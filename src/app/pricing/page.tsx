"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home, ChevronRight, Check, X, Star, Zap, ChevronDown,
  FileText, Calculator, Download, BookMarked, Users, Shield,
  Sparkles, ArrowRight, BadgeCheck,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// ── Genie Bottle ──────────────────────────────────────────────────────────────

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = {
  // Shared
  role_selector:       "Role selector (Student, Parent, Admin, Leader, Auditor)",
  basic_chat:          "Basic chat — FAFSA, SAI, school comparisons, tax credits",
  award_summaries:     "Text-based award letter summaries",
  // Pro+
  unlimited_chat:      "Unlimited chat with priority model",
  doc_upload:          "Document / photo / voice upload & AI analysis",
  advanced_tools:      "R2T4 calculators, mid-semester scenarios, audit prep",
  pdf_export:          "Full PDF exports & side-by-side comparisons",
  chat_history:        "Chat history & save",
  overage:             "Soft overage: $0.50 / extra advanced analysis",
  // Team
  unlimited_usage:     "Unlimited usage — all features, no caps",
  team_sharing:        "Multi-user seats + team sharing",
  custom_templates:    "Custom templates & branded exports",
  admin_dashboard:     "Admin dashboard",
} as const;

type FeatureKey = keyof typeof FEATURES;

interface Tier {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  yearlyMonthly?: number;
  priceNote?: string;
  description: string;
  highlight: boolean;
  ctaLabel: string;
  ctaVariant: "primary" | "ghost" | "outline";
  checkoutId?: string;  // maps to PLANS key
  href?: string;
  includes: FeatureKey[];
  excludes?: FeatureKey[];
  dailyLimit?: string;
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Start exploring financial aid guidance — no card needed.",
    highlight: false,
    ctaLabel: "Start Free",
    ctaVariant: "outline",
    href: "/aid-agent",
    dailyLimit: "10 messages / day",
    includes: ["role_selector", "basic_chat", "award_summaries"],
    excludes: ["unlimited_chat", "doc_upload", "advanced_tools", "pdf_export", "chat_history", "overage", "unlimited_usage", "team_sharing", "custom_templates", "admin_dashboard"],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    badgeColor: "from-cyan-500 to-teal-600",
    monthlyPrice: 5.99,
    yearlyPrice: process.env.NEXT_PUBLIC_PRO_ANNUAL_PRICE ? Number(process.env.NEXT_PUBLIC_PRO_ANNUAL_PRICE) : 59,
    yearlyMonthly: process.env.NEXT_PUBLIC_PRO_ANNUAL_PRICE ? Math.round((Number(process.env.NEXT_PUBLIC_PRO_ANNUAL_PRICE) / 12) * 100) / 100 : 4.92,
    description: "Your calm expert companion — unlimited questions, full document analysis.",
    highlight: true,
    ctaLabel: "Start 14-Day Free Trial",
    ctaVariant: "primary",
    checkoutId: "PRO_MONTHLY",
    dailyLimit: "Unlimited",
    includes: [
      "role_selector", "basic_chat", "award_summaries",
      "unlimited_chat", "doc_upload", "advanced_tools", "pdf_export", "chat_history", "overage",
    ],
    excludes: ["unlimited_usage", "team_sharing", "custom_templates", "admin_dashboard"],
  },
  {
    id: "team",
    name: "Team / Institutional",
    badge: "Best Value",
    badgeColor: "from-teal-500 to-cyan-600",
    monthlyPrice: 24.99,
    yearlyPrice: 199,
    yearlyMonthly: 16.58,
    priceNote: "per seat",
    description: "For financial aid offices, institutions, and audit teams.",
    highlight: false,
    ctaLabel: "Contact for Team",
    ctaVariant: "ghost",
    href: "/about#contact",
    dailyLimit: "Unlimited",
    includes: [
      "role_selector", "basic_chat", "award_summaries",
      "unlimited_chat", "doc_upload", "advanced_tools", "pdf_export", "chat_history",
      "unlimited_usage", "team_sharing", "custom_templates", "admin_dashboard",
    ],
  },
];

const WHY_PRO = [
  {
    icon: FileText,
    title: "Decode your full award letter in seconds",
    body: "Upload any financial aid offer and get a plain-English breakdown — EFC, net price, unmet need, and what to negotiate.",
  },
  {
    icon: Calculator,
    title: "Run R2T4 scenarios before you need them",
    body: "Model mid-semester withdrawals, check institutional vs. federal refund requirements, and generate audit-ready calculations.",
  },
  {
    icon: Shield,
    title: "Audit prep that saves hours",
    body: "Step-by-step Title IV compliance walkthroughs, 34 CFR cross-references, and SAP policy checks — on demand.",
  },
  {
    icon: BookMarked,
    title: "Your research, permanently saved",
    body: "Never lose a conversation. Search your full history and pick up any thread — perfect for multi-step aid processes.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What happens after the 14-day free trial?",
    a: `Your Pro access continues — you'll be charged $5.99/month (or $${process.env.NEXT_PUBLIC_PRO_ANNUAL_PRICE ?? "59"}/year if you chose annual). We'll email you a reminder 3 days before the trial ends. Cancel anytime from your account page before then and you'll never be charged.`,
  },
  {
    q: "Is a credit card required to start the trial?",
    a: "No. You can start the 14-day Pro trial without entering any payment information. If you decide to continue after the trial, you'll add a card at that point.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel with one click from your account page. Your Pro access continues until the end of your current billing period — no penalties, no fees, no questions.",
  },
  {
    q: "What is the $0.50 soft overage for?",
    a: "Pro includes 10 advanced analyses per month (R2T4 calculations, document analysis, audit prep). Beyond that, each additional analysis is $0.50 — no surprise charges, and you'll see your usage in real time.",
  },
  {
    q: "Is my data private and FERPA-compliant?",
    a: "Yes. We do not sell or share your personal data. Conversations are not used to train AI models. We recommend never entering student SSNs or sensitive identifiers — use anonymized or hypothetical data when running scenarios.",
  },
  {
    q: "How is Team pricing structured?",
    a: "Team is $24.99/seat/month or $199/year flat for up to 10 seats. Each seat gets full Pro access plus shared templates, branded exports, and an admin dashboard. Contact us for 10+ seat pricing.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function subscribe(tier: Tier) {
    if (tier.href) {
      window.location.href = tier.href;
      return;
    }
    if (!tier.checkoutId) return;

    const planId = tier.id === "pro"
      ? (annual ? "PRO_YEARLY" : "PRO_MONTHLY")
      : (annual ? "TEAM_YEARLY" : "TEAM_MONTHLY");

    setLoading(tier.id);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: planId }),
      });
      if (res.status === 401) {
        setCheckoutError("Please sign in first to start your trial. Visit Genie and create a free account.");
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
    } finally {
      setLoading(null);
    }
  }

  function getPrice(tier: Tier) {
    if (tier.monthlyPrice === 0) return "$0";
    if (annual && tier.yearlyMonthly !== undefined) {
      return `$${tier.yearlyMonthly.toFixed(2)}`;
    }
    return `$${tier.monthlyPrice?.toFixed(2)}`;
  }

  function getSavings(tier: Tier) {
    if (!tier.monthlyPrice || !tier.yearlyMonthly) return null;
    const saved = Math.round(((tier.monthlyPrice - tier.yearlyMonthly) / tier.monthlyPrice) * 100);
    return saved > 0 ? `Save ${saved}%` : null;
  }

  return (
    <div
      className="min-h-screen text-white relative"
      style={{ background: "linear-gradient(135deg, #06101F 0%, #0A1428 55%, #0D1A35 100%)" }}
    >
      {/* Genie Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <div className="genie-orb-bg" style={{ width: 700, height: 700, top: "-15%", left: "-10%", background: "rgba(99,102,241,0.10)" }} />
        <div className="genie-orb-bg" style={{ width: 550, height: 550, top: "40%", left: "65%", background: "rgba(139,92,246,0.08)", ["--dur" as any]: "10s", ["--delay" as any]: "2s" }} />
        <div className="genie-orb-bg" style={{ width: 400, height: 400, top: "80%", left: "5%", background: "rgba(0,209,201,0.06)", ["--dur" as any]: "13s", ["--delay" as any]: "4s" }} />
      </div>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-[#060E1F]/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/aid-agent"
            className="flex items-center gap-2 text-[#94A3B8]/70 hover:text-[#00E5C0] transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-2 py-1 ring-1 ring-white/10 hover:bg-white/[0.05]"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Genie</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md shadow-cyan-500/25">
              <GenieBottle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-[#00E5C0]">Genie</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/75 text-sm font-semibold">Pricing</span>
          </div>
          <div className="w-28" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24 relative" style={{ zIndex: 1 }}>

        {/* ── Hero ── */}
        <section className="pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/[0.12] ring-1 ring-cyan-400/40 text-cyan-300 text-xs font-semibold mb-6 tracking-widest uppercase shadow-sm shadow-cyan-500/20">
            <Zap className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4"
            style={{
              background: "linear-gradient(90deg, #00B8D4 0%, #00E5C0 18%, #7FFFEA 34%, #00D4FF 50%, #00E5C0 66%, #7FFFEA 82%, #00B8D4 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              animation: "genie-teal-shimmer 3.5s linear infinite",
            }}
          >
            Simple Pricing for Real<br className="hidden sm:block" /> Financial Aid Relief
          </h1>
          <p className="text-base sm:text-lg text-[#94A3B8]/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Your calm expert companion for FAFSA, award letters, and Title IV questions.
            Start free. Upgrade when you need document analysis and R2T4 tools.
          </p>

          {/* Contextual photo strip */}
          <div className="relative rounded-2xl overflow-hidden max-w-sm mx-auto mb-10">
            <img
              src="/images/student-happy.jpg"
              alt=""
              className="w-full h-48 object-cover object-[50%_25%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020C1B]/40 to-[#020C1B]/75" />
          </div>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.07] ring-1 ring-white/[0.12]" role="group" aria-label="Billing frequency">
            <span className={`text-sm font-semibold transition-colors ${!annual ? "text-white" : "text-white/40"}`}>
              Monthly
            </span>
            <Switch
              checked={annual}
              onCheckedChange={setAnnual}
              aria-label="Toggle annual billing"
              className="data-[state=checked]:bg-cyan-500"
            />
            <span className={`text-sm font-semibold transition-colors ${annual ? "text-white" : "text-white/40"}`}>
              Annual
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30 text-emerald-300 text-[11px] font-bold">
              Save up to 20%
            </span>
          </div>
        </section>

        {/* ── Checkout error ── */}
        {checkoutError && (
          <div className="max-w-lg mx-auto mb-6 flex items-start gap-3 px-5 py-4 rounded-xl bg-red-500/10 ring-1 ring-red-400/30">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <p className="text-sm text-red-300">{checkoutError}</p>
          </div>
        )}

        {/* ── Pricing cards ── */}
        <div className="grid sm:grid-cols-3 gap-5 mb-14 items-start">
          {TIERS.map((tier) => {
            const savings = annual ? getSavings(tier) : null;
            const isHighlight = tier.highlight;
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl flex flex-col px-6 py-7 ${
                  isHighlight
                    ? "bg-gradient-to-b from-cyan-600/25 to-teal-800/20 ring-2 ring-cyan-400/50 shadow-2xl shadow-cyan-900/30"
                    : ""
                }`}
                style={!isHighlight ? {
                  background: "linear-gradient(135deg, rgba(13,26,50,0.92) 0%, rgba(10,20,42,0.88) 100%)",
                  border: "1px solid rgba(6,182,212,0.18)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                } : undefined}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${tier.badgeColor} text-white text-xs font-bold shadow-lg whitespace-nowrap`}>
                      <Star className="h-3 w-3" />
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Name + description */}
                <div className="mb-5 mt-2">
                  <h2 className="text-base font-bold text-white mb-1">{tier.name}</h2>
                  <p className="text-xs text-white/50 leading-relaxed">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="mb-1 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-white leading-none">
                    {getPrice(tier)}
                  </span>
                  <div className="mb-0.5">
                    <p className="text-sm text-white/50">/month</p>
                    {tier.priceNote && (
                      <p className="text-[10px] text-white/35">{tier.priceNote}</p>
                    )}
                  </div>
                </div>

                {/* Annual note */}
                <div className="mb-5 h-5">
                  {annual && tier.yearlyPrice !== null && tier.yearlyPrice > 0 ? (
                    <p className="text-[11px] text-white/40">
                      Billed as ${tier.yearlyPrice}/year
                      {savings && (
                        <span className="ml-1.5 text-emerald-400 font-semibold">({savings})</span>
                      )}
                    </p>
                  ) : tier.monthlyPrice === 0 ? (
                    <p className="text-[11px] text-white/30">Forever free</p>
                  ) : null}
                </div>

                {/* Daily limit chip */}
                {tier.dailyLimit && (
                  <div className="mb-5 px-3 py-2 rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08] text-center">
                    <span className="text-xs font-semibold text-cyan-300">{tier.dailyLimit}</span>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => subscribe(tier)}
                  disabled={loading === tier.id}
                  className={`w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    tier.ctaVariant === "primary"
                      ? "bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg hover:opacity-90 active:scale-[0.98]"
                      : tier.ctaVariant === "outline"
                      ? "bg-white/[0.08] text-white ring-1 ring-white/[0.18] hover:bg-white/[0.14] active:scale-[0.98]"
                      : "bg-white/[0.05] text-cyan-300 ring-1 ring-cyan-400/30 hover:bg-cyan-500/15 active:scale-[0.98]"
                  }`}
                >
                  {loading === tier.id ? "Redirecting…" : tier.ctaLabel}
                  {loading !== tier.id && tier.ctaVariant === "primary" && <ArrowRight className="h-4 w-4" />}
                </button>

                {/* Trial note for Pro */}
                {tier.id === "pro" && (
                  <p className="text-[10px] text-white/30 text-center -mt-4 mb-4">
                    14-day free trial · No card required
                  </p>
                )}

                {/* Feature list */}
                <ul className="space-y-2.5 flex-1">
                  {tier.includes.map((key) => (
                    <li key={key} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-xs text-white/75">{FEATURES[key]}</span>
                    </li>
                  ))}
                  {tier.excludes?.map((key) => (
                    <li key={key} className="flex items-start gap-2 opacity-35">
                      <X className="h-3.5 w-3.5 text-white/40 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-xs text-white/50 line-through">{FEATURES[key]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Why Pro pays for itself ── */}
        <section className="mb-14" aria-labelledby="why-pro-heading">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.10]" />
            <h2 id="why-pro-heading" className="text-xs font-bold uppercase tracking-widest text-white/60 px-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              Why Pro pays for itself
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.10]" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {WHY_PRO.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07]">
                <div className="p-2.5 rounded-xl bg-cyan-500/[0.15] ring-1 ring-cyan-500/[0.28] shrink-0 self-start">
                  <Icon className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1 leading-snug">{title}</p>
                  <p className="text-xs text-white/55 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 px-2">
            {[
              { icon: BadgeCheck, text: "Built by a 15-yr FA Professional" },
              { icon: Shield,     text: "No data sold — ever" },
              { icon: Sparkles,   text: "34 CFR Parts 600–690 coverage" },
              { icon: Users,      text: "Students, parents & FA offices" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-cyan-400/60 shrink-0" aria-hidden="true" />
                <span className="text-xs text-white/40">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mb-12" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-white text-center mb-6">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-sm font-semibold text-white/85">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/30 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-white/55 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 text-center mt-6">
            More questions?{" "}
            <Link href="/about#contact" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
              Contact us
            </Link>
            {" "}or{" "}
            <Link href="/about" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
              learn about Genie
            </Link>
            .
          </p>
        </section>

        {/* ── Cross-page nav ── */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-wrap justify-center gap-x-1 gap-y-1 mb-2">
          {[
            { label: "Pricing", href: "/pricing" },
            { label: "About", href: "/about" },
            { label: "For Schools", href: "/institutions" },
            { label: "Support Dev", href: "/support" },
            { label: "Legal", href: "/legal" },
            { label: "School DPA", href: "/dpa" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="px-3 py-1 rounded-full text-[11px] font-medium text-white/35 hover:text-cyan-300 hover:bg-cyan-500/[0.10] ring-1 ring-white/[0.08] hover:ring-cyan-500/25 transition-all">{label}</Link>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/25">
              © 2026 Genie Student Aid Hub | Developed by One27 | All Rights Reserved
            </p>
            <p className="text-xs text-white/20 mt-0.5">
              Unofficial reference tool — not affiliated with the U.S. Department of Education
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/legal" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">
              Legal
            </Link>
            <Link
              href="/aid-agent"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
            >
              <GenieBottle className="h-3.5 w-3.5" />
              Open Genie
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
