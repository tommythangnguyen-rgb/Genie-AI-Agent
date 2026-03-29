import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DAILY_LIMITS } from "@/lib/stripe";
import { cookies } from "next/headers";

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
    const tier = user.subscriptionTier ?? "FREE";
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

  if (!sid) {
    return NextResponse.json({
      authenticated: false,
      tier: "FREE",
      dailyCount: 0,
      dailyLimit: 3,
      remaining: 3,
      unlimited: false,
    });
  }

  const guestSession = await prisma.guestSession.findUnique({ where: { sessionId: sid } });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const needsReset =
    !guestSession?.dailyQuestionResetAt || guestSession.dailyQuestionResetAt < today;
  const count = needsReset ? 0 : (guestSession?.dailyQuestionCount ?? 0);

  return NextResponse.json({
    authenticated: false,
    tier: "FREE",
    dailyCount: count,
    dailyLimit: 3,
    remaining: Math.max(0, 3 - count),
    unlimited: false,
  });
}
