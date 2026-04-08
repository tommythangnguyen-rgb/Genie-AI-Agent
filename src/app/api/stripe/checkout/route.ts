import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier } = await req.json();
  const plan = PLANS[tier as keyof typeof PLANS];
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (!plan.priceId) {
    console.error(`Missing Stripe price ID for plan: ${tier}. Configure STRIPE_${tier}_PRICE_ID.`);
    return NextResponse.json(
      { error: "This plan is not yet available for purchase. Please contact support." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    // Create or reuse Stripe customer.
    // If the stored ID belongs to the wrong mode (test vs live), create a fresh one.
    let customerId = user.stripeCustomerId;
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err: any) {
        if (err?.code === "resource_missing") {
          customerId = null; // stale test-mode ID — will create a new live-mode customer below
        } else {
          throw err;
        }
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: session.userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const subscriptionData: Record<string, any> = {
      metadata: { userId: session.userId, tier: plan.tier },
    };

    // Add 14-day free trial for Pro plans — card required upfront
    if (plan.trialDays > 0) {
      subscriptionData.trial_period_days = plan.trialDays;
      subscriptionData.trial_settings = {
        end_behavior: { missing_payment_method: "cancel" },
      };
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: "subscription",
      // Card always required — trial starts after card is collected
      payment_method_collection: "always",
      success_url: `${baseUrl}/account?success=true&plan=${plan.tier.toLowerCase()}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { userId: session.userId, tier: plan.tier },
      subscription_data: subscriptionData,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("Stripe checkout error:", msg);
    return NextResponse.json({ error: `Checkout failed: ${msg}` }, { status: 500 });
  }
}
