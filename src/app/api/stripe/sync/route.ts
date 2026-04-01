import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/** Map from Stripe price ID → tier string, built from the PLANS config. */
function buildPriceToTierMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const plan of Object.values(PLANS)) {
    if (plan.priceId) map[plan.priceId] = plan.tier;
  }
  return map;
}

export async function POST() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user: { stripeCustomerId: string | null; stripeSubscriptionId: string | null } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripeCustomerId: true, stripeSubscriptionId: true },
    });
  } catch (err: any) {
    console.error("[stripe/sync] DB lookup failed:", err?.message);
    return NextResponse.json({ synced: false, reason: "db_error", detail: err?.message });
  }

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ synced: false, reason: "no_customer" });
  }

  let subscription: any = null;
  try {
    if (user.stripeSubscriptionId) {
      subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    }
  } catch (err: any) {
    console.error("[stripe/sync] retrieve failed:", err?.message);
    // Fall through to list lookup
  }

  if (!subscription) {
    try {
      const list = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 5,
        status: "all",
      });
      // Prefer active/trialing over canceled
      subscription =
        list.data.find((s) => s.status === "trialing" || s.status === "active") ??
        list.data[0] ??
        null;
    } catch (err: any) {
      console.error("[stripe/sync] list failed:", err?.message);
      return NextResponse.json({ synced: false, reason: "stripe_error", detail: err?.message });
    }
  }

  if (!subscription) {
    return NextResponse.json({ synced: false, reason: "no_subscription" });
  }

  // Determine tier: prefer metadata, fall back to price ID mapping
  const priceToTier = buildPriceToTierMap();
  const priceId = subscription.items?.data?.[0]?.price?.id ?? "";
  const tierFromPrice = priceId ? priceToTier[priceId] : undefined;
  const tierFromMeta = subscription.metadata?.tier?.toUpperCase();
  const tier = tierFromMeta || tierFromPrice || "FREE";

  console.log(
    `[stripe/sync] userId=${session.userId} sub=${subscription.id} status=${subscription.status} tier=${tier} (meta=${tierFromMeta} price=${tierFromPrice})`
  );

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        subscriptionTier: tier as any,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    });
  } catch (err: any) {
    console.error("[stripe/sync] DB update failed:", err?.message);
    return NextResponse.json({ synced: false, reason: "db_update_error", detail: err?.message });
  }

  return NextResponse.json({ synced: true, tier, status: subscription.status });
}
