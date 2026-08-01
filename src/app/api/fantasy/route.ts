import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUserLimit, checkAndIncrementGuestLimit } from "@/lib/rate-limit";
import {
  FANTASY_AGENT_ID,
  FANTASY_ENVIRONMENT_ID,
  SPORTS_SEARCH_TOOL,
  fantasyConfigured,
} from "@/lib/fantasy/config";
import { runSportsSearch } from "@/lib/fantasy/search";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_MESSAGE_CHARS = 4000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((res) => setTimeout(() => res(undefined), ms))]);
}

/**
 * Managed Agents orchestrator.
 *
 * The browser never talks to Anthropic — it POSTs here, and this route holds
 * the session event stream, executes host-side custom tools, and re-emits a
 * simplified SSE feed. That keeps ANTHROPIC_API_KEY and TAVILY_API_KEY server
 * side, and means the sandbox never sees either.
 */
export async function POST(req: NextRequest) {
  if (!fantasyConfigured()) {
    return NextResponse.json(
      {
        error: "NOT_CONFIGURED",
        detail:
          "Set ANTHROPIC_API_KEY, FANTASY_AGENT_ID and FANTASY_ENVIRONMENT_ID, then run `npm run fantasy:setup`.",
      },
      { status: 503 }
    );
  }

  let body: { message?: unknown; sessionId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "MESSAGE_TOO_LONG" }, { status: 413 });
  }
  const priorSessionId = typeof body.sessionId === "string" ? body.sessionId : null;

  // Same quota system as the aid agent. This agent is materially more
  // expensive per turn (Opus at xhigh effort, plus web search), so it is
  // metered rather than left open.
  const session = await verifySession(req);
  let rateLimit: { allowed: boolean; remaining: number; limit: number } | undefined;

  if (session?.userId) {
    const user = await withTimeout(
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { subscriptionTier: true, emailVerified: true },
      }),
      8000
    );
    if (user && user.emailVerified === false) {
      return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }
    rateLimit = await withTimeout(
      checkAndIncrementUserLimit(session.userId, (user?.subscriptionTier ?? "FREE") as string),
      8000
    );
  } else {
    const jar = await cookies();
    const sid = jar.get("genie_guest_id")?.value ?? null;
    if (sid) rateLimit = await withTimeout(checkAndIncrementGuestLimit(sid), 8000);
  }

  if (rateLimit && !rateLimit.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT", limit: rateLimit.limit, remaining: rateLimit.remaining },
      { status: 429 }
    );
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (payload: Record<string, unknown>) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed by client disconnect */
        }
      };

      try {
        let sessionId = priorSessionId;
        if (!sessionId) {
          const created = await client.beta.sessions.create({
            agent: FANTASY_AGENT_ID,
            environment_id: FANTASY_ENVIRONMENT_ID,
            title: "Fantasy football strategy",
          });
          sessionId = created.id;
        }
        emit({ type: "session", sessionId });

        // Stream-first: the SSE feed only delivers events emitted after it
        // opens, so this must precede the send or the first tokens are lost.
        const events = await client.beta.sessions.events.stream(sessionId, {
          event_deltas: ["agent.message"],
        });

        await client.beta.sessions.events.send(sessionId, {
          events: [{ type: "user.message", content: [{ type: "text", text: message }] }],
        });

        // Accumulate live-preview deltas per event id; the buffered
        // agent.message that follows is authoritative and replaces them.
        const previews = new Map<string, string>();

        for await (const event of events) {
          const type = (event as { type?: string }).type;

          if (type === "event_start") {
            const inner = (event as { event?: { id?: string; type?: string } }).event;
            if (inner?.type === "agent.message" && inner.id) previews.set(inner.id, "");
            continue;
          }

          if (type === "event_delta") {
            const e = event as { event_id?: string; delta?: { content?: { text?: string } } };
            const text = e.delta?.content?.text;
            if (e.event_id && typeof text === "string") {
              previews.set(e.event_id, (previews.get(e.event_id) ?? "") + text);
              emit({ type: "delta", id: e.event_id, text });
            }
            continue;
          }

          if (type === "agent.message") {
            const e = event as { id?: string; content?: Array<{ type?: string; text?: string }> };
            const text = (e.content ?? [])
              .filter((b) => b.type === "text" && typeof b.text === "string")
              .map((b) => b.text)
              .join("");
            if (e.id) previews.delete(e.id);
            emit({ type: "message", id: e.id, text });
            continue;
          }

          // Built-in tools (web_search / web_fetch) run server-side; surface
          // them as status so the UI can show what the agent is doing.
          if (type === "agent.tool_use") {
            emit({ type: "activity", tool: (event as { name?: string }).name ?? "tool" });
            continue;
          }

          if (type === "agent.custom_tool_use") {
            const e = event as { id?: string; name?: string; input?: unknown };
            emit({ type: "activity", tool: e.name ?? SPORTS_SEARCH_TOOL });

            let result = { text: `Unknown tool: ${e.name}`, isError: true };
            if (e.name === SPORTS_SEARCH_TOOL) {
              result = await runSportsSearch((e.input ?? {}) as Record<string, unknown>);
            }

            await client.beta.sessions.events.send(sessionId, {
              events: [
                {
                  type: "user.custom_tool_result",
                  custom_tool_use_id: e.id!,
                  content: [{ type: "text", text: result.text }],
                  is_error: result.isError,
                },
              ],
            });
            continue;
          }

          if (type === "session.error") {
            const e = event as { error?: { message?: string } };
            emit({ type: "error", message: e.error?.message ?? "The agent hit an error." });
            continue;
          }

          if (type === "session.status_terminated") {
            emit({ type: "done", reason: "terminated" });
            break;
          }

          if (type === "session.status_idle") {
            const stop = (event as { stop_reason?: { type?: string } }).stop_reason;
            // `requires_action` means the agent is waiting on us (a pending
            // custom tool result) — not the end of the turn.
            if (stop?.type === "requires_action") continue;
            emit({ type: "done", reason: stop?.type ?? "end_turn" });
            break;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[fantasy] stream failed:", msg);
        emit({ type: "error", message: "The strategist connection dropped. Try again." });
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
