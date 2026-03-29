import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export const PLANS = {
  MONTHLY: {
    name: "Monthly",
    price: 9.99,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    questionsPerDay: 21,
    tier: "MONTHLY" as const,
    description: "21 questions per day",
  },
  MONTHLY_PLUS: {
    name: "Monthly Plus",
    price: 16.99,
    priceId: process.env.STRIPE_MONTHLY_PLUS_PRICE_ID!,
    questionsPerDay: Infinity,
    tier: "MONTHLY_PLUS" as const,
    description: "Unlimited questions monthly",
  },
  YEARLY: {
    name: "Yearly",
    price: 69.99,
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    questionsPerDay: Infinity,
    tier: "YEARLY" as const,
    description: "Unlimited questions yearly",
  },
};

export const DAILY_LIMITS: Record<string, number> = {
  FREE: 3,
  MONTHLY: 21,
  MONTHLY_PLUS: 999999,
  YEARLY: 999999,
};
