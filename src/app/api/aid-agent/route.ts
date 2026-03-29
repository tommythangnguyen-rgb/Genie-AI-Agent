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

  const result = streamText({
    model,
    messages: allMessages,
    maxOutputTokens: 3000, // down from 8000 — concise responses stream ~2.5× faster
    temperature: 0.4,      // lower = more focused, less wandering, faster convergence
    onError: (err: any) => {
      console.error("Aid agent error:", err);
    },
  });

  return result.toTextStreamResponse();
}

export const maxDuration = 120;
