// Location: /lib/actions/ai.actions.ts

"use server";

import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

// Define our AI agent tools
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
        }
      },
      required: ["query"],
    },
    handler: async (params: { query: string }) => {
      // Simplified web search implementation
      // In a real implementation, you would integrate with a search API
      return JSON.stringify([
        {
          title: "Search results for: " + params.query,
          snippet: "This is a placeholder for search results. In production, integrate with a proper search API."
        }
      ]);
    }
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
    handler: async (params: {
      companyName: string;
      industry?: string;
      geography?: string;
      size?: string;
    }, clerkId: string) => {
      if (!clerkId) return "Error: User not logged in.";

      const ownerId = await getUserId(clerkId);

      // Save to Supabase
      const { data, error } = await supabaseAdmin
        .from("Company")
        .insert([{
          name: params.companyName,
          industry: params.industry || null,
          geography: params.geography || null,
          size: params.size || null,
          status: "Lead",
          ownerId,
        }])
        .select();

      if (error) {
        return `Error saving lead: ${error.message}`;
      }

      // Revalidate the companies list
      revalidatePath("/companies");

      return `Successfully saved ${params.companyName} to CRM`;
    }
  }
];

export async function processAIRequest(prompt: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("Not authenticated");

  try {
    // Create completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI sales assistant that helps find and qualify leads.
          Your task is to:
          1. Use the web_search tool to find relevant companies based on the user's request
          2. Analyze the results and identify promising leads
          3. Save qualified leads to the CRM using the save_lead_to_crm tool
          4. Provide a summary of what you found and saved`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      tools: tools.map(({ name, description, parameters }) => ({
        type: "function",
        function: { name, description, parameters }
      })),
    });

    // Process any tool calls
    const message = completion.choices[0].message;

    if (message.tool_calls) {
      const results = await Promise.all(
        message.tool_calls.map(async (toolCall) => {
          const tool = tools.find(t => t.name === toolCall.function.name);
          if (tool) {
            const args = JSON.parse(toolCall.function.arguments);
            return await tool.handler(args, clerkId);
          }
        })
      );

      // Get final response from AI
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI sales assistant that helps find and qualify leads.
            Your task is to analyze the following results and provide a summary of the actions taken:
            ${results.join("\n")}`
          }
        ],
      });

      return finalResponse.choices[0].message.content;
    }

    return message.content;

  } catch (error) {
    console.error("AI processing error:", error);
    throw error;
  }
}
