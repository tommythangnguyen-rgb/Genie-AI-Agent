import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier?.toUpperCase();
      const subscriptionId = session.subscription;
      if (!userId || !tier) break;

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
