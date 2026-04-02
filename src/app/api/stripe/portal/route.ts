import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  // Verify the customer exists in the current Stripe mode
  try {
    await stripe.customers.retrieve(user.stripeCustomerId);
  } catch (err: any) {
    if (err?.code === "resource_missing") {
      return NextResponse.json({ error: "No active subscription found. Please subscribe first." }, { status: 400 });
    }
    throw err;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/account`,
  });

  return NextResponse.json({ url: portalSession.url });
}
