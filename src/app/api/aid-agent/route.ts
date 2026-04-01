import { streamText } from "ai";
import { getLanguageModel } from "@/lib/provider";
import { aidAgentPrompt } from "@/lib/prompts/aid-agent";
import { getLatestUpdatesContext } from "@/lib/regulation-fetcher";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUserLimit, checkAndIncrementGuestLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const session = await verifySession(req);
  let rateLimitResult;
  let guestSessionId: string | null = null;

  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { subscriptionTier: true, accountOwnerId: true },
    });
    const tier = user?.subscriptionTier ?? "FREE";

    // For sub-users, check the owner's subscription tier
    let effectiveTier = tier;
    if (user?.accountOwnerId) {
      const owner = await prisma.user.findUnique({
        where: { id: user.accountOwnerId },
        select: { subscriptionTier: true },
      });
      effectiveTier = owner?.subscriptionTier ?? "FREE";
    }

    rateLimitResult = await checkAndIncrementUserLimit(session.userId, effectiveTier);
  } else {
    // Guest — use cookie session ID
    const cookieStore = await cookies();
    let sid = cookieStore.get("genie-session")?.value;
    if (!sid) {
      sid = crypto.randomUUID();
      guestSessionId = sid;
    }
    rateLimitResult = await checkAndIncrementGuestLimit(sid);
    guestSessionId = sid;
  }

  if (!rateLimitResult.allowed) {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return NextResponse.json(
      {
        error: "RATE_LIMIT_EXCEEDED",
        remaining: 0,
        limit: rateLimitResult.limit,
        resetAt: tomorrow.toISOString(),
      },
      { status: 429 }
    );
  }

  // 2. Parse body
  const { messages }: { messages: any[] } = await req.json();

  // 3. Get system context
  const liveUpdates = await getLatestUpdatesContext();
  const systemContent = liveUpdates ? `${aidAgentPrompt}\n\n${liveUpdates}` : aidAgentPrompt;

  // Strip non-CoreMessage fields (id, senderRole, attachedFileName, etc.) before
  // passing to AI SDK — extra fields cause validation failures in AI SDK v5.
  const coreMessages = messages
    .filter((m: any) => m.role === "user" || m.role === "assistant")
    .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const model = getLanguageModel();

  // Build response headers up front
  const responseHeaders: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (guestSessionId) {
    responseHeaders["Set-Cookie"] =
      `genie-session=${guestSessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
  }

  // No user input is logged or persisted — messages are processed in-memory only.
  const result = streamText({
    model,
    system: systemContent,
    messages: coreMessages,
    maxOutputTokens: 3000,
    temperature: 0.4,
  });

  // Manually iterate the text stream so errors are surfaced to the client
  // instead of silently closing an empty stream (AI SDK v5 toTextStreamResponse
  // swallows errors, leaving the chat bubble blank).
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.error("Aid agent stream error:", msg);
        // Send a visible error so the user knows something went wrong
        controller.enqueue(
          encoder.encode("\n\nSorry, I encountered an error generating a response. Please try again.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: responseHeaders });
}

export const maxDuration = 120;
