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

    const output = await processAIRequest(prompt);
    return NextResponse.json({ output });
  } catch (err: any) {
    console.error("API /api/ai/process error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
