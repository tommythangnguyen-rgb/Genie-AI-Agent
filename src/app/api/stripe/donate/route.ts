import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const ALLOWED_AMOUNTS = [3, 5, 10, 25, 50]; // dollars

export async function POST(req: NextRequest) {
  const { amount } = await req.json();

  if (!amount || !ALLOWED_AMOUNTS.includes(Number(amount))) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://uigen-dusky-eight.vercel.app";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Number(amount) * 100, // cents
          product_data: {
            name: "Support askGenie",
            description: "One-time donation to support the developer",
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/support?donated=true`,
    cancel_url: `${baseUrl}/support`,
  });

  return NextResponse.json({ url: session.url });
}
