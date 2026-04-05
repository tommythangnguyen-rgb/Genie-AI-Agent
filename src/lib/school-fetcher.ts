import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * School data fetcher — queries the US Dept of Education College Scorecard API
 * for all Title IV-eligible institutions (active, closed, and under investigation).
 *
 * API key: set COLLEGE_SCORECARD_API_KEY in env vars (free at api.data.gov).
 * Falls back to "DEMO_KEY" (40 req/min, fine for our periodic fetch).
 *
 * Coverage: ~6,900+ institutions — 4-year universities, community colleges,
 * trade/vocational schools, online institutions, professional schools, HBCUs,
 * HSIs, tribal colleges, and for-profit schools across all 50 states + territories.
 */

const SCORECARD_BASE = "https://api.data.gov/ed/collegescorecard/v1/schools.json";

const SCORECARD_FIELDS = [
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.ownership",
  "school.degrees_awarded.highest",
  "school.operating",
  "school.under_investigation",
  "school.locale",
  "school.hbcu",
  "school.hispanic_serving",
  "school.tribal",
  "id",
].join(",");

function apiKey(): string {
  return process.env.COLLEGE_SCORECARD_API_KEY ?? "DEMO_KEY";
}

function ownershipLabel(n: number): string {
  if (n === 1) return "Public";
  if (n === 2) return "Private nonprofit";
  if (n === 3) return "Private for-profit";
  return "Unknown";
}

function degreeLabel(n: number): string {
  const map: Record<number, string> = {
    1: "Non-degree/Certificate",
    2: "Associate",
    3: "Bachelor's",
    4: "Graduate/Professional",
  };
  return map[n] ?? "Unknown";
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function scorecardFetch(params: Record<string, string>): Promise<any[]> {
  const url = new URL(SCORECARD_BASE);
  url.searchParams.set("fields", SCORECARD_FIELDS);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(14_000) });
  if (!res.ok) throw new Error(`Scorecard ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return data.results ?? [];
}

async function scorecardTotal(filter: Record<string, string>): Promise<number> {
  const url = new URL(SCORECARD_BASE);
  url.searchParams.set("fields", "id");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(filter)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.metadata?.total ?? 0;
}

function schoolLine(s: any): string {
  const name = s["school.name"] ?? "Unknown";
  const city = s["school.city"] ?? "";
  const state = s["school.state"] ?? "";
  const type = ownershipLabel(s["school.ownership"]);
  const degree = degreeLabel(s["school.degrees_awarded.highest"]);
  const flags: string[] = [];
  if (s["school.hbcu"]) flags.push("HBCU");
  if (s["school.hispanic_serving"]) flags.push("HSI");
  if (s["school.tribal"]) flags.push("Tribal");
  const flagStr = flags.length ? ` [${flags.join(", ")}]` : "";
  return `${name} (${city}, ${state} — ${type}, ${degree}${flagStr})`;
}

// ── Main export: fetch + store ────────────────────────────────────────────────

export async function fetchAndStoreSchoolUpdates(): Promise<{
  count: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const updates: Array<{
    category: string;
    title: string;
    summary: string;
    sourceUrl?: string;
    publishedAt?: Date;
  }> = [];

  // 1. Total active institution count
  try {
    const [totalActive, totalAll] = await Promise.all([
      scorecardTotal({ "school.operating": "1" }),
      scorecardTotal({}),
    ]);
    updates.push({
      category: "Schools",
      title: "Total Title IV-Eligible Institutions (College Scorecard)",
      summary:
        `As of this fetch: **${totalActive.toLocaleString()} actively operating** Title IV-eligible ` +
        `institutions (${totalAll.toLocaleString()} total including closed). This covers all 4-year ` +
        `universities, community colleges, trade/vocational schools, online institutions, professional ` +
        `schools (law, medical, dental, nursing), HBCUs, HSIs, tribal colleges, and for-profit schools ` +
        `across all 50 states, D.C., Puerto Rico, and U.S. territories. ` +
        `Use collegescorecard.ed.gov to look up any specific institution.`,
      sourceUrl: "https://collegescorecard.ed.gov",
    });
  } catch (e: any) {
    errors.push(`Total count: ${e?.message}`);
  }

  // 2. Most recently registered institutions (highest UNITID = recently assigned)
  try {
    const recent = await scorecardFetch({
      "school.operating": "1",
      per_page: "25",
      sort: "id:desc",
    });
    if (recent.length > 0) {
      const names = recent.slice(0, 15).map(schoolLine).join(" | ");
      updates.push({
        category: "Schools",
        title: "Recently Registered Title IV Institutions",
        summary:
          `Most recently assigned UNITID (newest to Scorecard database): ${names}. ` +
          `These may be newly certified, recently re-opened, or recently added to the database. ` +
          `Always verify current Title IV certification status at the Program Participation Agreement (PPA) database.`,
        sourceUrl: "https://eligcert.ed.gov",
      });
    }
  } catch (e: any) {
    errors.push(`Recent schools: ${e?.message}`);
  }

  // 3. Non-operating institutions (recently closed or withdrew from Title IV)
  try {
    const closed = await scorecardFetch({
      "school.operating": "0",
      per_page: "20",
      sort: "id:desc",
    });
    if (closed.length > 0) {
      const names = closed.slice(0, 10).map(schoolLine).join(" | ");
      updates.push({
        category: "Schools",
        title: "Non-Operating Institutions (Closed / Withdrew from Title IV)",
        summary:
          `Institutions marked non-operating in the College Scorecard: ${names}. ` +
          `Closed schools affect R2T4 obligations, teach-out plan requirements, ` +
          `and closed-school discharge eligibility for borrowers. ` +
          `Verify closure status and discharge availability at studentaid.gov/closedschool.`,
        sourceUrl: "https://studentaid.gov/announcements-events/closed-school",
      });
    }
  } catch (e: any) {
    errors.push(`Closed schools: ${e?.message}`);
  }

  // 4. Schools under ED investigation / heightened cash monitoring
  try {
    const investigated = await scorecardFetch({
      "school.under_investigation": "1",
      per_page: "20",
      sort: "id:desc",
    });
    if (investigated.length > 0) {
      const names = investigated.slice(0, 10).map(schoolLine).join(" | ");
      updates.push({
        category: "Schools",
        title: "Institutions Under ED Investigation / Heightened Cash Monitoring",
        summary:
          `Currently flagged under investigation in College Scorecard: ${names}. ` +
          `HCM (Heightened Cash Monitoring) levels 1 and 2 affect disbursement timing and documentation. ` +
          `See FSA Partner Connect for current HCM lists and Dear Colleague Letters.`,
        sourceUrl: "https://fsapartners.ed.gov/knowledge-center/library/dear-colleague-letters",
      });
    }
  } catch (e: any) {
    errors.push(`Investigated schools: ${e?.message}`);
  }

  // 5. Breakdown by institution type (public/private/for-profit counts)
  try {
    const [pub, priv, fp] = await Promise.all([
      scorecardTotal({ "school.operating": "1", "school.ownership": "1" }),
      scorecardTotal({ "school.operating": "1", "school.ownership": "2" }),
      scorecardTotal({ "school.operating": "1", "school.ownership": "3" }),
    ]);
    const hbcuCount = await scorecardTotal({ "school.operating": "1", "school.hbcu": "1" });
    const hsiCount = await scorecardTotal({ "school.operating": "1", "school.hispanic_serving": "1" });
    const tribalCount = await scorecardTotal({ "school.operating": "1", "school.tribal": "1" });
    updates.push({
      category: "Schools",
      title: "Institution Breakdown by Type (Active Title IV)",
      summary:
        `Public: ${pub.toLocaleString()} | Private nonprofit: ${priv.toLocaleString()} | ` +
        `Private for-profit: ${fp.toLocaleString()} | HBCUs: ${hbcuCount.toLocaleString()} | ` +
        `HSIs: ${hsiCount.toLocaleString()} | Tribal colleges: ${tribalCount.toLocaleString()}. ` +
        `Financial aid packaging, cost structures, and compliance requirements vary significantly ` +
        `by ownership type. For-profit institutions face additional oversight under 90/10 rule ` +
        `and gainful employment requirements.`,
      sourceUrl: "https://collegescorecard.ed.gov",
    });
  } catch (e: any) {
    errors.push(`Type breakdown: ${e?.message}`);
  }

  // Write to DB — replace old school entries
  try {
    await prisma.regulationUpdate.deleteMany({ where: { category: "Schools" } });
    if (updates.length > 0) {
      await prisma.regulationUpdate.createMany({
        data: updates.map((u) => ({
          category: u.category,
          title: u.title,
          summary: u.summary,
          sourceUrl: u.sourceUrl ?? null,
          publishedAt: u.publishedAt ?? null,
        })),
      });
    }
  } catch (e: any) {
    errors.push(`DB write: ${e?.message}`);
  }

  return { count: updates.length, errors };
}

// ── Context builder (called by aid-agent route) ───────────────────────────────

let schoolCache: { content: string; cachedAt: number } | null = null;
const SCHOOL_CACHE_TTL_MS = 6 * 60 * 60 * 1_000; // 6 hours

export async function getSchoolContext(): Promise<string | null> {
  if (schoolCache && Date.now() - schoolCache.cachedAt < SCHOOL_CACHE_TTL_MS) {
    return schoolCache.content || null;
  }

  let rows: Array<{
    id: string;
    title: string;
    summary: string;
    sourceUrl: string | null;
    fetchedAt: Date;
  }>;

  try {
    rows = await prisma.regulationUpdate.findMany({
      where: { category: "Schools" },
      orderBy: { fetchedAt: "desc" },
    });
  } catch {
    return null;
  }

  if (rows.length === 0) {
    schoolCache = { content: "", cachedAt: Date.now() };
    return null;
  }

  const fetchDate = rows[0]
    ? new Date(rows[0].fetchedAt).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : "Unknown";

  let content =
    `## LIVE SCHOOL DATABASE CONTEXT\n` +
    `*Source: US Dept of Education College Scorecard API | Last updated: ${fetchDate}*\n\n`;

  for (const row of rows) {
    content += `**${row.title}**: ${row.summary}`;
    if (row.sourceUrl) content += ` — [Source](${row.sourceUrl})`;
    content += "\n\n";
  }

  content +=
    "---\n\n" +
    "**School Lookup Instructions**: When a user asks about a specific institution, " +
    "use the data above for current status, then supplement with your training knowledge. " +
    "For real-time school data, direct users to collegescorecard.ed.gov, " +
    "nces.ed.gov/collegenavigator, or the school's official net price calculator. " +
    "For Title IV eligibility verification, use eligcert.ed.gov or ope.ed.gov/dapip.\n";

  schoolCache = { content, cachedAt: Date.now() };
  return content;
}
