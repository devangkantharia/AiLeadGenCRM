import { NextResponse } from "next/server";
import { processAIRequest } from "@/lib/actions/ai.actions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // Run the AI request but guard it with a timeout so a hung/model issue doesn't block the API forever
    const aiPromise = processAIRequest(prompt);
    const timeoutMs = 30000; // 30s
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), timeoutMs)
    );

    const output = await Promise.race([aiPromise, timeoutPromise]);
    return NextResponse.json({ output });
  } catch (err: any) {
    console.error("API /api/ai/process error:", err);
    const msg = err?.message || "Unknown error";
    const status = msg === 'AI request timed out' ? 504 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
