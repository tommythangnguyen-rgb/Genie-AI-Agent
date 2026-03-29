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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #0a2e7a 0%, #0e4099 50%, #1252b8 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.10] bg-[#071035]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/aid-agent" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg px-2 py-1">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Genie</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <GenieBottle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Genie</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/50 text-sm">For Schools</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">

        {/* Hero */}
        <section className="pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/20 ring-1 ring-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 tracking-wide">
            <Building2 className="h-3.5 w-3.5" />
            For Financial Aid Offices &amp; Institutions
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent mb-6 leading-tight">
            Built by someone who sat<br className="hidden sm:block" /> where you sit.
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed mb-8">
            Genie was created by a financial aid professional with 15 years of hands-on experience. Every feature was designed for the real work that happens inside a financial aid office — not just the theory.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="#request-demo"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-all"
            >
              Request a Demo
            </Link>
            <Link
              href="/dpa"
              className="px-6 py-3 rounded-xl bg-white/[0.08] ring-1 ring-white/[0.15] text-white font-medium text-sm hover:bg-white/[0.12] transition-all"
            >
              Review School DPA
            </Link>
          </div>
        </section>

        {/* Why Genie for Institutions */}
        <section className="mb-14 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-8">
          <h2 className="text-xl font-bold text-white mb-6">Why Financial Aid Offices Choose Genie</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { stat: "15", label: "Years of FA office experience behind every feature" },
              { stat: "34 CFR", label: "Federal regulation-grounded responses" },
              { stat: "R2T4", label: "Step-by-step calculation worksheets" },
              { stat: "FERPA", label: "Compliant by design — no student PII required" },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex items-center gap-4">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-indigo-600/30 ring-1 ring-indigo-500/30 flex items-center justify-center">
                  <span className="text-sm font-extrabold text-indigo-300">{stat}</span>
                </div>
                <p className="text-sm text-white/65 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-white mb-6">What Genie Does for Your Office</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-6 py-5 hover:bg-white/[0.08] transition-colors">
                <div className="p-2 rounded-xl bg-indigo-600/20 w-fit mb-3">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance Section */}
        <section className="mb-14 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-7">
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
                <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm text-white/65">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Request Form */}
        <section id="request-demo" className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
              <Mail className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Request a Demo</h2>
          </div>
          <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-7">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-indigo-400" />
                <p className="text-base font-semibold text-white">Demo request received!</p>
                <p className="text-sm text-white/55">We will reach out to your institution email within 2 business days.</p>
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
                      className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                      className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                    className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">What would you like to see?</label>
                  <textarea
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Tell us about your team size, current challenges, or specific features you want to explore..."
                    className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Request Demo
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/25">© 2026 Genie Financial Aid Hub | Developed by One27 | All Rights Reserved</p>
            <p className="text-xs text-white/20 mt-0.5">Unofficial reference tool — not affiliated with the U.S. Department of Education</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/about" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">About</Link>
            <Link href="/dpa" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">DPA</Link>
            <Link href="/legal" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">Legal</Link>
            <Link href="/aid-agent" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
              <GenieBottle className="h-3.5 w-3.5" />
              Open Genie
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
