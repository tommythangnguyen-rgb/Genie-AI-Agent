import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization");
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return true;
  const vercelCron = req.headers.get("x-vercel-cron");
  if (vercelCron === "1" && CRON_SECRET) return true;
  if (!CRON_SECRET && process.env.NODE_ENV === "development") return true;
  return false;
}

// GET — called by Vercel Cron on schedule (every 3 days at 07:00 UTC)
export async function GET(req: Request) {
  return handler(req);
}

// POST — called manually to trigger a refresh check
export async function POST(req: Request) {
  return handler(req);
}

async function handler(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron] Resource freshness check started…");

  try {
    await prisma.resourceRefreshLog.create({
      data: { success: true, note: "Scheduled 3-day resource freshness check" },
    });

    console.log("[cron] Resource refresh log recorded.");
    return Response.json({ success: true, refreshedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[cron] Resource refresh log failed:", err);
    try {
      await prisma.resourceRefreshLog.create({
        data: { success: false, note: err?.message ?? "Unknown error" },
      });
    } catch {}
    return Response.json({ success: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export const maxDuration = 10;
