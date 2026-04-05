import { streamText, stepCountIs } from "ai";
import { getLanguageModel } from "@/lib/provider";
import { aidAgentPrompt } from "@/lib/prompts/aid-agent";
import { getLatestUpdatesContext } from "@/lib/regulation-fetcher";
import { fetchResourcePage } from "@/lib/tools/resource-fetch";
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
    tools: { fetchResourcePage },
    stopWhen: stepCountIs(4),
  });

  // Translate raw API errors into user-friendly messages.
  function friendlyError(raw: string): string {
    const low = raw.toLowerCase();
    if (low.includes("credit balance") || low.includes("billing") || low.includes("quota") || low.includes("insufficient") || low.includes("payment")) {
      return "Genie is taking a short break — our team is on it! Please try again in a few minutes. If the issue persists, contact the askGenie developer at [x.com/one27__](https://x.com/one27__).";
    }
    if (low.includes("overloaded") || low.includes("capacity") || low.includes("service unavailable") || low.includes("503")) {
      return "Genie is a little overwhelmed right now — please wait a moment and try again. If this keeps happening, contact the developer at [x.com/one27__](https://x.com/one27__).";
    }
    if (low.includes("rate limit") || low.includes("too many requests") || low.includes("429")) {
      return "Genie is a little busy right now — please wait a moment and try again. If this keeps happening, reach out to the developer at [x.com/one27__](https://x.com/one27__).";
    }
    if (low.includes("api key") || low.includes("x-api-key") || low.includes("authentication") || low.includes("authentication_error") || low.includes("unauthorized") || low.includes("401") || low.includes("403")) {
      return "Genie is temporarily unavailable. Please contact the askGenie developer at [x.com/one27__](https://x.com/one27__) for assistance.";
    }
    if (low.includes("model") || low.includes("not found") || low.includes("invalid request") || low.includes("400")) {
      return "Genie encountered a configuration issue. Please contact the askGenie developer at [x.com/one27__](https://x.com/one27__).";
    }
    if (low.includes("context") || low.includes("token") || low.includes("length")) {
      return "Your conversation is getting long — try starting a new chat session for the best results.";
    }
    if (low.includes("timeout") || low.includes("timed out") || low.includes("network")) {
      return "Genie took too long to respond — please try again. If the issue continues, contact the developer at [x.com/one27__](https://x.com/one27__).";
    }
    return "Something went wrong on our end. Please try again in a moment. If the issue continues, contact the developer at [x.com/one27__](https://x.com/one27__).";
  }

  // Extract a usable message string from whatever the SDK throws.
  // AI SDK v5 wraps API errors in APICallError — real details are in responseBody/cause.
  function extractErrMsg(err: unknown): string {
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const e = err as any;
      const parts: string[] = [];
      if (e.message) parts.push(e.message);
      if (e.responseBody) parts.push(e.responseBody);
      if (e.cause?.message) parts.push(e.cause.message);
      if (e.cause?.responseBody) parts.push(e.cause.responseBody);
      if (e.error?.message) parts.push(e.error.message);
      if (e.error?.type) parts.push(e.error.type);
      if (parts.length > 0) return parts.join(" | ");
      // Last resort — safely serialize (Error objects have non-enumerable props)
      const safe = { name: e.name, message: e.message, status: e.status ?? e.statusCode, type: e.type };
      return JSON.stringify(safe);
    }
    return String(err);
  }

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
            const errMsg = extractErrMsg(part.error);
            const status = (part.error as any)?.statusCode ?? (part.error as any)?.status ?? "";
            const keyLen = process.env.ANTHROPIC_API_KEY?.trim().length ?? 0;
            console.error(`[AidAgent] STREAM ERROR status=${status} key_len=${keyLen}:`, errMsg);
            controller.enqueue(encoder.encode(friendlyError(errMsg)));
          }
        }
      } catch (err: any) {
        const msg = extractErrMsg(err);
        const status = err?.statusCode ?? err?.status ?? "";
        const keyLen = process.env.ANTHROPIC_API_KEY?.trim().length ?? 0;
        console.error(`[AidAgent] STREAM EXCEPTION status=${status} key_len=${keyLen}:`, msg);
        controller.enqueue(encoder.encode(friendlyError(msg)));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: responseHeaders });
}

export const maxDuration = 120;
