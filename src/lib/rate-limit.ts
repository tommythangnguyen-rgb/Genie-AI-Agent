import "server-only";
import { prisma } from "./prisma";
import { DAILY_LIMITS } from "./stripe";

function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function checkAndIncrementUserLimit(
  userId: string,
  tier: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = DAILY_LIMITS[tier] ?? 3;
  if (limit >= 999999) return { allowed: true, remaining: 999999, limit };

  const today = getTodayUTC();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyQuestionCount: true, dailyQuestionResetAt: true },
  });

  if (!user) return { allowed: false, remaining: 0, limit };

  const needsReset = !user.dailyQuestionResetAt || user.dailyQuestionResetAt < today;
  const currentCount = needsReset ? 0 : user.dailyQuestionCount;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyQuestionCount: currentCount + 1,
      dailyQuestionResetAt: needsReset ? today : undefined,
    },
  });

  return { allowed: true, remaining: limit - currentCount - 1, limit };
}

export async function checkAndIncrementGuestLimit(
  sessionId: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = DAILY_LIMITS.FREE;
  const today = getTodayUTC();

  const session = await prisma.guestSession.upsert({
    where: { sessionId },
    create: { sessionId, dailyQuestionCount: 0, dailyQuestionResetAt: today },
    update: {},
  });

  const needsReset = !session.dailyQuestionResetAt || session.dailyQuestionResetAt < today;
  const currentCount = needsReset ? 0 : session.dailyQuestionCount;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  await prisma.guestSession.update({
    where: { sessionId },
    data: {
      dailyQuestionCount: currentCount + 1,
      dailyQuestionResetAt: needsReset ? today : undefined,
    },
  });

  return { allowed: true, remaining: limit - currentCount - 1, limit };
}
