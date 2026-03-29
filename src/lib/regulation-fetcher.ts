import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FetchedUpdate {
  category: string;
  title: string;
  summary: string;
  sourceUrl?: string;
  publishedAt?: Date;
}

interface StoredUpdate {
  id: string;
  category: string;
  title: string;
  summary: string;
  sourceUrl: string | null;
  publishedAt: string | null; // SQLite stores as ISO string
  fetchedAt: string;
}

interface FetchLog {
  fetchedAt: string;
  success: number;
  updateCount: number;
}

// ─── RSS helpers ─────────────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  const pattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`,
    "i"
  );
  const m = pattern.exec(xml);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function parseRSSItems(
  xml: string
): Array<{ title: string; description: string; link: string; pubDate: string }> {
  const items: ReturnType<typeof parseRSSItems> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    items.push({
      title: extractTag(m[1], "title"),
      description: extractTag(m[1], "description"),
      link: extractTag(m[1], "link"),
      pubDate: extractTag(m[1], "pubDate"),
    });
  }
  return items;
}

// ─── Source 1: Federal Register — Education Dept rules ───────────────────────

async function fetchFederalRegisterUpdates(): Promise<FetchedUpdate[]> {
  const url =
    "https://www.federalregister.gov/api/v1/documents.json?" +
    "conditions%5Bagencies%5D%5B%5D=education-department" +
    "&conditions%5Btype%5D%5B%5D=Rule" +
    "&conditions%5Btype%5D%5B%5D=Proposed+Rule" +
    "&per_page=6&order=newest" +
    "&fields%5B%5D=title&fields%5B%5D=abstract&fields%5B%5D=html_url&fields%5B%5D=publication_date";

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];

  const data = await res.json();
  return ((data.results as any[]) ?? []).slice(0, 6).map((doc) => ({
    category: "TitleIV",
    title: String(doc.title ?? "ED Regulation Update"),
    summary: String(doc.abstract ?? "See the Federal Register for details."),
    sourceUrl: doc.html_url ?? undefined,
    publishedAt: doc.publication_date ? new Date(doc.publication_date) : undefined,
  }));
}

// ─── Source 2: NASFAA Today RSS — student aid / post-secondary news ──────────

async function fetchNASFAAUpdates(): Promise<FetchedUpdate[]> {
  const res = await fetch("https://www.nasfaa.org/today_rss", {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: "application/rss+xml, text/xml, */*" },
  });
  if (!res.ok) return [];

  const text = await res.text();
  const items = parseRSSItems(text);

  return items.slice(0, 5).map((item) => ({
    category: "SchoolUpdates",
    title: item.title || "NASFAA Update",
    summary: item.description
      ? item.description.replace(/<[^>]+>/g, "").slice(0, 350)
      : "See nasfaa.org for details.",
    sourceUrl: item.link || undefined,
    publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
  }));
}

// ─── Source 3: IRS Newsroom RSS — education tax updates ──────────────────────

const IRS_KEYWORDS = [
  "education", "student", "tuition", "scholarship", "529",
  "aotc", "lifetime learning", "higher education", "loan forgiveness", "tax credit",
];

async function fetchIRSUpdates(): Promise<FetchedUpdate[]> {
  const res = await fetch(
    "https://www.irs.gov/newsroom/news-releases-and-media-advisories",
    {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/rss+xml, text/xml, */*" },
    }
  );
  if (!res.ok) return [];

  const text = await res.text();
  const items = parseRSSItems(text);

  const relevant = items.filter((item) => {
    const content = (item.title + " " + item.description).toLowerCase();
    return IRS_KEYWORDS.some((kw) => content.includes(kw));
  });

  return relevant.slice(0, 5).map((item) => ({
    category: "IRS",
    title: item.title || "IRS Update",
    summary: item.description
      ? item.description.replace(/<[^>]+>/g, "").slice(0, 350)
      : "See IRS newsroom for details.",
    sourceUrl: item.link || undefined,
    publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
  }));
}

// ─── Source 4: Congress.gov — legislative updates (optional API key) ─────────

async function fetchCongressUpdates(): Promise<FetchedUpdate[]> {
  const apiKey = process.env.CONGRESS_API_KEY;

  if (!apiKey) {
    return [
      {
        category: "Legislative",
        title: "Congressional Tracking — Configure CONGRESS_API_KEY for Live Updates",
        summary:
          "Add CONGRESS_API_KEY (free at api.congress.gov) to .env.local for automatic " +
          "OBBB/HEA legislative tracking. Without it, rely on the static knowledge base. " +
          "Monitor congress.gov/bill/119th-congress/house-bill/1 for OBBB status.",
        sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/1",
      },
    ];
  }

  // HR 1, 119th Congress — One Big Beautiful Bill
  const res = await fetch(
    `https://api.congress.gov/v3/bill/119/hr/1/actions?api_key=${apiKey}&format=json&limit=5`,
    { signal: AbortSignal.timeout(10_000) }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const actions: any[] = (data.actions ?? []).slice(0, 5);
  if (actions.length === 0) return [];

  return [
    {
      category: "Legislative",
      title: "One Big Beautiful Bill (HR 1, 119th Congress) — Latest Actions",
      summary: actions.map((a: any) => `${a.actionDate}: ${a.text}`).join(" | "),
      sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/1",
      publishedAt: actions[0]?.actionDate ? new Date(actions[0].actionDate) : undefined,
    },
  ];
}

// ─── Main fetch + store ───────────────────────────────────────────────────────

export async function fetchAndStoreRegulationUpdates(): Promise<{
  count: number;
  errors: string[];
}> {
  const allUpdates: FetchedUpdate[] = [];
  const errors: string[] = [];

  await Promise.allSettled([
    fetchFederalRegisterUpdates()
      .then((r) => allUpdates.push(...r))
      .catch((e) => errors.push(`Federal Register: ${e?.message}`)),
    fetchNASFAAUpdates()
      .then((r) => allUpdates.push(...r))
      .catch((e) => errors.push(`NASFAA: ${e?.message}`)),
    fetchIRSUpdates()
      .then((r) => allUpdates.push(...r))
      .catch((e) => errors.push(`IRS: ${e?.message}`)),
    fetchCongressUpdates()
      .then((r) => allUpdates.push(...r))
      .catch((e) => errors.push(`Congress: ${e?.message}`)),
  ]);

  // Clear old data and insert new rows using raw SQL (compatible with existing Prisma client)
  await prisma.$executeRaw`DELETE FROM RegulationUpdate`;

  for (const u of allUpdates) {
    const id = crypto.randomUUID();
    const pubAt = u.publishedAt ? u.publishedAt.toISOString() : null;
    await prisma.$executeRaw`
      INSERT INTO RegulationUpdate (id, category, title, summary, sourceUrl, publishedAt, fetchedAt)
      VALUES (${id}, ${u.category}, ${u.title}, ${u.summary}, ${u.sourceUrl ?? null}, ${pubAt}, datetime('now'))
    `;
  }

  // Log this fetch
  const logId = crypto.randomUUID();
  const succeeded = errors.length < 4; // success if at least one source worked
  const errStr = errors.length > 0 ? errors.join("; ") : null;
  await prisma.$executeRaw`
    INSERT INTO RegulationFetchLog (id, fetchedAt, success, updateCount, error)
    VALUES (${logId}, datetime('now'), ${succeeded ? 1 : 0}, ${allUpdates.length}, ${errStr})
  `;

  // Bust in-memory cache
  updateCache = null;

  return { count: allUpdates.length, errors };
}

// ─── Context builder (called by aid-agent route) ──────────────────────────────

let updateCache: { content: string; cachedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1_000;       // 5 minutes
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1_000; // 14 days

export async function getLatestUpdatesContext(): Promise<string | null> {
  if (updateCache && Date.now() - updateCache.cachedAt < CACHE_TTL_MS) {
    return updateCache.content || null;
  }

  let updates: StoredUpdate[];
  let logs: FetchLog[];
  try {
    updates = await prisma.$queryRaw<StoredUpdate[]>`
      SELECT id, category, title, summary, sourceUrl, publishedAt, fetchedAt
      FROM RegulationUpdate
      ORDER BY category ASC, fetchedAt DESC
    `;
    logs = await prisma.$queryRaw<FetchLog[]>`
      SELECT fetchedAt, success, updateCount
      FROM RegulationFetchLog
      ORDER BY fetchedAt DESC
      LIMIT 1
    `;
  } catch {
    return null;
  }
  const lastLog = logs[0] ?? null;

  if (updates.length === 0) {
    updateCache = { content: "", cachedAt: Date.now() };
    return null;
  }

  const fetchDate = lastLog
    ? new Date(lastLog.fetchedAt).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : "Unknown";

  const isStale =
    !lastLog ||
    Date.now() - new Date(lastLog.fetchedAt).getTime() > STALE_AFTER_MS;

  const categoryLabels: Record<string, string> = {
    TitleIV:       "Title IV / Education Department Regulations",
    IRS:           "IRS / Education Tax Updates",
    Legislative:   "Legislative Updates (Congress)",
    SchoolUpdates: "Post-Secondary School & Policy News",
  };

  const grouped: Record<string, StoredUpdate[]> = {};
  for (const u of updates) {
    (grouped[u.category] ??= []).push(u);
  }

  let content =
    `## LIVE REGULATORY UPDATES\n` +
    `*Last fetched: ${fetchDate}` +
    (isStale ? " — ⚠️ Data may be stale. Run \`npm run regulations:refresh\`." : "") +
    ` | Auto-refreshes on the 1st and 15th of each month (Vercel) or manually via \`npm run regulations:refresh\`*\n\n`;

  for (const [cat, items] of Object.entries(grouped)) {
    content += `### ${categoryLabels[cat] ?? cat}\n`;
    for (const item of items) {
      const rawDate = item.publishedAt ?? item.fetchedAt;
      const d = new Date(rawDate).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });
      content += `- **${item.title}** (${d}): ${item.summary}`;
      if (item.sourceUrl) content += ` — [Source](${item.sourceUrl})`;
      content += "\n";
    }
    content += "\n";
  }

  content +=
    "---\n\n" +
    "**Instructions**: Check LIVE REGULATORY UPDATES first for any recent changes that " +
    "supersede the static knowledge base. If a live update contradicts static information, " +
    "the live update takes precedence. Flag such answers as 'updated per live data feed'.\n";

  updateCache = { content, cachedAt: Date.now() };
  return content;
}

export async function getLastFetchInfo(): Promise<{
  fetchedAt: Date | null;
  updateCount: number;
  isStale: boolean;
}> {
  let logs: FetchLog[];
  try {
    logs = await prisma.$queryRaw<FetchLog[]>`
      SELECT fetchedAt, success, updateCount FROM RegulationFetchLog
      ORDER BY fetchedAt DESC LIMIT 1
    `;
  } catch {
    return { fetchedAt: null, updateCount: 0, isStale: true };
  }
  const log = logs[0] ?? null;
  const fetchedAt = log ? new Date(log.fetchedAt) : null;
  const isStale = !fetchedAt || Date.now() - fetchedAt.getTime() > STALE_AFTER_MS;
  return { fetchedAt, updateCount: log?.updateCount ?? 0, isStale };
}
