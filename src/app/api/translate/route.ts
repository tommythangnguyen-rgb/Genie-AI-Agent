import { generateText } from "ai";
import { getLanguageModel } from "@/lib/provider";

const LANG_NAMES: Record<string, string> = {
  "en-US": "English",
  "es-ES": "Spanish",
  "hi-IN": "Hindi",
  "zh-CN": "Mandarin Chinese (Simplified)",
  "zh-HK": "Cantonese (Traditional Chinese)",
  "vi-VN": "Vietnamese",
  "fr-FR": "French",
  "ar-SA": "Arabic",
};

export async function POST(req: Request) {
  const { text, targetLang } = (await req.json()) as {
    text: string;
    targetLang: string;
  };

  if (!text?.trim() || !targetLang) {
    return new Response("Missing text or targetLang", { status: 400 });
  }

  const langName = LANG_NAMES[targetLang] ?? targetLang;

  const model = getLanguageModel();

  const { text: translated } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: `Translate the following financial aid text into ${langName}. Preserve all formatting (bullet points, headers, bold). Keep proper nouns, acronyms (FAFSA, R2T4, SAP, etc.), and dollar amounts as-is. Return only the translated text with no preamble or explanation.\n\n${text}`,
      },
    ],
    maxOutputTokens: 4000,
  });

  return new Response(JSON.stringify({ translated }), {
    headers: { "Content-Type": "application/json" },
  });
}
