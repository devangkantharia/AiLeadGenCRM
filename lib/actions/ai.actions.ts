// Location: /lib/actions/ai.actions.ts
// --- ALL TYPOS AND COPY-PASTE ERRORS FIXED ---

"use server";

import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Exa from "exa-js";
import { Langfuse } from "langfuse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const exa = new Exa(process.env.EXA_API_KEY!);

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_HOST!,
});

// Helper function (no changes)
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
  console.log(`[AI] Calling Exa with query: ${params.query}`);

  let allResults: any[] = [];
  try {
    const queries = [
      params.query,
      `${params.query} company profile leadership team`,
      `${params.query} company information contacts`,
    ];

    for (const searchQuery of queries) {
      const searchResponse = await exa.search(searchQuery, {
        numResults: 3, // Reduced to 3 results per query
        useAutoprompt: true
      });

      const ids = searchResponse.results.map(r => r.id);
      const contentsResponse = await exa.getContents(ids);
      allResults = allResults.concat(contentsResponse.results);
    }
  } catch (e) {
    console.error("Exa search error:", e);
    try {
      const stream = (exa as any).streamAnswer?.(params.query, { model: "exa-pro" });
      if (stream) {
        for await (const chunk of stream) {
          if (chunk?.results && Array.isArray(chunk.results)) {
            allResults = allResults.concat(chunk.results);
            break;
          }
        }
      }
    } catch (e2) {
      console.error("Exa stream error:", e2);
      throw new Error("Exa search and stream failed");
    }
  }

  const uniqueResults = Array.from(new Map(allResults.map(r => [r.url || r.link || r.uri, r])).values());

  const enriched = uniqueResults.map((r: any, index) => {

    // Truncate text to avoid token overflows
    const truncatedText = (r.text || r.summary || "").substring(0, 1500);
    const fullText = `${r.title || ""} ${truncatedText}`;

    const extract = (pattern: RegExp, text: string, group = 1): string => {
      const match = text.match(pattern);
      return match ? match[group] : "";
    };
    const extractEmails = (text: string): string[] => {
      return Array.from(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []);
    };
    const extractContacts = (text: string): any[] => {
      const contactPattern = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)(?:\s+(?:is|as|,|->|−)\s+([A-Z][a-zA-Z\s]+))?/g;
      const contacts: any[] = [];
      let match;
      while ((match = contactPattern.exec(text)) !== null) {
        const name = match[1];
        const role = match[2] || "";
        if (name && name.split(" ").length >= 2) {
          contacts.push({
            name,
            role: role.trim(),
            email: extractEmails(text).find(e => e.toLowerCase().includes(name.split(" ")[0].toLowerCase())) || "",
            social: { /*...your logic...*/ }
          });
        }
      }
      return contacts;
    };

    const result = {
      title: r.title || r.headline || r.name || r.source || r.url || "",
      url: r.url || r.link || r.uri || "",
      snippet: truncatedText + "...",
      confidence: r.score || r.confidence || 1.0,
      metadata: {
        company: {
          name: r.title?.split(/[-|]/)[0]?.trim() || "",
          size: extract(/(\d+(?:[,\s]\d+)*\s*(?:\+\s*)?(?:employees?|people|staff|team members?))/i, fullText) || "",
          industry: extract(/(?:industry|sector):\s*([^.]+)/i, fullText) || "",
          location: extract(/(?:based in|headquartered in|located in|offices? in)\s+([^.]+)/i, fullText) || "",
          founded: extract(/(?:founded|established|started)\s+in\s+(\d{4})/i, fullText) || "",
        },
        contacts: extractContacts(fullText),
        financial: {
          funding: extract(/raised\s+([^.]+)/i, fullText) || "",
          revenue: extract(/revenue of\s+([^.]+)/i, fullText) || "",
        },
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

// --- saveLeadToCrmHandler --- (Your code, no changes)
const saveLeadToCrmHandler = async (
  params: {
    companyName: string;
    industry?: string;
    geography?: string;
    size?: string;
    website?: string;
    contacts?: { name: string; title?: string; email?: string }[];
  },
  clerkId?: string
) => {
  if (!clerkId) return "Error: User not logged in.";

  const ownerId = await getUserId(clerkId);
  const { data: companyData, error: companyError } = await supabaseAdmin
    .from("Company")
    .insert([
      {
        name: params.companyName,
        industry: params.industry || null,
        geography: params.geography || null,
        size: params.size || null,
        status: "Discovery",
        ownerId,
      },
    ])
    .select()
    .single();

  if (companyError || !companyData) {
    return `Error saving company: ${companyError?.message || "Unknown error"}`;
  }

  const companyId = companyData.id;
  let contactsSaved = 0;

  if (params.contacts && params.contacts.length > 0) {
    const peopleToInsert = params.contacts
      .filter((contact) => contact.name)
      .map((contact) => {
        const nameParts = contact.name.split(" ");
        const firstName = nameParts.shift() || "";
        const lastName = nameParts.join(" ");
        return {
          firstName,
          lastName: lastName || null,
          email: contact.email || null,
          title: contact.title || null,
          companyId,
          ownerId,
        };
      });

    if (peopleToInsert.length > 0) {
      const { error: peopleError } = await supabaseAdmin
        .from("Person")
        .insert(peopleToInsert);

      if (peopleError) {
        console.error(`Error saving contacts: ${peopleError.message}`);
      } else {
        contactsSaved = peopleToInsert.length;
      }
    }
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");

  return `Successfully saved ${params.companyName} to CRM with ${contactsSaved} contacts.`;
};


// --- Main entry: processAIRequest ---
export async function processAIRequest(prompt: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("Not authenticated");

  // (Env var checks, no changes)
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing");
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!process.env.EXA_API_KEY) {
    console.error("EXA_API_KEY is missing");
  }

  // Use the REAL Langfuse trace
  const trace = langfuse.trace({
    name: "ai-lead-generation",
    userId: clerkId,
    input: prompt,
    tags: ["openai-tools", "copilot-flow"]
  });

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        // The "aggressive" prompt
        content: `You are an AI data entry assistant. Your job is to:
1.  **Use the \`web_search\` tool** to find companies matching the user's request.
2.  **Analyze the search results** to find the company name, industry, geography, and size.
3.  **You MUST call \`save_lead_to_crm\`** for *every* company you identify. A \`companyName\` is the only requirement. Save all other details you find (industry, geography, size, contacts).
4.  **Do NOT ask for permission** to save. Do not "qualify" the lead. Your job is to find and save.
5.  **After all tool calls are complete,** provide a single, final summary to the user listing the companies you found and saved.`
      },
      { role: "user", content: prompt },
    ];

    // (Your tool-calling loop logic)
    while (true) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
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
                  query: { type: "string", description: "The search query" }
                },
                required: ["query"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "save_lead_to_crm",
              description: "Save a new company lead and its contacts to the CRM.",
              parameters: {
                type: "object",
                properties: {
                  companyName: { type: "string", description: "The full name of the company." },
                  industry: { type: "string", description: "The industry the company operates in." },
                  geography: { type: "string", description: "The location of the company, e.g., 'San Francisco, CA'." },
                  size: { type: "string", description: "The size of the company, e.g., '11-50 employees'." },
                  website: { type: "string", description: "The company's official website." },
                  contacts: {
                    type: "array",
                    description: "A list of contacts at the company.",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Full name of the contact." },
                        title: { type: "string", description: "Job title of the contact." },
                        email: { type: "string", description: "Email address of the contact." },
                      },
                      required: ["name"],
                    },
                  },
                },
                required: ["companyName"],
              },
            },
          }
        ],
        tool_choice: "auto"
      });

      const message = completion.choices?.[0]?.message;

      if (message?.content) {
        await trace.update({ output: message.content });
        return message.content;
      }

      if (message?.tool_calls) {
        messages.push(message);

        const toolSpan = trace.span({ name: "tool-execution-loop" });

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || "{}");

          const toolCallSpan = toolSpan.span({
            name: toolName,
            input: args,
          });

          let result;
          try {
            if (toolName === "save_lead_to_crm") {
              result = await saveLeadToCrmHandler(args, clerkId);
            } else if (toolName === "web_search") {
              result = await webSearchHandler(args);
            } else {
              result = `Tool ${toolName} not found`;
            }
            toolCallSpan.update({ output: result });
          } catch (e: any) {
            result = `Error executing tool ${toolName}: ${e.message}`;
            toolCallSpan.update({ output: result });
            console.error(result);
          }

          toolCallSpan.end();
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        toolSpan.end();
        continue;
      }
      break;
    }

    await trace.update({ output: "Model did not return content." });
    return "No response from AI.";

    // --- FIX 5: This is the critical syntax fix ---
  } catch (error) {
    // It was `} catch (error)Player {`, which was a typo.
    // It is now `} catch (error) {`
    // --- END FIX ---

    // Log the error
    await trace.update({ output: (error as Error).message });
    console.error("AI processing error:", error);
    throw error;
  }
}