import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFeature } from "@/lib/feature-gates";
import { chargeTurn, millsToUsd, rawCostMills, MIN_BALANCE_MILLS, type TokenUsage } from "@/lib/fantasy/billing";
import {
  FANTASY_AGENT_ID,
  FANTASY_ENVIRONMENT_ID,
  SPORTS_SEARCH_TOOL,
  fantasyConfigured,
  MAX_IMAGES_PER_MESSAGE,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
  LEAGUE_TOOLS,
} from "@/lib/fantasy/config";
import { runSportsSearch, sportsSearchAvailable } from "@/lib/fantasy/search";
import { getLeagueSnapshot, getWaiverActivity, getTrending } from "@/lib/fantasy/sleeper";
import { appendTurn, isOwner } from "@/lib/fantasy/history";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_MESSAGE_CHARS = 4000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((res) => setTimeout(() => res(undefined), ms))]);
}

/** Render the connected league as plain text the model can reason over. */
async function runLeagueContext(
  leagueId: string | null,
  userId: string | null
): Promise<{ text: string; isError: boolean }> {
  if (!leagueId || !userId) {
    return { text: "No Sleeper league is connected. Ask the user to connect one in the League panel.", isError: true };
  }
  const s = await getLeagueSnapshot(leagueId, userId);
  if (!s) return { text: "Could not load that Sleeper league — it may be private or deleted.", isError: true };

  const lines = [
    `LEAGUE: ${s.league.name} (${s.league.season}, ${s.league.status})`,
    `Format: ${s.league.teams}-team, ${s.league.scoring}, waivers: ${s.league.waiver}`,
    `Roster slots: ${s.league.positions.join(", ") || "unknown"}`,
    `Current week: ${s.week}`,
  ];
  if (s.me) {
    lines.push(
      "",
      `MY TEAM: ${s.me.teamName} — ${s.me.record}, ${s.me.pointsFor} pts${s.me.faabUsed != null ? `, FAAB used $${s.me.faabUsed}` : ""}`,
      `Starters: ${s.me.starters.join(" | ") || "none set"}`,
      `Bench: ${s.me.bench.join(" | ") || "empty"}`
    );
  } else {
    lines.push("", "The connected user does not have a roster in this league (they may be an observer).");
  }
  if (s.matchup) {
    lines.push("", `THIS WEEK: vs ${s.matchup.opponent} — ${s.matchup.myPoints} to ${s.matchup.oppPoints}`);
  }
  lines.push("", "STANDINGS:");
  s.standings.forEach((t, i) => lines.push(`  ${i + 1}. ${t.team} (${t.record}, ${t.pointsFor} pts)`));
  lines.push("", "Player injury designations above come from Sleeper and may lag the official team report.");

  return { text: lines.join("\n"), isError: false };
}

async function runWaiverActivity(
  leagueId: string | null,
  userId: string | null,
  week?: number
): Promise<{ text: string; isError: boolean }> {
  if (!leagueId || !userId) {
    return { text: "No Sleeper league is connected. Ask the user to connect one in the League panel.", isError: true };
  }
  const snapshot = await getLeagueSnapshot(leagueId, userId);
  const wk = week ?? snapshot?.week ?? 1;
  const [txns, trending] = await Promise.all([getWaiverActivity(leagueId, wk), getTrending("add")]);

  const lines = [`LEAGUE TRANSACTIONS — week ${wk}:`];
  lines.push(txns.length ? txns.map((t) => `  ${t}`).join("\n") : "  (none recorded this week)");
  if (snapshot?.me?.faabUsed != null) lines.push("", `My FAAB spent so far: $${snapshot.me.faabUsed}`);
  lines.push("", "TRENDING ADDS ACROSS SLEEPER (last 24h):");
  lines.push(trending.length ? trending.map((t) => `  ${t}`).join("\n") : "  (unavailable)");
  return { text: lines.join("\n"), isError: false };
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

  let body: { message?: unknown; sessionId?: unknown; images?: unknown; sleeper?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const rawImages = Array.isArray(body.images) ? body.images : [];

  // A screenshot on its own is a valid ask ("what do you make of this?").
  if (!message && rawImages.length === 0) {
    return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "MESSAGE_TOO_LONG" }, { status: 413 });
  }
  if (rawImages.length > MAX_IMAGES_PER_MESSAGE) {
    return NextResponse.json(
      { error: "TOO_MANY_IMAGES", max: MAX_IMAGES_PER_MESSAGE },
      { status: 400 }
    );
  }

  const images: Array<{ media_type: string; data: string }> = [];
  for (const raw of rawImages) {
    const img = raw as { media_type?: unknown; data?: unknown };
    const mediaType = typeof img?.media_type === "string" ? img.media_type : "";
    const data = typeof img?.data === "string" ? img.data : "";
    if (!ALLOWED_IMAGE_TYPES.includes(mediaType)) {
      return NextResponse.json({ error: "UNSUPPORTED_IMAGE_TYPE", mediaType }, { status: 400 });
    }
    // base64 inflates by ~4/3; check the decoded size.
    if (!data || (data.length * 3) / 4 > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "IMAGE_TOO_LARGE", maxBytes: MAX_IMAGE_BYTES }, { status: 413 });
    }
    images.push({ media_type: mediaType, data });
  }

  const priorSessionId = typeof body.sessionId === "string" ? body.sessionId : null;

  // The connected Sleeper league is bound here, server-side, and injected when
  // a league tool runs. The model never supplies these — so it can't be talked
  // into reading someone else's team.
  const sleeper =
    body.sleeper && typeof body.sleeper === "object"
      ? (body.sleeper as { userId?: unknown; leagueId?: unknown })
      : null;
  const leagueId = typeof sleeper?.leagueId === "string" ? sleeper.leagueId : null;
  const sleeperUserId = typeof sleeper?.userId === "string" ? sleeper.userId : null;
  const leagueConnected = Boolean(leagueId && sleeperUserId);

  // Pro gates access; prepaid credits pay for the tokens. Both are required,
  // and there is no guest path — a turn here costs real money.
  const session = await verifySession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });
  }

  const user = await withTimeout(
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, subscriptionTier: true, emailVerified: true, fantasyCreditsMills: true },
    }),
    8000
  );
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  if (user.emailVerified === false) {
    return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
  }

  // Owner accounts (FANTASY_OWNER_EMAILS) skip both gates — unmetered access
  // for whoever runs the site. Usage is still recorded so spend stays visible;
  // it just never blocks or deducts.
  const owner = isOwner(user.email);

  const tier = (user.subscriptionTier ?? "FREE") as string;
  if (!owner && !canAccessFeature("fantasy_agent", tier)) {
    return NextResponse.json({ error: "PRO_REQUIRED", tier }, { status: 402 });
  }

  // Gate before starting rather than mid-answer: we can't know a turn's true
  // cost until it finishes, so require enough headroom for a typical one.
  if (!owner && user.fantasyCreditsMills < MIN_BALANCE_MILLS) {
    return NextResponse.json(
      { error: "INSUFFICIENT_CREDITS", balanceUsd: millsToUsd(user.fantasyCreditsMills) },
      { status: 402 }
    );
  }

  const billingUserId = session.userId;

  const client = new Anthropic();
  const encoder = new TextEncoder();

  // Set when the consumer cancels (tab closed, navigation, client abort) so we
  // stop writing and stop driving the agent session for a listener that's gone.
  let clientGone = false;

  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      clientGone = true;
    },
    async start(controller) {
      let closed = false;
      const emit = (payload: Record<string, unknown>) => {
        if (closed || clientGone) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // The consumer went away (tab closed, navigation, abort). The
          // controller is already closed, so stop trying to write to it —
          // `closed` alone can't catch this, since nothing on our side set it.
          closed = true;
        }
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

      // Declared outside the try so the finally block can bill from them.
      const turnUsageRef: TokenUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
      let sessionIdRef: string | null = priorSessionId;
      let answerRef = "";

      try {
        let sessionId = priorSessionId;
        if (!sessionId) {
          // Only offer tools that can actually succeed this session. A tool
          // that can only soft-fail still costs a full round trip before the
          // agent discovers that, so dropping it is a real latency win —
          // measured at 20.9s -> 12.0s when sports_search was removed.
          const tools: Array<Record<string, unknown>> = [
            { type: "agent_toolset_20260401", default_config: { enabled: true } },
          ];
          if (sportsSearchAvailable()) {
            tools.push({
              type: "custom",
              name: SPORTS_SEARCH_TOOL,
              description: "Sports-tuned retrieval for injuries, snaps, depth charts and odds.",
              input_schema: {
                type: "object",
                properties: { query: { type: "string" }, recency_days: { type: "integer" } },
                required: ["query"],
              },
            });
          }
          if (leagueConnected) {
            for (const t of LEAGUE_TOOLS) {
              tools.push({ type: "custom", name: t.name, description: t.description, input_schema: t.input_schema });
            }
          }

          // Overrides replace in full, so every tool the session should have
          // must be listed — including the built-in toolset.
          const created = await client.beta.sessions.create({
            agent: {
              type: "agent_with_overrides",
              id: FANTASY_AGENT_ID,
              tools,
            } as never,
            environment_id: FANTASY_ENVIRONMENT_ID,
            title: "Fantasy football strategy",
          });
          sessionId = created.id;
        }
        sessionIdRef = sessionId;
        emit({ type: "session", sessionId });

        // Stream-first: the SSE feed only delivers events emitted after it
        // opens, so this must precede the send or the first tokens are lost.
        const events = await client.beta.sessions.events.stream(sessionId, {
          event_deltas: ["agent.message"],
        });

        // Images first, then the question — the model reads the screenshot as
        // context for the text rather than the other way round.
        const content: Array<Record<string, unknown>> = [
          ...images.map((img) => ({
            type: "image",
            source: { type: "base64", media_type: img.media_type, data: img.data },
          })),
          {
            type: "text",
            text:
              message ||
              "Review the attached screenshot and tell me what you make of it — call out anything that changes a lineup, waiver, or trade decision.",
          },
        ];

        await client.beta.sessions.events.send(sessionId, {
          events: [{ type: "user.message", content: content as never }],
        });

        // Accumulate live-preview deltas per event id; the buffered
        // agent.message that follows is authoritative and replaces them.
        const previews = new Map<string, string>();

        for await (const event of events) {
          if (clientGone) break;
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
            // Accumulated for the saved transcript.
            const e = event as { id?: string; content?: Array<{ type?: string; text?: string }> };
            const text = (e.content ?? [])
              .filter((b) => b.type === "text" && typeof b.text === "string")
              .map((b) => b.text)
              .join("");
            if (e.id) previews.delete(e.id);
            answerRef += text;
            emit({ type: "message", id: e.id, text });
            continue;
          }

          // Built-in tools (web_search / web_fetch) run server-side; surface
          // them as status so the UI can show what the agent is doing.
          if (type === "span.model_request_end") {
            const mu = (event as { model_usage?: Record<string, number> }).model_usage;
            if (mu) {
              turnUsageRef.input_tokens = (turnUsageRef.input_tokens ?? 0) + (mu.input_tokens ?? 0);
              turnUsageRef.output_tokens = (turnUsageRef.output_tokens ?? 0) + (mu.output_tokens ?? 0);
              turnUsageRef.cache_read_input_tokens = (turnUsageRef.cache_read_input_tokens ?? 0) + (mu.cache_read_input_tokens ?? 0);
              turnUsageRef.cache_creation_input_tokens = (turnUsageRef.cache_creation_input_tokens ?? 0) + (mu.cache_creation_input_tokens ?? 0);
            }
            continue;
          }

          if (type === "agent.tool_use") {
            emit({ type: "activity", tool: (event as { name?: string }).name ?? "tool" });
            continue;
          }

          if (type === "agent.custom_tool_use") {
            const e = event as { id?: string; name?: string; input?: unknown };
            emit({ type: "activity", tool: e.name ?? SPORTS_SEARCH_TOOL });

            let result = { text: `Unknown tool: ${e.name}`, isError: true };
            const input = (e.input ?? {}) as Record<string, unknown>;

            if (e.name === SPORTS_SEARCH_TOOL) {
              result = await runSportsSearch(input);
            } else if (e.name === "get_league_context") {
              result = await runLeagueContext(leagueId, sleeperUserId);
            } else if (e.name === "get_waiver_activity") {
              const wk = typeof input.week === "number" ? input.week : undefined;
              result = await runWaiverActivity(leagueId, sleeperUserId, wk);
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
        emit({ type: "error", message: "The assistant connection dropped. Try again." });
      } finally {
        // Bill whatever was actually consumed, even on error or disconnect —
        // those tokens were spent. A turn that produced nothing costs nothing.
        try {
          if ((turnUsageRef.input_tokens ?? 0) + (turnUsageRef.output_tokens ?? 0) > 0) {
            // Owners are recorded but not deducted, so their real cost is
            // still visible rather than invisible.
            const { billedMills, balanceMills } = await chargeTurn(
              billingUserId,
              sessionIdRef,
              turnUsageRef,
              !owner
            );
            emit({
              type: "billing",
              chargedUsd: millsToUsd(billedMills),
              costUsd: millsToUsd(rawCostMills(turnUsageRef)),
              balanceUsd: millsToUsd(balanceMills),
              tokens:
                (turnUsageRef.input_tokens ?? 0) +
                (turnUsageRef.output_tokens ?? 0) +
                (turnUsageRef.cache_read_input_tokens ?? 0),
              owner,
            });
          }
        } catch (e) {
          console.error("[fantasy] billing failed:", e);
        }

        // Surface anything the agent wrote to /mnt/session/outputs/, otherwise
        // a generated cheat sheet exists but the user has no way to reach it.
        try {
          if (sessionIdRef && !clientGone) {
            let out: Array<{ id: string; filename: string; size_bytes: number }> = [];
            for (let a = 0; a < 3 && out.length === 0; a++) {
              // Indexing lags the idle event by a second or two.
              if (a) await new Promise((res) => setTimeout(res, 1200));
              const l = await client.beta.files.list({
                scope_id: sessionIdRef,
                betas: ["managed-agents-2026-04-01"],
              } as never);
              out = (l.data ?? []) as typeof out;
            }
            if (out.length) {
              emit({
                type: "files",
                files: out.map((f) => ({ id: f.id, filename: f.filename, sizeBytes: f.size_bytes })),
              });
            }
          }
        } catch (e) {
          console.error("[fantasy] output listing failed:", e);
        }

        // Persist the exchange so history survives closing the window.
        try {
          await appendTurn(billingUserId, sessionIdRef, message, answerRef);
        } catch (e) {
          console.error("[fantasy] history save failed:", e);
        }

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
