/**
 * /api/tts — Azure Neural TTS proxy.
 *
 * Required env vars:
 *   AZURE_SPEECH_KEY     — Azure Cognitive Services Speech API key
 *   AZURE_SPEECH_REGION  — Azure region, e.g. "eastus" or "westus2"
 *
 * Optional env vars:
 *   AZURE_SPEECH_VOICE   — Neural voice name (default: en-US-AriaNeural)
 *
 * Returns 503 when key/region absent → client falls back to Web Speech API.
 *
 * GET /api/tts — returns config status (safe for diagnostics, no key exposed).
 */

import { beautifulEloquentSpeech } from "@/lib/tts/speech-utils";

// Strip both real whitespace AND literal \n / \r sequences — Vercel dashboard
// sometimes encodes trailing newlines as the two-character sequence backslash-n
// when values are pasted, which .trim() alone doesn't catch.
const clean = (s: string | undefined) =>
  s?.replace(/\\n/g, "").replace(/\\r/g, "").trim();
const VOICE  = process.env.AZURE_SPEECH_VOICE ?? "en-US-AriaNeural";
const REGION = clean(process.env.AZURE_SPEECH_REGION);
const KEY    = clean(process.env.AZURE_SPEECH_KEY);

function escapeXml(s: string): string {
  return s
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
}

/** GET /api/tts — diagnostic: are credentials configured? */
export async function GET() {
  return Response.json({
    configured: !!(KEY && REGION),
    region: REGION ?? null,
    voice: VOICE,
    keyPresent: !!KEY,
    regionPresent: !!REGION,
  });
}

export async function POST(req: Request) {
  if (!KEY || !REGION) {
    console.log("[AzureTTS] Missing credentials — AZURE_SPEECH_KEY or AZURE_SPEECH_REGION not set");
    return new Response("Azure Speech key/region not configured", { status: 503 });
  }

  const { text, lang = "en-US" } = (await req.json()) as { text: string; lang?: string };
  if (!text?.trim()) return new Response("No text provided", { status: 400 });

  const processed = escapeXml(beautifulEloquentSpeech(text).slice(0, 9000));

  // Simple, widely-compatible SSML — no express-as style which can 400
  // on some Azure subscription tiers. AriaNeural already sounds natural.
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>
  <voice name='${VOICE}'>
    <prosody rate='-4%' pitch='-3%'>${processed}</prosody>
  </voice>
</speak>`;

  console.log(`[AzureTTS] Requesting voice=${VOICE} region=${REGION} textLen=${processed.length}`);

  const azureRes = await fetch(
    `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "askGenie/1.0",
      },
      body: ssml,
    }
  );

  if (!azureRes.ok) {
    const err = await azureRes.text().catch(() => "");
    console.error(`[AzureTTS] ${azureRes.status} from ${REGION}:`, err.slice(0, 500));
    return new Response(`Azure TTS error: ${azureRes.status}`, {
      status: azureRes.status >= 500 ? 502 : azureRes.status,
    });
  }

  console.log(`[AzureTTS] Success — streaming audio`);
  return new Response(azureRes.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
