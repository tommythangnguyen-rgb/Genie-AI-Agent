import { NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key || key.trim() === "") {
    return NextResponse.json({ status: "error", issue: "ANTHROPIC_API_KEY is not set or empty" }, { status: 500 });
  }

  const cleanKey = key.replace(/\\n/g, "").replace(/\\r/g, "").trim();
  const keyPreview = `${cleanKey.slice(0, 18)}...${cleanKey.slice(-4)}`;

  try {
    const provider = createAnthropic({ apiKey: cleanKey });
    const { text } = await generateText({
      model: provider("claude-sonnet-4-6"),
      prompt: "Reply with exactly: OK",
      maxOutputTokens: 5,
    });
    return NextResponse.json({ status: "ok", keyPreview, model: "claude-sonnet-4-6", reply: text.trim() });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    const body = err?.responseBody ?? err?.cause?.responseBody ?? "";
    return NextResponse.json({ status: "error", keyPreview, raw: msg, body }, { status: 500 });
  }
}
