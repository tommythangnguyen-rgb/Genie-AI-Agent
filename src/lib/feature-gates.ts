import { prisma } from "@/lib/prisma";
import { DAILY_LIMITS } from "@/lib/stripe";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Feature =
  | "document_upload"
  | "r2t4_calc"
  | "pdf_export"
  | "advanced_analysis"
  | "chat_history"
  | "unlimited_chat"
  | "team_sharing"
  | "admin_dashboard"
  | "branded_exports"
  | "fantasy_agent";

export type SubscriptionTier = "FREE" | "PRO" | "TEAM" | "MONTHLY" | "MONTHLY_PLUS" | "YEARLY";

// ── Tier sets ─────────────────────────────────────────────────────────────────

const PRO_AND_ABOVE = new Set<string>(["PRO", "TEAM", "MONTHLY_PLUS", "YEARLY"]);
const TEAM_ONLY = new Set<string>(["TEAM"]);

// ── Feature access ────────────────────────────────────────────────────────────

/**
 * Pure, synchronous check — safe to call anywhere (client or server).
 */
export function canAccessFeature(feature: Feature, tier: string): boolean {
  switch (feature) {
    case "document_upload":
    case "r2t4_calc":
    case "pdf_export":
    case "advanced_analysis":
    case "chat_history":
    case "unlimited_chat":
    // Pro unlocks the fantasy agent; each turn then draws down prepaid credits.
    case "fantasy_agent":
      return PRO_AND_ABOVE.has(tier);
    case "team_sharing":
    case "admin_dashboard":
    case "branded_exports":
      return TEAM_ONLY.has(tier);
    default:
      return false;
  }
}

// ── Limit helpers ─────────────────────────────────────────────────────────────

export function getDailyMessageLimit(tier: string): number {
  return DAILY_LIMITS[tier] ?? 10;
}

/** Pro gets 10 advanced analyses/month; Team gets unlimited. */
export function getMonthlyAnalysisLimit(tier: string): number {
  if (TEAM_ONLY.has(tier)) return Infinity;
  if (PRO_AND_ABOVE.has(tier)) return 10;
  return 0;
}

export function isUnlimited(tier: string): boolean {
  return PRO_AND_ABOVE.has(tier);
}

// ── Server-side helpers ───────────────────────────────────────────────────────

/**
 * Fetch the subscription tier for a user. Always hits the DB — call only
 * from Server Components, Route Handlers, or Server Actions.
 */
export async function getUserSubscriptionTier(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });
  return user?.subscriptionTier ?? "FREE";
}

/**
 * Returns current daily usage stats for a user. Resets the count if a new
 * day has started (same logic as rate-limiter but read-only here).
 */
export async function getUserDailyUsage(userId: string): Promise<{
  used: number;
  limit: number;
  tier: string;
  resetAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      dailyQuestionCount: true,
      dailyQuestionResetAt: true,
    },
  });

  const tier = user?.subscriptionTier ?? "FREE";
  const limit = getDailyMessageLimit(tier);

  // Determine effective count (reset if date has rolled over)
  const now = new Date();
  const resetAt = user?.dailyQuestionResetAt;
  const isNewDay = !resetAt || now > resetAt;
  const used = isNewDay ? 0 : (user?.dailyQuestionCount ?? 0);

  return { used, limit, tier, resetAt: resetAt ?? null };
}

/**
 * Server-side guard: throws a structured error if the user cannot access a
 * feature. Use in Server Actions or Route Handlers.
 */
export async function requireFeature(
  userId: string,
  feature: Feature
): Promise<void> {
  const tier = await getUserSubscriptionTier(userId);
  if (!canAccessFeature(feature, tier)) {
    throw Object.assign(new Error("Upgrade required"), {
      code: "UPGRADE_REQUIRED",
      feature,
      tier,
    });
  }
}
