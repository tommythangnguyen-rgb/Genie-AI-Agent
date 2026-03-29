import { streamText } from "ai";
import { getLanguageModel } from "@/lib/provider";
import { aidAgentPrompt } from "@/lib/prompts/aid-agent";
import { getLatestUpdatesContext } from "@/lib/regulation-fetcher";

export async function POST(req: Request) {
  const { messages }: { messages: any[] } = await req.json();

  // Fetch live regulatory updates from DB (5-min in-memory cache)
  const liveUpdates = await getLatestUpdatesContext();

  const systemContent = liveUpdates
    ? `${aidAgentPrompt}\n\n${liveUpdates}`
    : aidAgentPrompt;

  const allMessages = [
    {
      role: "system",
      content: systemContent,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    },
    ...messages,
  ];

  const model = getLanguageModel();

  // No user input is logged or persisted — messages are processed in-memory only.
  const result = streamText({
    model,
    messages: allMessages,
    maxOutputTokens: 3000,
    temperature: 0.4,
    onError: (err: any) => {
      // Log only the error code/type — never the message content — to avoid
      // capturing user input in Vercel function logs.
      console.error("Aid agent stream error:", err?.error?.name ?? "UnknownError");
    },
  });

  const response = result.toTextStreamResponse();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const maxDuration = 120;
