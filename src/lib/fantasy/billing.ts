import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Usage billing for the fantasy agent.
 *
 * Pro ($5.99/mo) buys *access*; each turn then draws down prepaid credits
 * priced off the real Anthropic spend. Prepaid rather than metered so a user
 * can never run up an unbounded bill — the agent just stops at zero.
 *
 * Everything is in "mills" (tenths of a cent). A cheap turn can cost well
 * under a cent, and integer cents would round it to zero — so a user could
 * chat indefinitely for free.
 */

/** Claude Opus 5 list price, USD per million tokens. */
const PRICE_PER_MTOK = {
  input: 5.0,
  output: 25.0,
  cacheRead: 0.5, // ~0.1x input
  cacheWrite: 6.25, // ~1.25x input
};

/** Charged at 2x raw cost — covers Stripe fees, hosting, and unbillable retries. */
export const MARKUP = 2;

/** Refuse to start a turn below this, so a turn can't strand mid-answer. */
export const MIN_BALANCE_MILLS = 250; // 25 cents

export type TokenUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
};

export function rawCostMills(u: TokenUsage): number {
  const dollars =
    ((u.input_tokens ?? 0) / 1_000_000) * PRICE_PER_MTOK.input +
    ((u.output_tokens ?? 0) / 1_000_000) * PRICE_PER_MTOK.output +
    ((u.cache_read_input_tokens ?? 0) / 1_000_000) * PRICE_PER_MTOK.cacheRead +
    ((u.cache_creation_input_tokens ?? 0) / 1_000_000) * PRICE_PER_MTOK.cacheWrite;
  return Math.round(dollars * 1000 * 10); // dollars -> mills
}

export const millsToUsd = (m: number): number => Math.round(m) / 10000;
export const usdToMills = (usd: number): number => Math.round(usd * 10000);

export async function getBalanceMills(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { fantasyCreditsMills: true },
  });
  return u?.fantasyCreditsMills ?? 0;
}

export async function addCredits(userId: string, usd: number): Promise<number> {
  const u = await prisma.user.update({
    where: { id: userId },
    data: { fantasyCreditsMills: { increment: usdToMills(usd) } },
    select: { fantasyCreditsMills: true },
  });
  return u.fantasyCreditsMills;
}

/**
 * Charge a completed turn. Called once the stream ends, with the summed usage
 * across every model request in that turn.
 *
 * The balance is allowed to go negative by at most the final turn's cost: we
 * gate on MIN_BALANCE_MILLS up front, but can't know a turn's true cost until
 * it finishes. Eating that overage is deliberate — the alternative is cutting
 * a user off mid-answer, which is worse than being a few cents short.
 */
export async function chargeTurn(
  userId: string,
  sessionId: string | null,
  usage: TokenUsage
): Promise<{ billedMills: number; balanceMills: number }> {
  const raw = rawCostMills(usage);
  const billed = Math.max(1, Math.round(raw * MARKUP)); // never free

  const [, user] = await prisma.$transaction([
    prisma.fantasyUsage.create({
      data: {
        userId,
        sessionId,
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
        rawCostMills: raw,
        billedMills: billed,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { fantasyCreditsMills: { decrement: billed } },
      select: { fantasyCreditsMills: true },
    }),
  ]);

  return { billedMills: billed, balanceMills: user.fantasyCreditsMills };
}

/** Credit packs. Priced so the smallest still clears Stripe's 30c fixed fee. */
export const CREDIT_PACKS = [
  { id: "starter", label: "Starter", usd: 5, blurb: "~30 questions" },
  { id: "regular", label: "Season", usd: 15, blurb: "~95 questions" },
  { id: "heavy", label: "Commissioner", usd: 40, blurb: "~260 questions" },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function packById(id: string) {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null;
}
