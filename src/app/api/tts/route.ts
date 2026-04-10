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
 * Voice: en-US-AriaNeural — warm, natural, calm female (Microsoft's best).
 * Style: "calm" + slight rate/pitch reduction for soothing delivery.
 */

import { beautifulEloquentSpeech } from "@/lib/tts/speech-utils";

const VOICE  = process.env.AZURE_SPEECH_VOICE ?? "en-US-AriaNeural";
const REGION = process.env.AZURE_SPEECH_REGION;
const KEY    = process.env.AZURE_SPEECH_KEY;

function escapeXml(s: string): string {
  return s
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
}

export async function POST(req: Request) {
  if (!KEY || !REGION) {
    return new Response("Azure Speech key/region not configured", { status: 503 });
  }

  const { text, lang = "en-US" } = (await req.json()) as { text: string; lang?: string };
  if (!text?.trim()) return new Response("No text provided", { status: 400 });

  const processed = escapeXml(beautifulEloquentSpeech(text).slice(0, 9000));

  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='${lang}'>
  <voice name='${VOICE}'>
    <mstts:express-as style='calm'>
      <prosody rate='-4%' pitch='-3%'>${processed}</prosody>
    </mstts:express-as>
  </voice>
</speak>`;

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
    console.error(`[AzureTTS] ${azureRes.status}:`, err);
    return new Response(`Azure TTS error: ${azureRes.status}`, { status: azureRes.status >= 500 ? 502 : azureRes.status });
  }

  return new Response(azureRes.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
