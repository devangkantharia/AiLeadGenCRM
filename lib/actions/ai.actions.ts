// Location: /lib/actions/ai.actions.ts

"use server";

import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Exa from "exa-js";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Lightweight trace wrapper: uses console if LANGFUSE isn't configured.
// Replace with real Langfuse SDK integration later.
function createTrace(clerkId?: string) {
  const enabled = !!process.env.LANGFUSE_SECRET_KEY;
  if (!enabled) {
    return {
      async start() { console.debug("trace:start (noop)"); return this; },
      span(name: string) { console.debug("span:start (noop)", name); return { async end() { console.debug("span:end (noop)", name); } }; },
      async update(props: any) { console.debug("trace:update (noop)", props); },
      async shutdown() { console.debug("trace:shutdown (noop)"); },
    };
  }
  // Minimal runtime-friendly wrapper placeholder; replace with the Langfuse SDK calls.
  // TODO: swap this with the real Langfuse client API (langfuse.trace(...) etc.)
  return {
    async start() { console.debug("trace:start", { user: clerkId }); return this; },
    span(name: string) { console.debug("span:start", name); return { async end() { console.debug("span:end", name); } }; },
    async update(props: any) { console.debug("trace:update", props); },
    async shutdown() { console.debug("trace:shutdown"); },
  };
}

// Helper function to get our internal user ID
async function getUserId(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", clerkId)
    .single();

  if (error || !data) throw new Error("User not found in DB.");
  return data.id;
}

// --- Real Exa web_search handler ---
async function webSearchHandler(params: { query: string }) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY not configured");

  const exa = new Exa(apiKey);

  // Configure comprehensive search
  let allResults: any[] = [];
  try {
    // Do multiple targeted searches to improve results
    const queries = [
      params.query,  // Original query
      `${params.query} company profile leadership team`,  // Add leadership focus
      `${params.query} company information contacts`, // Add contact focus
    ];

    for (const searchQuery of queries) {
      let searchResults: any[] = [];
      const raw = await (exa as any).search(searchQuery, {
        numResults: 5,
        useAutomaticProgramming: true,
        highlights: true,
        summaries: true
      });

      // Defensive checks for different response shapes
      if (Array.isArray(raw)) searchResults = raw;
      else if (Array.isArray(raw?.results)) searchResults = raw.results;
      else if (Array.isArray(raw?.hits)) searchResults = raw.hits;
      else if (raw?.answer && Array.isArray(raw.answer?.results)) searchResults = raw.answer.results;
      else if (raw?.items && Array.isArray(raw.items)) searchResults = raw.items;

      if (searchResults.length > 0) {
        allResults = allResults.concat(searchResults);
      }
    }
  } catch (err) {
    // If the SDK exposes a stream method only, attempt a fallback to streamAnswer then collect first set
    try {
      // Fallback to stream if direct search fails
      const stream = (exa as any).streamAnswer?.(params.query, { model: "exa-pro" });
      if (stream) {
        for await (const chunk of stream) {
          if (chunk?.results && Array.isArray(chunk.results)) {
            allResults = allResults.concat(chunk.results);
            break;
          }
        }
      }
    } catch (e) {
      console.error("Exa search error:", e);
      throw new Error("Exa search failed");
    }
  }

  // Remove duplicates based on URL
  const uniqueResults = Array.from(new Map(allResults.map(r => [r.url || r.link || r.uri, r])).values());

  // Process and enrich results with metadata
  const enriched = uniqueResults.map((r: any, index) => {
    // Combine title and snippet for better pattern matching
    const fullText = `${r.title || ""} ${r.snippet || ""} ${r.summary || ""}`;

    // Helper function to safely extract patterns
    const extract = (pattern: RegExp, text: string, group = 1): string => {
      const match = text.match(pattern);
      return match ? match[group] : "";
    };

    // Extract all emails from the text
    const extractEmails = (text: string): string[] => {
      return Array.from(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []);
    };

    // Extract all social profiles
    const extractSocial = (text: string): any => {
      return {
        linkedin: Array.from(text.match(/(?:linkedin\.com\/(?:in|company)\/[a-zA-Z0-9-]+)/g) || []),
        twitter: Array.from(text.match(/(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/g) || []),
      };
    };

    // Extract contact information
    const extractContacts = (text: string): any[] => {
      const contactPattern = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)(?:\s+(?:is|as|,|->|−)\s+([A-Z][a-zA-Z\s]+))?/g;
      const contacts: any[] = [];
      let match;

      while ((match = contactPattern.exec(text)) !== null) {
        const name = match[1];
        const role = match[2] || "";
        if (name && name.split(" ").length >= 2) {  // Ensure it's a full name
          contacts.push({
            name,
            role: role.trim(),
            email: extractEmails(text).find(e => e.toLowerCase().includes(name.split(" ")[0].toLowerCase())) || "",
            social: {
              linkedin: Array.from(text.match(new RegExp(`linkedin.com/in/[a-zA-Z0-9-]+(?:[^a-zA-Z0-9-]|$)`, "g")) || []),
            }
          });
        }
      }
      return contacts;
    };

    const result = {
      title: r.title || r.headline || r.name || r.source || r.url || "",
      url: r.url || r.link || r.uri || "",
      snippet: r.snippet || r.summary || r.excerpt || "",
      highlights: r.highlights || [],
      confidence: r.score || r.confidence || 1.0,
      metadata: {
        company: {
          name: r.title?.split(/[-|]/)[0]?.trim() || "",
          // Enhanced size extraction
          size: extract(/(\d+(?:[,\s]\d+)*\s*(?:\+\s*)?(?:employees?|people|staff|team members?))/i, fullText) ||
            extract(/(?:team of|workforce of|approximately|roughly|about)\s+(\d+(?:[,\s]\d+)*)/i, fullText) || "",
          // Enhanced industry extraction
          industry: extract(/(?:industry|sector):\s*([^.]+)/i, fullText) ||
            extract(/(?:in|focusing on|specializing in)\s+the\s+([^.]+(?:\sindustry|\smarket|\ssector))/i, fullText) || "",
          // Enhanced location extraction
          location: extract(/(?:based in|headquartered in|located in|offices? in)\s+([^.]+)/i, fullText) ||
            extract(/([^,]+,\s*(?:UK|United Kingdom|US|United States|Canada))/i, fullText) || "",
          // Added founding information
          founded: extract(/(?:founded|established|started)\s+in\s+(\d{4})/i, fullText) ||
            extract(/(?:since|est\.?\s+)(\d{4})/i, fullText) || "",
          // Tech stack and tools
          technology: Array.from(fullText.match(/(?:using|with|built on|powered by|leveraging)\s+([A-Za-z0-9,\s]+(?:framework|language|platform|stack|technology|cloud|API))/gi) || []),
        },
        // Enhanced contact extraction
        contacts: extractContacts(fullText),
        // Financial information
        financial: {
          funding: extract(/raised\s+([^.]+)/i, fullText) ||
            extract(/(\$\d+(?:\.\d+)?[MBM]\s+(?:Series\s+[A-Z]|seed|funding\sround))/i, fullText) || "",
          revenue: extract(/revenue of\s+([^.]+)/i, fullText) ||
            extract(/(\$\d+(?:\.\d+)?[MBM]\s+(?:in\s+revenue|ARR))/i, fullText) || "",
          growth: extract(/([^.]+\s+(?:YoY|year-over-year|growth|increase))/i, fullText) || "",
          investors: Array.from(fullText.match(/(?:backed by|investment from|funded by)\s+([^.]+)/gi) || []),
        },
        source: {
          domain: new URL(r.url || r.link || "https://example.com").hostname,
          date: r.date || r.published || "",
          type: r.url?.includes(r.title?.split(/[-|]/)[0]?.trim().toLowerCase() || "") ? "company website" : "third party",
        },
        // Additional business metrics
        metrics: {
          marketPosition: extract(/(?:leader|leading|top|pioneer|innovative|emerging|dominant)\s+([^.]+)/i, fullText) || "",
          customers: extract(/(?:clients?|customers?|serves)\s+([^.]+)/i, fullText) || "",
          partnerships: Array.from(fullText.match(/(?:partnership|collaboration|working) with\s+([^.]+)/gi) || []),
        }
      },
      relevance: index + 1
    };
    return result;
  });

  return JSON.stringify({
    query: params.query,
    results: enriched,
    total: enriched.length,
    timestamp: new Date().toISOString()
  });
}

// save_lead_to_crm handler (unchanged logic but ensures clerkId passed)
const saveLeadToCrmHandler = async (
  params: {
    companyName: string;
    industry?: string;
    geography?: string;
    size?: string;
  },
  clerkId?: string
) => {
  if (!clerkId) return "Error: User not logged in.";

  const ownerId = await getUserId(clerkId);

  const { data, error } = await supabaseAdmin
    .from("Company")
    .insert([
      {
        name: params.companyName,
        industry: params.industry || null,
        geography: params.geography || null,
        size: params.size || null,
        status: "Lead",
        ownerId,
      },
    ])
    .select();

  if (error) {
    return `Error saving lead: ${error.message}`;
  }

  revalidatePath("/companies");

  return `Successfully saved ${params.companyName} to CRM`;
};

// Tools definition passed to the model (function metadata)
const tools = [
  {
    name: "web_search",
    description: "Search the web for company information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
    handler: async (params: { query: string }) => {
      return await webSearchHandler(params);
    },
  },
  {
    name: "save_lead_to_crm",
    description: "Save a new company lead to the CRM",
    parameters: {
      type: "object",
      properties: {
        companyName: { type: "string" },
        industry: { type: "string" },
        geography: { type: "string" },
        size: { type: "string" },
      },
      required: ["companyName"],
    },
    handler: async (params: any, clerkId?: string) => {
      return await saveLeadToCrmHandler(params, clerkId);
    },
  },
];

// Main entry: processAIRequest
export async function processAIRequest(prompt: string) {
  // auth must run on server
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("Not authenticated");

  // Check required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing");
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!process.env.EXA_API_KEY) {
    console.error("EXA_API_KEY is missing");
    // Optionally: throw or allow web_search to fail gracefully
  }

  const trace = createTrace(clerkId);
  await trace.start();

  try {
    // Build base messages for the model
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI sales assistant specialized in finding company leads and contact information.

IMPORTANT INSTRUCTIONS:
1. When asked about companies or leads, ALWAYS use the web_search tool first to gather current information.
   The tool will return enriched results with company details and contact information.

2. ALWAYS format your responses with comprehensive details:
   Company Profile:
   - Company Name: [Full legal name]
   - Industry/Focus: [Main business area]
   - Location: [Complete address or region]
   - Size: [Employee count if available]
   - Founded: [Year if available]
   - Website: [URL from search results]
   
   Key People:
   - List all found executives/contacts with their roles
   - Include any contact details discovered
   
   Company Description:
   - Detailed 2-3 sentence description of what they do
   - Recent news or achievements if available
   
   Source Information:
   - Include "[Source: URL]" for each piece of information
   - Note when information comes from company's own website

3. For leads, analyze and include:
   - Growth indicators
   - Recent funding or expansion news
   - Technology stack or partnerships
   - Market position
   
4. If saving to CRM, explain why they're a good prospect

5. If search results are incomplete, clearly state what's missing and try an alternative search.

Remember: Quality over quantity. It's better to provide detailed information about fewer companies than sparse details about many.
2. Format your responses clearly with company details like:
   - Company Name
   - Industry/Focus
   - Location
   - Size (if available)
   - Key People/Contacts (when found)
   - Brief Description
3. Use save_lead_to_crm tool to save promising leads after gathering details
4. For contact searches, focus on finding key decision makers and leadership

Remember to process and summarize the web search results into a clear, structured response.`
      },
      { role: "user", content: prompt },
    ];

    // First model call with function calling enabled
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "web_search",
            description: "Search the web for company information and contact details",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to find company information"
                }
              },
              required: ["query"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "save_lead_to_crm",
            description: "Save a new company lead to the CRM",
            parameters: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                industry: { type: "string" },
                geography: { type: "string" },
                size: { type: "string" }
              },
              required: ["companyName"]
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    const message = completion.choices?.[0]?.message;
    // If model returned plain text, we are done.
    if (message?.content) {
      await trace.update({ output: message.content });
      // ensure we always shutdown the trace before returning
      await trace.shutdown();
      return message.content;
    }

    // TODO: If the model uses tool_calls (message.tool_calls), implement a loop:
    // 1) For each tool_call: start a trace.span, call the tool handler, add the tool result to messages.
    // 2) Re-call openai.chat.completions.create with extended messages.
    // 3) Repeat until model returns final text content.
    //
    // Below is a skeleton for that loop - most model SDKs follow a similar shape but you must adapt
    // depending on the exact 'tool_calls' shape returned by your OpenAI SDK.

    if ((message as any)?.tool_calls) {
      let history = [...messages];
      for (const tc of (message as any).tool_calls) {
        const toolName = tc.function?.name || tc.name;
        const argsRaw = tc.function?.arguments || tc.arguments || "{}";
        let args: any = {};
        try {
          args = JSON.parse(argsRaw || "{}");
        } catch (err) {
          console.error("Failed to parse tool_call arguments:", argsRaw, err);
          history.push({
            role: "system",
            content: `Error parsing arguments for tool ${toolName}: ${String(err)}`,
          });
          continue;
        }

        const span = trace.span(`tool:${toolName}`);
        try {
          const tool = tools.find((t) => t.name === toolName);
          if (!tool) {
            history.push({
              role: "system",
              content: `Tool ${toolName} not found`,
            });
            await span.end();
            continue;
          }

          // Validate required arguments for each tool
          let missingArgs = [];
          if (toolName === "save_lead_to_crm") {
            if (!args.companyName || typeof args.companyName !== "string") {
              missingArgs.push("companyName");
            }
          } else if (toolName === "web_search") {
            if (!args.query || typeof args.query !== "string") {
              missingArgs.push("query");
            }
          }

          if (missingArgs.length > 0) {
            history.push({
              role: "system",
              content: `Missing required argument(s) for tool ${toolName}: ${missingArgs.join(", ")}`,
            });
            await span.end();
            continue;
          }

          // Pass clerkId for save_lead_to_crm, only args for web_search
          let result;
          if (toolName === "save_lead_to_crm") {
            result = await saveLeadToCrmHandler(args, clerkId);
          } else if (toolName === "web_search") {
            result = await webSearchHandler(args);
          } else {
            result = "Unknown tool";
          }
          history.push({
            role: "assistant",
            content: null,
            tool_calls: [{
              id: tc.id,
              type: "function",
              function: {
                name: toolName,
                arguments: argsRaw
              }
            }]
          });
          history.push({
            role: "tool",
            content: typeof result === "string" ? result : JSON.stringify(result),
            tool_call_id: tc.id
          });

          await span.end();
        } catch (err) {
          await span.end();
          console.error(`Error running tool ${toolName}:`, err);
          history.push({
            role: "system",
            content: `Error running tool ${toolName}: ${String(err)}`,
          });
        }
      }

      // Re-query model with extended history
      const final = await openai.chat.completions.create({
        model: "gpt-4",
        messages: history as any, // Cast to any to bypass type error for now
      });

      const finalMsg = final.choices?.[0]?.message?.content;
      await trace.update({ output: finalMsg });
      await trace.shutdown();
      return finalMsg;
    }

    // Fallback: if nothing recognized, return a helpful message
    await trace.update({ output: "Model did not return content." });
    await trace.shutdown();
    return "No response from AI.";
  } catch (error) {
    await trace.update({ error: String(error) });
    await trace.shutdown();
    console.error("AI processing error:", error);
    throw error;
  }
}
