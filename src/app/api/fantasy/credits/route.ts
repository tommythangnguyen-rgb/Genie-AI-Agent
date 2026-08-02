import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFeature } from "@/lib/feature-gates";
import { CREDIT_PACKS, creditPacksWithNet, netAfterStripe, packById, getBalanceMills, millsToUsd, MIN_BALANCE_MILLS } from "@/lib/fantasy/billing";
import { agentTitleFor, isOwner } from "@/lib/fantasy/history";

export const dynamic = "force-dynamic";

/** GET — current balance, packs, and whether the user can use the agent. */
export async function GET(req: NextRequest) {
  const session = await verifySession(req);
  if (!session?.userId) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { subscriptionTier: true, email: true },
  });
  const tier = (user?.subscriptionTier ?? "FREE") as string;
  const owner = isOwner(user?.email);
  const balanceMills = await getBalanceMills(session.userId);

  return NextResponse.json({
    tier,
    hasPro: owner || canAccessFeature("fantasy_agent", tier),
    owner,
    agentTitle: agentTitleFor(user?.email),
    balanceUsd: millsToUsd(balanceMills),
    lowBalance: balanceMills < MIN_BALANCE_MILLS,
    packs: creditPacksWithNet(),
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

  // A stored customer ID can be from the wrong Stripe mode (a test-mode ID
  // against a live key, say, after switching keys). Stripe rejects that with
  // resource_missing, so fall back to email and clear the stale ID rather
  // than failing the purchase.
  const build = (customerId: string | null) => ({
      mode: "payment" as const,
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.usd * 100,
            product_data: {
              name: `Fantasy AI credits — ${pack.label}`,
              // State the credited amount, not the sticker price — the
              // difference is Stripe's own fee and shouldn't be a surprise.
              description: `$${netAfterStripe(pack.usd).toFixed(2)} of usage credit after processing fee`,
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

  try {
    let checkout;
    try {
      checkout = await stripe.checkout.sessions.create(build(user.stripeCustomerId));
    } catch (err) {
      const e = err as { code?: string; message?: string };
      const staleCustomer =
        user.stripeCustomerId && (e?.code === "resource_missing" || /No such customer/i.test(e?.message ?? ""));
      if (!staleCustomer) throw err;

      console.warn(`[fantasy/credits] stale stripeCustomerId for ${session.userId}; retrying by email`);
      await prisma.user
        .update({ where: { id: session.userId }, data: { stripeCustomerId: null } })
        .catch(() => {});
      checkout = await stripe.checkout.sessions.create(build(null));
    }
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[fantasy/credits] checkout failed:", e?.message ?? err);
    // Surface the reason — a silent failure here just looks like a dead button.
    return NextResponse.json(
      { error: "CHECKOUT_FAILED", detail: e?.message ?? "Stripe rejected the request." },
      { status: 502 }
    );
  }
}
