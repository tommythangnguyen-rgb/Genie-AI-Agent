import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserDailyUsage } from "@/lib/feature-gates";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ authenticated: false, used: 0, limit: 10, tier: "FREE" });
  }

  const usage = await getUserDailyUsage(session.userId);
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    used: usage.used,
    limit: usage.limit >= 999999 ? 999999 : usage.limit,
    tier: usage.tier,
    resetAt: usage.resetAt?.toISOString() ?? null,
  });
}
