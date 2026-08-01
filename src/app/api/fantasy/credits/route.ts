import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFeature } from "@/lib/feature-gates";
import { CREDIT_PACKS, packById, getBalanceMills, millsToUsd, MIN_BALANCE_MILLS } from "@/lib/fantasy/billing";

export const dynamic = "force-dynamic";

/** GET — current balance, packs, and whether the user can use the agent. */
export async function GET(req: NextRequest) {
  const session = await verifySession(req);
  if (!session?.userId) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { subscriptionTier: true },
  });
  const tier = (user?.subscriptionTier ?? "FREE") as string;
  const balanceMills = await getBalanceMills(session.userId);

  return NextResponse.json({
    tier,
    hasPro: canAccessFeature("fantasy_agent", tier),
    balanceUsd: millsToUsd(balanceMills),
    lowBalance: balanceMills < MIN_BALANCE_MILLS,
    packs: CREDIT_PACKS,
  });
}

/** POST — start a Stripe Checkout session for a one-off credit pack. */
export async function POST(req: NextRequest) {
  const session = await verifySession(req);
  if (!session?.userId) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });

  const { packId } = (await req.json().catch(() => ({}))) as { packId?: string };
  const pack = packById(String(packId ?? ""));
  if (!pack) return NextResponse.json({ error: "UNKNOWN_PACK" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, stripeCustomerId: true, subscriptionTier: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  // Credits are only usable with Pro, so don't let someone buy them first and
  // then discover the agent is still locked.
  if (!canAccessFeature("fantasy_agent", (user.subscriptionTier ?? "FREE") as string)) {
    return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 402 });
  }

  const origin = req.nextUrl.origin;
  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.usd * 100,
            product_data: {
              name: `Fantasy AI credits — ${pack.label}`,
              description: `$${pack.usd} of usage credit (${pack.blurb})`,
            },
          },
        },
      ],
      // The webhook reads these to credit the right account. Kept on the
      // session (not just the customer) so a guest-checkout still resolves.
      metadata: { userId: session.userId, kind: "fantasy_credits", usd: String(pack.usd) },
      payment_intent_data: {
        metadata: { userId: session.userId, kind: "fantasy_credits", usd: String(pack.usd) },
      },
      success_url: `${origin}/aid-agent?credits=ok`,
      cancel_url: `${origin}/aid-agent?credits=cancelled`,
    });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[fantasy/credits] checkout failed:", err);
    return NextResponse.json({ error: "CHECKOUT_FAILED" }, { status: 502 });
  }
}
