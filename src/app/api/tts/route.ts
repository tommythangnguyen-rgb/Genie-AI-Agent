/**
 * /api/tts — Free premium TTS via Microsoft Edge's read-aloud endpoint.
 *
 * Uses msedge-tts, which speaks to the same neural voices Azure Cognitive
 * Services exposes (AriaNeural, JennyNeural, etc.) but through the endpoint
 * Edge's built-in read-aloud feature calls. No API key, no quota, no billing.
 *
 * Optional env vars:
 *   TTS_VOICE — Neural voice short name (default: en-US-AriaNeural)
 *
 * GET  /api/tts — diagnostic (safe, no secrets)
 * POST /api/tts — { text, lang? } → audio/mpeg
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { beautifulEloquentSpeech } from "@/lib/tts/speech-utils";

export const runtime = "nodejs"; // msedge-tts uses ws — Node runtime only.
export const maxDuration = 30;

const VOICE = process.env.TTS_VOICE ?? "en-US-AriaNeural";

export async function GET() {
  return Response.json({
    provider: "msedge-tts",
    voice: VOICE,
    configured: true,
  });
}

export async function POST(req: Request) {
  const { text } = (await req.json()) as { text: string; lang?: string };
  if (!text?.trim()) return new Response("No text provided", { status: 400 });

  const processed = beautifulEloquentSpeech(text).slice(0, 9000);

  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(processed, { rate: "-4%", pitch: "-3%" });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (c: Buffer) => chunks.push(c));
      audioStream.on("end", () => resolve());
      audioStream.on("close", () => resolve());
      audioStream.on("error", reject);
    });

    const audio = Buffer.concat(chunks);
    if (audio.length === 0) {
      console.error("[EdgeTTS] Empty audio buffer");
      return new Response("TTS produced empty audio", { status: 502 });
    }

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[EdgeTTS] Synthesis failed:", err?.message ?? err);
    return new Response(`TTS error: ${err?.message ?? "unknown"}`, { status: 502 });
  } finally {
    try { tts.close(); } catch {}
  }
}
