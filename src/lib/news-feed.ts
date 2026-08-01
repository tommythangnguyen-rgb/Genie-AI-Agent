import "server-only";

export type TickerItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  tag?: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ITEMS = 24;
const FETCH_TIMEOUT_MS = 8000;
const UA = "GenieStudentAidHub/1.0 (+https://github.com/one27; news ticker)";

// Verified working 2026-08-01. Notably dead, do not re-add without re-testing:
// ed.gov/feed (404 since the 2025 redesign), fsapartners.ed.gov/rss.xml (valid
// RSS, permanently empty channel), nasfaa.org + chronicle.com (403 to bots),
// consumerfinance.gov blog feed (empty).
const RSS_SOURCES = [
  { source: "Inside Higher Ed", url: "https://www.insidehighered.com/rss/feed/ihe" },
  { source: "Higher Ed Dive", url: "https://www.highereddive.com/feeds/news/" },
] as const;

const FEDERAL_REGISTER_URL =
  "https://www.federalregister.gov/api/v1/documents.json" +
  "?per_page=8&order=newest" +
  "&conditions%5Bagencies%5D%5B%5D=education-department" +
  "&conditions%5Bterm%5D=student%20financial%20assistance" +
  "&fields%5B%5D=title&fields%5B%5D=publication_date" +
  "&fields%5B%5D=html_url&fields%5B%5D=type";

let cache: { items: TickerItem[]; fetchedAt: number } | null = null;
let inFlight: Promise<TickerItem[]> | null = null;

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  mdash: "—", ndash: "–", hellip: "…",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, ref: string) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X"
        ? parseInt(ref.slice(2), 16)
        : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[ref.toLowerCase()] ?? match;
  });
}

function cleanText(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function tagContent(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return null;
  const cdata = m[1].match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return cdata ? cdata[1] : m[1];
}

function toIso(raw: string | null): string {
  if (!raw) return new Date(0).toISOString();
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

function parseRss(xml: string, source: string): TickerItem[] {
  const items: TickerItem[] = [];
  for (const m of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    const title = cleanText(tagContent(block, "title") ?? "");
    const url = cleanText(tagContent(block, "link") ?? "");
    if (!title || !/^https?:\/\//.test(url)) continue;
    items.push({
      id: cleanText(tagContent(block, "guid") ?? "") || url,
      title,
      url,
      source,
      publishedAt: toIso(tagContent(block, "pubDate")),
    });
  }
  return items;
}

function parseFederalRegister(json: string): TickerItem[] {
  const data = JSON.parse(json) as {
    results?: Array<{ title?: string; html_url?: string; publication_date?: string; type?: string }>;
  };
  return (data.results ?? []).flatMap((r) => {
    if (!r.title || !r.html_url) return [];
    return [{
      id: r.html_url,
      title: cleanText(r.title),
      url: r.html_url,
      source: "Federal Register",
      publishedAt: toIso(r.publication_date ?? null),
      tag: r.type,
    }];
  });
}

async function fetchAll(): Promise<TickerItem[]> {
  const jobs: Array<Promise<TickerItem[]>> = [
    ...RSS_SOURCES.map(({ source, url }) =>
      fetchText(url).then((xml) => parseRss(xml, source))
    ),
    fetchText(FEDERAL_REGISTER_URL).then(parseFederalRegister),
  ];

  const settled = await Promise.allSettled(jobs);
  for (const r of settled) {
    if (r.status === "rejected") console.warn("[news-feed] source failed:", r.reason?.message ?? r.reason);
  }

  const seen = new Set<string>();
  return settled
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_ITEMS);
}

/**
 * Cached headline feed. One upstream fetch per TTL window serves every visitor,
 * so concurrent traffic never multiplies calls to the source sites. On a total
 * upstream failure the last good payload is served stale rather than blanking.
 */
export async function getNewsItems(): Promise<{ items: TickerItem[]; fetchedAt: number; stale: boolean }> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { ...cache, stale: false };
  }

  inFlight ??= fetchAll().finally(() => { inFlight = null; });

  try {
    const items = await inFlight;
    if (items.length === 0 && cache) return { ...cache, stale: true };
    cache = { items, fetchedAt: Date.now() };
    return { ...cache, stale: false };
  } catch (err) {
    console.error("[news-feed] refresh failed:", err);
    if (cache) return { ...cache, stale: true };
    return { items: [], fetchedAt: Date.now(), stale: true };
  }
}
