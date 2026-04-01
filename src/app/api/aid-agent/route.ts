import { streamText } from "ai";
import { getLanguageModel } from "@/lib/provider";
import { aidAgentPrompt } from "@/lib/prompts/aid-agent";
import { getLatestUpdatesContext } from "@/lib/regulation-fetcher";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUserLimit, checkAndIncrementGuestLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/** Race a promise against a timeout; returns undefined if it loses. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((res) => setTimeout(() => res(undefined), ms))]);
}

export async function POST(req: NextRequest) {
  // 1. Rate limiting — all DB calls are raced against a 8 s timeout so a slow
  //    Neon cold-start can't hang the entire route.
  const session = await verifySession(req);
  let rateLimitResult: { allowed: boolean; remaining: number; limit: number } | undefined;
  let guestSessionId: string | null = null;

  if (session?.userId) {
    const user = await withTimeout(
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { subscriptionTier: true, accountOwnerId: true },
      }),
      8000
    );
    const tier = (user?.subscriptionTier ?? "FREE") as string;
    rateLimitResult = await withTimeout(
      checkAndIncrementUserLimit(session.userId, tier),
      8000
    );
  } else {
    // Guest — use cookie session ID
    const cookieStore = await cookies();
    let sid = cookieStore.get("genie-session")?.value;
    if (!sid) {
      sid = crypto.randomUUID();
      guestSessionId = sid;
    }
    rateLimitResult = await withTimeout(checkAndIncrementGuestLimit(sid), 8000);
    guestSessionId = sid;
  }

  // If the DB timed out, fail open (allow the request through) rather than hang.
  if (rateLimitResult && !rateLimitResult.allowed) {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED", remaining: 0, limit: rateLimitResult.limit, resetAt: tomorrow.toISOString() },
      { status: 429 }
    );
  }

  // 2. Parse body
  const { messages }: { messages: any[] } = await req.json();

  // 3. Get system context — optional; skip if DB is slow
  const liveUpdates = await withTimeout(getLatestUpdatesContext(), 5000);
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

  // Use fullStream so API errors (bad key, quota, etc.) appear as error-type
  // parts rather than silently closing textStream with zero chunks.
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            controller.enqueue(encoder.encode(part.text));
          } else if (part.type === "error") {
            const errMsg = (part.error as any)?.message ?? String(part.error);
            console.error("Aid agent stream error:", errMsg);
            controller.enqueue(
              encoder.encode(`\n\nError: ${errMsg}`)
            );
          }
        }
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.error("Aid agent stream exception:", msg);
        controller.enqueue(encoder.encode(`\n\nError: ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: responseHeaders });
}

export const maxDuration = 120;
