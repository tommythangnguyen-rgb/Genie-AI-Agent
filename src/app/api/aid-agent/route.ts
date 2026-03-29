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

  const allMessages = [
    {
      role: "system",
      content: systemContent,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
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

  // Set guest session cookie if new
  if (guestSessionId) {
    response.headers.append(
      "Set-Cookie",
      `genie-session=${guestSessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`
    );
  }

  return response;
}

export const maxDuration = 120;
