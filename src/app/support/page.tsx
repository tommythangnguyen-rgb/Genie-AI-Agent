"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, Coffee, Copy, Check, CreditCard, Heart, ExternalLink } from "lucide-react";

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
    </svg>
  );
}

const WALLETS = [
  { label: "Ethereum (ETH)", address: "0xae91ffb368eb76fcf9c8dbaf95dd71fed8360abb" },
  { label: "USDC", address: "0xae91ffb368eb76fcf9c8dbaf95dd71fed8360abb" },
];

const AMOUNTS = [3, 5, 10, 25, 50];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-white/40 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors"
      title="Copy address"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function SupportPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateError, setDonateError] = useState<string | null>(null);

  const donated = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("donated") === "true";

  async function handleDonate() {
    setDonateLoading(true);
    setDonateError(null);
    try {
      const res = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setDonateError(data.error || "Unable to start checkout. Please try again.");
      }
    } catch {
      setDonateError("Connection error. Please try again.");
    }
    setDonateLoading(false);
  }

  return (
    <div
      className="min-h-screen text-white relative"
      style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #253d7a 50%, #1a3060 100%)" }}
    >
      {/* Genie Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <div className="genie-orb-bg" style={{ width: 620, height: 620, top: "-12%", left: "-8%", background: "rgba(0,229,192,0.08)" }} />
        <div className="genie-orb-bg" style={{ width: 480, height: 480, top: "45%", left: "68%", background: "rgba(251,191,36,0.05)", ["--dur" as any]: "12s", ["--delay" as any]: "2s" }} />
        <div className="genie-orb-bg" style={{ width: 360, height: 360, top: "78%", left: "8%", background: "rgba(20,184,166,0.05)", ["--dur" as any]: "15s", ["--delay" as any]: "5s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.15] bg-white/[0.08] backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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
            <span className="text-white/75 text-sm font-semibold">Support</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-24 relative" style={{ zIndex: 1 }}>
        {/* Hero */}
        <section className="pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/[0.12] ring-1 ring-cyan-400/40 text-cyan-300 text-xs font-semibold mb-6 tracking-widest uppercase shadow-sm shadow-cyan-500/20">
            <Heart className="h-3.5 w-3.5" />
            Support the Developer
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
            Keep Genie Running
          </h1>
          <p className="text-base text-[#94A3B8]/90 max-w-xl mx-auto leading-relaxed mb-8">
            Genie is built and maintained by one developer. Your support covers API and hosting
            costs — thank you for being part of this community.
          </p>

          {/* Contextual photo */}
          <div className="relative rounded-2xl overflow-hidden max-w-xs mx-auto">
            <img
              src="/images/support-dev.jpg"
              alt=""
              className="w-full h-48 object-cover object-[50%_20%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020C1B]/40 to-[#020C1B]/75" />
          </div>
        </section>

        {donated && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Check className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-emerald-300">Thank you for your donation! It means a lot.</p>
          </div>
        )}

        <div className="space-y-4 mb-12">
          {/* Buy Me a Coffee */}
          <div className="rounded-2xl px-7 py-6" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/[0.15] ring-1 ring-amber-500/[0.28]">
                <Coffee className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Buy Me a Coffee</h2>
                <p className="text-xs text-white/50">Quick one-time tip via buymeacoffee.com</p>
              </div>
            </div>
            <a
              href="https://buymeacoffee.com/one27"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold shadow-lg shadow-amber-900/30 active:scale-[0.98] transition-all"
            >
              <Coffee className="h-4 w-4" />
              Buy Me a Coffee
            </a>
          </div>

          {/* X / Twitter */}
          <div className="rounded-2xl px-7 py-6" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-white/[0.07] ring-1 ring-white/[0.12]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white/70">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Follow on X</h2>
                <p className="text-xs text-white/50">Stay updated on Genie news and updates</p>
              </div>
            </div>
            <a
              href="https://x.com/one27__"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-900 ring-1 ring-white/[0.15] text-white text-sm font-semibold shadow-lg active:scale-[0.98] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @one27__
              <ExternalLink className="h-3.5 w-3.5 opacity-50" />
            </a>
          </div>

          {/* Card / PayPal via Stripe */}
          <div className="rounded-2xl px-7 py-6" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-cyan-500/[0.15] ring-1 ring-cyan-500/[0.28]">
                <CreditCard className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Card / PayPal</h2>
                <p className="text-xs text-white/50">One-time donation — choose your amount</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-white/50 mb-3">Select amount</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedAmount === amt
                      ? "bg-cyan-600 text-white ring-2 ring-cyan-400 shadow-lg shadow-cyan-900/30"
                      : "bg-white/[0.06] text-white/70 ring-1 ring-white/[0.12] hover:bg-white/[0.12]"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {donateError && (
              <p className="text-xs text-red-400 mb-3">{donateError}</p>
            )}

            <button
              onClick={handleDonate}
              disabled={donateLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-cyan-900/30 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {donateLoading ? "Redirecting..." : `Donate $${selectedAmount}`}
            </button>
          </div>

          {/* Crypto */}
          <div className="rounded-2xl px-7 py-6" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-cyan-500/[0.15] ring-1 ring-cyan-500/[0.28]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-cyan-300">
                  <path d="M11.998 2C6.477 2 6.477 6.477 2 12s4.477 10 9.998 10C17.523 22 22 17.523 22 12S17.523 2 11.998 2zm1.014 14.999v1.016h-1v-1.002c-1.59-.054-2.716-.68-2.716-.68l.373-1.4s1.193.627 2.343.627c.79 0 1.342-.38 1.342-1.01 0-.572-.45-.934-1.7-1.325-1.51-.467-2.62-1.115-2.62-2.5 0-1.248.883-2.11 2.378-2.37V7.001h1v1.316c1.2.08 2.01.54 2.01.54l-.38 1.38s-.792-.47-1.87-.47c-.93 0-1.25.44-1.25.9 0 .53.5.85 1.85 1.3 1.66.52 2.47 1.23 2.47 2.6 0 1.28-.92 2.22-2.43 2.43z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Crypto Donation</h2>
                <p className="text-xs text-white/50">Send crypto directly to these wallet addresses</p>
              </div>
            </div>

            <div className="space-y-3">
              {WALLETS.map(({ label, address }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/60 mb-0.5">{label}</p>
                    <p className="text-xs text-white/40 font-mono truncate">{address}</p>
                  </div>
                  <CopyButton text={address} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] px-6 py-4 mb-12 text-center">
          <p className="text-xs text-white/35 leading-relaxed">
            Donations are voluntary and non-refundable. They do not constitute a purchase of any
            service or product. Thank you for your generosity.
          </p>
        </div>

        {/* Cross-page nav */}
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

        {/* Footer */}
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
            <a
              href="https://x.com/one27__"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/40 hover:text-[#00E5C0] text-xs font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @one27__
            </a>
            <Link
              href="/legal"
              className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors"
            >
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
