/**
 * /api/tts  — ElevenLabs TTS proxy.
 *
 * Required: ELEVENLABS_API_KEY
 * Optional: ELEVENLABS_VOICE_ID  (default: Adam — warm, natural, professional)
 *           ELEVENLABS_MODEL_ID  (default: eleven_multilingual_v2)
 *
 * Returns 503 when key is absent → client auto-falls back to Web Speech API.
 */

import { beautifulEloquentSpeech } from "@/lib/tts/speech-utils";

// Charlotte — warm, clear, confident, articulate; bright feminine tone
// (Hilary Duff / Natalie Portman energy: friendly but authoritative, never stiff)
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "XB0fDUnXU5powFXDhCwa";
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
const BASE_URL = "https://api.elevenlabs.io/v1";

const VOICE_SETTINGS = {
  stability:         0.42, // natural variation without wandering — crisp articulation
  similarity_boost:  0.85, // consistent character across the full response
  style:             0.38, // enough warmth and personality to feel human, not performative
  use_speaker_boost: true, // ElevenLabs clarity boost — sharper presence
};

const LANG_HINTS: Record<string, string> = {
  "en-US": "",
  "es-ES": "Por favor, habla en español. ",
  "hi-IN": "कृपया हिंदी में बोलें। ",
  "zh-CN": "请用普通话朗读。",
  "zh-HK": "請用廣東話朗讀。",
  "vi-VN": "Vui lòng đọc bằng tiếng Việt. ",
  "fr-FR": "Veuillez parler en français. ",
  "ar-SA": "يُرجى التحدث باللغة العربية. ",
};

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response("ElevenLabs API key not configured", { status: 503 });
  }

  const { text, lang = "en-US" } = (await req.json()) as {
    text: string;
    lang?: string;
  };

  if (!text?.trim()) {
    return new Response("No text provided", { status: 400 });
  }

  const processedText = beautifulEloquentSpeech(text);
  const langHint = LANG_HINTS[lang] ?? "";
  const spokenText = (langHint + processedText).slice(0, 4900);

  const elevenRes = await fetch(
    `${BASE_URL}/text-to-speech/${VOICE_ID}/stream?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: spokenText,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
        // "auto" lets the model handle number/abbreviation normalization naturally
        apply_text_normalization: "auto",
      }),
    }
  );

  if (!elevenRes.ok) {
    const err = await elevenRes.text().catch(() => "");
    console.error(`ElevenLabs ${elevenRes.status}:`, err);
    return new Response(`ElevenLabs error: ${elevenRes.status}`, {
      status: elevenRes.status,
    });
  }

  return new Response(elevenRes.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
