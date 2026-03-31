"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, Users, Target, Lightbulb, BookOpen, Mail, Building2, GraduationCap, ShieldCheck, CheckCircle, Sparkles, Heart, Paperclip } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formState, type: "contact" }),
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #0a2e7a 0%, #0e4099 50%, #1252b8 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.10] bg-[#071035]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/aid-agent" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg px-2 py-1">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to askGenie</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <GenieBottle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">askGenie</span>
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
            15 Years · Student Financial Aid · For-Profit Post-Secondary Education
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent mb-4 leading-tight">
            Built From the Inside
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mx-auto leading-relaxed mb-8">
            askGenie was created by someone who spent 15 years in the trenches of student financial aid — not reading about it, but living it, every single day.
          </p>
          <Link
            href="/aid-agent"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <GenieBottle className="h-4 w-4" />
            Try askGenie — It&apos;s Free
          </Link>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.08]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/30 px-2">How it works</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.08]" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {([
              { n: "1", icon: Sparkles,    title: "Choose your role",    body: "Select Student, Parent, Admin, Leader, or Auditor — Genie tailors every answer to your context and expertise level." },
              { n: "2", icon: Paperclip,   title: "Ask or upload",       body: "Type a question, upload an award letter or policy document, or pick a quick-start prompt. Attach ISIR data or 34 CFR text." },
              { n: "3", icon: CheckCircle, title: "Get expert guidance", body: "Plain-English answers with regulation citations, step-by-step calculations, and responses you can print or share." },
            ] as const).map(({ n, icon: Icon, title, body }) => (
              <div key={n} className="relative flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08]">
                <div className="absolute -top-3 -left-1 w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-500/30">
                  <span className="text-[10px] font-black text-white leading-none">{n}</span>
                </div>
                <Icon className="h-5 w-5 text-teal-300/60 mt-1" aria-hidden="true" />
                <p className="text-sm font-semibold text-white/90 leading-tight">{title}</p>
                <p className="text-xs text-white/55 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Origin Story */}
        <section className="mb-12 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-8">
          <h2 className="text-lg font-bold text-white mb-5">The Story Behind askGenie</h2>
          <p className="text-base text-white/90 leading-relaxed mb-4">
            Over 15 years in the for-profit post-secondary education sector working all typical positions in a FA office front and back end. I personally helped thousands of students navigate FAFSA applications, decode award letters, process R2T4 calculations, survive Title IV audits, and understand SAP policies and verification requirements.
          </p>
          <p className="text-base text-white/90 leading-relaxed mb-4">
            What I saw, year after year, was the same pattern: <strong className="text-white">students and families had urgent questions and nowhere to turn.</strong> Financial aid offices are understaffed. Appointments take days. Government handbooks are dense and written for compliance officers, not students. And the stakes — tuition, enrollment, federal aid eligibility — could not be higher.
          </p>
          <p className="text-base text-white/90 leading-relaxed mb-4">
            askGenie was built to close that gap. <strong className="text-white">Not as a replacement for your financial aid office</strong> — but as a knowledgeable companion that gives you clarity at 2 a.m. before a deadline, helps you understand your award letter before your appointment, and empowers you to walk into any financial aid conversation prepared.
          </p>
          <p className="text-base text-white/90 leading-relaxed">
            Every feature in this tool reflects real experiences from the financial aid office. The questions are real. The edge cases are real. <strong className="text-white">The expertise behind the answers is real.</strong>
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
          <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-6 space-y-4">
            <p className="text-white/90 leading-relaxed">
              Make financial aid <strong className="text-white">understandable, accessible, and actionable</strong> for every person who touches it — whether you are a first-generation student, a parent decoding an award letter, or a financial aid administrator running an R2T4 withdrawal.
            </p>
            <p className="text-white/90 leading-relaxed">
              But the mission reaches further: <strong className="text-white">to inspire curiosity and lifelong learning.</strong> Education does not end at graduation. Understanding how systems work — your rights, your options, your obligations — is a skill that pays dividends for life. If you are here, that curiosity deserves to be met with clarity, not confusion.
            </p>
            <p className="text-white/90 leading-relaxed">
              <strong className="text-white">askGenie is designed to cover API and hosting costs initially.</strong> If genuine demand grows, we will explore sustainable paths that keep the tool affordable and accessible for the students and families who need it most. The tool exists to serve users — not the other way around.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {[
                "Clear answers without the jargon",
                "Grounded in 34 CFR, FSA Handbook, and HEA Title IV",
                "Designed for accuracy, not approximation",
                "Always points you back to official sources",
                "Inspires lifelong curiosity and self-advocacy",
                "Accessible to anyone, regardless of background",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-white/85">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI & Intentions */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
              <Sparkles className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-white">AI, Transparency & Our Intentions</h2>
          </div>
          <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-8 py-6 space-y-4">
            <p className="text-white/90 leading-relaxed">
              We want to be direct with you: <strong className="text-white">AI is a powerful tool — and a responsibility.</strong> The conversations around artificial intelligence are real: job displacement, misinformation, loss of human connection. Those concerns deserve to be taken seriously, and they shaped how askGenie was built.
            </p>
            <p className="text-white/90 leading-relaxed">
              <strong className="text-white">askGenie is not here to eliminate jobs.</strong> Financial aid professionals, advisors, and counselors bring irreplaceable judgment, relationships, and human accountability to the students they serve. No AI changes that. What askGenie does is <strong className="text-white">fill the gaps</strong> — the after-hours question, the clarity before a meeting, the regulatory reference during a busy season — so that professionals can focus on what truly requires a human presence.
            </p>
            <p className="text-white/90 leading-relaxed">
              When AI is built with <strong className="text-white">care, transparency, and intention</strong> — and used to assist rather than replace — it becomes something genuinely helpful. That is the only version of AI we are interested in building.
            </p>
            <p className="text-white/90 leading-relaxed">
              <strong className="text-white">Always verify.</strong> askGenie provides general information based on federal regulation and best practices. It is not legal or financial advice. Always confirm important decisions with your institution's financial aid office and official FSA resources.
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {[
                "Not a replacement for FA professionals",
                "Designed to assist, not automate away, human judgment",
                "Transparent about AI limitations",
                "Built to empower users, not create dependency",
                "Anchored to student financial aid regulation",
                "Equally serving students, families, and FA offices",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <Heart className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-white/85">{item}</span>
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
                desc: "First-generation students, transfer students, graduate students, and their parents navigating FAFSA, award letters, enrollment decisions, and repayment.",
              },
              {
                icon: Building2,
                title: "Financial Aid Offices",
                desc: "Administrators running R2T4 calculations, managing Title IV compliance, processing SAP, verification, and award packaging — especially during peak season.",
              },
              {
                icon: BookOpen,
                title: "Institutions & Auditors",
                desc: "Compliance officers, executives, and auditors needing quick, reliable reference to federal regulations, program requirements, and audit preparation.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08] px-6 py-5">
                <div className="p-2 rounded-xl bg-indigo-600/20 w-fit mb-3">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/85 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/aid-agent"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] ring-1 ring-white/[0.15] hover:bg-white/[0.14] text-white text-sm font-semibold transition-all"
            >
              <GenieBottle className="h-4 w-4" />
              See askGenie in action
            </Link>
          </div>
        </section>

        {/* Why askGenie */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
              <Lightbulb className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Why askGenie — and Not Something Else</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Built by a practitioner, not a startup",
                body: "15 years as a Financial Aid Planner, Assistant Director, Director, Analyst, and Senior Analyst — across every level of the office. The nuance in these answers comes from lived experience, not a document read once.",
              },
              {
                label: "Grounded in the same sources your FA office uses",
                body: "Responses are anchored to 34 CFR, the FSA Handbook, and HEA Title IV — the exact regulatory foundation of every financial aid decision.",
              },
              {
                label: "Privacy is a design principle, not a checkbox",
                body: "Conversations are not stored or used to train future models. No SSNs, no student IDs. FERPA compliance is built in from the start.",
              },
              {
                label: "Honest about what it is — and what it isn't",
                body: "askGenie is a general reference tool. It will always direct you to your institution and official FSA sources for decisions. Curiosity is encouraged. Dependency is not.",
              },
              {
                label: "Stay curious. Ask questions. Verify everything.",
                body: "The most empowered users are the ones who ask follow-up questions, do their own research, and confirm information with official sources. askGenie is here to help you start — not finish — that journey.",
              },
            ].map(({ label, body }) => (
              <div key={label} className="rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] px-6 py-4">
                <p className="text-sm font-semibold text-white mb-1">{label}</p>
                <p className="text-sm text-white/85 leading-relaxed">{body}</p>
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
                <p className="text-sm text-white/85">We will be in touch within 2 business days.</p>
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
                      placeholder="you@example.com"
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
                    placeholder="Tell us about your needs, your institution, or request a demo..."
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
                  For institutional demo requests, please use your institution email address. All inquiries go to elementone27@gmail.com.
                </p>
              </form>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] px-6 py-4 mb-10 text-center">
          <p className="text-xs text-white/40 leading-relaxed">
            askGenie is an unofficial reference tool and is not affiliated with, endorsed by, or connected to the U.S. Department of Education or any federal agency. Information provided is for general educational purposes only and does not constitute legal, financial, or professional advice. Always verify information with your institution&apos;s financial aid office and official FSA sources at studentaid.gov.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/25">© 2026 askGenie Financial Aid Hub | Developed by One27 | All Rights Reserved</p>
            <p className="text-xs text-white/20 mt-0.5">Unofficial reference tool — not affiliated with the U.S. Department of Education</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/institutions" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">For Schools</Link>
            <Link href="/legal" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">Legal</Link>
            <Link href="/aid-agent" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
              <GenieBottle className="h-3.5 w-3.5" />
              Open askGenie
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
