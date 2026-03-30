"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, Check, Star, Zap, Users } from "lucide-react";

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
    </svg>
  );
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function subscribe(tier: string) {
    setLoading(tier);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      if (res.status === 401) {
        setCheckoutError("Please sign in to subscribe. Visit askGenie and create an account first.");
        setLoading(null);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Unable to start checkout. Please try again.");
      }
    } catch {
      setCheckoutError("Connection error. Please check your internet and try again.");
    }
    setLoading(null);
  }

  const plans = [
    {
      id: "FREE",
      name: "Basic",
      price: "$0",
      period: "forever",
      description: "Get started for free",
      questions: "3 questions / day",
      badge: null,
      features: [
        "3 questions per day",
        "FAFSA & Title IV guidance",
        "R2T4 reference",
        "No credit card required",
      ],
      cta: null,
      highlight: false,
    },
    {
      id: "MONTHLY",
      name: "Monthly",
      price: "$9.99",
      period: "/ month",
      description: "For regular users",
      questions: "21 questions / day",
      badge: null,
      features: [
        "21 questions per day",
        "All FAFSA & Title IV topics",
        "R2T4, SAP, verification",
        "Up to 3 seats per account",
        "Priority responses",
      ],
      cta: "Subscribe",
      highlight: false,
    },
    {
      id: "MONTHLY_PLUS",
      name: "Monthly Plus",
      price: "$16.99",
      period: "/ month",
      description: "For power users & teams",
      questions: "Unlimited questions",
      badge: "Most Popular",
      features: [
        "Unlimited questions per day",
        "All FAFSA & Title IV topics",
        "R2T4, SAP, verification",
        "Up to 3 seats per account",
        "Priority responses",
        "Early access to new features",
      ],
      cta: "Subscribe",
      highlight: true,
    },
    {
      id: "YEARLY",
      name: "Yearly",
      price: "$69.99",
      period: "/ year",
      description: "Best value for committed users",
      questions: "Unlimited questions",
      badge: "Best Value",
      features: [
        "Unlimited questions per day",
        "All FAFSA & Title IV topics",
        "R2T4, SAP, verification",
        "Up to 3 seats per account",
        "Priority responses",
        "Early access to new features",
        "~$5.83 / month equivalent",
      ],
      cta: "Subscribe",
      highlight: false,
    },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(135deg, #0a2e7a 0%, #0e4099 50%, #1252b8 100%)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.10] bg-[#071035]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/aid-agent"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg px-2 py-1"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to askGenie</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <GenieBottle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">askGenie</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/50 text-sm">Pricing</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        {/* Hero */}
        <section className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/20 ring-1 ring-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 tracking-wide">
            <Zap className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent mb-4 leading-tight">
            Choose Your Plan
          </h1>
          <p className="text-lg text-white/75 max-w-xl mx-auto leading-relaxed">
            Get expert financial aid guidance on your schedule. No contracts, cancel anytime.
          </p>
        </section>

        {/* Checkout error */}
        {checkoutError && (
          <div className="max-w-lg mx-auto mb-6 flex items-start gap-3 px-5 py-4 rounded-xl bg-red-500/10 ring-1 ring-red-400/30">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <p className="text-sm text-red-300">{checkoutError}</p>
          </div>
        )}

        {/* Multi-seat note */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Users className="h-4 w-4 text-indigo-300" />
          <span className="text-sm text-indigo-200">
            All paid plans include up to 3 seats per account
          </span>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col ${
                plan.highlight
                  ? "bg-gradient-to-b from-indigo-600/40 to-violet-700/30 ring-2 ring-indigo-400/60"
                  : "bg-white/[0.05] ring-1 ring-white/[0.10]"
              } px-6 py-6`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-bold shadow-lg">
                    <Star className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4 mt-2">
                <h2 className="text-base font-bold text-white mb-1">{plan.name}</h2>
                <p className="text-xs text-white/50">{plan.description}</p>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                <span className="text-sm text-white/50 ml-1">{plan.period}</span>
              </div>

              <div className="mb-5 px-3 py-2 rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08] text-center">
                <span className="text-xs font-semibold text-indigo-300">{plan.questions}</span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-white/75">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.cta ? (
                <button
                  onClick={() => subscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white shadow-lg hover:opacity-90 active:scale-[0.98]"
                      : "bg-white/[0.10] text-white ring-1 ring-white/[0.15] hover:bg-white/[0.15] active:scale-[0.98]"
                  }`}
                >
                  {loading === plan.id ? "Redirecting..." : plan.cta}
                </button>
              ) : (
                <Link
                  href="/aid-agent"
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-center bg-white/[0.07] text-white ring-1 ring-white/[0.12] hover:bg-white/[0.12] transition-all"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* FAQ note */}
        <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] px-8 py-6 text-center mb-12">
          <p className="text-sm text-white/60 leading-relaxed">
            All subscriptions renew automatically. Cancel anytime from your{" "}
            <Link href="/account" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
              account page
            </Link>
            . Questions? Visit our{" "}
            <Link href="/about#contact" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
              contact page
            </Link>
            .
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/25">
              © 2026 askGenie Financial Aid Hub | Developed by One27 | All Rights Reserved
            </p>
            <p className="text-xs text-white/20 mt-0.5">
              Unofficial reference tool — not affiliated with the U.S. Department of Education
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/legal"
              className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors"
            >
              Legal
            </Link>
            <Link
              href="/aid-agent"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <GenieBottle className="h-3.5 w-3.5" />
              Open askGenie
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
