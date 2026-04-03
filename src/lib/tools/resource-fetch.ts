import "server-only";
import { tool } from "ai";
import { z } from "zod";

const ALLOWED_DOMAINS = [
  "studentaid.gov",
  "ed.gov",
  "ifap.ed.gov",
  "fsapartners.ed.gov",
  "nslds.ed.gov",
  "cod.ed.gov",
  "eligcert.ed.gov",
  "ope.ed.gov",
  "ecampusbased.ed.gov",
  "fsawebenroll.ed.gov",
  "g5.gov",
  "nasfaa.org",
  "askregs.nasfaa.org",
  "ecfr.gov",
  "irs.gov",
  "federalregister.gov",
  "gao.gov",
  "oig.ed.gov",
  "nces.ed.gov",
  "collegescorecard.ed.gov",
  "nc-sara.org",
  "collegeboard.org",
  "commonapp.org",
  "act.org",
  "fastweb.com",
  "scholarships.com",
  "scholarshipamerica.org",
  "unigo.com",
  "cappex.com",
  "chegg.com",
  "petersons.com",
  "nacubo.org",
  "aicpa-cima.com",
  "acenet.edu",
  "higheredcompliance.org",
  "shrm.org",
  "ada.gov",
  "mindfulschools.org",
];

function isAllowedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 4500);
}

const inputSchema = z.object({
  url: z.string().url().describe("Full URL of the approved resource page to fetch"),
  reason: z.string().describe("One-sentence reason why fetching this page helps answer the user's question"),
});

export const fetchResourcePage = tool({
  description:
    "Fetches live content from an approved student aid or higher education resource website. " +
    "Use ONLY when a user asks about what a specific panel resource contains, its current offerings, " +
    "deadlines, or announcements. Approved domains include studentaid.gov, ed.gov, ifap.ed.gov, " +
    "nslds.ed.gov, nasfaa.org, irs.gov, collegeboard.org, fastweb.com, and other resources " +
    "listed in the Students & Parents and Admins/Auditors panels.",
  inputSchema,
  execute: async (input: z.infer<typeof inputSchema>) => {
    const { url } = input;
    if (!isAllowedUrl(url)) {
      return {
        error:
          "That domain is not approved. Only student aid and higher education resource domains from the panel may be fetched.",
      };
    }
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(9_000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; askGenie-StudentAid/1.0; +https://genie127.com)",
          Accept: "text/html,application/xhtml+xml,text/plain",
        },
      });
      if (!res.ok) return { error: `HTTP ${res.status} from ${url}` };
      const contentType = res.headers.get("content-type") ?? "";
      const raw = await res.text();
      const content = contentType.includes("text/html")
        ? extractText(raw)
        : raw.slice(0, 4500);
      return { url, content };
    } catch (err: unknown) {
      return { error: (err as Error)?.message ?? "Fetch failed" };
    }
  },
});
