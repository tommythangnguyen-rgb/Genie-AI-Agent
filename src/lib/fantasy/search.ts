import "server-only";

/**
 * Host-side executor for the `sports_search` custom tool.
 *
 * The agent emits `agent.custom_tool_use`; this runs on our server with our
 * key and returns `user.custom_tool_result`. The Tavily key never enters the
 * agent sandbox, so nothing the model writes can read or exfiltrate it.
 */

const TAVILY_URL = "https://api.tavily.com/search";
const TIMEOUT_MS = 15_000;
const MAX_RESULTS = 6;
const MAX_CHARS_PER_RESULT = 2400;

// Weighted toward beat writers, injury desks, and odds — the sources that
// general web search tends to bury under aggregator SEO pages.
const PREFERRED_DOMAINS = [
  "espn.com",
  "nfl.com",
  "rotowire.com",
  "fantasypros.com",
  "pro-football-reference.com",
  "profootballtalk.nbcsports.com",
  "theathletic.com",
  "cbssports.com",
  "sportsline.com",
  "actionnetwork.com",
  "vegasinsider.com",
  "reddit.com",
];

export type SportsSearchInput = {
  query?: unknown;
  recency_days?: unknown;
};

export type SportsSearchOutcome = {
  text: string;
  isError: boolean;
};

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  raw_content?: string | null;
  published_date?: string;
  score?: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}…[truncated]`;
}

export function sportsSearchAvailable(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

export async function runSportsSearch(input: SportsSearchInput): Promise<SportsSearchOutcome> {
  const query = typeof input?.query === "string" ? input.query.trim() : "";
  if (!query) {
    return { text: "sports_search requires a non-empty `query` string.", isError: true };
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    // Soft-fail: tell the model to fall back rather than dead-ending the turn.
    return {
      text:
        "sports_search is not configured on this deployment (no TAVILY_API_KEY). " +
        "Use the built-in web_search and web_fetch tools instead, and note in your answer " +
        "that sports-specific retrieval was unavailable.",
      isError: true,
    };
  }

  const days =
    typeof input?.recency_days === "number" && Number.isFinite(input.recency_days)
      ? clamp(Math.round(input.recency_days), 1, 365)
      : undefined;

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        query,
        search_depth: "advanced",
        max_results: MAX_RESULTS,
        include_raw_content: true,
        include_domains: PREFERRED_DOMAINS,
        ...(days ? { days } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        text: `sports_search upstream error ${res.status}. ${truncate(detail, 300)}`,
        isError: true,
      };
    }

    const data = (await res.json()) as { results?: TavilyResult[]; answer?: string };
    const results = data.results ?? [];

    if (results.length === 0) {
      return {
        text: `No sports sources matched "${query}"${days ? ` within the last ${days} day(s)` : ""}. Widen the query or drop the recency filter, then try web_search.`,
        isError: false,
      };
    }

    const header = `sports_search results for "${query}"${days ? ` (last ${days} day(s))` : ""} — retrieved ${new Date().toISOString()}`;
    const body = results
      .map((r, i) => {
        const text = r.raw_content?.trim() || r.content?.trim() || "(no extractable body text)";
        return [
          `[${i + 1}] ${r.title ?? "Untitled"}`,
          `URL: ${r.url ?? "unknown"}`,
          `Published: ${r.published_date ?? "not reported by source"}`,
          truncate(text, MAX_CHARS_PER_RESULT),
        ].join("\n");
      })
      .join("\n\n---\n\n");

    return { text: `${header}\n\n${body}`, isError: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const timedOut = msg.includes("timed out") || msg.includes("abort");
    return {
      text: timedOut
        ? `sports_search timed out after ${TIMEOUT_MS / 1000}s. Retry with a narrower query, or use web_search.`
        : `sports_search failed: ${truncate(msg, 200)}. Use web_search instead.`,
      isError: true,
    };
  }
}
