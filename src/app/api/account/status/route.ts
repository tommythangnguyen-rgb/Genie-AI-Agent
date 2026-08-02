import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DAILY_LIMITS } from "@/lib/stripe";
import { cookies } from "next/headers";
import { effectiveTier } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionPeriodEnd: true,
        dailyQuestionCount: true,
        dailyQuestionResetAt: true,
        accountOwnerId: true,
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const needsReset = !user.dailyQuestionResetAt || user.dailyQuestionResetAt < today;
    const count = needsReset ? 0 : user.dailyQuestionCount;
    const tier = effectiveTier(user.subscriptionTier, user.subscriptionStatus);
    const limit = DAILY_LIMITS[tier] ?? 3;

    return NextResponse.json({
      authenticated: true,
      tier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPeriodEnd: user.subscriptionPeriodEnd,
      dailyCount: count,
      dailyLimit: limit,
      remaining: Math.max(0, limit - count),
      unlimited: limit >= 999999,
    });
  }

  // Guest
  const cookieStore = await cookies();
  const sid = cookieStore.get("genie-session")?.value;

  const GUEST_LIMIT = 1;

  if (!sid) {
    return NextResponse.json({
      authenticated: false,
      tier: "GUEST",
      dailyCount: 0,
      dailyLimit: GUEST_LIMIT,
      remaining: GUEST_LIMIT,
      unlimited: false,
    });
  }

  const guestSession = await prisma.guestSession.findUnique({ where: { sessionId: sid } });
  const count = guestSession?.dailyQuestionCount ?? 0;

  return NextResponse.json({
    authenticated: false,
    tier: "GUEST",
    dailyCount: count,
    dailyLimit: GUEST_LIMIT,
    remaining: Math.max(0, GUEST_LIMIT - count),
    unlimited: false,
  });
}
