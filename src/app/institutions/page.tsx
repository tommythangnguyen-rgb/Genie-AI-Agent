"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, Building2, ShieldCheck, Users, BookOpen, Calculator, ClipboardList, CheckCircle, Zap, Mail } from "lucide-react";

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: Calculator,
    title: "R2T4 Worksheets",
    desc: "Walk through Return to Title IV calculations step by step. Genie generates pre-withdrawal worksheets with built-in compliance reminders.",
  },
  {
    icon: ClipboardList,
    title: "Audit Preparation",
    desc: "Instant reference for program reviews, internal audits, and OIG inquiries. Covers SAP, verification, COA, and packaging.",
  },
  {
    icon: BookOpen,
    title: "Regulation Reference",
    desc: "34 CFR, FSA Handbook, HEA Title IV — at your fingertips in plain language. No more searching through PDFs.",
  },
  {
    icon: Users,
    title: "Staff Training Support",
    desc: "Help new financial aid staff get up to speed on complex topics like dependency overrides, professional judgment, and aggregate limits.",
  },
  {
    icon: ShieldCheck,
    title: "FERPA-Compliant",
    desc: "Designed to answer policy and regulatory questions without requiring submission of student PII. FERPA compliance by design.",
  },
  {
    icon: Zap,
    title: "Always Current",
    desc: "Genie pulls from live regulatory update feeds to surface the latest FSA guidance, Dear Colleague Letters, and policy changes.",
  },
];

export default function InstitutionsPage() {
  const [formState, setFormState] = useState({ name: "", email: "", institution: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formState, type: "demo" }),
    });
    setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen text-white relative"
      style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #253d7a 50%, #1a3060 100%)" }}
    >
      {/* Genie Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <div className="genie-orb-bg" style={{ width: 700, height: 700, top: "-15%", left: "-10%", background: "rgba(0,229,192,0.08)" }} />
        <div className="genie-orb-bg" style={{ width: 550, height: 550, top: "40%", left: "65%", background: "rgba(99,102,241,0.07)", ["--dur" as any]: "11s", ["--delay" as any]: "2s" }} />
        <div className="genie-orb-bg" style={{ width: 400, height: 400, top: "80%", left: "5%", background: "rgba(20,184,166,0.05)", ["--dur" as any]: "14s", ["--delay" as any]: "5s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.15] bg-white/[0.08] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/aid-agent" className="flex items-center gap-2 text-[#94A3B8]/70 hover:text-[#00E5C0] transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-2 py-1 ring-1 ring-white/10 hover:bg-white/[0.05]">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Genie</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md shadow-cyan-500/25">
              <GenieBottle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-[#00E5C0]">Genie</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/75 text-sm font-semibold">For Schools</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24 relative" style={{ zIndex: 1 }}>

        {/* Hero */}
        <section className="pt-8 pb-14 text-center">
          {/* Hero background image */}
          <div className="relative rounded-2xl overflow-hidden mb-10">
            <img src="/images/advisor-student.jpg" alt="" className="w-full h-64 object-cover object-[50%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020C1B]/40 to-[#020C1B]/80" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/[0.20] ring-1 ring-cyan-400/50 text-cyan-300 text-xs font-semibold mb-4 tracking-widest uppercase shadow-sm shadow-cyan-500/20">
                <Building2 className="h-3.5 w-3.5" />
                For Financial Aid Offices &amp; Institutions
              </div>
              <h1
                className="text-4xl sm:text-5xl font-black tracking-tight leading-tight"
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
                Built by someone who sat<br className="hidden sm:block" /> where you sit.
              </h1>
            </div>
          </div>
          <p className="text-lg text-[#94A3B8]/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Genie was created by a financial aid professional with 15 years of hands-on experience. Every feature was designed for the real work that happens inside a financial aid office — not just the theory.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="#request-demo"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-cyan-900/30 hover:opacity-90 transition-all"
            >
              Request a Demo
            </Link>
            <Link
              href="/dpa"
              className="px-6 py-3 rounded-xl bg-white/[0.07] ring-1 ring-white/[0.15] text-white font-medium text-sm hover:bg-white/[0.12] transition-all"
            >
              Review School DPA
            </Link>
          </div>
        </section>

        {/* Why Genie for Institutions */}
        <section className="mb-14 rounded-2xl px-8 py-8" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
          <h2 className="text-xl font-bold text-white mb-6">Why Financial Aid Offices Choose Genie</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { stat: "15", label: "Years of FA office experience behind every feature" },
              { stat: "34 CFR", label: "Federal regulation-grounded responses" },
              { stat: "R2T4", label: "Step-by-step calculation worksheets" },
              { stat: "FERPA", label: "Compliant by design — no student PII required" },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex items-center gap-4">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-cyan-500/[0.15] ring-1 ring-cyan-500/[0.28] flex items-center justify-center">
                  <span className="text-sm font-extrabold text-cyan-300">{stat}</span>
                </div>
                <p className="text-sm text-white/85 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-white mb-6">What Genie Does for Your Office</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl px-6 py-5 transition-all" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                <div className="p-2 rounded-xl bg-cyan-500/[0.15] ring-1 ring-cyan-500/[0.28] w-fit mb-3">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/65 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance Section */}
        <section className="mb-14 rounded-2xl px-8 py-7" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
          <h2 className="text-xl font-bold text-white mb-4">Built for Compliance</h2>
          <div className="space-y-2.5">
            {[
              "FERPA-compliant design — answer policy questions without submitting student records",
              "SAMPLE watermarks on all generated offer letters — no confusion with official documents",
              "R2T4 outputs include mandatory disclaimers requiring certified administrator review",
              "No AI responses on specific loan repayment, IDR, or forgiveness strategies",
              "Data Processing Agreement (DPA) template available for institutional review",
              "Conversations not stored — no long-term retention of institution queries",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-sm text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Request Form */}
        <section id="request-demo" className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-cyan-500/[0.15] ring-1 ring-cyan-500/[0.28]">
              <Mail className="h-5 w-5 text-cyan-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Request a Demo</h2>
          </div>
          <div className="rounded-2xl px-8 py-7" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-cyan-400" />
                <p className="text-base font-semibold text-white">Demo request received!</p>
                <p className="text-sm text-white/65">We will reach out to your institution email within 2 business days.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Name &amp; Title</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="Director of Financial Aid"
                      className="w-full bg-white/[0.08] ring-1 ring-white/[0.20] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Institution Email</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="you@college.edu"
                      className="w-full bg-white/[0.08] ring-1 ring-white/[0.20] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Institution Name</label>
                  <input
                    type="text"
                    required
                    value={formState.institution}
                    onChange={(e) => setFormState({ ...formState, institution: e.target.value })}
                    placeholder="Your College or University"
                    className="w-full bg-white/[0.08] ring-1 ring-white/[0.20] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">What would you like to see?</label>
                  <textarea
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Tell us about your team size, current challenges, or specific features you want to explore..."
                    className="w-full bg-white/[0.08] ring-1 ring-white/[0.20] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-cyan-900/30 hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Request Demo
                </button>
              </form>
            )}
          </div>
        </section>

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
            <p className="text-xs text-white/25">© 2026 Genie Student Aid Hub | Developed by One27 | All Rights Reserved</p>
            <p className="text-xs text-white/20 mt-0.5">Unofficial reference tool — not affiliated with the U.S. Department of Education</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/about" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">About</Link>
            <Link href="/dpa" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">DPA</Link>
            <Link href="/legal" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">Legal</Link>
            <Link href="/aid-agent" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors">
              <GenieBottle className="h-3.5 w-3.5" />
              Open Genie
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
