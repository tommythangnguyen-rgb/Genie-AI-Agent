import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/stripe/sync
 * Pull the latest subscription state from Stripe and write it to the DB.
 * Called by the account page after a successful checkout redirect so the
 * user's tier is always up to date even if the webhook was delayed.
 */
export async function POST() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ synced: false, reason: "no_customer" });
  }

  let subscription: any;
  if (user.stripeSubscriptionId) {
    subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId).catch(() => null);
  }

  if (!subscription) {
    const list = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit: 1,
      status: "all",
    });
    subscription = list.data[0];
  }

  if (!subscription) {
    return NextResponse.json({ synced: false, reason: "no_subscription" });
  }

  const tier = (subscription.metadata?.tier ?? "FREE").toUpperCase();

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      subscriptionTier: tier as any,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  return NextResponse.json({ synced: true, tier, status: subscription.status });
}
