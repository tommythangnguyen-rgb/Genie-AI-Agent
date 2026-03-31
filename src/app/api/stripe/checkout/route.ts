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
    console.error(`Missing Stripe price ID for plan: ${tier}. Set STRIPE_${tier}_PRICE_ID in environment variables.`);
    return NextResponse.json(
      { error: "This plan is not available for purchase. Please contact support." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let customerId = user.stripeCustomerId;
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

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${baseUrl}/account?success=true`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { userId: session.userId, tier },
    subscription_data: { metadata: { userId: session.userId, tier } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
