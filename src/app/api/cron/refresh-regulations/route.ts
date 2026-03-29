import { fetchAndStoreRegulationUpdates, getLastFetchInfo } from "@/lib/regulation-fetcher";

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(req: Request): boolean {
  // Vercel cron passes the secret in the Authorization header
  const auth = req.headers.get("Authorization");
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return true;

  // Allow Vercel's internal cron invocations (they set this header automatically)
  const vercelCron = req.headers.get("x-vercel-cron");
  if (vercelCron === "1" && CRON_SECRET) return true;

  // Dev fallback: if no secret is configured, allow local calls
  if (!CRON_SECRET && process.env.NODE_ENV === "development") return true;

  return false;
}

// GET — called by Vercel Cron on schedule
export async function GET(req: Request) {
  return handler(req);
}

// POST — called manually via npm run regulations:refresh
export async function POST(req: Request) {
  return handler(req);
}

async function handler(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  console.log("[cron] Starting regulation update fetch…");

  try {
    const { count, errors } = await fetchAndStoreRegulationUpdates();
    const info = await getLastFetchInfo();

    const result = {
      success: true,
      updatesStored: count,
      fetchedAt: info.fetchedAt?.toISOString(),
      durationMs: Date.now() - start,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("[cron] Regulation fetch complete:", result);
    return Response.json(result);
  } catch (err: any) {
    console.error("[cron] Regulation fetch failed:", err);
    return Response.json(
      { success: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

// Allow up to 60 seconds for external API calls
export const maxDuration = 60;
