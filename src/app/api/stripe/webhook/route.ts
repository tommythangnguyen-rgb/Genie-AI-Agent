import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/fantasy/billing";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set. Cannot verify webhook signatures.");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      // One-off fantasy credit packs. Handled before the subscription checks
      // below, which bail without a `tier`/`subscription` — a credit purchase
      // has neither, so it would otherwise be silently dropped.
      if (session.metadata?.kind === "fantasy_credits") {
        const usd = Number(session.metadata?.usd ?? 0);
        if (userId && usd > 0 && session.payment_status === "paid") {
          await addCredits(userId, usd);
          console.log(`[stripe] credited $${usd} of fantasy usage to ${userId}`);
        }
        break;
      }

      const tier = session.metadata?.tier?.toUpperCase();
      const subscriptionId = session.subscription;
      if (!userId || !tier || !subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: tier as any,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: subscription.status,
          subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.created": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      const tier = (subscription.metadata?.tier ?? "").toUpperCase();
      if (!userId || !tier) break;
      await prisma.user
        .update({
          where: { id: userId },
          data: {
            subscriptionTier: tier as any,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        .catch(() => {});
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      if (!userId) break;
      const tier = (subscription.metadata?.tier ?? "FREE").toUpperCase();
      await prisma.user
        .update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionTier: tier as any,
            subscriptionStatus: subscription.status,
            subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        .catch(() => {});
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await prisma.user
        .update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionTier: "FREE",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
          },
        })
        .catch(() => {});
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        await prisma.user
          .update({
            where: { stripeSubscriptionId: subId as string },
            data: { subscriptionStatus: "past_due" },
          })
          .catch(() => {});
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
