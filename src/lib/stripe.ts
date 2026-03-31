import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export const PLANS = {
  // ── New plans ────────────────────────────────────────────────────────────────
  PRO_MONTHLY: {
    name: "Pro Monthly",
    price: 5.99,
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    tier: "PRO" as const,
    trialDays: 14,
    description: "Unlimited chat + document analysis",
  },
  PRO_YEARLY: {
    name: "Pro Yearly",
    price: 59,
    priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    tier: "PRO" as const,
    trialDays: 14,
    description: "Unlimited chat + document analysis (billed annually)",
  },
  TEAM_MONTHLY: {
    name: "Team Monthly",
    price: 24.99,
    priceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID ?? "",
    tier: "TEAM" as const,
    trialDays: 0,
    description: "Unlimited usage, multi-user, admin dashboard",
  },
  TEAM_YEARLY: {
    name: "Team Yearly",
    price: 199,
    priceId: process.env.STRIPE_TEAM_YEARLY_PRICE_ID ?? "",
    tier: "TEAM" as const,
    trialDays: 0,
    description: "Unlimited usage, multi-user, admin dashboard (billed annually)",
  },
  // ── Legacy plans (kept for existing subscribers) ──────────────────────────
  MONTHLY: {
    name: "Monthly",
    price: 9.99,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
    tier: "MONTHLY" as const,
    trialDays: 0,
    description: "21 questions per day",
  },
  MONTHLY_PLUS: {
    name: "Monthly Plus",
    price: 16.99,
    priceId: process.env.STRIPE_MONTHLY_PLUS_PRICE_ID ?? "",
    tier: "MONTHLY_PLUS" as const,
    trialDays: 0,
    description: "Unlimited questions monthly",
  },
  YEARLY: {
    name: "Yearly",
    price: 69.99,
    priceId: process.env.STRIPE_YEARLY_PRICE_ID ?? "",
    tier: "YEARLY" as const,
    trialDays: 0,
    description: "Unlimited questions yearly",
  },
};

export const DAILY_LIMITS: Record<string, number> = {
  FREE: 10,
  PRO: 999999,
  TEAM: 999999,
  // Legacy
  MONTHLY: 21,
  MONTHLY_PLUS: 999999,
  YEARLY: 999999,
};
