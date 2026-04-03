/**
 * /api/tts  — Google Cloud Text-to-Speech proxy.
 *
 * Required: GOOGLE_TTS_API_KEY  (Cloud TTS API key)
 * Optional: GOOGLE_TTS_VOICE    (default: en-US-Journey-F — warm, natural, professional)
 *
 * Returns 503 when key is absent → client auto-falls back to Web Speech API.
 */

import { beautifulEloquentSpeech } from "@/lib/tts/speech-utils";

const VOICE_NAME = process.env.GOOGLE_TTS_VOICE ?? "en-US-Journey-F";
const API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return new Response("Google Cloud TTS API key not configured", { status: 503 });
  }

  const { text, lang = "en-US" } = (await req.json()) as {
    text: string;
    lang?: string;
  };

  if (!text?.trim()) {
    return new Response("No text provided", { status: 400 });
  }

  const processedText = beautifulEloquentSpeech(text).slice(0, 5000);

  const gRes = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: processedText },
      voice: {
        languageCode: lang,
        name: VOICE_NAME,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,
        pitch: 0.0,
        effectsProfileId: ["headphone-class-device"],
      },
    }),
  });

  if (!gRes.ok) {
    const err = await gRes.text().catch(() => "");
    console.error(`Google TTS ${gRes.status}:`, err);
    return new Response(`Google TTS error: ${gRes.status}`, { status: gRes.status });
  }

  const data = (await gRes.json()) as { audioContent: string };
  const audioBuffer = Buffer.from(data.audioContent, "base64");

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
