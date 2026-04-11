"use client";

import Link from "next/link";
import { Home, ChevronRight, Shield, AlertTriangle, FileText } from "lucide-react";

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
    </svg>
  );
}

const DPA_SECTIONS = [
  {
    n: "1",
    title: "Parties",
    body: "This Data Processing Agreement (\"Agreement\") is entered into between the educational institution identified in the applicable Order Form or service enrollment (\"Institution\" or \"School\") and Genie Student Aid Hub, developed by One27 (\"Service Provider\"). This Agreement governs the processing of personal data in connection with the Institution's use of the Genie AI financial aid assistant service (\"Service\").",
  },
  {
    n: "2",
    title: "Definitions",
    body: "\"Personal Data\" means any information relating to an identified or identifiable natural person, including student education records as defined by FERPA.\n\"Education Records\" has the meaning set forth in 20 U.S.C. § 1232g (FERPA).\n\"School Official\" means an employee of the Institution who has a legitimate educational interest in accessing student records.\n\"Legitimate Educational Interest\" has the meaning defined in the Institution's FERPA annual notification.",
  },
  {
    n: "3",
    title: "FERPA Compliance",
    body: "The Service Provider acknowledges that it may be designated as a \"school official\" under FERPA with a \"legitimate educational interest\" solely to the extent the Institution chooses to submit education records through the Service. The Service Provider agrees to:\n(a) Use education records only for the purpose of providing the Service;\n(b) Not re-disclose education records to any third party without the Institution's written consent, except as permitted by FERPA;\n(c) Allow the Institution to inspect and review records maintained by the Service Provider;\n(d) Return or destroy education records upon termination of this Agreement.",
  },
  {
    n: "4",
    title: "Scope of Processing",
    body: "The Service Provider shall process personal data only on documented instructions from the Institution. The nature and purpose of processing is to provide AI-assisted financial aid information. Categories of data subjects may include students and parents/guardians. Categories of personal data may include names, student IDs, enrollment information, and financial aid award details — but only if voluntarily submitted by the Institution. The Service Provider strongly advises Institutions NOT to submit SSNs, full financial account numbers, or FERPA-protected PII through the general chat interface.",
  },
  {
    n: "5",
    title: "Data Minimization & Purpose Limitation",
    body: "The Service is designed to operate without requiring submission of personally identifiable student information. Institutions should use anonymized or hypothetical scenarios when using the Service for training, demonstrations, or general policy inquiries. The Service Provider does not require and does not solicit student PII to answer financial aid questions.",
  },
  {
    n: "6",
    title: "Sub-processors",
    body: "The Service Provider uses the following sub-processors:\n• Anthropic PBC (Claude AI) — AI response generation. Anthropic's usage policies apply.\n• Vercel Inc. — Hosting and infrastructure.\n• Neon Inc. — Database hosting.\nThe Service Provider will notify the Institution of any intended changes to sub-processors and provide opportunity to object.",
  },
  {
    n: "7",
    title: "Security Measures",
    body: "The Service Provider implements appropriate technical and organizational measures including:\n• Encryption of data in transit (TLS 1.2+)\n• Access controls and authentication\n• Regular security assessments\n• Incident response procedures\nThe Service Provider shall notify the Institution without undue delay (and within 72 hours where feasible) upon becoming aware of a personal data breach affecting Institution data.",
  },
  {
    n: "8",
    title: "Data Retention & Deletion",
    body: "The Service does not persistently store individual chat messages after session completion. Aggregate usage logs may be retained for up to 30 days for operational purposes. Upon written request from the Institution, the Service Provider will confirm deletion of any identified Institution data within 30 days.",
  },
  {
    n: "9",
    title: "Rights of Data Subjects",
    body: "The Service Provider will assist the Institution in fulfilling its obligations to respond to requests from data subjects exercising their rights under applicable law (FERPA, CCPA, and other applicable privacy regulations). The Institution remains the primary party responsible for responding to student and parent requests regarding their education records.",
  },
  {
    n: "10",
    title: "Confidentiality",
    body: "The Service Provider ensures that persons authorized to process personal data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.",
  },
  {
    n: "11",
    title: "Audits & Inspections",
    body: "The Service Provider shall make available to the Institution all information necessary to demonstrate compliance with this Agreement and shall allow for and contribute to audits, including inspections, conducted by the Institution or an auditor mandated by the Institution, with reasonable prior notice.",
  },
  {
    n: "12",
    title: "Term & Termination",
    body: "This Agreement is effective upon the Institution's first use of the Service and remains in effect until the Institution ceases use of the Service or either party terminates in writing. Upon termination, the Service Provider will delete or return all personal data as directed by the Institution.",
  },
  {
    n: "13",
    title: "Governing Law",
    body: "This Agreement is governed by the laws of the State of California. Disputes shall be resolved in courts located in Los Angeles County, California. Nothing in this Agreement limits the Institution's obligations under FERPA or other applicable federal and state laws.",
  },
  {
    n: "14",
    title: "Execution",
    body: "This Agreement is a sample template provided for institutional review. Institutions should review this template with their legal counsel before executing any data processing agreement. To execute a signed DPA with Genie Student Aid Hub, contact: elementone27@gmail.com. This template does not constitute a legally binding agreement until signed by authorized representatives of both parties.",
  },
];

export default function DpaPage() {
  return (
    <div className="min-h-screen text-white relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <img src="/images/desktop-bg.jpg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(5,2,14,0.55)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/aid-agent"
            className="flex items-center gap-2 text-[#94A3B8]/70 hover:text-[#D4AF37] transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 rounded-lg px-2 py-1 ring-1 ring-white/10 hover:bg-white/[0.05]"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Genie</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl" style={{ background: "rgba(212,175,55,0.18)" }}>
              <GenieBottle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-[#D4AF37]">Genie</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/75 text-sm font-semibold">School DPA</span>
          </div>

          <div className="w-24" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 pb-20 relative" style={{ zIndex: 1 }}>
        {/* Contextual banner image */}
        <div className="relative rounded-2xl overflow-hidden mb-6 mt-8">
          <img src="/images/advisor-student.jpg" alt="" className="w-full h-40 object-cover object-[50%_30%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020C1B]/40 to-[#020C1B]/80" />
        </div>

        {/* Intro */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-amber-500/[0.15] ring-1 ring-amber-500/[0.28]">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(90deg, #e8e8e8 0%, #ffffff 25%, #f0f0f0 50%, #ffffff 75%, #e8e8e8 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
                animation: "hiw-guidance-headline 3s linear infinite",
                filter: "drop-shadow(0 0 12px rgba(255,255,255,0.55))",
              }}
            >
              Data Processing Agreement
            </h1>
          </div>
          <p className="text-sm text-white/40 ml-[52px]">FERPA-Compliant Template for Educational Institutions</p>

          {/* Sample watermark */}
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-amber-500/[0.10] ring-1 ring-amber-500/25 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-0.5">Sample Template — Not a Signed Agreement</p>
              <p className="text-xs text-amber-300/70 leading-relaxed">
                This is a sample DPA template for institutional review only. It does not constitute a legally binding agreement.
                Institutions must review this template with qualified legal counsel and execute a signed version before sharing
                any student education records with this Service.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {DPA_SECTIONS.map(({ n, title, body }) => (
            <div
              key={n}
              className="group rounded-xl transition-all duration-150 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)",
              }}
            >
              <div className="flex items-start gap-4 px-6 py-5">
                <span className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/[0.15] ring-1 ring-amber-500/[0.28] text-amber-400 text-xs font-bold">
                  {n}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white mb-2 leading-snug">{title}</h2>
                  <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{body}</p>
                </div>
              </div>
            </div>
          ))}
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
            <Link key={label} href={href} className="px-3 py-1 rounded-full text-[11px] font-medium text-white/35 hover:text-amber-400 hover:bg-amber-500/[0.10] ring-1 ring-white/[0.08] hover:ring-amber-400/25 transition-all">{label}</Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/25">© 2026 Genie Student Aid Hub | Developed by One27 | All Rights Reserved</p>
            <p className="text-xs text-white/20 mt-0.5">Unofficial reference tool — not affiliated with the U.S. Department of Education</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/legal" className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors">
              Legal
            </Link>
            <Link
              href="/aid-agent"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[#D4AF37] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 hover:bg-amber-500/30"
              style={{ background: "rgba(212,175,55,0.25)", border: "1px solid rgba(212,175,55,0.40)" }}
            >
              <GenieBottle className="h-3.5 w-3.5" />
              Back to Genie
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
