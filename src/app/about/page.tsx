"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, Users, Target, Lightbulb, BookOpen, Mail, Building2, GraduationCap, ShieldCheck, CheckCircle } from "lucide-react";

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
    </svg>
  );
}

export default function AboutPage() {
  const [formState, setFormState] = useState({ name: "", email: "", role: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — wire up to your preferred form backend
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #0a2e7a 0%, #0e4099 50%, #1252b8 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.10] bg-[#071035]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
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
            <span className="text-white/50 text-sm">About</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-24">

        {/* Hero */}
        <section className="pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/20 ring-1 ring-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 tracking-wide">
            <ShieldCheck className="h-3.5 w-3.5" />
            15 Years · Student Financial Aid
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent mb-4 leading-tight">
            Built From the Inside
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Developed by a 15-year Financial Aid Professional. Designed for the people who do this work every day.
          </p>
        </section>

        {/* Origin Story */}
        <section className="mb-12 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-8">
          <p className="text-base text-white/75 leading-relaxed mb-5">
            The creator of Genie spent <strong className="text-white">15 years working directly in Student Financial Aid</strong> — addressing student concerns, processing FAFSA applications, running R2T4 calculations, navigating Title IV audits, and helping thousands of students understand and process their aid packages.
          </p>
          <p className="text-base text-white/75 leading-relaxed mb-5">
            Genie was born from a simple frustration: <strong className="text-white">students and families deserve clear, accurate answers about financial aid</strong> without waiting days for an appointment or wading through government handbooks.
          </p>
          <p className="text-base text-white/75 leading-relaxed">
            Every feature in Genie reflects real experiences from the financial aid office — built for students, parents, and the administrators who serve them.
          </p>
        </section>

        {/* Our Mission */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
              <Target className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Our Mission</h2>
          </div>
          <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-6">
            <p className="text-white/70 leading-relaxed mb-4">
              Make financial aid understandable, accessible, and actionable for every person who interacts with it — whether you are a first-generation student filling out a FAFSA for the first time, a parent trying to decode an award letter, or a financial aid administrator processing a withdrawal.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              {[
                "Clear answers without the jargon",
                "Built on official federal regulation (34 CFR, FSA Handbook, HEA)",
                "Designed for accuracy, not approximation",
                "Always pointing users back to official sources",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-white/65">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
              <Users className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Who We Serve</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: GraduationCap,
                title: "Students & Families",
                desc: "First-generation students, transfer students, graduate students, and their parents navigating aid packages, FAFSA, and enrollment decisions.",
              },
              {
                icon: Building2,
                title: "Financial Aid Offices",
                desc: "Administrators processing R2T4 calculations, Title IV compliance, SAP policies, verification, and award packaging.",
              },
              {
                icon: BookOpen,
                title: "Institutions & Auditors",
                desc: "Compliance officers, executives, and auditors who need quick reference to federal regulations and program requirements.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-6 py-5">
                <div className="p-2 rounded-xl bg-indigo-600/20 w-fit mb-3">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Genie */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
              <Lightbulb className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Why Genie</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Built by a practitioner",
                body: "Not a startup that read the regulations once — built by someone who lived them for 15 years.",
              },
              {
                label: "Grounded in real regulation",
                body: "Responses are anchored to 34 CFR, the FSA Handbook, and HEA Title IV — the same sources your financial aid office uses.",
              },
              {
                label: "Privacy-first",
                body: "Conversations are not stored. No SSNs, no student IDs. FERPA compliance is a design principle, not an afterthought.",
              },
              {
                label: "Honest about limitations",
                body: "Genie is a general information tool. It always directs you to your institution's financial aid office and official FSA sources for decisions.",
              },
            ].map(({ label, body }) => (
              <div key={label} className="rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] px-6 py-4">
                <p className="text-sm font-semibold text-white mb-1">{label}</p>
                <p className="text-sm text-white/55 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact / Demo Request */}
        <section id="contact" className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
              <Mail className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Contact & Demo Request</h2>
          </div>
          <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-7">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="h-10 w-10 text-indigo-400" />
                <p className="text-base font-semibold text-white">Message received!</p>
                <p className="text-sm text-white/55">We will be in touch within 2 business days.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="you@institution.edu"
                      className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Role</label>
                  <select
                    value={formState.role}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                    className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#0e4099]">Select your role</option>
                    <option value="student" className="bg-[#0e4099]">Student</option>
                    <option value="parent" className="bg-[#0e4099]">Parent / Guardian</option>
                    <option value="fa-admin" className="bg-[#0e4099]">Financial Aid Administrator</option>
                    <option value="institution" className="bg-[#0e4099]">Institution / School Leadership</option>
                    <option value="auditor" className="bg-[#0e4099]">Auditor / Compliance Officer</option>
                    <option value="other" className="bg-[#0e4099]">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Message or Demo Request</label>
                  <textarea
                    required
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Tell us about your institution, your team's needs, or request a demo..."
                    className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Send Message
                </button>
                <p className="text-[10px] text-center text-white/25">
                  For institutional demo requests, please use your institution email address.
                </p>
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
            <Link href="/institutions" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">For Schools</Link>
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
