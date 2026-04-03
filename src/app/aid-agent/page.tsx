"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { AppInstallPrompt } from "@/components/AppInstallPrompt";
import { UsageMeter, LimitToast } from "@/components/usage-meter";
import { UpgradeModal, useUpgradeModal } from "@/components/upgrade-modal";
import { canAccessFeature } from "@/lib/feature-gates";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  Send,
  BookOpen,
  Scale,
  Calculator,
  Users,
  Receipt,
  Sparkles,
  ChevronRight,
  Landmark,
  ClipboardList,
  ShieldCheck,
  ExternalLink,
  SquarePen,
  Zap,
  Library,
  AlertTriangle,
  Square,
  Lightbulb,
  Volume2,
  VolumeX,
  Loader2,
  Printer,
  Home,
  FileText,
  Award,
  TrendingUp,
  Briefcase,
  DollarSign,
  CheckCircle,
  Hash,

  X,
  Sun,
  Moon,
  Paperclip,
  Camera,
  ImageIcon,
  Mic,
  MicOff,
  LogIn,
  UserCircle,
  RotateCcw,
} from "lucide-react";

// ─── Genie Bottle Logo ────────────────────────────────────────────────────────

function GenieBottle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" className={className} style={style} aria-hidden="true">
      {/* Smoke / magic wisps emerging from top */}
      <path d="M24 4 C22 1 26 -1 24 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      <path d="M21 5 C18 2 20 7 19 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.22"/>
      <path d="M27 5 C30 2 28 7 29 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.22"/>
      {/* Neck collar ring */}
      <rect x="17" y="8" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.90"/>
      {/* Neck */}
      <rect x="19.5" y="11" width="9" height="5" rx="1" fill="currentColor" opacity="0.80"/>
      {/* Shoulder taper */}
      <path d="M19.5 16 C16 18 13 22 12 27 L12 42 C12 45.5 17.5 48.5 24 48.5 C30.5 48.5 36 45.5 36 42 L36 27 C35 22 32 18 28.5 16 Z" fill="currentColor" opacity="0.92"/>
      {/* Belly highlight — left shimmer */}
      <path d="M17 26 C15.5 29 15 33 15.5 37" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.18"/>
      {/* Belly highlight — small gleam */}
      <ellipse cx="19" cy="29" rx="2" ry="3.5" fill="white" opacity="0.12" transform="rotate(-15 19 29)"/>
      {/* Base ring */}
      <ellipse cx="24" cy="43.5" rx="9" ry="2.8" fill="currentColor" opacity="0.55"/>
      {/* Gold band around belly */}
      <path d="M13.5 32 C13.2 33.5 13 35 13 36.5 L35 36.5 C35 35 34.8 33.5 34.5 32 Z" fill="white" opacity="0.08"/>
      {/* Stopper cap top */}
      <ellipse cx="24" cy="8.5" rx="7.5" ry="2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

// ─── Graduation Cap Icon ──────────────────────────────────────────────────────

function GraduationCap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {/* Board */}
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      {/* Left tassel string */}
      <path d="M4 9.5v5c0 2.5 3.6 4.5 8 4.5s8-2 8-4.5v-5L12 14 4 9.5z" />
      {/* Tassel cord */}
      <path d="M20 7v6" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="14" r="1.2" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  apiContent?: any;          // multipart content for API (images etc.)
  senderRole?: string;
  attachedFileName?: string; // display label for attached file
}

interface AttachedFile {
  name: string;
  content: string;           // base64 for images, raw text for documents/audio transcripts
  type: "image" | "text" | "audio";
  mimeType?: string;
}

// ─── Link list helpers ────────────────────────────────────────────────────────

type LinkItem = { name: string; url: string };
type SubcatItem = { subcat: string };
type MaybeSubcat = LinkItem | SubcatItem;
function isSubcat(item: MaybeSubcat): item is SubcatItem { return "subcat" in item; }

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  {
    icon: BookOpen,
    label: "FA Offer Letter",
    description: "Any college, 2025-26 or 2026-27",
    q: "Generate a financial aid offer letter for a dependent freshman attending UCLA (in-state, California resident) with a family AGI of $55,000, living on-campus, for the 2025-26 award year.",
  },
  {
    icon: ClipboardList,
    label: "R2T4 Calculator",
    description: "Tentative pre-withdrawal calculation",
    q: "Generate a tentative R2T4 calculation for a student considering withdrawal. The semester started August 26, ends December 13 (112 days). The student plans to withdraw October 10. Scheduled breaks: Labor Day (Sept 1-2, 2 days — not qualifying). Aid disbursed: Pell $3,698, Subsidized Loan $1,750, Unsubsidized Loan $1,000. Institutional charges: $9,500 tuition and fees.",
  },
  {
    icon: ShieldCheck,
    label: "FSA Audit Prep",
    description: "Compliance audit & program review",
    q: "Walk me through the most common FSA audit findings and how to prepare our financial aid office for an ED program review.",
  },
  {
    icon: Calculator,
    label: "SAP Policy",
    description: "Required policy components",
    q: "What are the required components of a Satisfactory Academic Progress policy?",
  },
  {
    icon: Scale,
    label: "FAFSA Simplification",
    description: "EFC → SAI and new rules",
    q: "What are the biggest changes under the FAFSA Simplification Act effective 2024-25, especially the switch from EFC to SAI and the new divorced parent rule?",
  },
  {
    icon: Landmark,
    label: "Big Beautiful Bill",
    description: "2025 reconciliation & SAVE plan",
    q: "What student aid changes are proposed in the One Big Beautiful Bill reconciliation legislation, and what is the current status of the SAVE plan litigation?",
  },
  {
    icon: Users,
    label: "School Comparison",
    description: "Ivy, public, CC, trade schools",
    q: "Compare financial aid, costs, and admission processes across Ivy League, public universities, community colleges, and trade schools for a first-generation student from a low-income family.",
  },
  {
    icon: Receipt,
    label: "Education Tax Credits",
    description: "AOTC, LLC, and interactions",
    q: "Explain the American Opportunity Tax Credit and Lifetime Learning Credit — who qualifies, how much can they receive, and how does it interact with scholarships?",
  },
];

const QUICK_ACTIONS_BY_ROLE = [
  // ── Administrators first — highest daily FA office usage ──
  {
    role: "Administrators",
    color: "text-emerald-400",
    items: [
      { icon: BookOpen, label: "FA Offer Letter (School)", description: "Generate for any institution", q: "Generate a financial aid offer letter for a dependent freshman attending UCLA (in-state, California resident) with a family AGI of $55,000, living on-campus, for the 2025-26 award year." },
      { icon: ClipboardList, label: "R2T4 Calculator", description: "Tentative pre-withdrawal calc", q: "Generate a tentative R2T4 calculation for a student considering withdrawal. The semester started August 26, ends December 13 (112 days). The student plans to withdraw October 10. Scheduled breaks: Labor Day (Sept 1-2, 2 days — not qualifying). Aid disbursed: Pell $3,698, Subsidized Loan $1,750, Unsubsidized Loan $1,000. Institutional charges: $9,500 tuition and fees." },
      { icon: Calculator, label: "SAP Policy", description: "Required policy components", q: "What are the required components of a Satisfactory Academic Progress policy?" },
      { icon: ShieldCheck, label: "FSA Audit Prep", description: "Common findings & readiness", q: "Walk me through the most common FSA audit findings and how to prepare our financial aid office for an ED program review." },
    ],
    more: [
      { icon: FileText, label: "Professional Judgment", description: "Dependency & cost adjustments", q: "When can a financial aid administrator exercise professional judgment to adjust a student's cost of attendance or EFC/SAI? Walk me through the regulatory basis and documentation requirements." },
      { icon: CheckCircle, label: "Dependency Override", description: "Criteria and documentation", q: "What are the acceptable circumstances for granting a dependency override, and what documentation is required under 34 CFR 668.2?" },
      { icon: ClipboardList, label: "Verification Guide", description: "Process, tolerances & tracking", q: "Walk me through the complete verification process: which students must be selected, what documents to collect, verification tolerances, and how to document corrections." },
      { icon: BookOpen, label: "Entrance Counseling", description: "Compliance requirements", q: "What are the regulatory requirements for student loan entrance counseling — who must complete it, what topics must be covered, and how must it be documented?" },
      { icon: FileText, label: "Exit Counseling", description: "Requirements & timing", q: "What are the exit counseling requirements for student loan borrowers withdrawing or graduating, including timing and content requirements?" },
      { icon: Hash, label: "Consortium Agreements", description: "Dual enrollment aid processing", q: "How do consortium agreements work for financial aid purposes? What must be included, how is enrollment determined, and who is responsible for R2T4?" },
      { icon: Scale, label: "Study Abroad Aid", description: "Eligibility and COA adjustments", q: "How is financial aid processed for students studying abroad? What COA adjustments are allowable and what documentation is required?" },
      { icon: Calculator, label: "Summer Aid Eligibility", description: "Rules after FAFSA Simplification", q: "What are the rules for awarding aid during summer terms, and how did FAFSA Simplification affect summer Pell Grant eligibility?" },
      { icon: Landmark, label: "Campus-Based Aid", description: "FSEOG, FWS, and Perkins", q: "Walk me through the campus-based aid programs — FSEOG, Federal Work-Study, and Perkins Loan wind-down — including allocation, matching requirements, and reporting." },
      { icon: Award, label: "TEACH Grant", description: "Requirements and conversion rules", q: "Explain the TEACH Grant program requirements, the service obligation, and under what circumstances it converts to an unsubsidized Direct Loan." },
      { icon: DollarSign, label: "Direct Loan Limits", description: "Annual and aggregate amounts", q: "What are the current annual and aggregate Direct Loan limits for dependent undergraduates, independent undergraduates, and graduate students for 2024-25 and 2025-26?" },
      { icon: FileText, label: "Cost of Attendance", description: "Allowable components by category", q: "What components may be included in a student's cost of attendance under 34 CFR 472, and what special allowances exist for transportation, personal computers, and childcare?" },
      { icon: Scale, label: "Disbursement Rules", description: "Timing, holds, and late disbursements", q: "What are the disbursement timing requirements for Title IV funds, including the 30-day rule for first-year first-time borrowers and late disbursement rules?" },
      { icon: Receipt, label: "Credit Balance Procedures", description: "Timing and student notification", q: "What are the requirements for paying credit balances to students, including timing, student authorization for institutional holding, and permissible institutional charges?" },
      { icon: TrendingUp, label: "Conflicting Information", description: "Resolution and documentation", q: "How should a financial aid administrator handle conflicting information in a student's file, and what documentation is required under 34 CFR 668.16(f)?" },
    ],
  },
  {
    role: "Students",
    color: "text-sky-400",
    items: [
      { icon: BookOpen, label: "FA Offer Letter", description: "Decode your award letter", q: "I received my financial aid offer letter — can you explain what each award means (grants, scholarships, loans, work-study) and help me understand my true cost after aid?" },
      { icon: Scale, label: "FAFSA Simplification", description: "EFC → SAI and new rules", q: "What are the biggest changes under the FAFSA Simplification Act effective 2024-25, especially the switch from EFC to SAI and the new divorced parent rule?" },
      { icon: Users, label: "School Comparison", description: "Ivy, public, CC, trade schools", q: "Compare financial aid, costs, and admission processes across Ivy League, public universities, community colleges, and trade schools for a first-generation student from a low-income family." },
      { icon: Receipt, label: "Education Tax Credits", description: "AOTC, LLC, and interactions", q: "Explain the American Opportunity Tax Credit and Lifetime Learning Credit — who qualifies, how much can they receive, and how does it interact with scholarships?" },
    ],
    more: [
      { icon: Award, label: "Scholarship Search", description: "By major, state, and background", q: "Help me find scholarships I qualify for. I'm a first-generation college student majoring in nursing, from Texas, with a 3.4 GPA and a family income of about $45,000. What scholarships should I apply for?" },
      { icon: Briefcase, label: "Work-Study Jobs", description: "Eligibility and how to find them", q: "How does Federal Work-Study work? How do I qualify, how do I find work-study jobs on campus, and does the income affect my financial aid for next year?" },
      { icon: FileText, label: "Loan Entrance Counseling", description: "What to know before borrowing", q: "I need to complete loan entrance counseling before my loans disburse. Walk me through what it covers and the most important things I should understand about my loan obligations." },
      { icon: DollarSign, label: "Graduate PLUS vs. Private", description: "Compare rates and protections", q: "Should I take a Graduate PLUS loan or a private student loan? Compare interest rates, origination fees, repayment options, and deferment/forgiveness protections." },
      { icon: CheckCircle, label: "Public Service Loan Forgiveness", description: "Eligibility and application steps", q: "Walk me through Public Service Loan Forgiveness — who qualifies, what employers count, how to submit PSLF employment certification, and the current application process." },
      { icon: TrendingUp, label: "Income-Driven Repayment", description: "Compare IDR plans for 2024-25", q: "Compare all current income-driven repayment plans — SAVE, PAYE, IBR, ICR — including payment amounts, forgiveness timelines, and which plan is best for my situation." },
      { icon: Calculator, label: "Transfer Student Aid", description: "SAP, aid limits, and timing", q: "I'm transferring to a new school. How does financial aid work for transfer students — does my SAP reset, what loan history carries over, and when will my aid disburse?" },
      { icon: Landmark, label: "GI Bill & Military Benefits", description: "Chapter 33, 30, and BAH", q: "Explain the GI Bill education benefits — what's covered under Chapter 33 (Post-9/11), how does the housing allowance work, and can I stack it with other financial aid?" },
      { icon: Scale, label: "Emergency Aid Funds", description: "HEERF, institutional, and state", q: "My car broke down and I can't pay rent this month. What emergency aid funds are available to me — institutional emergency grants, state programs, or federal options?" },
      { icon: BookOpen, label: "Study Abroad Financing", description: "Aid eligibility and budgeting", q: "I want to study abroad for a semester. Can I use my financial aid for that, and if so, how much? What additional scholarships or funding exist specifically for study abroad?" },
      { icon: Receipt, label: "529 Plan & FAFSA", description: "Impact on financial aid formula", q: "How does a 529 college savings account affect my FAFSA? Does it reduce my financial aid, and whose 529 counts — mine, my parents', or a grandparent's?" },
      { icon: FileText, label: "Deferment vs. Forbearance", description: "Options during hardship", q: "What's the difference between deferment and forbearance? Which is better for my situation, does interest accrue during each, and how do I apply?" },
      { icon: Users, label: "Independent Student Status", description: "Criteria under FAFSA Simplification", q: "What makes a student independent for FAFSA purposes, and what changed under FAFSA Simplification? Can I appeal my dependency status if my parents won't help pay?" },
      { icon: Award, label: "State Grant Programs", description: "By state of residence", q: "What state grant and scholarship programs are available for students in my state? I'm a resident of California — what state aid can I receive beyond federal Pell?" },
      { icon: DollarSign, label: "Loan Forgiveness Programs", description: "All forgiveness options for 2025", q: "Beyond PSLF, what other student loan forgiveness programs exist in 2025? Include teacher loan forgiveness, nurse corps, state programs, and income-driven forgiveness timelines." },
      { icon: Users, label: "Volunteer Opportunities", description: "Search engines & service programs", q: "I want to find meaningful volunteer opportunities as a college student. What are the best volunteer search platforms and national service programs? Are there any that offer scholarships or education awards, like AmeriCorps? How does volunteer work affect financial aid or qualify me for PSLF?" },
      { icon: Award, label: "AmeriCorps & Service Awards", description: "Education awards through service", q: "How does the AmeriCorps Segal Education Award work? What service programs qualify, how much is the award, and how is it treated on the FAFSA? Which AmeriCorps programs are best for college students — VISTA, NCCC, or State/National?" },
    ],
  },
  {
    role: "Parents",
    color: "text-blue-400",
    items: [
      { icon: BookOpen, label: "Read the Offer Letter", description: "Decode your child's award", q: "My child received a financial aid offer letter. Can you walk me through what each line item means and help me understand the real out-of-pocket cost we'd pay?" },
      { icon: Users, label: "School Comparison", description: "Compare aid & net cost", q: "Compare financial aid, costs, and admission processes across Ivy League, public universities, community colleges, and trade schools for a first-generation student from a low-income family." },
      { icon: Receipt, label: "Education Tax Credits", description: "AOTC, LLC, and 529 strategy", q: "Explain the American Opportunity Tax Credit and Lifetime Learning Credit — who qualifies, how much can they receive, and how does it interact with scholarships?" },
      { icon: Scale, label: "FAFSA Simplification", description: "Divorced parent & asset rules", q: "How did FAFSA Simplification change the rules for divorced or separated parents, and how are parent assets and income treated in the new SAI formula?" },
    ],
    more: [
      { icon: DollarSign, label: "PLUS Loan Application", description: "Process, credit check & options", q: "Walk me through applying for a Parent PLUS Loan — what's the credit check process, what happens if I'm denied, what interest rate applies for 2024-25, and what repayment options do I have?" },
      { icon: FileText, label: "CSS Profile Strategy", description: "Tips to maximize aid", q: "My child is applying to schools that require the CSS Profile. What strategies should I know about to maximize our aid eligibility, including what assets are treated differently than on FAFSA?" },
      { icon: TrendingUp, label: "529 vs. Roth IRA", description: "Which is better for college savings?", q: "Compare a 529 college savings plan versus a Roth IRA for funding college — which has better tax advantages, flexibility, and FAFSA treatment?" },
      { icon: Scale, label: "Special Circumstances", description: "Appeal when income drops", q: "Our family income dropped significantly this year due to a job loss. Can we appeal our child's financial aid award based on current-year income? Walk me through the professional judgment appeal process." },
      { icon: Users, label: "Multiple Students in College", description: "Sibling impact on SAI", q: "We have two children in college at the same time. How does FAFSA Simplification change the sibling discount? How is each child's SAI calculated now compared to before?" },
      { icon: Calculator, label: "Home Equity & FAFSA", description: "How it affects aid eligibility", q: "Does our home equity affect our child's financial aid? How is primary home equity treated on FAFSA vs. the CSS Profile, and are there strategies to reduce its impact?" },
      { icon: Receipt, label: "Business Assets on FAFSA", description: "Small business & farm rules", q: "We own a small business. How are business assets and income reported on the FAFSA? Are there any exemptions for small businesses or family farms?" },
      { icon: DollarSign, label: "PLUS vs. Private Loans", description: "Pros, cons, and rate comparison", q: "Should we take a Parent PLUS Loan or a private student loan to cover our gap? Compare current interest rates, fees, repayment flexibility, and forgiveness protections." },
      { icon: CheckCircle, label: "AOTC Optimization", description: "Maximize $2,500 tax credit", q: "How can we maximize the American Opportunity Tax Credit? What expenses qualify, can we claim it if aid covers all tuition, and how do we coordinate with 529 distributions?" },
      { icon: Landmark, label: "State Grants for Parents", description: "State programs beyond FAFSA", q: "Are there state education grants or subsidies that parents can receive directly, or programs that reduce our out-of-pocket costs for our child's education in our state?" },
      { icon: FileText, label: "Divorce & Aid Strategy", description: "Which parent files, asset planning", q: "My ex-spouse and I are divorced. Under FAFSA Simplification, which parent's information is required, and how should we structure finances to maximize our child's aid eligibility?" },
      { icon: Award, label: "Merit Aid Negotiation", description: "How to appeal for more money", q: "My child received merit scholarships from two schools but one offer is much better. Can we negotiate with the other school for more aid? What's the best approach and what to say?" },
      { icon: BookOpen, label: "Net Price Calculator", description: "What to expect before applying", q: "How accurate are college net price calculators, and what factors do they typically not account for? Help me interpret a specific school's net price calculator result." },
      { icon: Scale, label: "Medical Expenses Appeal", description: "Impact on family contribution", q: "We have high medical bills that aren't reflected in our FAFSA. Can these be used to adjust our SAI through a financial aid appeal, and how do we document this?" },
      { icon: TrendingUp, label: "Income-Driven PLUS Repayment", description: "ICR plan for PLUS borrowers", q: "What repayment options are available for Parent PLUS Loans? I've heard only Income-Contingent Repayment is available — explain how ICR works and the PLUS loan consolidation strategy." },
      { icon: Users, label: "Volunteer Opportunities for Students", description: "Service programs & education awards", q: "What volunteer programs and national service opportunities should my child consider in college? Are there programs that offer scholarships or education awards, like AmeriCorps? How can community service strengthen college applications and career prospects?" },
    ],
  },
  {
    role: "Leaders",
    color: "text-violet-400",
    items: [
      { icon: Landmark, label: "Big Beautiful Bill", description: "2025 reconciliation & SAVE plan", q: "What student aid changes are proposed in the One Big Beautiful Bill reconciliation legislation, and what is the current status of the SAVE plan litigation?" },
      { icon: ShieldCheck, label: "Compliance Risk", description: "Title IV exposure & CDR", q: "Give me a high-level compliance risk summary across Title IV program areas including cohort default rate exposure and gainful employment implications for institutional leadership." },
      { icon: Receipt, label: "Gainful Employment", description: "Financial value transparency", q: "Explain the gainful employment and financial value transparency regulations and their implications for our institution's programs." },
      { icon: Users, label: "Aid Packaging Strategy", description: "Benchmark vs. peer institutions", q: "How do aid packaging strategies at community colleges compare to 4-year public and private institutions, and how can we benchmark our approach?" },
    ],
    more: [
      { icon: Calculator, label: "90/10 Rule Compliance", description: "Revenue percentage tracking", q: "Explain the 90/10 rule under HEA Section 487(a)(24) — how is the 90% threshold calculated, what counts as federal revenue vs. other revenue, and what are the consequences of violation?" },
      { icon: TrendingUp, label: "Composite Financial Score", description: "Maintain acceptable threshold", q: "How is the ED composite financial score calculated for private institutions? What ratios are used, what is the acceptable range, and what happens if we fall below the threshold?" },
      { icon: Landmark, label: "Title IV Participation", description: "PPA requirements and renewal", q: "Walk me through the Program Participation Agreement requirements — what institutions must certify, when renewal is required, and what triggers ED review or limitation." },
      { icon: FileText, label: "Change of Ownership", description: "Reporting and provisionary certification", q: "We're in discussions with a private equity buyer. What are the Title IV change of ownership reporting requirements, the provisional certification process, and risk to Title IV eligibility?" },
      { icon: Briefcase, label: "Financial Responsibility", description: "Standards and surety options", q: "What are ED's financial responsibility standards, what triggers an LOC requirement, and what surety options are available if we receive a letter requiring financial protection?" },
      { icon: Scale, label: "CDR Reduction Strategy", description: "Default aversion programs", q: "Our cohort default rate is approaching the threshold. What interventions are most effective at reducing CDR, and what are the consequences at 30% or 40%?" },
      { icon: Hash, label: "State Authorization", description: "Multi-state compliance for online programs", q: "What are our state authorization obligations for online programs delivered to students in other states? Walk me through SARA participation and what remains state-specific." },
      { icon: TrendingUp, label: "Teach-Out Planning", description: "Regulatory requirements if closing", q: "We may need to close a program or campus. What are the teach-out agreement requirements, student notification obligations, and Title IV close-out procedures?" },
      { icon: Landmark, label: "Accreditation & Title IV", description: "HEA linkage and risks", q: "How is accreditation linked to Title IV eligibility? What triggers ED scrutiny when an institution is on accreditor probation, and what are our obligations to notify ED?" },
      { icon: BookOpen, label: "FAFSA Simplification Impact", description: "Enrollment & packaging strategy", q: "How has FAFSA Simplification affected our enrollment strategy, financial aid packaging, and messaging to prospective students and families for 2025-26?" },
      { icon: DollarSign, label: "FWS Allocation Strategy", description: "Maximize work-study funding", q: "How should we optimize our Federal Work-Study allocation — which students qualify, how is the institution match calculated, and how do we maximize community service job requirements?" },
      { icon: Briefcase, label: "ED Rulemaking Tracker", description: "Pending 2025 regulations", q: "What significant ED rulemaking is pending or recently finalized for 2025-26? Include any items under reconsideration by the current administration." },
      { icon: CheckCircle, label: "IPEDS Compliance", description: "Reporting accuracy & penalties", q: "What are our IPEDS data submission obligations, what are the key data elements that receive ED scrutiny, and what are the penalties for inaccurate or late reporting?" },
      { icon: Receipt, label: "Endowment Aid Reporting", description: "Institutional grant transparency", q: "What are our institutional grant and endowment disclosure obligations under HEA Section 136, and how should we communicate institutional aid on student award notifications?" },
      { icon: Users, label: "Enrollment Management Linkage", description: "Aid strategy & net tuition revenue", q: "How should our financial aid strategy align with enrollment management goals to optimize net tuition revenue while maintaining access for low-income students?" },
      { icon: FileText, label: "AI Excel Spreadsheet", description: "Build FA reporting or analysis sheet", q: "Help me build an Excel-compatible spreadsheet for financial aid leadership reporting. Generate a fully structured spreadsheet with column headers, sample formulas, and data rows for an executive dashboard tracking Pell disbursements, R2T4 returns, CDR trends, and SAP evaluation rates by term. Format it so it can be pasted directly into Excel." },
      { icon: ClipboardList, label: "Clarify Audit Finding", description: "Plain-language regulatory explanation", q: "Please clarify this audit finding or regulatory requirement in plain language: identify the relevant 34 CFR citation, describe the likely root cause, and outline the corrective action steps an institution should take to resolve it." },
    ],
  },
  {
    role: "Auditors",
    color: "text-rose-400",
    items: [
      { icon: ShieldCheck, label: "FSA Audit Prep", description: "Compliance audit & program review", q: "Walk me through the most common FSA audit findings and how to prepare our financial aid office for an ED program review." },
      { icon: ClipboardList, label: "34 CFR Review", description: "Regulatory citations & findings", q: "What are the specific 34 CFR regulatory citations I should reference when auditing Return to Title IV compliance, and what GAGAS finding format should I use?" },
      { icon: BookOpen, label: "GAGAS Finding Template", description: "Criteria, condition, cause, effect", q: "Generate a GAGAS-format finding documentation template for an R2T4 compliance finding with criteria, condition, cause, effect, and recommendation." },
      { icon: Calculator, label: "R2T4 Testing Checklist", description: "Attribute-level audit steps", q: "Give me a complete testing attribute checklist for auditing R2T4 calculations including all key items to verify." },
    ],
    more: [
      { icon: FileText, label: "Single Audit Requirements", description: "Uniform Guidance & major programs", q: "Walk me through Single Audit Act requirements for higher education under OMB Uniform Guidance — how is the Type A/B threshold calculated, how are major programs determined, and what is required for Title IV?" },
      { icon: CheckCircle, label: "Student Status Audit", description: "Enrollment verification testing", q: "Describe the audit steps for testing student enrollment status changes and their effect on financial aid eligibility, including what NSLDS data to verify and what documentation to pull." },
      { icon: Hash, label: "Verification Sampling", description: "Statistical sampling methodology", q: "What statistical sampling methodologies are acceptable for testing verification compliance in a financial aid audit, and what error rates trigger a finding?" },
      { icon: ClipboardList, label: "Entrance Counseling Test", description: "Compliance attribute checklist", q: "Provide an attribute-level testing checklist for auditing loan entrance counseling compliance — what to verify, acceptable evidence, and relevant regulatory citation." },
      { icon: TrendingUp, label: "G5 Drawdown Testing", description: "Cash management documentation", q: "How do I test G5 drawdowns against disbursements for cash management compliance? What constitutes excess cash, what is the three-day rule, and how should findings be documented?" },
      { icon: Calculator, label: "COD Reconciliation Audit", description: "Origination vs. disbursement", q: "Walk me through the audit steps for testing COD reconciliation — what data to pull from COD vs. the SIS, what reconciling items are acceptable, and how to document unresolved differences." },
      { icon: DollarSign, label: "Credit Balance Testing", description: "Timing and student notification", q: "What are the audit procedures for testing credit balance compliance — timing of payment to students, authorization for holding, and permissible institutional charges?" },
      { icon: FileText, label: "Overpayment Recovery", description: "Tracking and ED reporting", q: "How do I audit an institution's overpayment recovery procedures? What triggers an overpayment, when must it be referred to ED, and what documentation should exist?" },
      { icon: Scale, label: "Program Review Prep", description: "ED on-site readiness guide", q: "Walk me through preparing for an ED program review — what documents to have ready, common areas of focus, how interviews are conducted, and what happens after the review." },
      { icon: ShieldCheck, label: "OIG Audit Alerts", description: "Fraud indicators and red flags", q: "What are the current OIG audit alerts and fraud risk indicators in financial aid? What red flags in student files should trigger additional testing procedures?" },
      { icon: Landmark, label: "IPEDS Data Accuracy", description: "Testing reported statistics", q: "How should an auditor test the accuracy of an institution's IPEDS data submissions? What financial aid data points receive the most scrutiny and how are discrepancies evaluated?" },
      { icon: Briefcase, label: "Internal Control Assessment", description: "COSO framework for FA office", q: "How should I document and test internal controls over the financial aid function using the COSO framework? What are the key control objectives and common control deficiencies?" },
      { icon: FileText, label: "Corrective Action Plan", description: "Draft CAP for repeat findings", q: "Help me draft a corrective action plan for a repeat material weakness in R2T4 processing — include root cause analysis, corrective steps, responsible party, and target completion date." },
      { icon: Hash, label: "90/10 Audit Steps", description: "Revenue percentage calculation test", q: "What are the specific audit steps for testing an institution's 90/10 calculation — what revenues to include or exclude, what documentation to verify, and what ED guidance applies?" },
      { icon: Award, label: "GAGAS Refresher", description: "Yellow Book 2024 independence rules", q: "What are the 2024 Yellow Book (GAGAS) updates relevant to financial aid audits, particularly the independence standards, documentation requirements, and peer review obligations?" },
    ],
  },
];

const COVERAGE_TOPICS = [
  "34 CFR Parts 600–690",
  "HEA Title IV",
  "FA Offer Letters (Any School)",
  "R2T4 Calculator",
  "FSA Compliance Audits",
  "ED Program Reviews",
  "OIG Audits & Investigations",
  "FAFSA Simplification Act",
  "One Big Beautiful Bill",
  "SAVE Plan & Litigation",
  "IRS Education Tax Credits",
  "State Aid (50 states)",
  "SAP Policies",
  "Loan Repayment & Forgiveness",
  "529 Plans & Tax Strategy",
  "Gainful Employment Rule",
];

const COVERAGE_TOPIC_PROMPTS: Record<string, string> = {
  "34 CFR Parts 600–690": "Give me an overview of 34 CFR Parts 600–690 and how they apply to Title IV financial aid administration.",
  "HEA Title IV": "Explain the key provisions of HEA Title IV and how they govern student financial aid programs.",
  "FA Offer Letters (Any School)": "Generate a sample financial aid offer letter template that complies with current ED guidance.",
  "R2T4 Calculator": "Walk me through a Return to Title IV (R2T4) calculation with a detailed example.",
  "FSA Compliance Audits": "What are the key areas FSA compliance audits typically focus on, and how should institutions prepare?",
  "ED Program Reviews": "What should we expect during an ED program review and how should we prepare our office?",
  "OIG Audits & Investigations": "What are OIG audit and investigation procedures for Title IV programs and how should institutions respond?",
  "FAFSA Simplification Act": "What are the major changes from the FAFSA Simplification Act and how do they affect financial aid processing?",
  "One Big Beautiful Bill": "What financial aid provisions are in the One Big Beautiful Bill and how might they impact students and institutions?",
  "SAVE Plan & Litigation": "What is the current status of the SAVE repayment plan and its ongoing litigation?",
  "IRS Education Tax Credits": "Explain the IRS education tax credits available to students and families, including the AOTC and LLC.",
  "State Aid (50 states)": "What state financial aid programs are available across all 50 states and how do they interact with federal aid?",
  "SAP Policies": "What are the requirements for Satisfactory Academic Progress (SAP) policies under Title IV?",
  "Loan Repayment & Forgiveness": "What federal student loan repayment plans and forgiveness programs are currently available?",
  "529 Plans & Tax Strategy": "How do 529 plans work and what tax strategies should students and families consider?",
  "Gainful Employment Rule": "What is the Gainful Employment Rule and what are the current compliance requirements for institutions?",
};

const FEDERAL_RESOURCES = [
  {
    group: "Students & Parents",
    links: [
      { name: "Federal Student Aid", url: "https://studentaid.gov" },
      { name: "FAFSA Application", url: "https://studentaid.gov/h/apply-for-aid/fafsa" },
      { name: "Loan Simulator", url: "https://studentaid.gov/loan-simulator" },
    ],
  },
  {
    group: "Administrators & Advisors",
    links: [
      { name: "FSA Handbook (IFAP)", url: "https://ifap.ed.gov/fsahandbook" },
      { name: "IFAP – ED Policy Guidance", url: "https://ifap.ed.gov" },
      { name: "NSLDS Professional Access", url: "https://nslds.ed.gov" },
      { name: "COD – Common Origination & Disbursement", url: "https://cod.ed.gov" },
      { name: "eCampus-Based (Campus-Based Aid)", url: "https://ecampusbased.ed.gov" },
      { name: "AskRegs – NASFAA Reg Q&A", url: "https://askregs.nasfaa.org" },
      { name: "studentaid.gov – Professionals", url: "https://studentaid.gov/help-center/answers/topic/professionals" },
      { name: "FSA Partner Connect", url: "https://fsapartners.ed.gov" },
      { name: "2025-26 Verification Guide (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/verification-guide" },
      { name: "2026-27 Verification Guide (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/verification-guide" },
    ],
    more: [
      { subcat: "Policy Guidance & Bulletins" },
      { name: "Dear Colleague Letters (DCL) – All Years", url: "https://ifap.ed.gov/dear-colleague-letters" },
      { name: "Dear Colleague Letters 2025-26", url: "https://ifap.ed.gov/dear-colleague-letters" },
      { name: "Dear Colleague Letters 2026-27", url: "https://ifap.ed.gov/dear-colleague-letters" },
      { name: "Electronic Announcement – IFAP", url: "https://ifap.ed.gov/electronic-announcements" },
      { subcat: "Systems & Software" },
      { name: "G5 – Grants Management System", url: "https://www.g5.gov" },
      { name: "SAIG Enrollment (TDClient)", url: "https://fsawebenroll.ed.gov" },
      { name: "EDExpress – FA Software", url: "https://fsapartners.ed.gov/knowledge-center/fsa-software/edexpress" },
      { name: "EdConnect – SAIG Transmission", url: "https://fsapartners.ed.gov/knowledge-center/fsa-software/edconnect" },
      { name: "FSA Training & Professional Development", url: "https://fsapartners.ed.gov/training-events" },
      { name: "FSA Data Center (FAFSA Data)", url: "https://studentaid.gov/data-center" },
      { subcat: "FAFSA & Verification" },
      { name: "CPS (Central Processing System) Info", url: "https://ifap.ed.gov" },
      { name: "SAR / ISIR Interpretation", url: "https://studentaid.gov/help-center/answers/topic/professionals" },
      { name: "FAFSA Simplification Act Resources", url: "https://fsapartners.ed.gov/knowledge-center/fafsa-simplification" },
      { name: "FAFSA Partner Toolkit", url: "https://studentaid.gov/help-center/answers/topic/outreach-and-resources" },
      { name: "Verification 2025-26 – IRS Tax Year 2023 Data", url: "https://ifap.ed.gov/ilibrary/document-type/verification-guide" },
      { name: "Verification 2026-27 – IRS Tax Year 2024 Data", url: "https://ifap.ed.gov/ilibrary/document-type/verification-guide" },
      { name: "IRS Data Retrieval Tool (FAFSA)", url: "https://studentaid.gov/help-center/answers/article/what-is-irs-data-retrieval-tool" },
      { subcat: "Loan Processing & Counseling" },
      { name: "MPN – Master Promissory Note", url: "https://studentaid.gov/mpn" },
      { name: "Entrance Counseling – studentaid.gov", url: "https://studentaid.gov/entrance-counseling" },
      { name: "Exit Counseling – studentaid.gov", url: "https://studentaid.gov/exit-counseling" },
      { name: "Direct Loan Aggregate Limits Guidance", url: "https://studentaid.gov/understand-aid/types/loans/subsidized-unsubsidized" },
      { name: "PLUS Loan Processing (COD)", url: "https://cod.ed.gov" },
      { name: "FSA Loan Origination & Disbursement (COD)", url: "https://cod.ed.gov" },
      { subcat: "Student File & Aid Processing" },
      { name: "Professional Judgment Guidance (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/professional-judgment" },
      { name: "Dependency Override Policy Guidance", url: "https://ifap.ed.gov" },
      { name: "Conflicting Information Policy (34 CFR 668.16)", url: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-668/subpart-B/section-668.16" },
      { name: "Consortium Agreement Guidance", url: "https://ifap.ed.gov" },
      { name: "Study Abroad Aid Processing", url: "https://ifap.ed.gov" },
      { name: "Unusual Enrollment History (UEH) Guidance", url: "https://ifap.ed.gov" },
      { name: "Transfer Monitoring – NSLDS", url: "https://nslds.ed.gov" },
      { name: "Homeless/Foster Youth (Unaccompanied Youth)", url: "https://studentaid.gov/help-center/answers/article/foster-youth-and-homeless-youth" },
      { name: "Incarcerated Students Initiative", url: "https://studentaid.gov/incarcerated" },
      { subcat: "SAP, R2T4 & Disbursement" },
      { name: "Satisfactory Academic Progress (SAP) Regulations", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-C" },
      { name: "R2T4 Policy & Worksheets (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/return-title-iv" },
      { name: "Disbursement Timing Rules (34 CFR 668.164)", url: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-668/subpart-K/section-668.164" },
      { name: "Award Year Crossover Guidance", url: "https://ifap.ed.gov" },
      { name: "Credit Balance Management (34 CFR 668.164(e))", url: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-668/subpart-K/section-668.164" },
      { subcat: "Grant & Aid Programs" },
      { name: "Campus-Based Aid Allocation", url: "https://ecampusbased.ed.gov" },
      { name: "FISAP Filing (ecampusbased.ed.gov)", url: "https://ecampusbased.ed.gov" },
      { name: "TEACH Grant Program", url: "https://studentaid.gov/teach-grant-program" },
      { name: "Iraq/Afghanistan Service Grant", url: "https://studentaid.gov/understand-aid/types/grants/iraq-afghanistan-service" },
      { name: "Federal Pell Grant Lifetime Eligibility", url: "https://studentaid.gov/understand-aid/types/grants/pell/calculate-eligibility" },
      { name: "Pell Grant LEU Tracking – NSLDS", url: "https://nslds.ed.gov" },
      { name: "AmeriCorps Segal Education Award Info", url: "https://americorps.gov/members-volunteers/segal-americorps-education-award" },
      { subcat: "Institutional Compliance" },
      { name: "Default Prevention Resources", url: "https://studentaid.gov/help-center/answers/topic/managing-repayment" },
      { name: "CDR – Cohort Default Rate Guide (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/cohort-default-rate-guide" },
      { name: "IPEDS Data Collection (NCES)", url: "https://nces.ed.gov/ipeds" },
      { name: "Gainful Employment Disclosure Tool", url: "https://studentaid.gov/gainful-employment" },
      { name: "90/10 Rule Guidance (HEA § 487(a)(24))", url: "https://ifap.ed.gov" },
      { name: "Financial Responsibility Standards (Composite Score)", url: "https://studentaid.gov/financialresponsibility" },
      { name: "Distance Education – Accreditation Guidance", url: "https://ifap.ed.gov" },
      { name: "Clock-to-Credit Hour Conversion", url: "https://ifap.ed.gov" },
      { name: "State Authorization Resources (NC-SARA)", url: "https://nc-sara.org" },
      { subcat: "IRS & Tax Resources" },
      { name: "IRS Get Transcript (Verification)", url: "https://www.irs.gov/individuals/get-transcript" },
      { name: "IRS Publication 970 – Tax Benefits for Education", url: "https://www.irs.gov/publications/p970" },
      { name: "IRS Form 1098-T (Tuition Statement)", url: "https://www.irs.gov/forms-pubs/about-form-1098-t" },
      { name: "IRS AOTC – American Opportunity Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/aotc" },
      { name: "IRS LLC – Lifetime Learning Credit", url: "https://www.irs.gov/credits-deductions/individuals/llc" },
      { name: "IRS Student Loan Interest Deduction", url: "https://www.irs.gov/taxtopics/tc456" },
      { name: "IRS Free File (Tax Years 2020–2024)", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free" },
      { name: "IRS Tax Return Transcripts (2020–2024)", url: "https://www.irs.gov/individuals/get-transcript" },
      { name: "IRS Form 4506-C (Transcript Request)", url: "https://www.irs.gov/forms-pubs/about-form-4506-c" },
      { name: "IRS EIN / ITIN for FAFSA", url: "https://www.irs.gov/individuals/individual-taxpayer-identification-number" },
      { subcat: "NASFAA & Professional Tools" },
      { name: "R2T4 Tracking Spreadsheet Template (NASFAA)", url: "https://www.nasfaa.org/tools_resources" },
      { name: "NASFAA Tools & Resources Library", url: "https://www.nasfaa.org/tools_resources" },
    ],
  },
  {
    group: "Leaders, Auditors & Compliance",
    links: [
      { name: "Federal Register – ED Rules & Regulations", url: "https://www.federalregister.gov/agencies/education-department" },
      { name: "U.S. Dept. of Education", url: "https://www.ed.gov" },
      { name: "NASFAA – National Assoc. of Student Financial Aid", url: "https://www.nasfaa.org" },
      { name: "ED Office of Inspector General (OIG)", url: "https://www2.ed.gov/about/offices/list/oig/index.html" },
      { name: "OIG Semiannual Report to Congress", url: "https://www2.ed.gov/about/offices/list/oig/semiann/index.html" },
      { name: "34 CFR Part 668 – Student Assistance General", url: "https://www.ecfr.gov/current/title-34/part-668" },
      { name: "34 CFR Part 685 – Direct Loan Program", url: "https://www.ecfr.gov/current/title-34/part-685" },
      { name: "34 CFR Part 690 – Federal Pell Grant Program", url: "https://www.ecfr.gov/current/title-34/part-690" },
      { name: "OMB Uniform Guidance (2 CFR Part 200)", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200" },
      { name: "GAO – Government Auditing Standards (Yellow Book)", url: "https://www.gao.gov/yellowbook" },
    ],
    more: [
      { subcat: "Federal Regulations (CFR)" },
      { name: "34 CFR Part 674 – Federal Perkins Loan", url: "https://www.ecfr.gov/current/title-34/part-674" },
      { name: "34 CFR Part 675 – Federal Work-Study", url: "https://www.ecfr.gov/current/title-34/part-675" },
      { name: "34 CFR Part 676 – FSEOG", url: "https://www.ecfr.gov/current/title-34/part-676" },
      { name: "34 CFR Part 682 – FFEL Program", url: "https://www.ecfr.gov/current/title-34/part-682" },
      { name: "34 CFR Part 692 – LEAP Program", url: "https://www.ecfr.gov/current/title-34/part-692" },
      { name: "34 CFR Part 99 – FERPA", url: "https://www.ecfr.gov/current/title-34/part-99" },
      { name: "HEA Title IV – Higher Education Act", url: "https://uscode.house.gov/browse/prelim@title20/chapter28&edition=prelim" },
      { name: "FSA 2025-26 Final Rules (Federal Register)", url: "https://www.federalregister.gov/agencies/education-department" },
      { name: "FSA 2026-27 Award Year Regulations (Federal Register)", url: "https://www.federalregister.gov/agencies/education-department" },
      { name: "2025-26 Verification Requirements (34 CFR 668 Subpart E)", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-E" },
      { name: "2026-27 Verification Requirements (34 CFR 668 Subpart E)", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-E" },
      { subcat: "Audit Standards" },
      { name: "Single Audit Act (31 U.S.C. § 7501)", url: "https://www.govinfo.gov/content/pkg/USCODE-2011-title31/pdf/USCODE-2011-title31-subtitleV-chap75.pdf" },
      { name: "AICPA – Audit Standards (SAS)", url: "https://www.aicpa.org/research/standards/auditattest/clarity.html" },
      { name: "FSA Audit Guide – Title IV", url: "https://www2.ed.gov/about/offices/list/oig/aireports/auditguide.html" },
      { name: "Program Review Protocols – FSA", url: "https://studentaid.gov/about/announcements/program-review" },
      { name: "OIG Audit Reports – Higher Education", url: "https://www2.ed.gov/about/offices/list/oig/aireports/aireports.html" },
      { name: "HEERF / CARES Act Audit Requirements", url: "https://www2.ed.gov/about/offices/list/oig/aireports/auditguide.html" },
      { subcat: "Institutional Compliance" },
      { name: "CDR Cohort Default Rate – National Data", url: "https://studentaid.gov/data-center/school/default" },
      { name: "90/10 Rule – HEA § 487(a)(24)", url: "https://ifap.ed.gov" },
      { name: "Composite Score / Financial Responsibility", url: "https://studentaid.gov/financialresponsibility" },
      { name: "Letters of Credit – ED Financial Standards", url: "https://studentaid.gov/financialresponsibility" },
      { name: "Gainful Employment Regulations (2023)", url: "https://www.federalregister.gov/documents/2023/10/30/2023-23715/programs-leading-to-gainful-employment" },
      { name: "Borrower Defense Regulations", url: "https://www.federalregister.gov/agencies/education-department" },
      { name: "Program Integrity Rules (34 CFR 668)", url: "https://www.ecfr.gov/current/title-34/part-668" },
      { name: "Cash Management Rules (34 CFR 668.162–164)", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-K" },
      { name: "IPEDS Reporting (NCES)", url: "https://nces.ed.gov/ipeds" },
      { name: "FERPA – Family Educational Rights & Privacy", url: "https://studentprivacy.ed.gov" },
      { subcat: "Statutory Compliance" },
      { name: "Foreign Gift Reporting (HEA § 117)", url: "https://www.ed.gov/about/offices/list/ope/foreigngifts.html" },
      { name: "Clery Act Compliance", url: "https://www2.ed.gov/admins/lead/safety/campus.html" },
      { name: "Drug-Free Schools & Communities Act", url: "https://www2.ed.gov/policy/elsec/guid/secletter/120725.html" },
      { name: "Title IX Compliance – ED OCR", url: "https://www2.ed.gov/about/offices/list/ocr/docs/tix_dis.html" },
      { name: "ADA Compliance in Higher Education", url: "https://www.ada.gov" },
      { name: "HEOA – Higher Education Opportunity Act", url: "https://www.congress.gov/110/plaws/publ315/PLAW-110publ315.pdf" },
      { name: "Emergency Aid – COVID Relief Reporting", url: "https://www2.ed.gov/about/offices/list/ope/caresact.html" },
      { subcat: "Minority & Specialized Institutions" },
      { name: "Title III – HBCUs & Strengthening Institutions", url: "https://www.ed.gov/about/offices/list/ope/idues/index.html" },
      { name: "Title V – Hispanic-Serving Institutions", url: "https://www.ed.gov/about/offices/list/ope/idues/index.html" },
      { name: "MSI – Minority Serving Institutions", url: "https://www.ed.gov/about/offices/list/ope/idues/index.html" },
      { name: "State Authorization – NC-SARA", url: "https://nc-sara.org" },
      { name: "Accreditation Recognition Database (DAPIP)", url: "https://ope.ed.gov/dapip" },
      { subcat: "Professional Standards & Ethics" },
      { name: "NASFAA Standards of Excellence (SOE)", url: "https://www.nasfaa.org/SOE" },
      { name: "NASFAA Code of Ethics & Professional Standards", url: "https://www.nasfaa.org/professional_standards" },
      { name: "NASFAA AskRegs – Compliance Q&A", url: "https://askregs.nasfaa.org" },
      { name: "FSA Modernization – FUTURE Act", url: "https://fsapartners.ed.gov/knowledge-center/fafsa-simplification" },
      { name: "Congressional Research Service – Higher Ed Reports", url: "https://crsreports.congress.gov" },
      { subcat: "Recovery, Controls & Governance" },
      { name: "Overpayment Recovery – NSLDS", url: "https://nslds.ed.gov" },
      { name: "Title IV Reconciliation Guidance", url: "https://cod.ed.gov" },
      { name: "Internal Controls – 2 CFR 200.303", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.303" },
      { name: "Allowable Costs – 2 CFR 200.420-.476", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E" },
      { name: "Questioned Costs & Findings – 2 CFR 200.516", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-F/section-200.516" },
      { name: "Corrective Action Plans – OIG Guidance", url: "https://www2.ed.gov/about/offices/list/oig/aireports/aireports.html" },
      { name: "FSA Access – MyFSAID Account Management", url: "https://fsaid.ed.gov" },
      { name: "SAIG Mailbox Management & Security", url: "https://fsawebenroll.ed.gov" },
      { subcat: "IRS & Tax" },
      { name: "IRS Publication 970 – Tax Benefits for Education", url: "https://www.irs.gov/publications/p970" },
      { name: "IRS AOTC Audit Compliance (Institutions)", url: "https://www.irs.gov/credits-deductions/individuals/aotc" },
      { name: "IRS Form 1098-T Reporting Requirements", url: "https://www.irs.gov/forms-pubs/about-form-1098-t" },
      { name: "IRS Tax Filing 2020 – Resources Archive", url: "https://www.irs.gov/filing" },
      { name: "IRS Tax Filing 2021 – Resources Archive", url: "https://www.irs.gov/filing" },
      { name: "IRS Tax Filing 2022 – Resources Archive", url: "https://www.irs.gov/filing" },
      { name: "IRS Tax Filing 2023 – Resources Archive", url: "https://www.irs.gov/filing" },
      { name: "IRS Tax Filing 2024 – Current Year Guide", url: "https://www.irs.gov/filing" },
      { name: "IRS Get Transcript (All Tax Years)", url: "https://www.irs.gov/individuals/get-transcript" },
      { name: "IRS Form 4506-C – Transcript for Third Parties", url: "https://www.irs.gov/forms-pubs/about-form-4506-c" },
      { subcat: "Privacy & Digital Security" },
      { name: "GLBA – Gramm-Leach-Bliley Cybersecurity (FTC)", url: "https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act" },
      { name: "COPPA Compliance (Children Under 13)", url: "https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy" },
      { name: "CCPA – California Consumer Privacy Act", url: "https://oag.ca.gov/privacy/ccpa" },
    ],
  },
  {
    group: "Private Loan Administrator Portals",
    links: [
      { name: "ELMOne (ELM Resources)", url: "https://www.elmresources.com" },
      { name: "Sallie Mae School Portal", url: "https://www.salliemae.com/college-financial-aid" },
      { name: "Tuition Options", url: "https://www.tuitionoptions.com" },
      { name: "COD – Common Origination & Disbursement", url: "https://cod.ed.gov" },
      { name: "Nelnet Campus Commerce", url: "https://nelnetcampuscommerce.com" },
      { name: "MOHELA Servicer Portal", url: "https://www.mohela.com" },
      { name: "Aidvantage Servicer", url: "https://aidvantage.com" },
      { name: "College Ave School Services", url: "https://www.collegeavestudentloans.com/partner" },
      { name: "Firstmark Services", url: "https://www.firstmarkservices.com" },
      { name: "PHEAA / AES Servicer", url: "https://www.aessuccess.org" },
      { name: "EdFinancial Services", url: "https://edfinancial.com" },
    ],
  },
  {
    group: "Health Wellness Support",
    links: [
      { name: "OSHA — Workplace Stress & Mental Health", url: "https://www.osha.gov/workplace-stress" },
      { name: "CDC — Workplace Health Promotion", url: "https://www.cdc.gov/workplacehealthpromotion" },
      { name: "NIOSH — Total Worker Health Program", url: "https://www.cdc.gov/niosh/twh" },
      { name: "SAMHSA — Workplace Behavioral Health", url: "https://www.samhsa.gov/workplace" },
      { name: "EEOC — Mental Health in the Workplace", url: "https://www.eeoc.gov/laws/guidance/depression-ptsd-other-mental-health-conditions-workplace-you-have-rights" },
      { name: "OPM — Employee Assistance Programs (EAP)", url: "https://www.opm.gov/policy-data-oversight/worklife/employee-assistance-programs" },
      { name: "DOL — FMLA & Mental Health Leave", url: "https://www.dol.gov/agencies/whd/fmla" },
      { name: "APA — Psychologically Healthy Workplace", url: "https://www.apaexcellence.org" },
      { name: "NAMI — Mental Health in the Workplace", url: "https://www.nami.org/Your-Journey/Identity-and-Cultural-Dimensions/Mental-Health-in-the-Workplace" },
      { name: "WHO — Mental Health in the Workplace", url: "https://www.who.int/teams/mental-health-and-substance-use/promotion-prevention/mental-health-in-the-workplace" },
    ],
    more: [
      { subcat: "Workplace Mental Health" },
      { name: "Mental Health First Aid — Workplace Training", url: "https://www.mentalhealthfirstaid.org/apply/workplace" },
      { name: "One Mind at Work — Employer Pledge", url: "https://onemindatwork.org" },
      { name: "Mind Share Partners — Employer Resources", url: "https://www.mindsharepartners.org" },
      { name: "EAPA — Employee Assistance Professionals Assoc.", url: "https://www.eapassn.org" },
      { name: "SHRM — Employee Mental Health & Wellness", url: "https://www.shrm.org/topics-tools/topics/employee-relations/mental-health" },
      { subcat: "Disability & Accommodations" },
      { name: "ADA.gov — Reasonable Workplace Accommodations", url: "https://www.ada.gov/employment/employ.htm" },
      { name: "Job Accommodation Network (JAN)", url: "https://askjan.org" },
      { name: "EEOC — ADA & Psychiatric Disabilities FAQs", url: "https://www.eeoc.gov/laws/guidance/questions-and-answers-clarifications-application-ada-psychiatric-disabilities" },
      { name: "ADA National Network — Workplace Accommodation", url: "https://adata.org" },
      { subcat: "Crisis & Immediate Support" },
      { name: "988 Suicide & Crisis Lifeline", url: "https://988lifeline.org" },
      { name: "Crisis Text Line — Text HOME to 741741", url: "https://www.crisistextline.org" },
      { name: "SAMHSA National Helpline — 1-800-662-4357", url: "https://www.samhsa.gov/find-help/national-helpline" },
      { subcat: "Clinical & Mental Health" },
      { name: "NIMH — Caring for Your Mental Health", url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health" },
      { name: "ADAA — Workplace Anxiety & Depression", url: "https://adaa.org/living-with-anxiety/workplace" },
      { name: "DBSA — Working Well Employee Resources", url: "https://www.dbsalliance.org/wellness/working-well" },
      { name: "TIAA — Financial Wellness & Mental Health", url: "https://www.tiaa.org/public/institute/research/wellness" },
      { name: "SAMHSA — Trauma-Informed Workplace Care", url: "https://www.samhsa.gov/trauma-violence" },
      { name: "SAMHSA — Strategic Prevention Framework", url: "https://www.samhsa.gov/prevention" },
      { name: "NAADAC — Addiction Counselors in the Workplace", url: "https://www.naadac.org" },
      { name: "American Institute of Stress — Workplace", url: "https://www.stress.org/workplace-stress" },
      { name: "NAMI — Workplace Mental Health Resources", url: "https://www.nami.org" },
      { name: "NBCC — Counselor Certification Board", url: "https://www.nbcc.org" },
      { name: "NASW — Social Work & Workplace Health", url: "https://www.socialworkers.org/Practice/Mental-Health" },
      { subcat: "Suicide Prevention" },
      { name: "LivingWorks — ASIST Suicide Intervention", url: "https://www.livingworks.net/asist" },
      { name: "QPR Institute — Suicide Prevention Training", url: "https://qprinstitute.com" },
      { name: "safeTALK — Suicide Alertness for Everyone", url: "https://www.livingworks.net/safetalk" },
      { name: "AFSP — Workplace Suicide Prevention", url: "https://afsp.org/programs/workplace" },
      { subcat: "Wellness Organizations & Research" },
      { name: "National Safety Council — Employee Wellbeing", url: "https://www.nsc.org/workplace/safety-topics/employee-wellness" },
      { name: "Business Group on Health — Employer MH", url: "https://www.businessgrouphealth.org/resources/mental-health" },
      { name: "WELCOA — Wellness Council of America", url: "https://www.welcoa.org" },
      { name: "HERO — Health Enhancement Research Org.", url: "https://hero-health.org" },
      { name: "National Wellness Institute", url: "https://nationalwellness.org" },
      { name: "IFEBP — Employee Benefit Plans Foundation", url: "https://www.ifebp.org" },
      { name: "ACOEM — Occupational Medicine & Wellness", url: "https://acoem.org" },
      { name: "ILO — Mental Health at Work", url: "https://www.ilo.org/global/topics/safety-and-health-at-work" },
      { name: "OPM — Work-Life Balance Programs", url: "https://www.opm.gov/policy-data-oversight/worklife" },
      { name: "DOL — Workplace Safety & Health Resources", url: "https://www.dol.gov/general/topic/safety-health" },
      { name: "National Council for Mental Wellbeing", url: "https://www.thenationalcouncil.org" },
      { name: "MHWorks — National Council Workplace Program", url: "https://www.thenationalcouncil.org/mental-health-works" },
      { subcat: "Research & Policy Insights" },
      { name: "OSHA — Preventing Workplace Violence", url: "https://www.osha.gov/workplace-violence" },
      { name: "Gallup — Employee Wellbeing Index", url: "https://www.gallup.com/workplace/employee-wellbeing.aspx" },
      { name: "APA — Work, Stress & Health Resources", url: "https://www.apa.org/health/work" },
      { name: "McKinsey — Workplace Mental Health Insights", url: "https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/reframing-employee-health-moving-beyond-burnout-to-holistic-health" },
      { name: "HBR — Work & Mental Health Collection", url: "https://hbr.org/topic/subject/mental-health" },
      { name: "CDC — Violence Prevention in the Workplace", url: "https://www.cdc.gov/violenceprevention/index.html" },
      { name: "CIPD — Work & Mental Health Research", url: "https://www.cipd.org/uk/knowledge/factsheets/mental-health-factsheet" },
      { subcat: "Digital Wellness Platforms" },
      { name: "Lyra Health — Employer Mental Health Benefits", url: "https://lyrahealth.com" },
      { name: "Spring Health — Workplace Mental Health", url: "https://springhealth.com" },
      { name: "Modern Health — Employee Mental Health Platform", url: "https://modernhealth.com" },
      { name: "Headspace for Work — Mindfulness at Work", url: "https://work.headspace.com" },
      { name: "Calm for Business — Workplace Wellness", url: "https://business.calm.com" },
      { name: "Talkspace for Business — Employee Therapy", url: "https://www.talkspace.com/business" },
      { name: "NIH — Employee Wellness Program Model", url: "https://hr.nih.gov/benefits-and-wellness/wellness" },
    ] as MaybeSubcat[],
  },
  {
    group: "Spiritual Care & Life",
    links: [
      { name: "Interfaith Youth Core (IFYC)", url: "https://ifyc.org" },
      { name: "Parliament of World Religions", url: "https://parliamentofreligions.org" },
      { name: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu" },
      { name: "Internet Encyclopedia of Philosophy", url: "https://iep.utm.edu" },
      { name: "Greater Good Science Center — UC Berkeley", url: "https://greatergood.berkeley.edu" },
      { name: "Markkula Center for Applied Ethics — SCU", url: "https://www.scu.edu/ethics" },
      { name: "Ethics Unwrapped — UT Austin", url: "https://ethicsunwrapped.utexas.edu" },
      { name: "Hillel International — Jewish Campus Life", url: "https://www.hillel.org" },
      { name: "Catholic Campus Ministry Assoc. (CCMA)", url: "https://www.ccmanet.org" },
      { name: "Muslim Students Association — National", url: "https://msanational.org" },
    ],
    more: [
      { subcat: "Campus Ministry" },
      { name: "InterVarsity Christian Fellowship", url: "https://intervarsity.org" },
      { name: "Campus Crusade for Christ (CRU)", url: "https://www.cru.org" },
      { name: "Wesley Foundation — Methodist Campus", url: "https://gbhem.org/campus-ministry" },
      { name: "Chi Alpha Campus Ministries", url: "https://chialpha.com" },
      { name: "Campus Ministry Today", url: "https://campusministrytoday.org" },
      { subcat: "Diverse Faith Traditions" },
      { name: "Greek Orthodox Campus Ministry", url: "https://www.goarch.org" },
      { name: "Unitarian Universalist Campus Ministry", url: "https://www.uua.org/lgbtq/youth/campus" },
      { name: "Secular Student Alliance", url: "https://www.secularstudents.org" },
      { name: "Islamic Online University", url: "https://www.islamiconlineuniversity.com" },
      { name: "IFYC — Interfaith Campus Research", url: "https://ifyc.org/research" },
      { subcat: "Philosophy & Meaning" },
      { name: "Daily Stoic — Staff Resilience", url: "https://dailystoic.com" },
      { name: "Modern Stoicism", url: "https://modernstoicism.com" },
      { name: "The School of Life — Life Philosophy", url: "https://www.theschooloflife.com" },
      { name: "Viktor Frankl — Logotherapy & Purpose", url: "https://www.viktorfrankl.org" },
      { subcat: "Psychology of Flourishing" },
      { name: "Self-Compassion — Kristin Neff", url: "https://self-compassion.org" },
      { name: "Brené Brown — Courage & Vulnerability", url: "https://brenebrown.com" },
      { name: "Positive Psychology Center — Penn", url: "https://www.authentichappiness.sas.upenn.edu" },
      { name: "VIA Character Strengths Survey", url: "https://www.viacharacter.org" },
      { name: "Harvard Human Flourishing Program", url: "https://hwpi.harvard.edu/humanflourishingprogram" },
      { name: "Character Lab — Character Research", url: "https://characterlab.org" },
      { name: "Growth Mindset — Carol Dweck", url: "https://www.mindsetonline.com" },
      { name: "Grit Scale — Angela Duckworth", url: "https://angeladuckworth.com" },
      { subcat: "Contemplative Practice" },
      { name: "Center for Contemplative Mind in Society", url: "https://www.contemplativemind.org" },
      { name: "Fetzer Institute — Love & Forgiveness", url: "https://fetzer.org" },
      { name: "Spirituality & Practice", url: "https://www.spiritualityandpractice.com" },
      { name: "Mindful.org — Mindfulness in Education", url: "https://www.mindful.org/mindfulness-in-higher-education" },
      { name: "UMass MBSR — Mindfulness Research", url: "https://www.umassmed.edu/cfm" },
      { name: "Brown Contemplative Studies Program", url: "https://www.brown.edu/academics/contemplative-studies" },
      { name: "Mindfulness in Higher Education Network", url: "https://mindfuleducation.net" },
      { name: "Association for Contemplative Mind in Higher Ed", url: "https://www.contemplativemind.org/programs/acmhe" },
      { name: "Institute for Mindful Leadership", url: "https://instituteformindfulleadership.org" },
      { subcat: "Character & Purpose" },
      { name: "Courage & Renewal — Parker Palmer", url: "https://couragerenewal.org" },
      { name: "Appreciative Inquiry Commons", url: "https://appreciativeinquiry.champlain.edu" },
      { name: "Positive Organizational Scholarship", url: "https://positiveorgs.bus.umich.edu" },
      { name: "Human Dignity — Witherspoon Institute", url: "https://www.winst.org" },
      { name: "On Being — Krista Tippett", url: "https://onbeing.org" },
      { name: "Philosophy Now — For Educators", url: "https://philosophynow.org" },
      { name: "MIT OCW Philosophy", url: "https://ocw.mit.edu/search/?d=Philosophy" },
      { name: "Yale OCW — Death & Philosophy", url: "https://oyc.yale.edu/death/phil-176" },
      { subcat: "Higher Ed & Student Affairs" },
      { name: "NACADA — Advising Students of Faith", url: "https://www.nacada.ksu.edu" },
      { name: "NASPA — Spirituality & Faith in Student Affairs", url: "https://www.naspa.org/constituent-groups/kcs/spirituality" },
      { name: "ACPA — Spirituality in Higher Ed", url: "https://myacpa.org" },
      { name: "ACE — Religion in Higher Education", url: "https://www.acenet.edu" },
      { name: "Campus Compact — Community & Service", url: "https://compact.org" },
      { name: "Journal of College & Character", url: "https://www.tandfonline.com/toc/ujcc20/current" },
      { name: "Patheos — Faith in Higher Education", url: "https://www.patheos.com/channels/higheredprofessor" },
      { name: "Religion News Service — Campus Religion", url: "https://religionnews.com/category/campus" },
      { subcat: "Academic Research" },
      { name: "Association for the Sociology of Religion", url: "https://www.sociologyofreligion.com" },
      { name: "American Academy of Religion", url: "https://www.aarweb.org" },
      { name: "Society for the Scientific Study of Religion", url: "https://www.sssrweb.org" },
      { name: "Harvard Divinity School — Resources", url: "https://hds.harvard.edu" },
      { name: "Fuller Theological Seminary", url: "https://fuller.edu" },
      { name: "Duke Divinity School — Resources", url: "https://divinity.duke.edu" },
      { name: "Yale Divinity School", url: "https://divinity.yale.edu" },
      { name: "Gordon-Conwell Theological Seminary", url: "https://www.gordonconwell.edu" },
      { name: "Jewish Theological Seminary", url: "https://www.jtsa.edu" },
      { subcat: "Faith, Ideas & Religious Freedom" },
      { name: "Veritas Forum — Faith & Ideas", url: "https://www.veritas.org" },
      { name: "Q Ideas — Christian Thought Leadership", url: "https://qideas.org" },
      { name: "BioLogos — Faith & Science", url: "https://biologos.org" },
      { name: "Reasons to Believe — Apologetics", url: "https://reasons.org" },
      { name: "Liberty University — Faith Integration", url: "https://www.liberty.edu" },
      { name: "WorldViews in Conflict — Wheaton College", url: "https://www.wheaton.edu" },
      { name: "Civic Responsibility & Religious Freedom — FIRE", url: "https://www.thefire.org/issues/religious-liberty" },
      { name: "Becket Fund — Religious Freedom Law", url: "https://www.becketlaw.org" },
      { name: "First Amendment — Religious Expression on Campus", url: "https://www.thefire.org/rights/first-amendment" },
      { name: "Ethics & Religious Liberty Commission", url: "https://erlc.com" },
    ] as MaybeSubcat[],
  },
  {
    group: "Student Rights & Consumer Protections",
    links: [
      { name: "CFPB — Consumer Financial Protection Bureau", url: "https://www.consumerfinance.gov" },
      { name: "CFPB — File a Complaint", url: "https://www.consumerfinance.gov/complaint" },
      { name: "FTC — Consumer Reporting Portal", url: "https://reportfraud.ftc.gov" },
      { name: "ED OIG — Report Fraud/Waste/Abuse", url: "https://www2.ed.gov/about/offices/list/oig/hotline.html" },
      { name: "ED OCR — File Civil Rights Complaint", url: "https://www2.ed.gov/about/offices/list/ocr/complaintintro.html" },
      { name: "OSHA Whistleblower Protection Program", url: "https://www.whistleblowers.gov" },
      { name: "OSC — Office of Special Counsel", url: "https://osc.gov" },
      { name: "DOJ — False Claims Act / Qui Tam", url: "https://www.justice.gov/civil/frauds-section" },
      { name: "FSA Ombudsman — Student Loan Disputes", url: "https://studentaid.gov/feedback-center" },
      { name: "Borrower Defense to Repayment (ED)", url: "https://studentaid.gov/borrower-defense" },
    ],
    more: [
      { subcat: "Whistleblower Resources" },
      { name: "Government Accountability Project", url: "https://whistleblower.org" },
      { name: "National Whistleblower Center", url: "https://www.whistleblowers.org" },
      { name: "Taxpayers Against Fraud — False Claims Act", url: "https://www.taf.org" },
      { name: "Project on Government Oversight (POGO)", url: "https://www.pogo.org" },
      { name: "Whistleblower Aid — Legal Support", url: "https://whistlebloweraid.org" },
      { name: "GAO — Federal Whistleblower Resources", url: "https://www.gao.gov/legal/other-legal-work/whistleblower-protection" },
      { name: "Inspector General Network — Whistleblower", url: "https://www.ignet.gov/content/whistleblower-protection-resources" },
      { name: "SEC Whistleblower Program", url: "https://www.sec.gov/whistleblower" },
      { name: "CFTC Whistleblower Program", url: "https://www.cftc.gov/whistleblower" },
      { subcat: "Digital Privacy & Security" },
      { name: "EFF — Electronic Frontier Foundation", url: "https://www.eff.org" },
      { name: "EFF — Surveillance Self-Defense", url: "https://ssd.eff.org" },
      { name: "SecureDrop — Anonymous Tips to Media", url: "https://securedrop.org" },
      { name: "GlobalLeaks — Secure Whistleblowing", url: "https://www.globaleaks.org" },
      { name: "Signal — Encrypted Communication", url: "https://signal.org" },
      { name: "ProtonMail — Anonymous Encrypted Email", url: "https://proton.me" },
      { name: "Tor Project — Anonymous Browsing", url: "https://www.torproject.org" },
      { name: "FOIA — Freedom of Information Act", url: "https://www.foia.gov" },
      { name: "PrivacyRights.org — Consumer Data Rights", url: "https://privacyrights.org" },
      { name: "FERPA — Student Privacy Rights", url: "https://studentprivacy.ed.gov" },
      { name: "CCPA — California Consumer Privacy Act", url: "https://oag.ca.gov/privacy/ccpa" },
      { name: "EPIC — Electronic Privacy Info Center", url: "https://epic.org" },
      { subcat: "Student Loan Borrower Rights" },
      { name: "NCLC — Student Loan Borrower Rights", url: "https://www.nclc.org/issues/student-loans.html" },
      { name: "TICAS — College Access & Student Rights", url: "https://ticas.org" },
      { name: "CFPB — Know Before You Owe", url: "https://www.consumerfinance.gov/paying-for-college" },
      { name: "Gainful Employment Disclosure Tool", url: "https://studentaid.gov/gainful-employment" },
      { name: "90/10 Rule Consumer Protection", url: "https://studentaid.gov" },
      { name: "School Closure Discharge (ED)", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/closed-school" },
      { name: "False Certification Discharge (ED)", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/false-certification" },
      { subcat: "Consumer Protection & Fraud Prevention" },
      { name: "Public Citizen — Consumer Advocacy", url: "https://www.citizen.org" },
      { name: "National Consumer Law Center", url: "https://www.nclc.org" },
      { name: "FTC — Scholarship & FA Scam Alerts", url: "https://consumer.ftc.gov/articles/scholarship-and-financial-aid-scams" },
      { name: "USA.gov — Student Aid Scam Resources", url: "https://www.usa.gov/student-aid-scams" },
      { name: "College Scorecard — School Verification", url: "https://collegescorecard.ed.gov" },
      { name: "DAPIP — Accreditation Database", url: "https://ope.ed.gov/dapip" },
      { name: "Diploma Mill Awareness — ED", url: "https://www.ed.gov/accreditation" },
      { name: "IRS — Tax Scams & Fraud Alerts", url: "https://www.irs.gov/newsroom/tax-scams-consumer-alerts" },
      { name: "FBI — Financial Crime Reporting", url: "https://www.fbi.gov/investigate/white-collar-crime/financial-crimes" },
      { name: "IC3 — Internet Crime Complaint Center", url: "https://www.ic3.gov" },
      { name: "BBB — Better Business Bureau Complaints", url: "https://www.bbb.org" },
      { name: "USA.gov — Consumer Complaint Resources", url: "https://www.usa.gov/consumer-complaints" },
      { name: "AARP Fraud Watch Network", url: "https://www.aarp.org/money/scams-fraud" },
      { name: "FTC Identity Theft Resources", url: "https://www.identitytheft.gov" },
      { name: "Identity Theft Resource Center", url: "https://www.idtheftcenter.org" },
      { subcat: "Legal Aid & Civil Rights" },
      { name: "LawHelp.org — Legal Aid by State", url: "https://www.lawhelp.org" },
      { name: "LSC — Legal Services Corporation", url: "https://www.lsc.gov" },
      { name: "ABA — Free Legal Answers", url: "https://www.lawhelp.org" },
      { name: "EEOC — File Discrimination Complaint", url: "https://www.eeoc.gov/filing-charge-discrimination" },
      { name: "DOJ — ADA Disability Rights Complaints", url: "https://www.ada.gov/filing-a-complaint" },
      { name: "HUD — Housing Discrimination Complaints", url: "https://www.hud.gov/topics/housing_discrimination" },
      { name: "ACLU — Know Your Rights", url: "https://www.aclu.org/know-your-rights" },
      { name: "NAACP Legal Defense Fund", url: "https://www.naacpldf.org" },
      { name: "Asian Americans Advancing Justice", url: "https://www.advancingjustice-aajc.org" },
      { name: "MALDEF — Latino Civil Rights", url: "https://maldef.org" },
      { subcat: "Financial Regulation & Banking" },
      { name: "NCUA — Credit Union Consumer Resources", url: "https://www.ncua.gov/consumers" },
      { name: "OCC — National Bank Customer Assistance", url: "https://www.helpwithmybank.gov" },
      { name: "FDIC — Consumer Resources", url: "https://www.fdic.gov/consumers" },
      { name: "Federal Reserve — Consumer Resources", url: "https://www.federalreserve.gov/consumerscommunities.htm" },
      { name: "FINRA — Investor Complaint Center", url: "https://www.finra.org/investors/have-problem/file-complaint" },
      { name: "SEC — Investor Complaint Center", url: "https://investor.gov" },
      { subcat: "Media, Oversight & Professional Standards" },
      { name: "State AG — Consumer Protection Finder", url: "https://www.naag.org/find-my-ag" },
      { name: "Reporters Without Borders", url: "https://rsf.org" },
      { name: "Reporter's Committee for Freedom of Press", url: "https://www.rcfp.org" },
      { name: "HHS OIG — Report Fraud Hotline", url: "https://oig.hhs.gov/fraud/report-fraud" },
      { name: "NASFAA — Ethical Standards & Complaints", url: "https://www.nasfaa.org/professional_standards" },
    ] as MaybeSubcat[],
  },
];

const SCHOLARSHIP_ENGINES = [
  { name: "Scholarships.com", url: "https://www.scholarships.com" },
  { name: "Fastweb", url: "https://www.fastweb.com" },
  { name: "BigFuture (College Board)", url: "https://bigfuture.collegeboard.org/scholarship-search" },
  { name: "Cappex", url: "https://www.cappex.com" },
  { name: "College Raptor", url: "https://www.collegeraptor.com/scholarships" },
];
const SCHOLARSHIP_ENGINES_MORE: MaybeSubcat[] = [
  { subcat: "General Search Engines" },
  { name: "Going Merry", url: "https://www.goingmerry.com" },
  { name: "Bold.org", url: "https://bold.org/scholarships" },
  { name: "Unigo", url: "https://www.unigo.com" },
  { name: "Niche Scholarships", url: "https://www.niche.com/colleges/scholarships" },
  { name: "Peterson's Scholarship Search", url: "https://www.petersons.com/scholarship-search" },
  { name: "CollegeXpress", url: "https://www.collegexpress.com" },
  { name: "SuperCollege", url: "https://www.supercollege.com" },
  { name: "Raise.me (Micro-Scholarships)", url: "https://www.raise.me" },
  { name: "Scholarships.gov", url: "https://www.scholarships.gov" },
  { name: "Scholarship Owl", url: "https://scholarshipowl.com" },
  { name: "Scholly", url: "https://myscholly.com" },
  { name: "College Greenlight", url: "https://www.collegegreenlight.com" },
  { name: "Sallie Mae Scholarships", url: "https://www.salliemae.com/college-planning/scholarships" },
  { name: "Chegg Scholarships", url: "https://www.chegg.com/scholarships" },
  { name: "Student Scholarship Search", url: "https://www.studentscholarshipsearch.com" },
  { subcat: "Prestigious Programs" },
  { name: "QuestBridge", url: "https://www.questbridge.org" },
  { name: "Jack Kent Cooke Foundation", url: "https://www.jkcf.org" },
  { name: "Gates Scholarship", url: "https://www.thegatesscholarship.org" },
  { name: "Dell Scholars Program", url: "https://www.dellscholars.org" },
  { name: "Coca-Cola Scholars Foundation", url: "https://www.coca-colascholarsfoundation.org" },
  { name: "Elks National Foundation", url: "https://www.elks.org/scholars" },
  { name: "Davidson Fellows Scholarship", url: "https://www.davidsongifted.org/fellows-scholarship" },
  { name: "Rotary Foundation Scholarships", url: "https://www.rotary.org/en/our-programs/scholarships" },
  { name: "Horatio Alger Scholarship", url: "https://scholars.horatioalger.org" },
  { name: "Ron Brown Scholar Program", url: "https://www.ronbrown.org" },
  { name: "Posse Foundation", url: "https://www.possefoundation.org" },
  { name: "Questbridge College Prep", url: "https://www.questbridge.org/college-prep-scholars" },
  { name: "American Legion Scholarships", url: "https://www.legion.org/scholarships" },
  { name: "Regeneron Science Talent Search", url: "https://www.societyforscience.org/regeneron-sts" },
  { name: "Google Generation Scholarship", url: "https://buildyourfuture.withgoogle.com/scholarships" },
  { subcat: "Diversity & Inclusion" },
  { name: "Hispanic Scholarship Fund", url: "https://www.hsf.net" },
  { name: "United Negro College Fund (UNCF)", url: "https://uncf.org/scholarships" },
  { name: "American Indian College Fund", url: "https://collegefund.org" },
  { name: "Asian & Pacific Islander Scholarship Fund", url: "https://apiascholars.org" },
  { name: "TheDream.US (DACA Students)", url: "https://www.thedream.us" },
  { name: "National Black MBA Association", url: "https://nbmbaa.org/scholarships" },
  { name: "Congressional Hispanic Caucus Institute", url: "https://chci.org/scholarships" },
  { name: "National Urban League Scholarships", url: "https://nulscholarship.org" },
  { name: "AAHHE Graduate Fellowships", url: "https://www.aahhe.org" },
  { name: "National Association of Black Journalists", url: "https://www.nabj.org/scholarships" },
  { name: "Point Foundation (LGBTQ+)", url: "https://pointfoundation.org" },
  { name: "Pride Foundation Scholarships", url: "https://pridefoundation.org/scholarships" },
  { name: "NAACP Scholarships", url: "https://naacp.org/find-resources/scholarships-awards-internships" },
  { name: "Esperanza Education Fund", url: "https://www.esperanzaeducationfund.org" },
  { name: "Native Forward Scholars Fund", url: "https://nativeforward.org" },
  { subcat: "Women's Scholarships" },
  { name: "American Association of University Women (AAUW)", url: "https://www.aauw.org/resources/programs/fellowships-grants" },
  { name: "Jeannette Rankin Women's Scholarship", url: "https://rankinfoundation.org" },
  { name: "P.E.O. International Scholarships", url: "https://www.peointernational.org/about-peo-scholar-awards" },
  { name: "Zonta International Scholarships", url: "https://www.zonta.org/Our-Work/Educational-Programs" },
  { name: "Society of Women Engineers (SWE)", url: "https://swe.org/scholarships" },
  { name: "Women in Technology Scholarship", url: "https://www.womenintechnology.org" },
  { name: "Business & Professional Women Foundation", url: "https://bpwfoundation.org" },
  { name: "Soroptimist Live Your Dream", url: "https://www.soroptimist.org/our-work/live-your-dream" },
  { name: "National Women's Studies Association", url: "https://www.nwsa.org/scholarships" },
  { name: "Women's Independence Scholarship Program", url: "https://www.wispinc.org" },
  { subcat: "STEM" },
  { name: "NSF Graduate Research Fellowship", url: "https://www.nsfgrfp.org" },
  { name: "Barry Goldwater Scholarship", url: "https://goldwaterscholarship.gov" },
  { name: "SMART Scholarship (DoD)", url: "https://www.smartscholarship.org" },
  { name: "American Chemical Society Scholarships", url: "https://www.acs.org/funding/scholarships.html" },
  { name: "Society of Physics Students", url: "https://www.spsnational.org/programs/scholarships" },
  { name: "IEEE Foundation Scholarships", url: "https://www.ieeefoundation.org/programs/scholarships" },
  { name: "Microsoft Scholarship Program", url: "https://careers.microsoft.com/us/en/usscholarshipprogram" },
  { name: "Amazon Future Engineer Scholarship", url: "https://www.amazonfutureengineer.com/scholarships" },
  { name: "Palantir Scholarship for STEM", url: "https://www.palantir.com/students/scholarship" },
  { name: "Hertz Foundation Fellowship", url: "https://www.hertzfoundation.org" },
  { name: "AFCEA STEM Scholarships", url: "https://www.afcea.org/site/scholarships.aspx" },
  { name: "National GEM Consortium", url: "https://www.gemfellowship.org" },
  { name: "Astronaut Scholarship Foundation", url: "https://astronautscholarship.org" },
  { name: "ACM/IEEE-CS Computing Scholarship", url: "https://www.computer.org/volunteering/awards/scholarships" },
  { name: "CRA Outstanding Undergrad Researcher", url: "https://cra.org/crae/awards/cra-outstanding-undergraduate-researchers" },
  { subcat: "Healthcare & Nursing" },
  { name: "NHSC Scholarship (Health Corps)", url: "https://nhsc.hrsa.gov/scholarships" },
  { name: "American Nurses Foundation Scholarship", url: "https://www.americannursesfoundation.org/programs/scholarships" },
  { name: "Jonas Nursing & Veterans Healthcare", url: "https://www.jonas.org" },
  { name: "Tylenol Future Care Scholarship", url: "https://www.tylenol.com/news/scholarship" },
  { name: "American Medical Association Foundation", url: "https://www.amafoundation.org/programs/scholarships" },
  { name: "Health Resources & Services Administration", url: "https://bhw.hrsa.gov/funding/scholarships-loans" },
  { name: "Foundation for Physical Therapy", url: "https://foundation4pt.org/scholarships" },
  { name: "American Dental Association Foundation", url: "https://adafoundation.org/scholarships" },
  { name: "Pharmacy Scholarship Foundation", url: "https://www.pswf.org" },
  { name: "Minority Serving Institutions STEM Health", url: "https://www.minorityhealth.hhs.gov" },
  { subcat: "Business & Finance" },
  { name: "NFIB Young Entrepreneur Foundation", url: "https://www.nfib.com/yef/scholarships" },
  { name: "National Business Education Association", url: "https://www.nbea.org/scholarships" },
  { name: "Accounting & Financial Women's Alliance", url: "https://www.afwa.org/scholarship" },
  { name: "AICPA Scholarship for Minority Students", url: "https://www.aicpa.org/career/scholarshipsawards.html" },
  { name: "Financial Service Centers Scholarship", url: "https://www.fisca.org/scholarships" },
  { name: "CFA Institute Research Challenge", url: "https://www.cfainstitute.org/en/research/foundation/scholarships" },
  { name: "Actuarial Foundation Scholarships", url: "https://www.actuarialfoundation.org/scholarships" },
  { name: "Risk Management Scholarship (Spencer)", url: "https://www.spencered.org" },
  { name: "National Association of Insurance Women", url: "https://www.naiw.org/scholarships.html" },
  { name: "Investment Management Education Alliance", url: "https://www.imea.org/scholarships" },
  { subcat: "Arts, Humanities & Social Sciences" },
  { name: "Scholastic Art & Writing Awards", url: "https://www.artandwriting.org" },
  { name: "Worldstudio AIGA Scholarships", url: "https://www.aiga.org/worldstudio-scholarships" },
  { name: "College Art Association (CAA)", url: "https://www.collegeart.org/programs/fellowships" },
  { name: "Herb Alpert Young Jazz Composer", url: "https://www.ascapfoundation.org/awards" },
  { name: "American Musicological Society Grants", url: "https://www.amsmusicology.org/awards" },
  { name: "Modern Language Association Awards", url: "https://www.mla.org/Resources/Grants-and-Awards" },
  { name: "American Historical Association", url: "https://www.historians.org/awards-and-grants" },
  { name: "American Philosophical Society Grants", url: "https://www.amphilsoc.org/grants/fellowships" },
  { name: "National Endowment for the Humanities", url: "https://www.neh.gov/grants" },
  { name: "Kennedy Center Fellowships", url: "https://www.kennedy-center.org/education/opportunities-for-artists" },
  { subcat: "Military & Veterans" },
  { name: "Veterans of Foreign Wars (VFW) Scholarships", url: "https://www.vfw.org/scholarship" },
  { name: "Military Officers Association of America", url: "https://www.moaa.org/content/education/education" },
  { name: "Fisher House Foundation Scholarships", url: "https://www.fisherhouse.org/programs/scholarship-programs" },
  { name: "Scholarships for Military Children", url: "https://www.militaryscholar.org" },
  { name: "Pat Tillman Scholarship", url: "https://pattillmanfoundation.org" },
  { name: "Tillman Scholars", url: "https://pattillmanfoundation.org/apply" },
  { name: "Navy-Marine Corps Relief Society", url: "https://www.nmcrs.org/education" },
  { name: "Air Force Aid Society", url: "https://www.afas.org/educational-assistance" },
  { name: "Army Emergency Relief Scholarships", url: "https://www.aerhq.org/programs-scholarships.asp" },
  { name: "Coast Guard Foundation Scholarships", url: "https://www.coastguardfoundation.org/scholarships" },
  { subcat: "State Programs (All 50 States)" },
  { name: "Alabama PACT / STARS Scholarship", url: "https://www.ache.edu/scholarships" },
  { name: "Alaska Commission on Postsecondary Education", url: "https://acpe.alaska.gov/FINANCIAL_AID" },
  { name: "Arizona Commission for Postsecondary Ed", url: "https://azregents.edu/financial-aid" },
  { name: "Arkansas Department of Higher Education", url: "https://scholarships.adhe.edu" },
  { name: "California Student Aid Commission (CSAC)", url: "https://www.csac.ca.gov" },
  { name: "Colorado Department of Higher Education", url: "https://cdhe.colorado.gov/students/paying-for-college" },
  { name: "Connecticut Office of Higher Education", url: "https://www.ctohe.org" },
  { name: "Delaware Higher Education Office", url: "https://www.doe.k12.de.us/dhe" },
  { name: "Florida Student Assistance Grant (FSAG)", url: "https://www.floridastudentfinancialaidsg.org" },
  { name: "Georgia Student Finance Commission (HOPE)", url: "https://www.gsfc.org" },
  { name: "Hawaii State Scholarships & Grants", url: "https://students.hawaii.edu/financial-aid" },
  { name: "Idaho State Board of Education Aid", url: "https://boardofed.idaho.gov/college-planning" },
  { name: "Illinois Student Assistance Commission (ISAC)", url: "https://www.isac.org" },
  { name: "Indiana Commission for Higher Education", url: "https://www.in.gov/che/4483.htm" },
  { name: "Iowa College Student Aid Commission", url: "https://www.iowacollegeaid.gov" },
  { name: "Kansas Board of Regents Scholarships", url: "https://www.kansasregents.org/students/scholarships" },
  { name: "Kentucky Higher Education Assistance Authority (KHEAA)", url: "https://www.kheaa.com" },
  { name: "Louisiana Office of Student Financial Assistance (LOSFA)", url: "https://www.osfa.la.gov" },
  { name: "Maine Education Opportunity Center", url: "https://www.famemaine.com" },
  { name: "Maryland Higher Education Commission", url: "https://mhec.maryland.gov/preparing/Pages/FinancialAid" },
  { name: "Massachusetts Office of Student Financial Assistance (OSFA)", url: "https://www.mass.edu/osfa" },
  { name: "Michigan Student Financial Services Bureau", url: "https://www.michigan.gov/mde/services/college" },
  { name: "Minnesota Office of Higher Education", url: "https://www.ohe.state.mn.us/mPg.cfm?pageID=872" },
  { name: "Mississippi Institutions of Higher Learning", url: "https://www.ihl.state.ms.us/financial-aid" },
  { name: "Missouri Dept of Higher Education & Workforce Development", url: "https://dhewd.mo.gov/financial-aid" },
  { name: "Montana Higher Education Student Assistance", url: "https://mus.edu/Prepare/Pay" },
  { name: "Nebraska Coordinating Commission for Postsecondary Ed", url: "https://ccpe.nebraska.gov/financial-aid" },
  { name: "Nevada Governor Guinn Millennium Scholarship", url: "https://nevadatreasurer.gov/millennium" },
  { name: "New Hampshire Postsecondary Education Commission", url: "https://www.education.nh.gov/higher-education" },
  { name: "New Jersey Higher Education Student Assistance Authority (HESAA)", url: "https://www.hesaa.org" },
  { name: "New Mexico Higher Education Department", url: "https://hed.state.nm.us/financial-aid" },
  { name: "New York Higher Education Services Corp (HESC)", url: "https://www.hesc.ny.gov" },
  { name: "North Carolina State Education Assistance Authority (NCSEAA)", url: "https://www.ncseaa.edu" },
  { name: "North Dakota University System Financial Aid", url: "https://ndus.edu/student-resources/financial-aid" },
  { name: "Ohio Higher Education Commission (OCHE)", url: "https://highered.ohio.gov/financial-aid" },
  { name: "Oklahoma State Regents for Higher Education", url: "https://secure.okcollegestart.org/financial_aid" },
  { name: "Oregon Student Assistance Commission (OSAC)", url: "https://oregonstudentaid.gov" },
  { name: "Pennsylvania Higher Education Assistance Agency (PHEAA)", url: "https://www.pheaa.org" },
  { name: "Rhode Island Office of the Postsecondary Commissioner", url: "https://www.riopc.edu/financial_aid" },
  { name: "South Carolina Commission on Higher Education", url: "https://www.che.sc.gov/Students_Parents" },
  { name: "South Dakota Board of Regents Financial Aid", url: "https://sdregents.edu/current-students/financial-aid" },
  { name: "Tennessee Student Assistance Corporation (TSAC)", url: "https://www.tn.gov/collegepaystn.html" },
  { name: "Texas Higher Education Coordinating Board (THECB)", url: "https://www.highered.texas.gov/financial-aid" },
  { name: "Utah System of Higher Education Financial Aid", url: "https://ushe.edu/financial-aid" },
  { name: "Vermont Student Assistance Corporation (VSAC)", url: "https://www.vsac.org" },
  { name: "Virginia Council for Higher Education (SCHEV)", url: "https://www.schev.edu/index/students-and-parents/resources" },
  { name: "Washington Student Achievement Council (WSAC)", url: "https://wsac.wa.gov/financial-aid" },
  { name: "West Virginia Higher Education Policy Commission", url: "https://secure.cfwv.com" },
  { name: "Wisconsin Higher Educational Aids Board (HEAB)", url: "https://heab.state.wi.us" },
  { name: "Wyoming Department of Education Financial Aid", url: "https://edu.wyoming.gov/beyond-the-classroom" },
  { name: "DC Office of the State Superintendent of Education", url: "https://osse.dc.gov/service/financial-aid-resources" },
  { subcat: "International & Study Abroad" },
  { name: "Fulbright U.S. Student Program", url: "https://us.fulbrightonline.org" },
  { name: "Benjamin A. Gilman International Scholarship", url: "https://www.gilmanscholarship.org" },
  { name: "Rhodes Scholarship", url: "https://www.rhodesscholar.org" },
  { name: "Marshall Scholarship", url: "https://www.marshallscholarship.org" },
  { name: "Mitchell Scholarship", url: "https://www.us-irelandalliance.org/mitchellscholarship" },
  { name: "Schwarzman Scholars", url: "https://www.schwarzmanscholars.org" },
  { name: "IIE Study Abroad Scholarships", url: "https://www.iie.org/programs" },
  { name: "DAAD — German Academic Exchange", url: "https://www.daad.de/en/study-and-research-in-germany/scholarships" },
  { name: "Boren Scholarships (NSEP)", url: "https://www.borenawards.org" },
  { name: "Critical Language Scholarship (U.S. Dept of State)", url: "https://clscholarship.org" },
];

const PRIVATE_STUDENT_LOANS: MaybeSubcat[] = [
  { subcat: "Major National Lenders" },
  { name: "Sallie Mae", url: "https://www.salliemae.com/student-loans" },
  { name: "College Ave Student Loans", url: "https://www.collegeavestudentloans.com" },
  { name: "Earnest", url: "https://www.earnest.com/student-loans" },
  { name: "SoFi Student Loans", url: "https://www.sofi.com/student-loans" },
  { name: "Discover Student Loans", url: "https://www.discover.com/student-loans" },
  { name: "Citizens Bank Student Loans", url: "https://www.citizensbank.com/learning/student-loans.aspx" },
  { name: "Ascent Student Loans", url: "https://www.ascentfunding.com" },
  { subcat: "State & Regional Programs" },
  { name: "MEFA (MA Educational Financing)", url: "https://www.mefa.org/loans" },
  { name: "RISLA (RI Student Loan Auth.)", url: "https://www.risla.com" },
  { name: "Laurel Road", url: "https://www.laurelroad.com" },
];
const PRIVATE_STUDENT_LOANS_MORE: MaybeSubcat[] = [
  { subcat: "Banks & Credit Unions" },
  { name: "LendKey", url: "https://www.lendkey.com" },
  { name: "PNC Student Loans", url: "https://www.pnc.com/student-loans" },
  { name: "Navy Federal CU Education Loans", url: "https://www.navyfederal.org/loans-cards/student-loans.html" },
  { name: "PenFed Credit Union", url: "https://www.penfed.org/student-loans" },
  { name: "First Tech FCU Student Loans", url: "https://www.firsttechfed.com/borrow/student-loans" },
  { subcat: "International Students" },
  { name: "MPOWER (International Students)", url: "https://www.mpowerfinancing.com" },
  { name: "Prodigy Finance (International)", url: "https://prodigyfinance.com" },
  { subcat: "Servicers & Refinance" },
  { name: "EdFinancial Services", url: "https://edfinancial.com" },
  { name: "MOHELA Servicer Portal", url: "https://www.mohela.com" },
  { name: "Aidvantage (Navient Transfer)", url: "https://aidvantage.com" },
  { name: "NaviRefi by Navient", url: "https://www.navient.com/loans/repay/refinancing" },
  { name: "Splash Financial", url: "https://www.splashfinancial.com" },
  { name: "Nelnet Bank", url: "https://www.nelnetbank.com" },
  { name: "Education Loan Finance (ELFI)", url: "https://www.elfi.com" },
  { name: "EDvestinU", url: "https://www.edvestinu.com" },
  { name: "Funding U (no cosigner)", url: "https://www.fundingeducation.com" },
  { name: "Edly (income-based repayment)", url: "https://www.edly.com" },
  { subcat: "State Authority Programs" },
  { name: "Brazos Higher Education", url: "https://www.brazos.org" },
  { name: "South Carolina Student Loan", url: "https://www.scstudentloan.org" },
  { name: "College Foundation of NC (CFNC)", url: "https://www.cfnc.org/pay-for-college/apply-for-a-loan" },
  { name: "VSAC (Vermont Student Assistance)", url: "https://www.vsac.org/pay/loans" },
  { name: "HESC (NY Higher Education Svcs.)", url: "https://www.hesc.ny.gov" },
  { name: "PHEAA (PA Higher Education)", url: "https://www.pheaa.org" },
  { name: "HESAA (NJ Higher Education)", url: "https://www.hesaa.org" },
  { subcat: "Marketplaces & Alternatives" },
  { name: "Juno (group negotiated rates)", url: "https://joinjuno.com" },
  { name: "Student Choice (CU network)", url: "https://www.studentchoice.org" },
  { name: "Yrefy (defaulted loan refi)", url: "https://www.yrefy.com" },
  { name: "Purefy (refi marketplace)", url: "https://www.purefy.com" },
  { name: "ISL Education Lending", url: "https://islelend.com" },
  { name: "Advantage Education Loan (KHESLC)", url: "https://www.advantageeducationloan.com" },
  { name: "Custom Choice (SouthState)", url: "https://www.customchoiceloan.com" },
];

const STUDENT_JOB_SEARCH = [
  { name: "Handshake (College Students)", url: "https://joinhandshake.com" },
  { name: "Indeed", url: "https://www.indeed.com" },
  { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs" },
  { name: "Glassdoor", url: "https://www.glassdoor.com" },
  { name: "ZipRecruiter", url: "https://www.ziprecruiter.com" },
  { name: "College Recruiter", url: "https://www.collegerecruiter.com" },
  { name: "AfterCollege", url: "https://www.aftercollege.com" },
  { name: "WayUp", url: "https://www.wayup.com" },
  { name: "USAJobs (Federal)", url: "https://www.usajobs.gov" },
  { name: "Idealist (Nonprofit)", url: "https://www.idealist.org" },
];
const STUDENT_JOB_SEARCH_MORE: MaybeSubcat[] = [
  { subcat: "General Platforms" },
  { name: "Monster", url: "https://www.monster.com" },
  { name: "CareerBuilder", url: "https://www.careerbuilder.com" },
  { name: "SimplyHired", url: "https://www.simplyhired.com" },
  { name: "Wellfound / AngelList (Startups)", url: "https://wellfound.com" },
  { name: "Built In (Tech Startups)", url: "https://builtin.com" },
  { name: "The Ladders ($100K+)", url: "https://www.theladders.com" },
  { name: "Vault Career Guides", url: "https://www.vault.com" },
  { subcat: "Tech & Specialty" },
  { name: "Dice (Tech)", url: "https://www.dice.com" },
  { name: "HealthcareJobsite", url: "https://www.healthcarejobsite.com" },
  { name: "Health eCareers", url: "https://www.healthecareers.com" },
  { name: "eFinancialCareers", url: "https://www.efinancialcareers.com" },
  { name: "LawJobs", url: "https://www.lawjobs.com" },
  { name: "Mediabistro (Media/Comms)", url: "https://www.mediabistro.com" },
  { name: "JournalismJobs", url: "https://www.journalismjobs.com" },
  { name: "EngineeringJobs.com", url: "https://www.engineeringjobs.com" },
  { name: "AccountingJobsToday", url: "https://www.accountingjobstoday.com" },
  { subcat: "Remote & Flexible" },
  { name: "FlexJobs (Remote/Flexible)", url: "https://www.flexjobs.com" },
  { name: "We Work Remotely", url: "https://weworkremotely.com" },
  { name: "Remote.co", url: "https://remote.co" },
  { name: "Himalayas (Remote Jobs)", url: "https://himalayas.app" },
  { subcat: "Hourly & Part-Time" },
  { name: "Snagajob (Hourly/Part-Time)", url: "https://www.snagajob.com" },
  { name: "JobList", url: "https://www.joblist.com" },
  { name: "Nexxt", url: "https://www.nexxt.com" },
  { subcat: "Government & Higher Ed" },
  { name: "GovernmentJobs.com", url: "https://www.governmentjobs.com" },
  { name: "ClearanceJobs (Security Clearance)", url: "https://www.clearancejobs.com" },
  { name: "HigherEdJobs", url: "https://www.higheredjobs.com" },
  { name: "Chronicle of Higher Ed Jobs", url: "https://jobs.chronicle.com" },
  { subcat: "Diversity & Inclusion" },
  { name: "PowerToFly (Women & Diversity)", url: "https://powertofly.com" },
  { name: "Jopwell (Diverse Professionals)", url: "https://www.jopwell.com" },
  { name: "DiversityJobs", url: "https://www.diversityjobs.com" },
  { name: "iHispano", url: "https://ihispano.com" },
  { subcat: "Veterans & Disability" },
  { name: "VetJobs (Veterans)", url: "https://www.vetjobs.com" },
  { name: "HireHeroesUSA (Veterans)", url: "https://www.hireheroesusa.org" },
  { name: "DisabilityJobs.net", url: "https://www.disabilityjobs.net" },
  { name: "AbilityLinks", url: "https://abilitylinks.org" },
  { subcat: "Student-Focused" },
  { name: "Chegg Internships & Jobs", url: "https://www.chegg.com/internships" },
  { name: "Parker Dewey (Micro-Internships)", url: "https://www.parkerdewey.com" },
  { name: "Campus Job", url: "https://www.campusjob.com" },
  { name: "JobSpider", url: "https://www.jobspider.com" },
  { name: "Career.io", url: "https://career.io" },
];

const INTERNSHIP_SEARCH = [
  { name: "Handshake Internships", url: "https://joinhandshake.com" },
  { name: "Internships.com", url: "https://www.internships.com" },
  { name: "WayUp", url: "https://www.wayup.com" },
  { name: "Chegg Internships", url: "https://www.chegg.com/internships" },
  { name: "Forage (Virtual Internships)", url: "https://www.theforage.com" },
  { name: "Parker Dewey (Micro-Internships)", url: "https://www.parkerdewey.com" },
  { name: "LinkedIn Internships", url: "https://www.linkedin.com/jobs" },
  { name: "Indeed Internships", url: "https://www.indeed.com" },
  { name: "Virtual Internships", url: "https://www.virtualinternships.com" },
  { name: "INROADS (Diversity)", url: "https://inroads.org" },
];
const INTERNSHIP_SEARCH_MORE: MaybeSubcat[] = [
  { subcat: "General Platforms" },
  { name: "InternQueen", url: "https://www.internqueen.com" },
  { name: "Idealist Internships", url: "https://www.idealist.org" },
  { name: "Vault Internship Rankings", url: "https://www.vault.com/best-companies/internships" },
  { name: "College Recruiter Internships", url: "https://www.collegerecruiter.com" },
  { name: "Glassdoor Internships", url: "https://www.glassdoor.com" },
  { name: "ZipRecruiter Internships", url: "https://www.ziprecruiter.com" },
  { subcat: "International & Abroad" },
  { name: "Go Overseas (Abroad)", url: "https://www.gooverseas.com" },
  { name: "AIESEC (International)", url: "https://aiesec.org" },
  { name: "BUNAC (Work Abroad)", url: "https://www.bunac.org" },
  { name: "Global Experiences (Abroad)", url: "https://www.globalexperiences.com" },
  { name: "IAESTE (STEM Abroad)", url: "https://www.iaeste.us" },
  { subcat: "Diversity & Inclusion" },
  { name: "SEO Career (Diversity)", url: "https://www.seo-usa.org" },
  { name: "Management Leadership for Tomorrow (MLT)", url: "https://mlt.org" },
  { name: "Out for Undergrad (O4U)", url: "https://www.outforundergrad.org" },
  { name: "Hispanic Scholarship Fund Internships", url: "https://www.hsf.net" },
  { name: "UNCF Internship Programs", url: "https://uncf.org" },
  { name: "Congressional Black Caucus Foundation", url: "https://www.cbcfinc.org" },
  { name: "Jopwell Internships (Diversity)", url: "https://www.jopwell.com" },
  { name: "Getting Hired (Disability)", url: "https://www.gettinghired.com" },
  { subcat: "Government & Public Service" },
  { name: "Washington Center Internships", url: "https://twc.edu" },
  { name: "White House Internship Program", url: "https://www.whitehouse.gov/get-involved/internships" },
  { name: "State Department Student Internships", url: "https://www.state.gov/internships" },
  { name: "USAJobs Student Programs", url: "https://www.usajobs.gov/students" },
  { name: "Peace Corps (Post-Grad)", url: "https://www.peacecorps.gov" },
  { name: "AmeriCorps", url: "https://americorps.gov" },
  { name: "City Year", url: "https://www.cityyear.org" },
  { name: "Teach For America", url: "https://www.teachforamerica.org" },
  { name: "Hire Heroes USA (Veterans Internships)", url: "https://www.hireheroesusa.org" },
  { subcat: "Federal Research & Science" },
  { name: "NSF REU Programs (Research)", url: "https://www.nsf.gov/crssprgm/reu" },
  { name: "NASA Internships", url: "https://intern.nasa.gov" },
  { name: "NIH Training & Internships", url: "https://www.training.nih.gov" },
  { name: "CDC Student Internships", url: "https://www.cdc.gov/employment" },
  { name: "DOE Science Internships (WDTS)", url: "https://science.osti.gov/wdts" },
  { name: "Smithsonian Internships", url: "https://www.si.edu/OFG/Internships" },
  { subcat: "Top Companies" },
  { name: "Google STEP Internship", url: "https://buildyourfuture.withgoogle.com/programs/step" },
  { name: "Microsoft Intern Programs", url: "https://careers.microsoft.com/students" },
  { name: "Goldman Sachs Summer Analyst", url: "https://www.goldmansachs.com/careers/students" },
  { name: "Apple Internships", url: "https://jobs.apple.com/en-us/search?team=internships-STDNT-INTRN" },
  { name: "Facebook/Meta Internships", url: "https://www.metacareers.com/students-and-grads" },
  { name: "Amazon Student Programs", url: "https://www.amazon.jobs/en/teams/internships-for-students" },
];

const RESUME_ASSISTANCE: MaybeSubcat[] = [
  { subcat: "AI-Powered Builders" },
  { name: "Resume.io", url: "https://resume.io" },
  { name: "Rezi (AI Resume Builder)", url: "https://www.rezi.ai" },
  { subcat: "Design & Visual" },
  { name: "Canva Resume Builder (Free)", url: "https://www.canva.com/resumes" },
  { name: "VisualCV", url: "https://www.visualcv.com" },
  { subcat: "Classic Builders" },
  { name: "Zety Resume Builder", url: "https://zety.com" },
  { name: "Novoresume", url: "https://novoresume.com" },
  { name: "Enhancv", url: "https://enhancv.com" },
  { name: "Resume Genius", url: "https://resumegenius.com" },
  { name: "Kickresume", url: "https://www.kickresume.com" },
  { subcat: "ATS Optimization" },
  { name: "JobScan (ATS Optimization)", url: "https://www.jobscan.co" },
];
const RESUME_ASSISTANCE_MORE: MaybeSubcat[] = [
  { subcat: "AI Career Tools" },
  { name: "Teal HQ (AI Career Tools)", url: "https://www.tealhq.com" },
  { name: "ResumeWorded (AI Feedback)", url: "https://resumeworded.com" },
  { name: "Wonsulting AI Resume", url: "https://www.wonsulting.com" },
  { name: "Skillroads (AI Resume)", url: "https://skillroads.com" },
  { name: "iinterview AI (Mock)", url: "https://iinterview.ai" },
  { subcat: "Traditional Platforms" },
  { name: "My Perfect Resume", url: "https://www.myperfectresume.com" },
  { name: "LiveCareer", url: "https://www.livecareer.com" },
  { name: "Resume Now", url: "https://www.resume-now.com" },
  { name: "Standard Resume", url: "https://standardresume.co" },
  { name: "CakeResume", url: "https://www.cakeresume.com" },
  { name: "RxResume (Free & Open Source)", url: "https://rxresu.me" },
  { name: "Indeed Resume Builder", url: "https://www.indeed.com/create-resume" },
  { name: "LinkedIn Resume Builder", url: "https://www.linkedin.com/resume-builder" },
  { name: "Resume Builder (Free)", url: "https://www.resumebuilder.com" },
  { name: "Resumake (Open Source)", url: "https://resumake.io" },
  { name: "Creddle (Visual Resume)", url: "https://creddle.io" },
  { subcat: "Professional Services" },
  { name: "TopResume (Professional Service)", url: "https://www.topresume.com" },
  { name: "ZipJob (Professional Service)", url: "https://www.zipjob.com" },
  { name: "ResumeSpice (Professional)", url: "https://www.resumespice.com" },
  { subcat: "Interview Prep" },
  { name: "Big Interview (Mock Interviews)", url: "https://biginterview.com" },
  { name: "Pramp (Mock Interviews)", url: "https://www.pramp.com" },
  { name: "InterviewBit", url: "https://www.interviewbit.com" },
  { name: "Interview Warmup (Google)", url: "https://grow.google/certificates/interview-warmup" },
  { name: "LinkedIn Interview Prep", url: "https://www.linkedin.com/interview-prep" },
  { name: "PathRise (Career Coaching)", url: "https://www.pathrise.com" },
  { subcat: "Writing & Polish" },
  { name: "Grammarly (Writing Polish)", url: "https://www.grammarly.com" },
  { name: "Hemingway Editor (Clarity)", url: "https://hemingwayapp.com" },
  { name: "Quillbot (Paraphrase & Improve)", url: "https://quillbot.com" },
  { subcat: "University Guides" },
  { name: "Purdue OWL Resume Guide", url: "https://owl.purdue.edu/owl/job_search_writing/resumes_and_vitas" },
  { name: "Harvard OCS Resume Guide", url: "https://ocs.fas.harvard.edu/resumes-cvs" },
  { name: "MIT Resume Guide", url: "https://capd.mit.edu/jobs-and-internships/resumes-cvs-cover-letters-linkedin" },
  { name: "NACE Career Resources", url: "https://www.naceweb.org" },
  { subcat: "Templates" },
  { name: "Google Docs Resume Templates", url: "https://docs.google.com/templates" },
  { name: "Microsoft Office Resume Templates", url: "https://templates.office.com/en-us/resumes-and-cover-letters" },
  { subcat: "Career Research" },
  { name: "The Muse — Resume Tips", url: "https://www.themuse.com/advice/resume" },
  { name: "Career Contessa", url: "https://www.careercontessa.com" },
  { name: "Monster Resume Advice", url: "https://www.monster.com/career-advice/article/how-to-write-a-resume" },
  { name: "Glassdoor Resume Tips", url: "https://www.glassdoor.com/blog/guide/how-to-write-a-resume" },
  { name: "Vault Career Guides", url: "https://www.vault.com" },
  { name: "Career Karma (Bootcamp/Tech)", url: "https://careerkarma.com" },
];

const VOLUNTEER_SEARCH: MaybeSubcat[] = [
  { subcat: "Top Platforms" },
  { name: "VolunteerMatch — Find Local Volunteer Opps", url: "https://www.volunteermatch.org" },
  { name: "Idealist — Nonprofits & Volunteer", url: "https://www.idealist.org" },
  { name: "AmeriCorps — National Service Programs", url: "https://americorps.gov" },
  { name: "All for Good — Volunteer Search", url: "https://allforgood.org" },
  { name: "Points of Light — Volunteer Network", url: "https://www.pointsoflight.org/volunteer" },
  { name: "JustServe — Faith-Inclusive Volunteer", url: "https://www.justserve.org" },
  { name: "United Way Volunteer", url: "https://www.unitedway.org/get-involved/volunteer" },
  { name: "DoSomething.org — Youth Causes", url: "https://www.dosomething.org" },
  { name: "Catchafire — Skills-Based Volunteering", url: "https://www.catchafire.org" },
  { name: "Serve.gov — National Service Directory", url: "https://serve.gov" },
];
const VOLUNTEER_SEARCH_MORE: MaybeSubcat[] = [
  { subcat: "National Service & Education Awards" },
  { name: "AmeriCorps VISTA — Anti-Poverty Service", url: "https://americorps.gov/serve/americorps/americorps-vista" },
  { name: "AmeriCorps NCCC — Team Service", url: "https://americorps.gov/serve/americorps/americorps-nccc" },
  { name: "Peace Corps — International Service", url: "https://www.peacecorps.gov" },
  { name: "Senior Corps — Older Adult Service", url: "https://americorps.gov/serve/what-acf-does/senior-corps" },
  { name: "City Year — Urban Education Service", url: "https://www.cityyear.org" },
  { name: "Teach For America", url: "https://www.teachforamerica.org" },
  { name: "AmeriCorps Segal Education Award", url: "https://americorps.gov/members-volunteers/segal-americorps-education-award" },
  { subcat: "Skills-Based & Virtual" },
  { name: "Catchafire — Pro Bono Skills Match", url: "https://www.catchafire.org" },
  { name: "Taproot Foundation — Pro Bono Service", url: "https://www.taprootfoundation.org" },
  { name: "Zooniverse — Online Research Volunteering", url: "https://www.zooniverse.org" },
  { name: "Be My Eyes — Help Visually Impaired (App)", url: "https://www.bemyeyes.com" },
  { name: "Crisis Text Line — Volunteer Crisis Counselor", url: "https://www.crisistextline.org/volunteer" },
  { name: "United Nations Online Volunteers", url: "https://www.onlinevolunteering.org" },
  { name: "Sparked — Micro-Volunteering Platform", url: "https://www.sparked.com" },
  { subcat: "Community & Faith-Based" },
  { name: "Habitat for Humanity — Build Homes", url: "https://www.habitat.org/volunteer" },
  { name: "Red Cross Volunteer", url: "https://www.redcross.org/volunteer/become-a-volunteer.html" },
  { name: "Feeding America — Food Banks", url: "https://www.feedingamerica.org/take-action/volunteer" },
  { name: "Catholic Charities Volunteer", url: "https://www.catholiccharitiesusa.org/find-help" },
  { name: "Jewish Federations — Volunteer", url: "https://jewishfederations.org" },
  { name: "Islamic Relief USA — Volunteer", url: "https://irusa.org/volunteer" },
  { name: "HandsOn Network — Local Volunteer Centers", url: "https://www.pointsoflight.org/handsonnetwork" },
  { subcat: "Environmental & Science" },
  { name: "Sierra Club Volunteer Opportunities", url: "https://www.sierraclub.org/volunteer" },
  { name: "National Park Service Volunteers", url: "https://www.nps.gov/getinvolved/volunteer.htm" },
  { name: "SciStarter — Citizen Science Projects", url: "https://scistarter.org" },
  { name: "NOAA Volunteer Programs", url: "https://www.noaa.gov/volunteer" },
  { subcat: "Student & Campus Specific" },
  { name: "Campus Compact — College Civic Engagement", url: "https://compact.org" },
  { name: "National Youth Leadership Council (NYLC)", url: "https://www.nylc.org" },
  { name: "CIRCLE — Youth Civic Engagement Data", url: "https://circle.tufts.edu" },
  { name: "Generate Change — Student Service", url: "https://www.generatechange.org" },
  { name: "Key Club International — High School Service", url: "https://www.keyclub.org" },
  { subcat: "Scholarships Through Service" },
  { name: "AmeriCorps Education Award — FAFSA Treatment", url: "https://americorps.gov/members-volunteers/segal-americorps-education-award" },
  { name: "AARP Create the Good — Community Service", url: "https://createthegood.aarp.org" },
  { name: "FEMA Community Emergency Response Teams (CERT)", url: "https://community.fema.gov/PreparednessCommunity/s/cert" },
];

const AI_LITERACY: MaybeSubcat[] = [
  { subcat: "Free Beginner Courses" },
  { name: "Elements of AI (Free)", url: "https://www.elementsofai.com" },
  { name: "Google AI Essentials (Free)", url: "https://grow.google/intl/en_us/courses-and-tools" },
  { name: "Microsoft AI Skills Initiative (Free)", url: "https://microsoft.com/en-us/ai/ai-skills" },
  { name: "Coursera: AI for Everyone — Andrew Ng (Free Audit)", url: "https://www.coursera.org/learn/ai-for-everyone" },
  { name: "DeepLearning.AI Short Courses (Free)", url: "https://www.deeplearning.ai/short-courses" },
  { subcat: "Technical Free Courses" },
  { name: "Google ML Crash Course (Free)", url: "https://developers.google.com/machine-learning/crash-course" },
  { name: "Kaggle Learn — AI/ML (Free)", url: "https://www.kaggle.com/learn" },
  { name: "fast.ai — Practical Deep Learning (Free)", url: "https://www.fast.ai" },
  { name: "Harvard CS50 AI with Python (Free)", url: "https://cs50.harvard.edu/ai" },
  { name: "IBM AI Fundamentals (Free)", url: "https://skills.yourlearning.ibm.com" },
];
const AI_LITERACY_MORE: MaybeSubcat[] = [
  { subcat: "Free — Cloud & Industry" },
  { name: "Hugging Face AI Courses (Free)", url: "https://huggingface.co/learn" },
  { name: "Google Generative AI Learning Path (Free)", url: "https://cloudskillsboost.google/paths/118" },
  { name: "AWS AI/ML Training (Free Tier)", url: "https://aws.amazon.com/training/learn-about/machine-learning" },
  { name: "NVIDIA Deep Learning Institute (Free/Paid)", url: "https://www.nvidia.com/en-us/training" },
  { name: "MIT OpenCourseWare — AI (Free)", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010" },
  { name: "Stanford HAI Resources (Free)", url: "https://hai.stanford.edu" },
  { name: "AI Business School — Microsoft (Free)", url: "https://www.microsoft.com/en-us/ai/ai-business-school" },
  { name: "Salesforce AI Associate — Trailhead (Free)", url: "https://trailhead.salesforce.com" },
  { name: "Class Central — AI Courses (Free Aggregator)", url: "https://www.classcentral.com/subject/ai" },
  { subcat: "Prompt Engineering" },
  { name: "OpenAI Prompt Engineering Guide (Free)", url: "https://platform.openai.com/docs/guides/prompt-engineering" },
  { name: "Anthropic Prompt Library (Free)", url: "https://docs.anthropic.com/en/prompt-library/library" },
  { name: "ChatGPT Prompt Engineering for Developers (Free)", url: "https://learn.deeplearning.ai/chatgpt-prompt-eng" },
  { subcat: "Paid Certifications" },
  { name: "Coursera: Machine Learning Specialization (Paid Cert)", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
  { name: "Coursera: Deep Learning Specialization (Paid Cert)", url: "https://www.coursera.org/specializations/deep-learning" },
  { name: "edX AI MicroMasters Programs (Paid)", url: "https://www.edx.org/micromasters" },
  { name: "Udacity AI Nanodegree (Paid)", url: "https://www.udacity.com/school-of-ai" },
  { name: "Udemy AI & Machine Learning Courses (Paid)", url: "https://www.udemy.com/topic/artificial-intelligence" },
  { name: "DataCamp AI & ML (Paid)", url: "https://www.datacamp.com/category/machine-learning" },
  { name: "Pluralsight AI Paths (Paid)", url: "https://www.pluralsight.com/browse/data-professional/artificial-intelligence" },
  { name: "LinkedIn Learning AI Courses (Paid/Free Trial)", url: "https://www.linkedin.com/learning/topics/artificial-intelligence" },
  { name: "Brilliant.org AI (Paid)", url: "https://brilliant.org/courses/artificial-intelligence" },
  { name: "Codecademy AI (Free/Paid)", url: "https://www.codecademy.com/catalog/subject/artificial-intelligence" },
  { subcat: "Free References & Media" },
  { name: "W3Schools AI Tutorial (Free)", url: "https://www.w3schools.com/ai" },
  { name: "FutureLearn AI Courses (Free/Paid)", url: "https://www.futurelearn.com/subjects/it-and-computer-science-courses/ai" },
  { name: "AI4K12 Initiative (Free)", url: "https://ai4k12.org" },
  { name: "PAIR Explorables — Google (Free)", url: "https://pair.withgoogle.com/explorables" },
  { name: "UNESCO AI Competency Framework (Free)", url: "https://www.unesco.org/en/digital-education/ai-future-learning" },
  { name: "Partnership on AI Resources (Free)", url: "https://partnershiponai.org" },
  { name: "Stanford AI Index Report (Free)", url: "https://aiindex.stanford.edu" },
  { name: "3Blue1Brown — Neural Networks (Free YouTube)", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi" },
  { name: "Lex Fridman AI Lectures (Free YouTube)", url: "https://www.youtube.com/@lexfridman" },
  { name: "Towards Data Science (Free Articles)", url: "https://towardsdatascience.com" },
  { name: "AI Explained — YouTube (Free)", url: "https://www.youtube.com/@aiexplained-official" },
  { subcat: "Hands-On Tools" },
  { name: "Claude.ai — Hands-On AI Practice (Free)", url: "https://claude.ai" },
  { name: "ChatGPT — Hands-On AI Practice (Free/Paid)", url: "https://chatgpt.com" },
  { name: "Google NotebookLM (Free)", url: "https://notebooklm.google.com" },
  { name: "Gamma AI Presentations (Free/Paid)", url: "https://gamma.app" },
  { name: "Perplexity AI Learning Guide (Free)", url: "https://www.perplexity.ai" },
  { name: "Coursera: Generative AI for Everyone (Free Audit)", url: "https://www.coursera.org/learn/generative-ai-for-everyone" },
];

// ── Mental Health Literacy — Students & Parents ──
const MENTAL_HEALTH_STUDENT: MaybeSubcat[] = [
  { subcat: "Crisis & Immediate Help" },
  { name: "988 Suicide & Crisis Lifeline", url: "https://988lifeline.org" },
  { name: "Crisis Text Line — Text HOME to 741741", url: "https://www.crisistextline.org" },
  { name: "Trevor Project — LGBTQ+ Youth Crisis", url: "https://www.thetrevorproject.org" },
  { name: "SAMHSA National Helpline 1-800-662-4357", url: "https://www.samhsa.gov/find-help/national-helpline" },
  { name: "Suicide Prevention Resource Center (SPRC)", url: "https://sprc.org" },
  { name: "National Eating Disorders Association (NEDA)", url: "https://www.nationaleatingdisorders.org" },
  { subcat: "Organizations & Advocacy" },
  { name: "NAMI — National Alliance on Mental Illness", url: "https://www.nami.org" },
  { name: "Active Minds — Student Mental Health", url: "https://www.activeminds.org" },
  { name: "JED Foundation — Young Adult Mental Health", url: "https://jedfoundation.org" },
  { name: "MentalHealth.gov — What Is Mental Health", url: "https://www.mentalhealth.gov" },
];
const MENTAL_HEALTH_STUDENT_MORE: MaybeSubcat[] = [
  { subcat: "Therapy & Counseling" },
  { name: "BetterHelp — Online Therapy", url: "https://www.betterhelp.com" },
  { name: "Talkspace — Online Therapy for Students", url: "https://www.talkspace.com" },
  { name: "Headspace for Students", url: "https://www.headspace.com/students" },
  { name: "Calm App — Stress & Sleep", url: "https://www.calm.com" },
  { name: "Woebot — AI Mental Health Support", url: "https://woebothealth.com" },
  { subcat: "College Mental Health" },
  { name: "AFSP — American Foundation for Suicide Prevention", url: "https://afsp.org" },
  { name: "Half of Us — Campus Mental Health", url: "https://halfofus.com" },
  { name: "ULifeline — College Mental Health Resource", url: "https://www.ulifeline.org" },
  { name: "NAMI HelpLine 1-800-950-6264", url: "https://www.nami.org/help" },
  { name: "MHA — Mental Health America Screening", url: "https://screening.mhanational.org" },
  { name: "Anxiety & Depression Association (ADAA)", url: "https://adaa.org" },
  { name: "Child Mind Institute — Youth Mental Health", url: "https://childmind.org" },
  { name: "Psychology Today Therapist Finder", url: "https://www.psychologytoday.com/us/therapists" },
  { name: "Open Path Collective — Affordable Therapy", url: "https://openpathcollective.org" },
  { name: "7 Cups — Free Online Chat Support", url: "https://www.7cups.com" },
  { name: "Sanvello — Anxiety & Depression App", url: "https://www.sanvello.com" },
  { name: "Therapy Aid Coalition — Free/Low-Cost Therapy", url: "https://www.therapyaid.org" },
  { name: "OK2Talk — Teen & Young Adult Support", url: "https://ok2talk.org" },
  { name: "Teen Line — Teen-to-Teen Support", url: "https://www.teenlineonline.org" },
  { name: "Boys Town National Hotline 1-800-448-3000", url: "https://www.boystown.org/hotline" },
  { name: "RAINN — Sexual Assault Hotline", url: "https://www.rainn.org" },
  { name: "Love is Respect — Relationship Abuse", url: "https://www.loveisrespect.org" },
  { name: "National DV Hotline 1-800-799-7233", url: "https://www.thehotline.org" },
  { name: "NEDA Helpline 1-800-931-2237", url: "https://www.nationaleatingdisorders.org/help-support/contact-helpline" },
  { name: "ANAD — Eating Disorders Support", url: "https://anad.org" },
  { name: "SMART Recovery — Addiction Support", url: "https://www.smartrecovery.org" },
  { name: "SAMHSA Treatment Locator", url: "https://findtreatment.samhsa.gov" },
  { name: "Alcoholics Anonymous", url: "https://www.aa.org" },
  { name: "Narcotics Anonymous", url: "https://www.na.org" },
  { subcat: "Specific Populations" },
  { name: "Student Veterans of America — Mental Health", url: "https://studentveterans.org/programs/mental-health" },
  { name: "Veterans Crisis Line 1-800-273-8255 #1", url: "https://www.veteranscrisisline.net" },
  { name: "NAMI Veterans & Military Resource", url: "https://www.nami.org/Your-Journey/Veterans-Active-Duty" },
  { name: "Black Mental Health Alliance", url: "https://blackmentalhealth.com" },
  { name: "Asian Mental Health Collective", url: "https://www.asianmhc.org" },
  { name: "Latinx Therapy — Therapist Directory", url: "https://latinxtherapy.com" },
  { name: "NQTTCN — Queer Trans Therapists of Color", url: "https://www.nqttcn.com" },
  { name: "The Steve Fund — BIPOC Mental Health", url: "https://stevefund.org" },
  { name: "Shine — Mental Health for People of Color", url: "https://www.theshineapp.com" },
  { name: "Mindline Trans+ — Trans Mental Health", url: "https://mindlinetrans.org.uk" },
  { name: "Safe Space — LGBTQ+ Mental Health", url: "https://www.safespace.org" },
  { name: "CHADD — ADHD Resources", url: "https://chadd.org" },
  { name: "Autism Society of America", url: "https://autismsociety.org" },
  { name: "ADAA — Find a Therapist (Anxiety)", url: "https://adaa.org/finding-help/finding-therapist" },
  { name: "Understood.org — Learning & Mental Health", url: "https://www.understood.org" },
  { name: "DBSA — Depression & Bipolar Support Alliance", url: "https://www.dbsalliance.org" },
  { name: "International OCD Foundation", url: "https://iocdf.org" },
  { name: "PTSD Alliance", url: "https://www.ptsdalliance.org" },
  { name: "Insomnia Coach — Sleep & Mental Health", url: "https://www.insomniacoach.org" },
  { name: "Postpartum Support International", url: "https://www.postpartum.net" },
  { name: "NSVRC — Sexual Violence & Mental Health", url: "https://www.nsvrc.org" },
  { name: "ASCA — Adult Survivors of Child Abuse", url: "https://www.ascasupport.org" },
  { subcat: "Research & Policy" },
  { name: "APA — Student Mental Health Resources", url: "https://www.apa.org/topics/mental-health/index" },
  { name: "NIMH — National Institute of Mental Health", url: "https://www.nimh.nih.gov" },
  { name: "CDC Mental Health Resources", url: "https://www.cdc.gov/mentalhealth/index.htm" },
  { name: "Springtide Research — Gen Z Faith & Mental Health", url: "https://springtideresearch.org" },
  { name: "Campus Calm — Student Wellness", url: "https://campuscalm.com" },
  { name: "Student Success — Stress Management Tips", url: "https://www.collegeraptor.com/plan-for-college/articles/college-life/student-mental-health-resources" },
  { name: "National Alliance on Mental Illness — College Students", url: "https://www.nami.org/Support-Education/Mental-Health-Education/NAMI-on-Campus-Clubs" },
  { name: "Peer Support International", url: "https://www.peersupportinternational.org" },
  { name: "Born This Way Foundation — Youth Mental Health", url: "https://bornthisway.foundation" },
  { name: "Erika's Lighthouse — Teen Depression", url: "https://erikaslighthouse.org" },
  { name: "Hope for the Day — Proactive Suicide Prevention", url: "https://hftd.org" },
  { name: "To Write Love on Her Arms", url: "https://twloha.com" },
  { name: "NARSAD — Mental Health Research", url: "https://www.bbrfoundation.org" },
  { name: "SAMHSA Mental Health Treatment Locator", url: "https://findtreatment.samhsa.gov" },
  { name: "United Way 211 — Local Mental Health Services", url: "https://www.211.org" },
  { name: "Peer.org — Peer Support Community", url: "https://peer.org" },
  { name: "Child Welfare Information Gateway", url: "https://www.childwelfare.gov/topics/responding/mental-health" },
  { name: "Mindfulness-Based Stress Reduction (MBSR)", url: "https://www.umassmed.edu/cfm/mindfulness-based-programs/mbsr-courses" },
  { name: "Headspace Guide to Meditation (Netflix)", url: "https://www.netflix.com/title/81280926" },
  { name: "Ten Percent Happier — Meditation App", url: "https://www.tenpercent.com" },
  { name: "Insight Timer — Free Meditation App", url: "https://insighttimer.com" },
  { name: "Financial Stress & Mental Health — NFCC", url: "https://www.nfcc.org/resources/mental-health-financial-stress" },
  { name: "Student Loan Anxiety — NFCC Resources", url: "https://www.nfcc.org" },
  { name: "Financial Therapy Association", url: "https://www.financialtherapyassociation.org" },
  { name: "Project Semicolon — Mental Health Advocacy", url: "https://www.projectsemicolon.com" },
  { name: "Bring Change to Mind", url: "https://bringchange2mind.org" },
  { name: "Mental Health First Aid USA", url: "https://www.mentalhealthfirstaid.org" },
  { name: "QPR Institute — Suicide Prevention Training", url: "https://qprinstitute.com" },
  { name: "Zero Suicide Institute", url: "https://zerosuicide.edc.org" },
  { name: "Safe Messaging Guidelines — AFSP", url: "https://afsp.org/safe-messaging-guidelines" },
  { name: "IMAlive — Online Crisis Network", url: "https://www.imalive.org" },
  { name: "SilverCloud Health — Digital Mental Health", url: "https://www.silvercloudhealth.com" },
  { name: "Daylio — Mood Journal App", url: "https://daylio.net" },
  { name: "Moodfit — Mental Health App", url: "https://www.getmoodfit.com" },
  { name: "Youper — AI Emotional Health App", url: "https://www.youper.ai" },
  { name: "NAMI Warmline Directory", url: "https://www.nami.org/Support-Education/Support-Groups/NAMI-Warmline" },
  { name: "Crisis Support Services of Nevada", url: "https://www.crisisupportservices.org" },
  { name: "AFSP — Campus Programs", url: "https://afsp.org/chapter/programs/campus-programs" },
  { name: "Suicide Attempt Survivors — AFSP", url: "https://afsp.org/find-your-local-chapter" },
  { name: "Now Matters Now — DBT Skills", url: "https://www.nowmattersnow.org" },
  { name: "Calm Harm App — Self Harm", url: "https://calmharm.co.uk" },
  { name: "ReachOut Australia — Youth Mental Health", url: "https://au.reachout.com" },
  { name: "After Suicide Loss — AFSP", url: "https://afsp.org/find-your-local-chapter" },
  { name: "Alliance of Hope for Suicide Loss Survivors", url: "https://allianceofhope.org" },
  { name: "Grief Share — Grief Recovery Support", url: "https://www.griefshare.org" },
  { name: "What's Your Grief — Grief Education", url: "https://whatsyourgrief.com" },
  { name: "Campus Mental Health — ACPA Resource", url: "https://myacpa.org/commission-for-wellness-and-health" },
  { name: "NASPA — Student Affairs Mental Health", url: "https://www.naspa.org/topics/mental-health" },
  { name: "Healthy Minds Network — College Mental Health Data", url: "https://healthymindsnetwork.org" },
  { name: "CCMH — Center for Collegiate Mental Health", url: "https://ccmh.psu.edu" },
  { name: "Higher Education Mental Health Alliance (HEMHA)", url: "https://hemha.org" },
  { name: "American College Health Association (ACHA)", url: "https://www.acha.org/NCHA" },
  { name: "ACHA — National College Health Assessment", url: "https://www.acha.org/NCHA/About_ACHA_NCHA/NCHA_Background/NCHA/About/About_NCHA.aspx" },
  { name: "National Student Assistance Association (NSAA)", url: "https://www.nsaa.us" },
  { name: "Community Mental Health Association", url: "https://www.cmhanational.org" },
  { name: "NAMI Peer-to-Peer Program", url: "https://www.nami.org/Support-Education/Mental-Health-Education/NAMI-Peer-to-Peer" },
  { name: "NAMI Family Support Group", url: "https://www.nami.org/Support-Education/Support-Groups/NAMI-Family-Support-Group" },
  { name: "Family Lives — Parenting & Mental Health", url: "https://www.familylives.org.uk" },
  { name: "Parents.com — Child Mental Health", url: "https://www.parents.com/health/mental-health" },
  { name: "Zero to Three — Early Childhood Mental Health", url: "https://www.zerotothree.org" },
  { name: "Mental Health Foundation — UK", url: "https://www.mentalhealth.org.uk" },
  { name: "Mind.org — UK Mental Health Charity", url: "https://www.mind.org.uk" },
  { name: "WHO — Mental Health", url: "https://www.who.int/health-topics/mental-health" },
  { name: "PAHO — Mental Health in the Americas", url: "https://www.paho.org/en/topics/mental-health" },
  { name: "International Association for Suicide Prevention", url: "https://www.iasp.info" },
  { name: "National Council for Mental Wellbeing", url: "https://www.thenationalcouncil.org" },
  { name: "Finding Hope in College — Flourishing in FA", url: "https://studentaid.gov/help-center/answers/topic/general-info" },
  { name: "NAMI — Mental Health & Financial Stress", url: "https://www.nami.org/Blogs/NAMI-Blog/November-2019/How-Financial-Stress-Can-Impact-Mental-Health" },
  { name: "College and Career Readiness & Mental Health", url: "https://www.cdc.gov/healthyyouth/mental-health/index.htm" },
  { name: "SAMHSA — College Mental Health", url: "https://www.samhsa.gov/resource-search/ebp?f[0]=population_group%3A1552" },
];

// ── Religion, Faith & Philosophy ──
const RELIGION_FAITH_PHILOSOPHY: MaybeSubcat[] = [
  { subcat: "Interfaith & Campus Ministry" },
  { name: "Patheos — World Religions & Philosophy", url: "https://www.patheos.com" },
  { name: "Beliefnet — Spirituality & Faith", url: "https://www.beliefnet.com" },
  { name: "Awakin.org — Inner-Life Weekly Readings", url: "https://www.awakin.org" },
  { name: "Coursera — Religion & Philosophy Courses", url: "https://www.coursera.org/browse/arts-and-humanities/philosophy" },
  { name: "Khan Academy — World History of Religion", url: "https://www.khanacademy.org/humanities/world-history/world-history-beginnings/birth-of-religion/a/the-first-religions" },
  { subcat: "Philosophy & Ethics" },
  { name: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu" },
  { name: "Internet Encyclopedia of Philosophy", url: "https://iep.utm.edu" },
  { name: "Philosophy Bro — Accessible Philosophy", url: "https://www.philosophybro.com" },
  { name: "Daily Stoic — Stoic Philosophy", url: "https://dailystoic.com" },
  { subcat: "Wellbeing & Meaning" },
  { name: "TED Talks — Philosophy & Religion", url: "https://www.ted.com/topics/philosophy" },
];
const RELIGION_FAITH_PHILOSOPHY_MORE: MaybeSubcat[] = [
  { subcat: "Christian Campus" },
  { name: "BibleGateway — Bible Study Online", url: "https://www.biblegateway.com" },
  { name: "Christianity Today — Faith & Culture", url: "https://www.christianitytoday.com" },
  { name: "United States Conference of Catholic Bishops", url: "https://www.usccb.org" },
  { name: "Vatican — Official Catholic Resources", url: "https://www.vatican.va" },
  { name: "Luther.edu — Lutheran Faith Resources", url: "https://www.luther.edu" },
  { name: "UMC — United Methodist Church", url: "https://www.umc.org" },
  { name: "Presbyterian Church USA", url: "https://www.pcusa.org" },
  { name: "The Episcopal Church", url: "https://www.episcopalchurch.org" },
  { name: "Southern Baptist Convention Resources", url: "https://www.sbc.net" },
  { name: "Christianity.com — Bible & Devotionals", url: "https://www.christianity.com" },
  { subcat: "Diverse Faith Traditions" },
  { name: "IslamicFinder — Prayer Times & Quran", url: "https://www.islamicfinder.org" },
  { name: "Quran.com — Read & Listen to Quran", url: "https://quran.com" },
  { name: "Islamic Society of North America (ISNA)", url: "https://www.isna.net" },
  { name: "Yaqeen Institute — Islamic Research", url: "https://yaqeeninstitute.org" },
  { name: "SeekersGuidance — Islamic Learning", url: "https://seekersguidance.org" },
  { name: "My Jewish Learning — Torah & Traditions", url: "https://www.myjewishlearning.com" },
  { name: "Chabad.org — Jewish Resources", url: "https://www.chabad.org" },
  { name: "Union for Reform Judaism", url: "https://urj.org" },
  { name: "United Synagogue of Conservative Judaism", url: "https://www.uscj.org" },
  { name: "Jewish Virtual Library", url: "https://www.jewishvirtuallibrary.org" },
  { name: "Hinduism Today — Cultural Magazine", url: "https://www.hinduismtoday.com" },
  { name: "Hindu American Foundation", url: "https://www.hinduamerican.org" },
  { name: "Vedanta Society — Vedanta Philosophy", url: "https://www.vedanta.org" },
  { name: "Bhagavad Gita Online", url: "https://www.holy-bhagavad-gita.org" },
  { name: "Lion's Roar — Buddhist Wisdom", url: "https://www.lionsroar.com" },
  { name: "Dharma.org — Insight Meditation", url: "https://www.dharma.org" },
  { name: "BuddhaNet — Buddhist Education", url: "https://www.buddhanet.net" },
  { name: "Zen Mountain Monastery", url: "https://zmm.org" },
  { name: "Plum Village — Thich Nhat Hanh", url: "https://plumvillage.org" },
  { name: "Sikh Net — Sikh Resource Center", url: "https://www.sikhnet.com" },
  { name: "Sri Granth — Guru Granth Sahib", url: "https://www.srigranth.org" },
  { name: "Sikh Coalition", url: "https://www.sikhcoalition.org" },
  { name: "Native American Church Resources", url: "https://www.nativeamericanchurchofna.org" },
  { name: "Longhouse Media — Indigenous Spirituality", url: "https://www.longhousemedia.org" },
  { name: "Bahai.org — Bahai Faith", url: "https://www.bahai.org" },
  { name: "Interfaith Youth Core (IFYC)", url: "https://ifyc.org" },
  { name: "Parliament of World Religions", url: "https://parliamentofreligions.org" },
  { name: "Fetzer Institute — Love & Forgiveness", url: "https://fetzer.org" },
  { name: "Spirituality & Practice — Multifaith", url: "https://www.spiritualityandpractice.com" },
  { name: "Unitarian Universalist Association", url: "https://www.uua.org" },
  { subcat: "Secular & Philosophy" },
  { name: "Secular Student Alliance", url: "https://www.secularstudents.org" },
  { name: "Center for Contemplative Mind in Society", url: "https://www.contemplativemind.org" },
  { name: "Philosophy Now — Philosophy Magazine", url: "https://philosophynow.org" },
  { name: "Philosophy Pages — Western Philosophy", url: "https://www.philosophypages.com" },
  { name: "The School of Life — Life Philosophy", url: "https://www.theschooloflife.com" },
  { name: "Big Think — Philosophy & Ideas", url: "https://bigthink.com/series/the-big-think-interview" },
  { name: "Closer to Truth — Cosmos & Philosophy", url: "https://www.closertotruth.com" },
  { name: "Philosophy Talk — Radio Show & Podcast", url: "https://www.philosophytalk.org" },
  { name: "Existentialism — SparkNotes Philosophy", url: "https://www.sparknotes.com/philosophy" },
  { name: "Ethics Unwrapped — UT Austin", url: "https://ethicsunwrapped.utexas.edu" },
  { name: "Practical Ethics — Oxford University", url: "https://www.practicalethics.ox.ac.uk" },
  { name: "Markkula Center for Applied Ethics", url: "https://www.scu.edu/ethics" },
  { name: "Philosophy Foundation — UK Outreach", url: "https://www.philosophy-foundation.org" },
  { name: "Tao Te Ching — Laozi (Free Text)", url: "https://www.gutenberg.org/ebooks/216" },
  { name: "Confucius Institute Online", url: "https://www.chinese-ki.com" },
  { name: "Alan Watts Lectures — Eastern Philosophy", url: "https://www.alanwatts.org" },
  { name: "Zen Buddhism Resources — Shambhala", url: "https://www.shambhala.org" },
  { subcat: "Research & Academic" },
  { name: "MIT OpenCourseWare — Philosophy", url: "https://ocw.mit.edu/search/?d=Philosophy" },
  { name: "Yale Open Courses — Philosophy & Death", url: "https://oyc.yale.edu/death/phil-176" },
  { name: "Coursera — Buddhism & Modern Psychology", url: "https://www.coursera.org/learn/science-of-meditation" },
  { name: "edX — World Religions & Spirituality", url: "https://www.edx.org/search?q=religion" },
  { name: "FutureLearn — Philosophy Courses", url: "https://www.futurelearn.com/subjects/philosophy-and-religion-courses" },
  { name: "Udemy — Philosophy for Beginners", url: "https://www.udemy.com/topic/philosophy" },
  { name: "Goodreads — Philosophy & Religion Reading Lists", url: "https://www.goodreads.com/shelf/show/philosophy" },
  { name: "Project Gutenberg — Free Philosophy Texts", url: "https://www.gutenberg.org/ebooks/search/?query=philosophy&submit_search=Search+Catalog" },
  { name: "Open Library — Free Religion Books", url: "https://openlibrary.org/subjects/religion" },
  { name: "IFYC Campus Programs — Interfaith", url: "https://ifyc.org/campuses" },
  { name: "Catholic Campus Ministry Association", url: "https://www.ccmanet.org" },
  { name: "Hillel International — Jewish Campus Life", url: "https://www.hillel.org" },
  { name: "Muslim Students Association — National", url: "https://msanational.org" },
  { name: "Campus Buddhist Fellowship", url: "https://bcbsdharma.org/student-resources" },
  { name: "Wesley Foundation — Methodist Campus Ministry", url: "https://gbhem.org/campus-ministry" },
  { name: "Newman Centers — Catholic Campus Ministry", url: "https://www.usccb.org/committees/catholic-education/campus-ministry" },
  { name: "Campus Crusade for Christ (CRU)", url: "https://www.cru.org" },
  { name: "InterVarsity Christian Fellowship", url: "https://intervarsity.org" },
  { name: "Chi Alpha Campus Ministries", url: "https://chialpha.com" },
  { name: "Greek Orthodox Archdiocese — Campus Ministry", url: "https://www.goarch.org" },
  { name: "Buddhist Chaplains — Soka University", url: "https://www.soka.edu/student-life/spiritual-life" },
  { name: "Secular Humanist Society", url: "https://humanists.international/community/organizations" },
  { subcat: "Mindfulness & Practice" },
  { name: "The Stoic Fellowship", url: "https://stoicfellowship.com" },
  { name: "Modern Stoicism — Stoic Week", url: "https://modernstoicism.com" },
  { name: "Stoicism Today", url: "https://stoicismtoday.com" },
  { name: "Stoic Meditations — Ryan Holiday", url: "https://ryanholiday.net/stoicism" },
  { name: "Marcus Aurelius — Meditations (Free)", url: "https://classics.mit.edu/Antoninus/meditations.html" },
  { name: "Epictetus Discourses (Online Text)", url: "https://www.gutenberg.org/ebooks/4135" },
  { name: "Seneca's Letters (Online Text)", url: "https://www.gutenberg.org/ebooks/900" },
  { name: "Center for Mindfulness — UMass Medical", url: "https://www.umassmed.edu/cfm" },
  { name: "Mindful.org — Mindfulness Resources", url: "https://www.mindful.org" },
  { name: "Insight Meditation Society", url: "https://www.dharma.org" },
  { name: "Contemplative Studies — Brown University", url: "https://www.brown.edu/academics/contemplative-studies" },
  { name: "Tara Brach — Meditation & Teachings", url: "https://www.tarabrach.com" },
  { name: "Jack Kornfield — Mindfulness & Buddhism", url: "https://jackkornfield.com" },
  { name: "Pema Chodron — Buddhist Teachings", url: "https://pemachodronfoundation.org" },
  { name: "Mindfulness-Based Cognitive Therapy", url: "https://www.mbct.com" },
  { name: "Daily Prayer — Pray.com", url: "https://pray.com" },
  { name: "Hallow — Catholic Prayer App", url: "https://hallow.com" },
  { name: "YouVersion Bible App", url: "https://www.bible.com" },
  { name: "Jewish Prayer Resources — Siddur", url: "https://www.jewishvirtuallibrary.org/jewish-prayer" },
  { name: "Islamicity — Quran & Hadith", url: "https://www.islamicity.org" },
  { name: "On Being — Krista Tippett Podcast", url: "https://onbeing.org" },
  { name: "Secular Buddhism Podcast", url: "https://secularbuddhism.com" },
  { name: "Pray.com — Christian Podcasts", url: "https://pray.com/podcasts" },
  { name: "Philosophy Bites — Free Podcast", url: "https://philosophybites.com" },
  { name: "Hi Phi Nation — Story-Driven Philosophy", url: "https://hiphination.org" },
  { name: "Philosophize This! — Podcast", url: "https://www.philosophizethis.org" },
  { name: "Making Sense — Sam Harris Philosophy", url: "https://www.samharris.org/podcasts" },
  { name: "The Rubin Report — Ideas & Culture", url: "https://rubinreport.com" },
  { name: "The Liturgists — Progressive Faith", url: "https://theliturgists.com" },
  { name: "The RobCast — Rob Bell Spirituality", url: "https://robbell.com/portfolio/robcast" },
  { subcat: "Character & Growth" },
  { name: "Positive Psychology — VIA Strengths", url: "https://www.viacharacter.org" },
  { name: "Greater Good Science Center — UC Berkeley", url: "https://greatergood.berkeley.edu" },
  { name: "Happiness Lab — Yale Course", url: "https://www.happinesslab.fm" },
  { name: "Purpose in Life — Stanford Center on Longevity", url: "https://longevity.stanford.edu" },
  { name: "The Purpose Institute", url: "https://www.thepurposeinstitute.com" },
  { name: "Viktor Frankl Institute — Logotherapy", url: "https://www.viktorfrankl.org" },
  { name: "Simon Sinek — Find Your Why", url: "https://simonsinek.com" },
  { name: "Character Strengths — VIA Survey", url: "https://www.viacharacter.org/surveys/takesurvey" },
  { name: "Flourishing — Harvard Divinity School", url: "https://hwpi.harvard.edu/humanflourishingprogram" },
  { name: "Positive Intelligence — Shirzad Chamine", url: "https://www.positiveintelligence.com" },
  { name: "Carol Dweck — Growth Mindset", url: "https://www.mindsetonline.com" },
  { name: "Angela Duckworth — Grit & Resilience", url: "https://angeladuckworth.com" },
  { name: "Martin Seligman — Positive Psychology", url: "https://www.authentichappiness.sas.upenn.edu" },
  { name: "Self-Compassion — Kristin Neff", url: "https://self-compassion.org" },
  { name: "Brené Brown — Vulnerability & Courage", url: "https://brenebrown.com" },
  { name: "Oprah's SuperSoul — Spiritual Growth", url: "https://www.oprah.com/app/super-soul.html" },
  { name: "Goop — Wellness & Spiritual Exploration", url: "https://goop.com" },
  { name: "Sounds True — Spiritual Audio Resources", url: "https://www.soundstrue.com" },
  { name: "Tricycle — Buddhist Teachings", url: "https://tricycle.org" },
  { name: "Parabola — Myth & Meaning", url: "https://parabola.org" },
];

// ── Consumer Rights & Whistleblower Protection ──
const CONSUMER_RIGHTS: MaybeSubcat[] = [
  { subcat: "Federal Agencies" },
  { name: "CFPB — Consumer Financial Protection Bureau", url: "https://www.consumerfinance.gov" },
  { name: "FTC — Federal Trade Commission Consumer Info", url: "https://consumer.ftc.gov" },
  { name: "ED OIG Hotline — Report Fraud/Waste/Abuse", url: "https://www2.ed.gov/about/offices/list/oig/hotline.html" },
  { name: "FTC Identity Theft Resources", url: "https://www.identitytheft.gov" },
  { name: "BBB — Better Business Bureau", url: "https://www.bbb.org" },
  { name: "USA.gov — File a Consumer Complaint", url: "https://www.usa.gov/consumer-complaints" },
  { name: "State Attorney General — Consumer Protection", url: "https://www.naag.org/find-my-ag" },
  { subcat: "Financial Aid Disputes" },
  { name: "CFPB Student Loan Complaint Portal", url: "https://www.consumerfinance.gov/complaint" },
  { name: "ED Feedback System — Ombudsman", url: "https://studentaid.gov/feedback-center" },
  { name: "FSA Ombudsman (Student Loan Disputes)", url: "https://studentaid.gov/feedback-center" },
];
const CONSUMER_RIGHTS_MORE: MaybeSubcat[] = [
  { subcat: "Consumer Financial Protection" },
  { name: "CFPB — Know Before You Owe (Student Loans)", url: "https://www.consumerfinance.gov/paying-for-college" },
  { name: "CFPB — Paying for College Tool", url: "https://www.consumerfinance.gov/paying-for-college" },
  { name: "CFPB — Private Student Loan Complaints", url: "https://www.consumerfinance.gov/complaint" },
  { name: "CFPB — Servicer Complaint Database", url: "https://www.consumerfinance.gov/data-research/consumer-complaints" },
  { name: "Federal Reserve — Consumer Resources", url: "https://www.federalreserve.gov/consumerscommunities.htm" },
  { name: "NCUA — Credit Union Consumer Protection", url: "https://www.ncua.gov/consumers" },
  { name: "OCC — Bank Customer Assistance", url: "https://www.helpwithmybank.gov" },
  { name: "FDIC — Deposit Insurance & Consumer Info", url: "https://www.fdic.gov/consumers" },
  { name: "SEC — Investor Protection Resources", url: "https://investor.gov" },
  { name: "FINRA — Investor Complaint Center", url: "https://www.finra.org/investors/have-problem/file-complaint" },
  { subcat: "Whistleblower Support" },
  { name: "Whistleblower Protection Program — OSHA", url: "https://www.whistleblowers.gov" },
  { name: "SEC Whistleblower Program", url: "https://www.sec.gov/whistleblower" },
  { name: "CFTC Whistleblower Program", url: "https://www.cftc.gov/whistleblower" },
  { name: "DOJ — False Claims Act / Qui Tam", url: "https://www.justice.gov/civil/frauds-section" },
  { name: "GAO — Federal Whistleblower Resources", url: "https://www.gao.gov/legal/other-legal-work/whistleblower-protection" },
  { name: "OSC — Office of Special Counsel (Federal)", url: "https://osc.gov" },
  { name: "Inspector General Whistleblower Resources", url: "https://www.ignet.gov/content/whistleblower-protection-resources" },
  { name: "ED OIG — Report Financial Aid Fraud", url: "https://www2.ed.gov/about/offices/list/oig/hotline.html" },
  { name: "FTC Reporting — Education Scams", url: "https://reportfraud.ftc.gov" },
  { name: "HHS Office of Inspector General Hotline", url: "https://oig.hhs.gov/fraud/report-fraud" },
  { subcat: "Legal Resources" },
  { name: "NELA — National Employment Law Association", url: "https://www.nela.org" },
  { name: "PEER — Government Accountability", url: "https://peer.org" },
  { name: "Government Accountability Project", url: "https://whistleblower.org" },
  { name: "National Whistleblower Center", url: "https://www.whistleblowers.org" },
  { name: "Taxpayers Against Fraud — False Claims Act", url: "https://www.taf.org" },
  { name: "Project on Government Oversight (POGO)", url: "https://www.pogo.org" },
  { name: "Public Citizen — Consumer & Civic Action", url: "https://www.citizen.org" },
  { name: "Alliance for Justice — Legal Resources", url: "https://www.afj.org" },
  { name: "National Consumer Law Center", url: "https://www.nclc.org" },
  { name: "NCLC — Student Loan Borrower Rights", url: "https://www.nclc.org/issues/student-loans.html" },
  // Financial Aid specific consumer rights
  { name: "Borrower Defense to Repayment (ED)", url: "https://studentaid.gov/borrower-defense" },
  { name: "School Closure Discharge (ED)", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/closed-school" },
  { name: "False Certification Discharge", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/false-certification" },
  { name: "Unpaid Refund Discharge", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/unpaid-refund" },
  { name: "Servicer Complaints — MOHELA", url: "https://www.mohela.com/customer-service" },
  { name: "Student Loan Ombudsman — CFPB", url: "https://www.consumerfinance.gov/student-loans" },
  { name: "NASFAA — Student Rights & Responsibilities", url: "https://www.nasfaa.org" },
  { name: "Net Price Calculator Accuracy — College Scorecard", url: "https://collegescorecard.ed.gov" },
  { name: "Gainful Employment Disclosure Tool", url: "https://studentaid.gov/gainful-employment" },
  { name: "TICAS — The Institute for College Access & Success", url: "https://ticas.org" },
  { subcat: "Digital Rights" },
  { name: "FERPA — Student Privacy Rights", url: "https://studentprivacy.ed.gov" },
  { name: "FOIA — Freedom of Information Act Requests", url: "https://www.foia.gov" },
  { name: "PrivacyRights.org — Consumer Data Rights", url: "https://privacyrights.org" },
  { name: "CCPA — California Consumer Privacy", url: "https://oag.ca.gov/privacy/ccpa" },
  { name: "FTC — Privacy Consumer Information", url: "https://consumer.ftc.gov/privacy-identity-online-security" },
  { name: "Electronic Privacy Information Center (EPIC)", url: "https://epic.org" },
  { name: "Privacy International", url: "https://privacyinternational.org" },
  { name: "Data Privacy Day Resources", url: "https://staysafeonline.org/programs/data-privacy-week" },
  { name: "ED Office for Civil Rights (OCR)", url: "https://www2.ed.gov/about/offices/list/ocr/complaintintro.html" },
  { name: "OCR — File a Discrimination Complaint", url: "https://www2.ed.gov/about/offices/list/ocr/complaintintro.html" },
  { name: "EEOC — File an Employment Complaint", url: "https://www.eeoc.gov/filing-charge-discrimination" },
  { name: "DOJ Civil Rights Division", url: "https://www.justice.gov/crt" },
  { name: "HUD — Housing Discrimination Complaints", url: "https://www.hud.gov/topics/housing_discrimination" },
  { name: "ADA.gov — Disability Rights Complaints", url: "https://www.ada.gov/filing-a-complaint" },
  { name: "ACLU — Know Your Rights", url: "https://www.aclu.org/know-your-rights" },
  { name: "NAACP — Legal Defense Fund", url: "https://www.naacpldf.org" },
  { name: "MALDEF — Latino Civil Rights", url: "https://maldef.org" },
  { name: "Asian Americans Advancing Justice", url: "https://www.advancingjustice-aajc.org" },
  // Anonymous reporting & secure channels
  { name: "SecureDrop — Anonymous Tip to Media", url: "https://securedrop.org" },
  { name: "GlobalLeaks — Secure Whistleblowing Platform", url: "https://www.globaleaks.org" },
  { name: "EFF — Electronic Frontier Foundation", url: "https://www.eff.org" },
  { name: "Tor Project — Anonymous Browsing", url: "https://www.torproject.org" },
  { name: "Signal — Secure Messaging App", url: "https://signal.org" },
  { name: "ProtonMail — Encrypted Email", url: "https://proton.me" },
  { name: "EFF — Surveillance Self-Defense", url: "https://ssd.eff.org" },
  { name: "Reporter's Committee — Legal Defense", url: "https://www.rcfp.org" },
  { name: "Reporters Without Borders", url: "https://rsf.org" },
  { name: "Whistleblower Aid — Legal Support", url: "https://whistlebloweraid.org" },
  // Fraud & scam awareness
  { name: "FTC Scam Alerts", url: "https://consumer.ftc.gov/features/scam-alerts" },
  { name: "USA.gov — Student Financial Aid Scams", url: "https://www.usa.gov/student-aid-scams" },
  { name: "FBI — Financial Fraud", url: "https://www.fbi.gov/investigate/white-collar-crime/financial-crimes" },
  { name: "IRS — Tax Scams & Fraud", url: "https://www.irs.gov/newsroom/tax-scams-consumer-alerts" },
  { name: "AARP Fraud Watch Network", url: "https://www.aarp.org/money/scams-fraud" },
  { name: "Scholarship Scam Alert — FTC", url: "https://consumer.ftc.gov/articles/scholarship-and-financial-aid-scams" },
  { name: "Diploma Mill Awareness — ED", url: "https://www.ed.gov/accreditation" },
  { name: "College Scorecard — Verify Schools", url: "https://collegescorecard.ed.gov" },
  { name: "DAPIP — Accreditation Database", url: "https://ope.ed.gov/dapip" },
  { name: "Title IV School Eligibility — studentaid.gov", url: "https://studentaid.gov/understand-aid/eligibility/requirements/school-eligibility" },
  // Legal aid & free assistance
  { name: "LawHelp.org — Legal Aid by State", url: "https://www.lawhelp.org" },
  { name: "LSC — Legal Services Corporation", url: "https://www.lsc.gov" },
  { name: "ABA — Free Legal Answers", url: "https://www.lawhelp.org/dc/resource/american-bar-association-free-legal-answers" },
  { name: "Student Legal Services — Law School Clinics", url: "https://lawschool.westlaw.com" },
  { name: "Volunteer Lawyers Project", url: "https://vlpnet.org" },
];

const FINANCIAL_LITERACY: MaybeSubcat[] = [
  { subcat: "Budgeting & Money Basics" },
  { name: "CFPB — Your Money, Your Goals", url: "https://www.consumerfinance.gov/consumer-tools/money-as-you-grow" },
  { name: "NerdWallet Student Budgeting", url: "https://www.nerdwallet.com/article/finance/budgeting-for-college-students" },
  { name: "Mint Budgeting App", url: "https://mint.intuit.com" },
  { name: "YNAB (You Need A Budget)", url: "https://www.ynab.com" },
  { name: "Copilot Money", url: "https://copilot.money" },
];
const FINANCIAL_LITERACY_MORE: MaybeSubcat[] = [
  { subcat: "Budgeting Tools" },
  { name: "Rocket Money", url: "https://www.rocketmoney.com" },
  { name: "PocketGuard", url: "https://pocketguard.com" },
  { name: "Goodbudget (Envelope Method)", url: "https://goodbudget.com" },
  { name: "Every Dollar (Dave Ramsey)", url: "https://www.everydollar.com" },
  { name: "Honeydue (Couples/Roommates)", url: "https://www.honeydue.com" },
  { name: "Empower Personal Finance", url: "https://www.empower.com" },
  { name: "Tiller Money (Spreadsheet Budget)", url: "https://www.tillerhq.com" },
  { name: "Wealthfront Cash Account", url: "https://www.wealthfront.com/cash" },
  { name: "Marcus by Goldman Sachs (HYSA)", url: "https://www.marcus.com" },
  { name: "Ally Bank High-Yield Savings", url: "https://www.ally.com/bank/high-yield-cd" },
  { name: "SoFi Checking & Savings", url: "https://www.sofi.com/banking" },
  { name: "Chime (No-fee Banking)", url: "https://www.chime.com" },
  { name: "Current (Student-Friendly Bank)", url: "https://current.com" },
  { name: "Step (Student Debit/Banking)", url: "https://step.com" },
  { name: "Greenlight (Teen/Student Money)", url: "https://greenlightcard.com" },
  { subcat: "Financial Literacy Education" },
  { name: "Khan Academy — Personal Finance", url: "https://www.khanacademy.org/college-careers-more/personal-finance" },
  { name: "Next Gen Personal Finance (NGPF)", url: "https://www.ngpf.org" },
  { name: "Investopedia Financial Literacy", url: "https://www.investopedia.com/financial-literacy-4689762" },
  { name: "CFPB Financial Well-Being Tools", url: "https://www.consumerfinance.gov/consumer-tools" },
  { name: "MyMoney.gov (US Govt)", url: "https://www.mymoney.gov" },
  { name: "Smart About Money (NEFE)", url: "https://www.smartaboutmoney.org" },
  { name: "Financial Industry Regulatory Authority (FINRA)", url: "https://www.finra.org/investors/financial-education" },
  { name: "Jump$tart Coalition", url: "https://www.jumpstart.org" },
  { name: "EverFi Financial Literacy Courses", url: "https://everfi.com/financial-literacy" },
  { name: "360 Degrees of Financial Literacy", url: "https://www.360financialliteracy.org" },
  { name: "Federal Reserve — Financial Education", url: "https://www.federalreserve.gov/consumers-communities/financial-literacy.htm" },
  { name: "FDIC Money Smart Program", url: "https://www.fdic.gov/resources/consumers/money-smart" },
  { name: "NCUA Financial Literacy Resources", url: "https://www.mycreditunion.gov/financial-literacy" },
  { name: "America Saves", url: "https://americasaves.org" },
  { name: "The Balance — Student Money", url: "https://www.thebalancemoney.com/student-finances-4161884" },
  { subcat: "Student Credit Cards" },
  { name: "Discover it® Student Card", url: "https://www.discover.com/credit-cards/student" },
  { name: "Capital One Quicksilver Student", url: "https://www.capitalone.com/credit-cards/students" },
  { name: "Chase Freedom Student Card", url: "https://creditcards.chase.com/freedom-credit-cards/student" },
  { name: "Bank of America® Student Card", url: "https://www.bankofamerica.com/credit-cards/student" },
  { name: "Deserve EDU Mastercard for Students", url: "https://www.deserve.com/edu" },
  { name: "Petal 2 Visa (No Credit History)", url: "https://www.petalcard.com" },
  { name: "OpenSky Secured Visa Card", url: "https://www.openskycc.com" },
  { name: "Secured Self Visa Credit Card", url: "https://www.self.inc/credit-builder-account" },
  { name: "NerdWallet — Best Student Credit Cards", url: "https://www.nerdwallet.com/best/credit-cards/student" },
  { name: "The Points Guy — Student Cards", url: "https://thepointsguy.com/cards/best/student-credit-cards" },
  { name: "Credit Karma — Student Cards", url: "https://www.creditkarma.com/credit-cards/student" },
  { name: "Bankrate — Student Credit Cards", url: "https://www.bankrate.com/credit-cards/student" },
  { name: "WalletHub Student Credit Cards", url: "https://wallethub.com/best-credit-cards/students" },
  { name: "US News — Student Credit Cards", url: "https://creditcards.usnews.com/student" },
  { name: "Experian Student Credit Guide", url: "https://www.experian.com/blogs/ask-experian/credit-card-advice/student-credit-cards" },
  { subcat: "Credit Scores & Building Credit" },
  { name: "Credit Karma (Free Credit Score)", url: "https://www.creditkarma.com" },
  { name: "Credit Sesame", url: "https://www.creditsesame.com" },
  { name: "AnnualCreditReport.com (Free Reports)", url: "https://www.annualcreditreport.com" },
  { name: "Experian Free Credit Score", url: "https://www.experian.com/free-credit-score" },
  { name: "Equifax Credit Education", url: "https://www.equifax.com/personal/credit-report-services" },
  { name: "TransUnion Credit Tools", url: "https://www.transunion.com/credit-help" },
  { name: "CFPB — Understanding Your Credit Score", url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-score-en-315" },
  { name: "Self — Credit Builder Loans", url: "https://www.self.inc" },
  { name: "Experian Boost (Add Bills to Score)", url: "https://www.experian.com/consumer-products/score-boost.html" },
  { name: "Kikoff Credit Builder", url: "https://www.kikoff.com" },
  { subcat: "Student Loan Repayment" },
  { name: "Federal Student Aid Loan Simulator", url: "https://studentaid.gov/loan-simulator" },
  { name: "NSLDS — Student Aid Data", url: "https://nslds.ed.gov" },
  { name: "studentaid.gov — Loan Summary", url: "https://studentaid.gov/aid-summary/loans" },
  { name: "studentaid.gov — IDR Plans", url: "https://studentaid.gov/manage-loans/repayment/plans/income-driven" },
  { name: "studentaid.gov — SAVE Plan", url: "https://studentaid.gov/announcements-events/save-plan" },
  { name: "studentaid.gov — PSLF", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/public-service" },
  { name: "PSLF Help Tool", url: "https://studentaid.gov/pslf" },
  { name: "studentaid.gov — Teacher Loan Forgiveness", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/teacher" },
  { name: "NerdWallet Student Loan Calculator", url: "https://www.nerdwallet.com/article/loans/student-loans/student-loan-calculator" },
  { name: "Bankrate Student Loan Payoff Calculator", url: "https://www.bankrate.com/loans/student-loans/student-loan-payoff-calculator" },
  { name: "SoFi Student Loan Refinancing", url: "https://www.sofi.com/refinance-student-loans" },
  { name: "Earnest Student Loan Refinancing", url: "https://www.earnest.com/student-loan-refinancing" },
  { name: "Laurel Road Student Refinancing", url: "https://www.laurelroad.com/refinance-student-loans" },
  { name: "CommonBond (Now Firstmark)", url: "https://www.firstmarkservices.com" },
  { name: "Summer — Loan Repayment Advisor", url: "https://www.meetsummer.org" },
  { subcat: "Student Debt Counseling" },
  { name: "NFCC — Student Debt Counseling", url: "https://www.nfcc.org/resources/student-loan-debt" },
  { name: "Savi — Student Loan Optimization", url: "https://www.saviforstudents.com" },
  { name: "IonTuition — Loan Management", url: "https://www.iontuition.com" },
  { name: "Candidly (Student Loan Platform)", url: "https://www.candidly.com" },
  { name: "studentloanhero.com (LendingTree)", url: "https://studentloanhero.com" },
  { name: "The Student Loan Planner", url: "https://www.studentloanplanner.com" },
  { name: "Debt.org — Student Loans", url: "https://www.debt.org/students" },
  { name: "National Student Legal Defense (NSLDN)", url: "https://studentdefense.org" },
  { name: "Student Borrower Protection Center", url: "https://protectborrowers.org" },
  { name: "CFPB — Student Loans", url: "https://www.consumerfinance.gov/consumer-tools/student-loans" },
  { subcat: "Investing & Wealth Building" },
  { name: "Acorns (Micro-Investing)", url: "https://www.acorns.com" },
  { name: "Stash (Beginner Investing)", url: "https://www.stash.com" },
  { name: "Robinhood (Commission-Free Trading)", url: "https://robinhood.com" },
  { name: "Fidelity Youth Account", url: "https://www.fidelity.com/go/youth-account/overview" },
  { name: "Schwab Starter Kit", url: "https://www.schwab.com/starter-kit" },
  { name: "Vanguard — Beginner Investing", url: "https://investor.vanguard.com/investor-resources-education/beginner-investing" },
  { name: "Betterment (Robo-Advisor)", url: "https://www.betterment.com" },
  { name: "Wealthfront (Robo-Advisor)", url: "https://www.wealthfront.com" },
  { name: "M1 Finance", url: "https://www.m1finance.com" },
  { name: "Motley Fool — Investing Basics", url: "https://www.fool.com/investing/how-to-invest" },
  { name: "Investopedia — Investing for Beginners", url: "https://www.investopedia.com/investing-for-beginners-4770753" },
  { name: "NerdWallet — How to Invest", url: "https://www.nerdwallet.com/article/investing/how-to-start-investing" },
  { name: "IRS — Roth IRA for Students", url: "https://www.irs.gov/retirement-plans/roth-iras" },
  { name: "SIPC — Investor Protection", url: "https://www.sipc.org" },
  { name: "SEC — Investor.gov Beginner Tools", url: "https://www.investor.gov/introduction-investing" },
  { subcat: "Side Income & Gig Economy" },
  { name: "Upwork (Freelancing)", url: "https://www.upwork.com" },
  { name: "Fiverr (Gig Services)", url: "https://www.fiverr.com" },
  { name: "Taskrabbit (Local Tasks)", url: "https://www.taskrabbit.com" },
  { name: "DoorDash (Delivery Gigs)", url: "https://www.doordash.com/dasher/signup" },
  { name: "Instacart Shopper", url: "https://shoppers.instacart.com" },
  { name: "Rover (Pet Sitting)", url: "https://www.rover.com/become-a-sitter" },
  { name: "Chegg Tutors (Now Learner)", url: "https://www.chegg.com/tutors" },
  { name: "Wyzant (Private Tutoring)", url: "https://www.wyzant.com/become_a_tutor" },
  { name: "Rev (Transcription & Captions)", url: "https://www.rev.com/freelancers" },
  { name: "Amazon MTurk (Micro Tasks)", url: "https://www.mturk.com" },
  { subcat: "Money & Mental Health" },
  { name: "NAMI — Money & Mental Health", url: "https://www.nami.org/Blogs/NAMI-Blog/March-2019/How-Mental-Health-Affects-Financial-Health" },
  { name: "Money & Mental Health Policy Institute", url: "https://www.moneyandmentalhealth.org" },
  { name: "CFPB — Financial Well-Being Scale", url: "https://www.consumerfinance.gov/consumer-tools/financial-well-being" },
  { name: "The Financial Therapy Association", url: "https://financialtherapyassociation.org" },
  { name: "National Alliance on Mental Illness (NAMI)", url: "https://www.nami.org" },
  { name: "JED Foundation — Student Mental Health", url: "https://jedfoundation.org" },
  { name: "Active Minds — Campus Mental Health", url: "https://www.activeminds.org" },
  { name: "Thriveworks (Online Therapy)", url: "https://thriveworks.com" },
  { name: "BetterHelp (Online Counseling)", url: "https://www.betterhelp.com" },
  { name: "SAMHSA Helpline (Free)", url: "https://www.samhsa.gov/find-help/national-helpline" },
  { subcat: "Basic Needs & Housing" },
  { name: "HUD — Student Housing Resources", url: "https://www.hud.gov/topics/housing_assistance" },
  { name: "USDA — SNAP Eligibility for Students", url: "https://www.fns.usda.gov/snap/eligibility" },
  { name: "College & University Food Bank Alliance", url: "https://cufba.org" },
  { name: "Swipe Out Hunger", url: "https://swipehunger.org" },
  { name: "Single Stop (Basic Needs Navigation)", url: "https://singlestop.org" },
  { name: "United Way 211 (Local Resources)", url: "https://www.211.org" },
  { name: "Benefits.gov (Federal Benefits Finder)", url: "https://www.benefits.gov" },
  { name: "National Homelessness Hotline", url: "https://www.nationalhomeless.org/factsheets/students.html" },
  { name: "WIC Program (Women, Infants, Children)", url: "https://www.fns.usda.gov/wic" },
  { name: "Medicaid Student Coverage Info", url: "https://www.medicaid.gov/medicaid/eligibility/index.html" },
  { subcat: "Tax Resources for Students" },
  { name: "IRS — Tax Benefits for Education", url: "https://www.irs.gov/newsroom/tax-benefits-for-education-information-center" },
  { name: "IRS Free File (Free Tax Filing)", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free" },
  { name: "VITA — Free Tax Prep for Low Income", url: "https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers" },
  { name: "TurboTax Student Guide", url: "https://turbotax.intuit.com/tax-tips/college-and-education" },
  { name: "H&R Block Student Tax Guide", url: "https://www.hrblock.com/tax-center/income/other-income/tax-tips-for-college-students" },
  { name: "TaxAct College Student Center", url: "https://www.taxact.com/tax-information/college-students" },
  { name: "1098-E Student Loan Interest Guide", url: "https://studentaid.gov/resources/prepare-for-college/students/funding/tax-benefits" },
  { name: "IRS AOTC — American Opportunity Credit", url: "https://www.irs.gov/credits-deductions/individuals/education-credits-aotc-llc" },
  { name: "IRS Publication 970 — Tax Benefits for Education", url: "https://www.irs.gov/forms-pubs/about-publication-970" },
  { name: "FreeTaxUSA (Low-Cost Filing)", url: "https://www.freetaxusa.com" },
  { subcat: "Career & Salary Planning" },
  { name: "LinkedIn Jobs & Career Planning", url: "https://www.linkedin.com/jobs" },
  { name: "Handshake (College Career Platform)", url: "https://joinhandshake.com" },
  { name: "Indeed (Job Search)", url: "https://www.indeed.com" },
  { name: "Glassdoor — Salary Insights", url: "https://www.glassdoor.com/Salaries/index.htm" },
  { name: "Levels.fyi (Tech Salaries)", url: "https://www.levels.fyi" },
  { name: "Bureau of Labor Statistics — OOH", url: "https://www.bls.gov/ooh" },
  { name: "PayScale Salary Research", url: "https://www.payscale.com" },
  { name: "College Scorecard (ROI by School)", url: "https://collegescorecard.ed.gov" },
  { name: "Georgetown CEW — College ROI Study", url: "https://cew.georgetown.edu/cew-reports/college-roi" },
  { name: "NACE — Career Outlook & Salary Data", url: "https://www.naceweb.org/job-market/compensation/salary-surveys" },
  { subcat: "Graduate School Finance" },
  { name: "GRE Fee Waiver Program", url: "https://www.ets.org/gre/fee-reduction.html" },
  { name: "FAFSA for Graduate School", url: "https://studentaid.gov/understand-aid/types/loans/grad-plus" },
  { name: "Grad PLUS Loan Info", url: "https://studentaid.gov/understand-aid/types/loans/plus/grad" },
  { name: "GradCafe — Funding & Fellowships", url: "https://thegradcafe.com" },
  { name: "ProFellow — Fellowships Database", url: "https://www.profellow.com" },
  { name: "Ford Foundation Fellowships", url: "https://nap.nationalacademies.org/fordfellowships" },
  { name: "NSF Grad Research Fellowship (GRFP)", url: "https://www.nsfgrfp.org" },
  { name: "Graduate Student Financial Aid Guide (NASFAA)", url: "https://www.nasfaa.org/Graduate_Students" },
  { name: "Cost of Grad School Calculator (FinAid)", url: "https://finaid.org/calculators/costprojector.phtml" },
  { name: "AAUW Fellowships & Grants", url: "https://www.aauw.org/resources/programs/fellowships-grants" },
  { subcat: "Student Discounts & Perks" },
  { name: "UNiDAYS — Student Discounts", url: "https://www.myunidays.com" },
  { name: "Student Beans — Student Discounts", url: "https://www.studentbeans.com/us" },
  { name: "ID.me Student Verification & Deals", url: "https://www.id.me/benefits" },
  { name: "Amazon Prime Student (Half Price)", url: "https://www.amazon.com/studentprime" },
  { name: "Spotify Student Discount", url: "https://www.spotify.com/us/student" },
  { name: "Apple Education Pricing", url: "https://www.apple.com/shop/go/product/education" },
  { name: "GitHub Student Developer Pack (Free)", url: "https://education.github.com/pack" },
  { name: "Microsoft Azure for Students (Free)", url: "https://azure.microsoft.com/en-us/free/students" },
  { name: "Adobe Creative Cloud — Student Plan", url: "https://www.adobe.com/creativecloud/buy/students.html" },
  { name: "Student Advantage Discount Network", url: "https://studentadvantage.com" },
  { subcat: "Consumer Protection & Rights" },
  { name: "CFPB — Know Before You Owe (Student Loans)", url: "https://www.consumerfinance.gov/paying-for-college" },
  { name: "FTC — Avoiding Financial Aid Scams", url: "https://consumer.ftc.gov/articles/scholarship-scams" },
  { name: "CFPB — Submit a Complaint", url: "https://www.consumerfinance.gov/complaint" },
  { name: "FTC Student Loan Scams Alert", url: "https://consumer.ftc.gov/articles/student-loan-debt-relief-scams" },
  { name: "Debt.org — Know Your Rights", url: "https://www.debt.org/advice/rights" },
  { name: "National Debt Relief — Student Guide", url: "https://www.nationaldebtrelief.com/student-loans" },
  { name: "Student Loan Ombudsman (FSA)", url: "https://studentaid.gov/feedback-center" },
  { name: "CFPB Student Loan Ombudsman", url: "https://www.consumerfinance.gov/consumer-tools/student-loans/answers/key-terms/#student-loan-ombudsman" },
  { name: "Legal Aid for Students (LAWHELP)", url: "https://www.lawhelp.org" },
  { name: "Nolo — Student Legal Rights", url: "https://www.nolo.com/legal-encyclopedia/student-financial-aid" },
];

const ROLE_TIPS = [
  {
    role: "Student",
    icon: GenieBottle,
    gradient: "from-indigo-500 to-violet-600",
    accent: "bg-indigo-500/15 ring-indigo-500/25",
    tips: [
      { text: "Before going through a college's FA process, ask me to generate an estimated financial aid offer letter.", prompt: "Before I go through a college's financial aid process, can you generate an estimated financial aid offer letter for me based on my family income, school type, and enrollment status?" },
      { text: "Ask me to break down your financial aid offer letter line by line — grants, loans, and work-study explained.", prompt: "Can you explain my financial aid offer letter and break down each award type — grants, loans, and work-study?" },
      { text: "Compare net costs across multiple schools you're considering by sharing each award letter.", prompt: "Help me compare financial aid packages from two schools to find the best net price." },
      { text: "Get plain-English answers to any FAFSA question, including EFC vs. SAI and dependency rules.", prompt: "What is the difference between EFC and SAI under FAFSA Simplification, and how does it affect my aid?" },
      { text: "Understand how withdrawing mid-semester affects your aid and what you may owe back.", prompt: "If I withdraw from school this semester, how will it affect my financial aid and will I owe money back?" },
      { text: "Explore scholarship strategies, income-driven repayment plans, and loan forgiveness programs.", prompt: "What loan forgiveness programs am I eligible for as a student, and how do income-driven repayment plans work?" },
      { text: "Upload any documents and ask me to review, analyze, inform and/or clarify.", prompt: "I'm uploading a document — please review it, analyze the key financial aid information, and clarify anything that may be confusing or important for me to understand." },
    ],
  },
  {
    role: "Parent",
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
    accent: "bg-blue-500/15 ring-blue-500/25",
    tips: [
      { text: "Learn how your household income, assets, and family size are weighed in the financial aid formula.", prompt: "How does my household income, assets, and family size affect my child's financial aid eligibility?" },
      { text: "Compare Parent PLUS Loans against private loans — interest rates, limits, and forgiveness options.", prompt: "What are the differences between a Parent PLUS Loan and a private student loan, including rates and forgiveness?" },
      { text: "Understand how 529 plan balances are reported on the FAFSA and their impact on aid.", prompt: "How does a 529 college savings plan affect my child's financial aid eligibility on the FAFSA?" },
      { text: "Navigate the new divorced/separated parent rules introduced by FAFSA Simplification.", prompt: "How did FAFSA Simplification change the rules for divorced or separated parents, and which parent must file?" },
      { text: "Maximize the American Opportunity Tax Credit (AOTC) to reduce your tax bill.", prompt: "How does the American Opportunity Tax Credit work, who qualifies, and how do I claim it?" },
    ],
  },
  {
    role: "Administrator",
    icon: ClipboardList,
    gradient: "from-emerald-500 to-teal-600",
    accent: "bg-emerald-500/15 ring-emerald-500/25",
    tips: [
      { text: "Run a tentative R2T4 calculation before a student officially withdraws to advise them accurately.", prompt: "Run a tentative R2T4 calculation — semester starts Aug 26, ends Dec 13, student plans to withdraw Oct 10, Pell $3,698 disbursed." },
      { text: "Generate a compliant FA offer letter for any school, award year, or enrollment status in seconds.", prompt: "Generate a financial aid offer letter for a dependent sophomore at a public university with an AGI of $45,000 for 2025-26." },
      { text: "Get a complete SAP policy checklist with required components and suggested appeal language.", prompt: "What are all the required components of a Satisfactory Academic Progress policy and what should an appeal process include?" },
      { text: "Prepare for FSA compliance audits and program reviews with common finding patterns.", prompt: "What are the most common FSA audit findings and how should I prepare my office for an ED program review?" },
      { text: "Stay current on regulatory changes — FAFSA Simplification, gainful employment, and legislative updates.", prompt: "Summarize the most important regulatory changes in Title IV financial aid for 2024-25 and 2025-26 that administrators need to know." },
    ],
  },
  {
    role: "Leader",
    icon: Landmark,
    gradient: "from-violet-500 to-purple-600",
    accent: "bg-violet-500/15 ring-violet-500/25",
    tips: [
      { text: "Get a compliance risk summary across all Title IV program areas for board or leadership reporting.", prompt: "Give me a high-level compliance risk summary across Title IV program areas that I can present to institutional leadership." },
      { text: "Assess the financial impact of the One Big Beautiful Bill on your institution's aid programs.", prompt: "What are the key provisions of the One Big Beautiful Bill that affect institutional financial aid programs and what is the projected impact?" },
      { text: "Benchmark your institution's aid packaging strategy against peer institutions.", prompt: "How do aid packaging strategies at community colleges compare to 4-year public and private institutions?" },
      { text: "Understand cohort default rate trends and strategies to reduce institutional exposure.", prompt: "What strategies can an institution use to reduce its cohort default rate and what are the consequences of a high CDR?" },
      { text: "Evaluate the implications of gainful employment and financial value transparency rules.", prompt: "Explain the gainful employment and financial value transparency regulations and their implications for our institution's programs." },
      { text: "Ask me how your institution can be more student centric and better student experience.", prompt: "How can our institution become more student-centric and improve the overall student experience in financial aid services?" },
      { text: "Ask me to clarify an audit finding, or rule/regulation.", prompt: "Please clarify the following audit finding or regulatory requirement for me — explain it in plain language, identify the relevant 34 CFR citation, and describe the corrective steps an institution should take." },
      { text: "Ask me to help you build an AI Excel spreadsheet for financial aid reporting or analysis.", prompt: "Help me build an Excel spreadsheet for financial aid reporting. Generate a fully structured Excel-compatible spreadsheet with formulas, column headers, and sample data. I need it for [describe your use case — e.g., R2T4 tracking, SAP monitoring, award reconciliation, CDR analysis, etc.]." },
    ],
  },
  {
    role: "Auditor",
    icon: ShieldCheck,
    gradient: "from-rose-500 to-pink-600",
    accent: "bg-rose-500/15 ring-rose-500/25",
    tips: [
      { text: "Generate GAGAS-format finding documentation templates for any Title IV program area.", prompt: "Generate a GAGAS-format finding documentation template for an R2T4 compliance finding with criteria, condition, cause, effect, and recommendation." },
      { text: "Get detailed testing attribute checklists for R2T4, verification, and Pell accuracy.", prompt: "Give me a complete testing attribute checklist for auditing R2T4 calculations including all key items to verify." },
      { text: "Review common OIG audit findings and root cause patterns by program area.", prompt: "What are the most frequent OIG audit findings in financial aid and what root causes are typically identified?" },
      { text: "Look up the exact 34 CFR citations relevant to a specific compliance issue.", prompt: "What are the specific 34 CFR regulatory citations I should reference when auditing Return to Title IV compliance?" },
      { text: "Build a program review preparation checklist aligned to the ED program review guide.", prompt: "Create a comprehensive program review preparation checklist aligned to the Department of Education's program review procedures." },
    ],
  },
];

const ROLE_OPTIONS = [
  { label: "Student",       icon: GraduationCap,  color: "text-sky-400",    ring: "ring-sky-500/40",    bg: "bg-sky-500/15"    },
  { label: "Parent",        icon: Users,          color: "text-blue-400",   ring: "ring-blue-500/40",   bg: "bg-blue-500/15"   },
  { label: "Administrator", icon: ClipboardList,  color: "text-emerald-400",ring: "ring-emerald-500/40",bg: "bg-emerald-500/15"},
  { label: "Leader",        icon: Landmark,       color: "text-violet-400", ring: "ring-violet-500/40", bg: "bg-violet-500/15" },
  { label: "Auditor",       icon: ShieldCheck,    color: "text-rose-400",   ring: "ring-rose-500/40",   bg: "bg-rose-500/15"   },
];


// ─── Background ───────────────────────────────────────────────────────────────

function EducationalBackground({ isDark = true }: { isDark?: boolean }) {
  const darkParticles = [
    { top: "15%", left: "22%", size: 4, dur: "3.2s", delay: "0s" },
    { top: "68%", left: "8%",  size: 3, dur: "4.1s", delay: "0.7s" },
    { top: "42%", left: "78%", size: 5, dur: "3.7s", delay: "1.4s" },
    { top: "82%", left: "55%", size: 3, dur: "2.9s", delay: "0.3s" },
    { top: "28%", left: "91%", size: 4, dur: "4.5s", delay: "1.9s" },
    { top: "55%", left: "44%", size: 3, dur: "3.5s", delay: "0.9s" },
  ];

  if (!isDark) {
    // Bright mode — professional omni blue
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {/* Pure royal blue base — no green/teal component */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #0d1f45 0%, #152d6b 35%, #122660 65%, #0a1840 100%)" }} />

        {/* Blue + gold atmospheric orbs */}
        <div
          className="genie-orb absolute -top-64 -left-64 w-[900px] h-[900px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.09) 50%, transparent 70%)", "--orb-dur": "16s" } as React.CSSProperties}
        />
        <div
          className="genie-orb absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.08) 50%, transparent 70%)", "--orb-dur": "20s" } as React.CSSProperties}
        />
        <div
          className="genie-orb absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 65%)", "--orb-dur": "24s" } as React.CSSProperties}
        />
        <div
          className="genie-orb absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full blur-[110px]"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.10) 0%, transparent 65%)", "--orb-dur": "18s" } as React.CSSProperties}
        />

        {/* Gold + blue sparkle particles */}
        {[
          { top: "12%", left: "18%", size: 5, dur: "3.0s", delay: "0s" },
          { top: "70%", left: "10%", size: 3, dur: "4.2s", delay: "0.6s" },
          { top: "38%", left: "80%", size: 5, dur: "3.8s", delay: "1.3s" },
          { top: "85%", left: "52%", size: 4, dur: "2.8s", delay: "0.2s" },
          { top: "25%", left: "88%", size: 3, dur: "4.6s", delay: "1.8s" },
          { top: "58%", left: "42%", size: 4, dur: "3.4s", delay: "0.8s" },
          { top: "45%", left: "5%",  size: 3, dur: "3.9s", delay: "1.1s" },
          { top: "6%",  left: "65%", size: 4, dur: "3.2s", delay: "0.4s" },
        ].map((p, i) => (
          <div
            key={i}
            className="genie-particle absolute rounded-full"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              background: i % 2 === 0
                ? "radial-gradient(circle, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.5) 100%)"
                : "radial-gradient(circle, rgba(147,197,253,0.92) 0%, rgba(96,165,250,0.45) 100%)",
              boxShadow: i % 2 === 0
                ? "0 0 7px 2px rgba(251,191,36,0.42)"
                : "0 0 7px 2px rgba(147,197,253,0.38)",
              "--p-dur": p.dur,
              animationDelay: p.delay,
            } as React.CSSProperties}
          />
        ))}

        {/* SVG: educational background — dot grid + constellations + academic symbols */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="edu-dots-b" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.7" fill="#93c5fd" fillOpacity="0.18" />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#edu-dots-b)" />

          {/* Constellation cluster — top left */}
          <g stroke="#93c5fd" strokeOpacity="0.18" strokeWidth="0.8" fill="none">
            <line x1="160" y1="80"  x2="230" y2="130" />
            <line x1="230" y1="130" x2="310" y2="105" />
            <line x1="310" y1="105" x2="370" y2="160" />
            <line x1="370" y1="160" x2="420" y2="120" />
            <line x1="230" y1="130" x2="280" y2="190" />
          </g>
          <g fill="#bfdbfe" fillOpacity="0.35">
            <circle cx="160" cy="80"  r="1.8" /><circle cx="230" cy="130" r="2.4" />
            <circle cx="310" cy="105" r="1.6" /><circle cx="370" cy="160" r="2.0" />
            <circle cx="420" cy="120" r="1.4" /><circle cx="280" cy="190" r="1.6" />
          </g>

          {/* Constellation cluster — top right */}
          <g stroke="#93c5fd" strokeOpacity="0.18" strokeWidth="0.8" fill="none">
            <line x1="1060" y1="60"  x2="1140" y2="100" />
            <line x1="1140" y1="100" x2="1210" y2="70"  />
            <line x1="1210" y1="70"  x2="1280" y2="130" />
            <line x1="1140" y1="100" x2="1170" y2="175" />
            <line x1="1280" y1="130" x2="1320" y2="80"  />
          </g>
          <g fill="#bfdbfe" fillOpacity="0.35">
            <circle cx="1060" cy="60"  r="1.6" /><circle cx="1140" cy="100" r="2.2" />
            <circle cx="1210" cy="70"  r="1.8" /><circle cx="1280" cy="130" r="2.0" />
            <circle cx="1170" cy="175" r="1.4" /><circle cx="1320" cy="80"  r="1.6" />
          </g>

          {/* Constellation cluster — bottom left */}
          <g stroke="#93c5fd" strokeOpacity="0.18" strokeWidth="0.8" fill="none">
            <line x1="100" y1="620" x2="175" y2="680" />
            <line x1="175" y1="680" x2="250" y2="645" />
            <line x1="250" y1="645" x2="310" y2="710" />
            <line x1="175" y1="680" x2="160" y2="760" />
          </g>
          <g fill="#bfdbfe" fillOpacity="0.35">
            <circle cx="100" cy="620" r="1.6" /><circle cx="175" cy="680" r="2.2" />
            <circle cx="250" cy="645" r="1.8" /><circle cx="310" cy="710" r="1.4" />
            <circle cx="160" cy="760" r="1.6" />
          </g>

          {/* Constellation cluster — bottom right */}
          <g stroke="#93c5fd" strokeOpacity="0.18" strokeWidth="0.8" fill="none">
            <line x1="1100" y1="700" x2="1180" y2="740" />
            <line x1="1180" y1="740" x2="1260" y2="710" />
            <line x1="1260" y1="710" x2="1330" y2="770" />
            <line x1="1180" y1="740" x2="1200" y2="820" />
          </g>
          <g fill="#bfdbfe" fillOpacity="0.35">
            <circle cx="1100" cy="700" r="1.6" /><circle cx="1180" cy="740" r="2.0" />
            <circle cx="1260" cy="710" r="1.8" /><circle cx="1330" cy="770" r="1.4" />
            <circle cx="1200" cy="820" r="1.6" />
          </g>

          {/* Scattered star points */}
          <g fill="#bfdbfe" fillOpacity="0.28">
            <circle cx="520"  cy="140" r="1.4" /><circle cx="680"  cy="55"  r="1.6" />
            <circle cx="840"  cy="180" r="1.2" /><circle cx="960"  cy="90"  r="1.8" />
            <circle cx="440"  cy="400" r="1.4" /><circle cx="750"  cy="520" r="1.6" />
            <circle cx="1010" cy="430" r="1.2" /><circle cx="580"  cy="750" r="1.4" />
            <circle cx="880"  cy="800" r="1.6" /><circle cx="640"  cy="310" r="1.2" />
          </g>

          {/* Graduation cap — faint watermark, center */}
          <g transform="translate(680, 390)" stroke="#93c5fd" strokeOpacity="0.09" strokeWidth="1.2" fill="none">
            {/* Board top */}
            <polygon points="0,-28 40,-14 0,0 -40,-14" />
            {/* Brim base */}
            <ellipse cx="0" cy="-14" rx="40" ry="8" />
            {/* Tassel stem */}
            <line x1="40" y1="-14" x2="40" y2="12" />
            <line x1="40" y1="12"  x2="36" y2="24" />
            <line x1="40" y1="12"  x2="44" y2="24" />
          </g>

          {/* Open book — faint watermark, bottom center */}
          <g transform="translate(700, 760)" stroke="#93c5fd" strokeOpacity="0.08" strokeWidth="1.2" fill="none">
            <path d="M0,0 C-30,-8 -60,-8 -70,-4 L-70,30 C-60,26 -30,26 0,18" />
            <path d="M0,0 C 30,-8  60,-8  70,-4 L 70,30 C 60,26  30,26  0,18" />
            <line x1="0" y1="0" x2="0" y2="18" />
          </g>
        </svg>
      </div>
    );
  }

  // Dark mode — indigo/slate theme
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Deep navy base */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #08142e 0%, #0c1d3d 35%, #0a1f3a 65%, #071530 100%)" }} />

      {/* Animated atmospheric orbs */}
      <div
        className="genie-orb absolute -top-64 -left-64 w-[900px] h-[900px] rounded-full blur-[160px]"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.13) 0%, rgba(99,102,241,0.06) 50%, transparent 70%)", "--orb-dur": "16s" } as React.CSSProperties}
      />
      <div
        className="genie-orb absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, rgba(67,56,202,0.11) 0%, rgba(79,70,229,0.05) 50%, transparent 70%)", "--orb-dur": "20s" } as React.CSSProperties}
      />
      <div
        className="genie-orb absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 65%)", "--orb-dur": "24s" } as React.CSSProperties}
      />
      {/* Gold orbs */}
      <div
        className="genie-orb absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px]"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, rgba(217,119,6,0.04) 55%, transparent 70%)", "--orb-dur": "22s" } as React.CSSProperties}
      />
      <div
        className="genie-orb absolute top-0 right-0 w-[450px] h-[450px] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.03) 55%, transparent 70%)", "--orb-dur": "18s" } as React.CSSProperties}
      />

      {/* Sparkle particles */}
      {darkParticles.map((p, i) => (
        <div
          key={i}
          className="genie-particle absolute rounded-full"
          style={{
            top: p.top, left: p.left,
            width: p.size, height: p.size,
            background: "radial-gradient(circle, rgba(165,180,252,0.9) 0%, rgba(129,140,248,0.4) 100%)",
            boxShadow: "0 0 6px 2px rgba(165,180,252,0.35)",
            "--p-dur": p.dur,
            animationDelay: p.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* SVG: subtle dot grid */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="edu-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.7" fill="#a5b4fc" fillOpacity="0.12" />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#edu-dots)" />
      </svg>
    </div>
  );
}

// ─── X / Twitter profile embed ────────────────────────────────────────────────
function XProfileEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const existing = document.getElementById("twitter-widget-js");
    if (existing) {
      (window as any)?.twttr?.widgets?.load(containerRef.current);
      return;
    }
    const script = document.createElement("script");
    script.id = "twitter-widget-js";
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, []);
  return (
    <div ref={containerRef} className="rounded-lg overflow-hidden">
      <a
        className="twitter-timeline"
        data-theme="dark"
        data-height="420"
        data-chrome="noheader nofooter noborders transparent"
        href="https://twitter.com/one27__"
      >
        Posts by @one27__
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AidAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState("Student");
  const [activeActionRole, setActiveActionRole] = useState("Students");
  const ttsLang = "en-US";
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["sec-left-videos", "sec-videos-social"]));
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showMobileLeft, setShowMobileLeft] = useState(false);
  const [showMobileRight, setShowMobileRight] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showCookieNotice, setShowCookieNotice] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const wasVoiceInputRef = useRef(false);
  const [userTier, setUserTier] = useState<string>("FREE");
  const [dailyUsage, setDailyUsage] = useState<{ used: number; limit: number } | null>(null);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const { upgradeState, openUpgrade, closeUpgrade } = useUpgradeModal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (localStorage.getItem("genie-terms-accepted")) setShowDisclaimer(false);
    if (!localStorage.getItem("genie-cookie-accepted")) setShowCookieNotice(true);
    // Fetch tier + usage for feature gating, usage meter, and auth state
    fetch("/api/user/usage")
      .then((r) => r.json())
      .then((d) => {
        setUserTier(d.tier ?? "FREE");
        setDailyUsage({ used: d.used ?? 0, limit: d.limit ?? 10 });
        setIsAuthenticated(d.authenticated === true);
        setUserEmail(d.email ?? null);
      })
      .catch(() => {});
  }, []);

  const handleAccept = () => {
    localStorage.setItem("genie-terms-accepted", "true");
    setShowDisclaimer(false);
  };

  // Smart scroll: follow bottom only when user hasn't scrolled up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledUpRef.current = distFromBottom > 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Also scroll during streaming (new chunks arrive)
  useEffect(() => {
    if (isStreaming && !userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  });

  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  // Cancel streaming and audio on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.cancel();
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = "";
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleSection = useCallback((key: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    }), []);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        setAttachedFile({ name: file.name, content: base64, type: "image", mimeType: file.type });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        setAttachedFile({ name: file.name, content: e.target?.result as string, type: "text" });
      };
      reader.readAsText(file);
    }
  };

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recording is not supported in this browser. Please try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalText = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
        else interim += event.results[i][0].transcript;
      }
      setVoiceTranscript(finalText + interim);
    };
    recognition.onerror = () => { setIsRecording(false); setVoiceTranscript(""); };
    recognition.onend = () => {
      setIsRecording(false);
      setVoiceTranscript("");
      if (finalText.trim()) {
        wasVoiceInputRef.current = true;
        sendMessage(finalText.trim());
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setVoiceTranscript("");
  };

  const stopVoiceRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const goHome = useCallback(() => {
    readerRef.current?.cancel();
    readerRef.current = null;
    setIsStreaming(false);
    setStreamingMsgId(null);
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
    setMessages([]);
    setInput("");
  }, []);

  const stopStreaming = () => {
    readerRef.current?.cancel();
    readerRef.current = null;
    setIsStreaming(false);
    setStreamingMsgId(null);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && !attachedFile || isLoading || isStreaming) return;
    stopSpeaking();

    // Build display content and API content separately
    const displayContent = trimmed || (attachedFile ? `[Attached: ${attachedFile.name}]` : "");
    let apiContent: any;
    if (attachedFile?.type === "image") {
      apiContent = [
        { type: "image", source: { type: "base64", media_type: attachedFile.mimeType ?? "image/jpeg", data: attachedFile.content } },
        ...(trimmed ? [{ type: "text", text: trimmed }] : [{ type: "text", text: "Please review this image and provide relevant financial aid information or analysis." }]),
      ];
    } else if (attachedFile?.type === "text") {
      apiContent = `${trimmed}\n\n[Attached document: ${attachedFile.name}]\n\n${attachedFile.content}`;
    } else if (attachedFile?.type === "audio") {
      apiContent = `${trimmed}\n\n[Voice Recording Transcript]: ${attachedFile.content}`;
    } else {
      apiContent = trimmed;
    }

    const currentFile = attachedFile;
    setAttachedFile(null); // clear immediately after capturing

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent,
      apiContent,
      senderRole: selectedRole ?? undefined,
      attachedFileName: currentFile?.name,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();

    // Build API payload — inject role context, use apiContent for the API call
    const apiMessages = [...messages, userMsg].map((msg) => {
      const content = msg.apiContent ?? msg.content;
      if (msg.role === "user" && msg.senderRole) {
        if (typeof content === "string") {
          return { ...msg, content: `[I am a ${msg.senderRole}]\n\n${content}`, apiContent: undefined };
        }
        // multipart — prepend role as first text block
        return { ...msg, content: [{ type: "text", text: `[I am a ${msg.senderRole}]` }, ...content], apiContent: undefined };
      }
      return { ...msg, content, apiContent: undefined };
    });

    try {
      const res = await fetch("/api/aid-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const isGuest = !data.limit || data.limit <= 1;
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: isGuest
              ? "You've used your free preview question. **[Create a free account](/aid-agent)** to get 10 questions per day, or **[upgrade to Pro](/pricing)** for unlimited access."
              : `You've reached your daily limit (${data.limit ?? 10} messages/day). Resets at midnight. **[Upgrade to Pro](/pricing)** for unlimited conversations.`,
          },
        ]);
        setDailyUsage((prev) => prev ? { ...prev, used: prev.limit } : null);
        setShowLimitToast(true);
        return;
      }

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const reader = res.body!.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      setIsLoading(false);
      setIsStreaming(true);
      setStreamingMsgId(assistantId);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      let accumulatedContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
      // Auto-speak response when triggered by voice input
      if (wasVoiceInputRef.current && accumulatedContent.trim()) {
        wasVoiceInputRef.current = false;
        speakMessage(assistantId, accumulatedContent);
      }
    } catch (err) {
      console.error("Aid agent error:", err);
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingMsgId(null);
      readerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
  }, []);

  const speakMessage = async (msgId: string, text: string) => {
    // Toggle off
    if (speakingMsgId === msgId) { stopSpeaking(); return; }
    stopSpeaking();
    setSpeakingMsgId(msgId);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: ttsLang }),
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { URL.revokeObjectURL(url); setSpeakingMsgId(null); };
      audio.onerror = () => { URL.revokeObjectURL(url); setSpeakingMsgId(null); };
      await audio.play();
    } catch {
      // Fallback — Web Speech API
      if (typeof window === "undefined" || !window.speechSynthesis) { setSpeakingMsgId(null); return; }
      const plain = text
        .replace(/```[\s\S]*?```/g, "code block omitted")
        .replace(/`[^`]*`/g, "").replace(/#{1,6}\s/g, "")
        .replace(/[*_~>|]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n{2,}/g, ". ").replace(/\n/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(plain);
      utterance.lang = ttsLang;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const printMessage = (content: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    // Convert markdown to basic HTML for print
    const mdToHtml = (md: string) =>
      md
        // Code blocks
        .replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
        // Inline code
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // Bold + italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // H3
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        // H2
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        // H1
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        // Unordered list items
        .replace(/^[-*•] (.+)$/gm, "<li>$1</li>")
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>[\s\S]*?<\/li>)(\n(?!<li>)|$)/g, "<ul>$1</ul>")
        // Horizontal rule
        .replace(/^---+$/gm, "<hr>")
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Paragraphs (double newlines)
        .replace(/\n{2,}/g, "</p><p>")
        // Single newlines
        .replace(/\n/g, "<br>")
        // Wrap in paragraph
        .replace(/^(?!<[hup]|<pre|<hr)(.+)$/, "<p>$1</p>");

    const bodyHtml = mdToHtml(content);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>askGenie — FA Hub Response</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff;
      color: #1a1a2e;
      font-size: 13px;
      line-height: 1.65;
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      padding: 0 40px 60px;
    }

    /* ── Letterhead ── */
    .letterhead {
      background: linear-gradient(135deg, #4338ca 0%, #6d28d9 60%, #7c3aed 100%);
      margin: 0 -40px;
      padding: 28px 40px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .letterhead-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .letterhead-icon {
      background: rgba(255,255,255,0.18);
      border-radius: 14px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }

    .letterhead-title {
      color: #fff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      line-height: 1.1;
    }

    .letterhead-sub {
      color: rgba(255,255,255,0.65);
      font-size: 11px;
      font-weight: 500;
      margin-top: 3px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }

    .letterhead-date {
      color: rgba(255,255,255,0.7);
      font-size: 11px;
      text-align: right;
      line-height: 1.6;
    }

    /* ── Accent bar ── */
    .accent-bar {
      height: 3px;
      background: linear-gradient(90deg, #818cf8, #a78bfa, #c4b5fd);
      margin: 0 -40px 28px;
    }

    /* ── Content ── */
    .content h1 { font-size: 17px; font-weight: 700; margin: 20px 0 8px; color: #1e1b4b; }
    .content h2 { font-size: 15px; font-weight: 700; margin: 18px 0 7px; color: #312e81; border-bottom: 1px solid #e0e7ff; padding-bottom: 4px; }
    .content h3 { font-size: 13px; font-weight: 600; margin: 14px 0 5px; color: #3730a3; }
    .content p { margin: 0 0 10px; }
    .content ul { margin: 6px 0 10px 18px; }
    .content li { margin-bottom: 4px; }
    .content strong { font-weight: 600; color: #1e1b4b; }
    .content em { font-style: italic; color: #4338ca; }
    .content a { color: #4f46e5; text-decoration: underline; }
    .content hr { border: none; border-top: 1px solid #e0e7ff; margin: 16px 0; }
    .content code {
      background: #f0f0ff;
      border: 1px solid #d4d4f7;
      border-radius: 4px;
      padding: 1px 5px;
      font-family: 'Courier New', monospace;
      font-size: 11.5px;
      color: #3730a3;
    }
    .content pre {
      background: #f5f5ff;
      border: 1px solid #ddd6fe;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 10px 0;
      overflow-x: auto;
    }
    .content pre code {
      background: none;
      border: none;
      padding: 0;
      font-size: 11px;
      color: #1e1b4b;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #e0e7ff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      flex-shrink: 0;
    }

    .footer-disclaimer {
      font-size: 10px;
      color: #6b7280;
      line-height: 1.4;
    }

    .footer-brand {
      font-size: 10px;
      color: #a5b4fc;
      font-weight: 600;
      white-space: nowrap;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .letterhead { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .accent-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="letterhead">
      <div class="letterhead-left">
        <div class="letterhead-icon">🎓</div>
        <div>
          <div class="letterhead-title">askGenie</div>
          <div class="letterhead-sub">Student Aid Hub &nbsp;·&nbsp; AI-Powered Guidance</div>
        </div>
      </div>
      <div class="letterhead-date">
        ${dateStr}<br>${timeStr}
      </div>
    </div>

    <div class="accent-bar"></div>

    <div class="content">
      <p>${bodyHtml}</p>
    </div>

    <div class="footer">
      <div class="footer-left">
        <div class="footer-dot"></div>
        <div class="footer-disclaimer">
          General guidance only &mdash; not legal or financial advice.<br>
          Always verify with the <strong>FSA Handbook (IFAP)</strong>, 34 CFR, and your institution's policies.
        </div>
      </div>
      <div class="footer-brand">Genie &mdash; FA Hub</div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  const isBusy = isLoading || isStreaming;

  return (
    <>
      <style>{`
        .genie-scroll::-webkit-scrollbar { width: 4px; }
        .genie-scroll::-webkit-scrollbar-track { background: transparent; }
        .genie-scroll::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.35);
          border-radius: 9999px;
        }
        .genie-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.60);
        }
        .genie-scroll { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.35) transparent; }
        .genie-scroll-main::-webkit-scrollbar { width: 5px; }
        .genie-scroll-main::-webkit-scrollbar-track { background: rgba(10, 46, 122, 0.25); }
        .genie-scroll-main::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.30);
          border-radius: 9999px;
        }
        .genie-scroll-main::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.55);
        }
        .genie-scroll-main { scrollbar-width: thin; scrollbar-color: rgba(96,165,250,0.30) rgba(10,46,122,0.25); }
      `}</style>
      {showDisclaimer && (
        <div role="dialog" aria-modal="true" aria-labelledby="disclaimer-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#071035] border border-indigo-500/25 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-7 py-5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/15 shrink-0">
                <GenieBottle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 id="disclaimer-title" className="text-base font-bold text-white leading-tight">askGenie — Student Aid Hub</h2>
                <p className="text-xs text-white/75 mt-0.5">Developed by a 15-year Financial Aid Professional</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-7 py-6 space-y-4">
              <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25 px-4 py-3">
                <p className="text-sm text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300">Not professional advice.</strong> Genie provides general informational guidance only and does not constitute legal, financial, or professional advice. Always verify with your institution's financial aid office and the official FSA Handbook.
                </p>
              </div>

              <ul className="space-y-2.5 text-sm text-white/80">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>All responses are <strong className="text-white/80">AI-generated</strong> and may contain errors. Cross-reference with official sources.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Your conversations are <strong className="text-white/80">not stored or logged.</strong> Do not enter SSNs, student IDs, or FERPA-protected data.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>You must be <strong className="text-white/80">13 or older</strong> to use this service.</span>
                </li>
              </ul>

              <p className="text-xs text-white/30 leading-relaxed">
                By clicking "I Accept" you agree to our{" "}
                <Link href="/legal" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                  Terms of Service &amp; Privacy Policy
                </Link>
                . Powered by Claude AI (Anthropic) in compliance with Anthropic's usage policies.
              </p>
            </div>

            {/* Actions */}
            <div className="px-7 pb-6">
              <button
                onClick={handleAccept}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-900/40 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
              >
                I Accept — Continue to Genie
              </button>
            </div>
          </div>
        </div>
      )}

      <EducationalBackground isDark={isDark} />

      {/* Mobile panel backdrop */}
      {(showMobileLeft || showMobileRight) && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => { setShowMobileLeft(false); setShowMobileRight(false); }}
        />
      )}

      <div className="h-screen flex overflow-hidden" style={{ height: "100dvh" }}>

        {/* ── Sidebar ── */}
        <aside className={`${showMobileLeft ? "flex fixed inset-y-0 left-0 z-50" : "hidden"} lg:flex lg:static lg:z-auto flex-col w-72 shrink-0 border-r border-white/[0.10] bg-[#071035] lg:bg-white/[0.07] backdrop-blur-2xl`}>

          {/* Brand — Students & Parents */}
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/25 shrink-0">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-none mb-0.5">Student Aid HUB</p>
                <p className="text-sm font-semibold bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent leading-tight">
                  Students &amp; Parents
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable: Quick Actions + Resources */}
          <div className="flex-1 overflow-y-auto genie-scroll px-3 py-3 space-y-1.5">

            {/* ── Quick Actions (collapsible by role) ── */}
            {QUICK_ACTIONS_BY_ROLE.filter(({ role }) => role === "Students" || role === "Parents").map(({ role, color, items, more }) => {
              const isOpen = expandedSections.has(`lqa-open-${role}`);
              return (
                <div key={role} className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(`lqa-open-${role}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{role} Quick Actions</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="space-y-0.5 px-1.5 pb-2">
                      {[...items, ...more].map(({ icon: Icon, label, description, q }) => (
                        <button key={`lqa-${role}-${label}`} onClick={() => sendMessage(q)} disabled={isBusy}
                          title={label}
                          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left group transition-all duration-150 hover:bg-sky-500/20 ring-1 ring-transparent hover:ring-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                          <div className="mt-0.5 p-1.5 rounded-lg bg-white/[0.08] group-hover:bg-sky-500/30 transition-colors shrink-0">
                            <Icon className="h-3 w-3 text-white/60 group-hover:text-sky-300 transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white/85 group-hover:text-white transition-colors leading-tight">{label}</p>
                            <p className="text-[10px] text-white/55 mt-0.5 leading-tight">{description}</p>
                          </div>
                          <ChevronRight className="h-3 w-3 text-white/25 group-hover:text-sky-400 transition-colors shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Federal Student Aid ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-federal-students");
              const studentGroup = FEDERAL_RESOURCES.find(({ group }) => group === "Students & Parents");
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-federal-students")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Federal Student Aid</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && studentGroup && (
                    <div className="px-1.5 pb-2 space-y-0.5">
                      {studentGroup.links.map(({ name, url }) => (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                          title={name}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-sky-500/20 ring-1 ring-transparent hover:ring-sky-500/20 transition-all duration-150 group">
                          <span>{name}</span>
                          <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-sky-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Scholarship Search Engines ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-scholarships");
              const showMore = expandedSections.has("scholarships");
              const list = showMore ? [...SCHOLARSHIP_ENGINES, ...SCHOLARSHIP_ENGINES_MORE] : SCHOLARSHIP_ENGINES;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-scholarships")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Scholarship Search Engines</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-sky-500/20 ring-1 ring-transparent hover:ring-sky-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-sky-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("scholarships")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-indigo-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Student Centered Job Search Engines ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-jobs");
              const showMore = expandedSections.has("jobs");
              const list = showMore ? [...STUDENT_JOB_SEARCH, ...STUDENT_JOB_SEARCH_MORE] : STUDENT_JOB_SEARCH;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-jobs")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Student Job Search</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-emerald-500/20 ring-1 ring-transparent hover:ring-emerald-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-emerald-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("jobs")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-emerald-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Internship / Externship Search ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-internships");
              const showMore = expandedSections.has("internships");
              const list = showMore ? [...INTERNSHIP_SEARCH, ...INTERNSHIP_SEARCH_MORE] : INTERNSHIP_SEARCH;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-internships")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Internship / Externship Search</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-teal-500/20 ring-1 ring-transparent hover:ring-teal-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-teal-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("internships")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-teal-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Volunteer & Community Service ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-volunteer");
              const showMore = expandedSections.has("volunteer");
              const list = showMore ? [...VOLUNTEER_SEARCH, ...VOLUNTEER_SEARCH_MORE] : VOLUNTEER_SEARCH;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-volunteer")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80 text-left">Volunteer &amp; Community Service</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-violet-500/20 ring-1 ring-transparent hover:ring-violet-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-violet-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("volunteer")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-violet-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Resume Assistance ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-resume");
              const showMore = expandedSections.has("resume");
              const list = showMore ? [...RESUME_ASSISTANCE, ...RESUME_ASSISTANCE_MORE] : RESUME_ASSISTANCE;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-resume")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Resume Assistance</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-amber-500/20 ring-1 ring-transparent hover:ring-amber-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-amber-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("resume")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-amber-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View ${RESUME_ASSISTANCE_MORE.length} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── AI Literacy ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-ai-literacy");
              const showMore = expandedSections.has("ai-literacy");
              const list = showMore ? [...AI_LITERACY, ...AI_LITERACY_MORE] : AI_LITERACY;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-ai-literacy")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">AI Literacy</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-violet-500/20 ring-1 ring-transparent hover:ring-violet-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-violet-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("ai-literacy")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-violet-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View ${AI_LITERACY_MORE.length} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Financial Literacy ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-finlit");
              const showMore = expandedSections.has("finlit");
              const list = showMore ? [...FINANCIAL_LITERACY, ...FINANCIAL_LITERACY_MORE] : FINANCIAL_LITERACY;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-finlit")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Financial Literacy</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-sky-500/20 ring-1 ring-transparent hover:ring-sky-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-sky-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("finlit")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-sky-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View ${FINANCIAL_LITERACY_MORE.length} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Religion, Faith & Philosophy */}
            {(() => {
              const key = "lp-religion-faith";
              const moreKey = "lp-religion-faith-more";
              const isOpen = expandedSections.has(key);
              const isMoreOpen = expandedSections.has(moreKey);
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Spiritual Care & Life</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {RELIGION_FAITH_PHILOSOPHY.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-fuchsia-500/20 ring-1 ring-transparent hover:ring-fuchsia-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-fuchsia-400 shrink-0" />
                            </a>
                          );
                        })}
                        {isMoreOpen && RELIGION_FAITH_PHILOSOPHY_MORE.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-more-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-fuchsia-500/20 ring-1 ring-transparent hover:ring-fuchsia-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-fuchsia-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection(moreKey)}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-indigo-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${isMoreOpen ? "rotate-90" : "-rotate-90"}`} />
                        {isMoreOpen ? "Show less" : `View ${RELIGION_FAITH_PHILOSOPHY_MORE.length} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Consumer Rights & Whistleblower */}
            {(() => {
              const key = "lp-consumer-rights";
              const moreKey = "lp-consumer-rights-more";
              const isOpen = expandedSections.has(key);
              const isMoreOpen = expandedSections.has(moreKey);
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80 text-left">Student Rights & Consumer Protections</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {CONSUMER_RIGHTS.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-orange-500/20 ring-1 ring-transparent hover:ring-orange-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-orange-400 shrink-0" />
                            </a>
                          );
                        })}
                        {isMoreOpen && CONSUMER_RIGHTS_MORE.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-more-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-orange-500/20 ring-1 ring-transparent hover:ring-orange-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-orange-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection(moreKey)}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-indigo-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${isMoreOpen ? "rotate-90" : "-rotate-90"}`} />
                        {isMoreOpen ? "Show less" : `View ${CONSUMER_RIGHTS_MORE.length} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Mental Health Literacy — Students & Parents */}
            {(() => {
              const key = "lp-mental-health";
              const moreKey = "lp-mental-health-more";
              const isOpen = expandedSections.has(key);
              const isMoreOpen = expandedSections.has(moreKey);
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Student Wellness & Support</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {MENTAL_HEALTH_STUDENT.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-emerald-500/20 ring-1 ring-transparent hover:ring-emerald-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-emerald-400 shrink-0" />
                            </a>
                          );
                        })}
                        {isMoreOpen && MENTAL_HEALTH_STUDENT_MORE.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-more-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-emerald-500/20 ring-1 ring-transparent hover:ring-emerald-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-emerald-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection(moreKey)}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-indigo-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${isMoreOpen ? "rotate-90" : "-rotate-90"}`} />
                        {isMoreOpen ? "Show less" : `View ${MENTAL_HEALTH_STUDENT_MORE.length} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Private Student Loans ── */}
            {(() => {
              const isOpen = expandedSections.has("sec-loans");
              const showMore = expandedSections.has("loans");
              const list = showMore ? [...PRIVATE_STUDENT_LOANS, ...PRIVATE_STUDENT_LOANS_MORE] : PRIVATE_STUDENT_LOANS;
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("sec-loans")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Private Student Loans</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2">
                      <div className="space-y-0.5">
                        {list.map((item, idx) => {
                          if (isSubcat(item)) {
                            return <div key={`sc-${idx}`} className="px-3 pt-2.5 pb-0.5"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                          }
                          return (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                              title={item.name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-violet-500/20 ring-1 ring-transparent hover:ring-violet-500/20 transition-all duration-150 group">
                              <span>{item.name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-violet-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleSection("loans")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-violet-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show fewer" : `View ${PRIVATE_STUDENT_LOANS_MORE.length} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Videos ── */}
            {(() => {
              const key = "sec-left-videos";
              const moreKey = "sec-left-videos-more";
              const isOpen = expandedSections.has(key);
              const showMore = expandedSections.has(moreKey);
              const allIds = ["rhgwIhB58PA", "C5OJJD3Eytk", "kKvK2foOTJM"];
              const visibleIds = showMore ? allIds : allIds.slice(0, 1);
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Videos</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-2 pb-3 pt-1 space-y-3">
                      {visibleIds.map((id) => (
                        <div key={id} className="rounded-lg overflow-hidden w-full" style={{ aspectRatio: "16/9" }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${id}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="w-full h-full border-0"
                          />
                        </div>
                      ))}
                      <button onClick={() => toggleSection(moreKey)}
                        className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg text-[11px] font-medium text-sky-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show fewer" : `View ${allIds.length - 1} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>

          {/* Disclaimer footer */}
          <div className="shrink-0 px-4 py-3 border-t border-white/[0.07]">
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/70 leading-relaxed">
                General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex flex-1 flex-col min-w-0 min-h-0" aria-label="askGenie AI Assistant">

          {/* Header */}
          <header className="sticky top-0 z-30 shrink-0 border-b border-teal-500/[0.15] backdrop-blur-xl px-5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(90deg, rgba(7,30,61,0.92) 0%, rgba(10,37,64,0.95) 50%, rgba(7,30,61,0.92) 100%)" }}>
            {/* Left — mobile left-panel toggle (graduation cap) + home + theme toggle */}
            <div className="flex items-center gap-1.5 w-40">
              <button
                onClick={() => { setShowMobileLeft(!showMobileLeft); setShowMobileRight(false); }}
                title="Students & Parents panel"
                className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {showMobileLeft ? <X className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
              </button>
              <button
                onClick={goHome}
                title="Home"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-xs font-medium"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                title={isDark ? "Switch to bright mode" : "Switch to dark mode"}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            {/* Center — title */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center select-none">
              <h1 className="text-4xl font-black tracking-tight leading-none whitespace-nowrap genie-shimmer-text">
                askGenie
              </h1>
              <p className="hidden sm:block text-[10px] text-teal-300/50 font-medium tracking-wide mt-0.5 whitespace-nowrap">Your calm, expert student aid companion</p>
            </div>

            {/* Right — auth button + mobile right-panel toggle + new chat */}
            <div className="flex items-center gap-1.5 w-40 justify-end">
              {isAuthenticated ? (
                <Link
                  href="/account"
                  title={userEmail ?? "Your account"}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30 text-indigo-300 hover:bg-indigo-600/35 hover:text-white transition-colors text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <UserCircle className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline max-w-[72px] truncate">
                    {userEmail ? userEmail.split("@")[0] : "Account"}
                  </span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthDialogMode("signin"); setAuthDialogOpen(true); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 shadow-sm"
                  >
                    <LogIn className="h-3.5 w-3.5 shrink-0" />
                    <span>Sign In</span>
                  </button>
                  <Link
                    href="/account"
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] ring-1 ring-white/[0.12] text-white/60 hover:text-white hover:bg-white/[0.10] transition-colors text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <UserCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Account</span>
                  </Link>
                </>
              )}
              <button
                onClick={() => { setShowMobileRight(!showMobileRight); setShowMobileLeft(false); }}
                title="Admins & Auditors panel"
                className="xl:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {showMobileRight ? <X className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              </button>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="New chat"
                  className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/[0.08] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <SquarePen className="h-4 w-4" />
                </button>
              )}
            </div>
          </header>

          {/* Messages / Welcome */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 genie-scroll-main" role="log" aria-live="polite" aria-label="Conversation">
            {messages.length === 0 ? (

              /* ── Welcome state ── */
              <div className="relative flex flex-col items-center px-6 py-12 genie-fade-in-up overflow-hidden">

                {/* ── Shooting stars layer ── */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                  {/* Pulsing background orbs */}
                  {[
                    { w:320, h:320, top:"5%",  left:"10%",  color:"rgba(99,102,241,0.35)",  dur:"6s",  delay:"0s"   },
                    { w:260, h:260, top:"40%", left:"65%",  color:"rgba(139,92,246,0.28)",  dur:"8s",  delay:"1.5s" },
                    { w:200, h:200, top:"70%", left:"20%",  color:"rgba(251,191,36,0.18)",  dur:"7s",  delay:"3s"   },
                    { w:180, h:180, top:"15%", left:"75%",  color:"rgba(56,189,248,0.15)",  dur:"9s",  delay:"0.8s" },
                  ].map((o, i) => (
                    <div key={i} className="genie-orb-bg" style={{
                      width: o.w, height: o.h,
                      top: o.top, left: o.left,
                      background: o.color,
                      ["--dur" as any]: o.dur,
                      ["--delay" as any]: o.delay,
                    }} />
                  ))}

                  {/* Shooting stars — calm, multi-directional, infrequent */}
                  {[
                    // top-right → bottom-left (classic)
                    { len:110, thick:1.5, top:"6%",  left:"88%", dur:"3.8s", delay:"4s",   tx:"-480px", ty:"310px", angle:"-36deg" },
                    // top-left → bottom-right
                    { len:80,  thick:1,   top:"10%", left:"2%",  dur:"4.2s", delay:"19s",  tx:"420px",  ty:"260px", angle:"28deg"  },
                    // steep / near-vertical
                    { len:60,  thick:1,   top:"2%",  left:"55%", dur:"4.8s", delay:"34s",  tx:"-140px", ty:"500px", angle:"-72deg" },
                    // shallow / near-horizontal from right
                    { len:140, thick:2,   top:"30%", left:"96%", dur:"3.4s", delay:"51s",  tx:"-620px", ty:"120px", angle:"-12deg" },
                    // mid-screen top → bottom-left
                    { len:95,  thick:1.5, top:"5%",  left:"65%", dur:"4.0s", delay:"67s",  tx:"-380px", ty:"340px", angle:"-42deg" },
                    // far right, shallow upward angle
                    { len:75,  thick:1,   top:"55%", left:"98%", dur:"5.0s", delay:"83s",  tx:"-550px", ty:"-80px", angle:"8deg"   },
                    // bottom-left corner, rising
                    { len:90,  thick:1.5, top:"80%", left:"5%",  dur:"4.4s", delay:"98s",  tx:"360px",  ty:"-420px",angle:"-52deg" },
                  ].map((s, i) => (
                    <div key={i} className="genie-shooting-star" style={{
                      width: s.len,
                      top: s.top, left: s.left,
                      ["--thickness" as any]: `${s.thick}px`,
                      ["--dur" as any]: s.dur,
                      ["--delay" as any]: s.delay,
                      ["--tx" as any]: s.tx,
                      ["--ty" as any]: s.ty,
                      ["--angle" as any]: s.angle,
                    }} />
                  ))}

                  {/* Static twinkling pinpoint stars */}
                  {[
                    { w:2.5, h:2.5, top:"10%", left:"5%",  dur:"2.8s", delay:"0s"   },
                    { w:3,   h:3,   top:"6%",  left:"28%", dur:"3.5s", delay:"1s"   },
                    { w:2,   h:2,   top:"18%", left:"88%", dur:"2.2s", delay:"0.5s" },
                    { w:3,   h:3,   top:"52%", left:"94%", dur:"4s",   delay:"2s"   },
                    { w:2.5, h:2.5, top:"72%", left:"3%",  dur:"3s",   delay:"1.5s" },
                    { w:2,   h:2,   top:"82%", left:"52%", dur:"2.5s", delay:"0.8s" },
                    { w:3,   h:3,   top:"33%", left:"97%", dur:"3.8s", delay:"3s"   },
                    { w:2,   h:2,   top:"60%", left:"46%", dur:"2.9s", delay:"0.3s" },
                    { w:2.5, h:2.5, top:"25%", left:"15%", dur:"4.2s", delay:"2.4s" },
                    { w:2,   h:2,   top:"45%", left:"78%", dur:"3.1s", delay:"1.8s" },
                  ].map((s, i) => (
                    <div key={`tw-${i}`} className="genie-star-twinkle" style={{
                      width: s.w, height: s.h,
                      top: s.top, left: s.left,
                      ["--dur" as any]: s.dur,
                      ["--delay" as any]: s.delay,
                    }} />
                  ))}
                </div>
                {/* Hero badge */}
                <div className="relative mb-10 flex items-center justify-center" style={{width: 120, height: 120}}>
                  {/* Outermost ambient glow */}
                  <div className="absolute inset-0 rounded-full" style={{
                    background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
                    animation: "genie-halo-expand 3.2s ease-out infinite",
                  }} />
                  <div className="absolute inset-0 rounded-full" style={{
                    background: "radial-gradient(circle, rgba(167,139,250,0.13) 0%, transparent 65%)",
                    animation: "genie-halo-expand-2 3.2s ease-out infinite 1.6s",
                  }} />
                  {/* Soft outer ring */}
                  <div className="absolute inset-3 rounded-3xl" style={{
                    boxShadow: "0 0 0 1px rgba(139,92,246,0.25), 0 0 40px 10px rgba(99,102,241,0.15)",
                    animation: "genie-bottle-container-pulse 3s ease-in-out infinite",
                    borderRadius: "24px",
                  }} />
                  {/* Card */}
                  <div className="relative z-10 flex items-center justify-center rounded-3xl ring-1 ring-white/[0.12]"
                    style={{
                      width: 88, height: 88,
                      background: "linear-gradient(145deg, #3730a3 0%, #4f46e5 40%, #6d28d9 100%)",
                      boxShadow: "0 8px 32px rgba(79,70,229,0.45), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                      borderRadius: "22px",
                      animation: "genie-bottle-container-pulse 3s ease-in-out infinite",
                    }}>
                    {/* Inner shimmer layer */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden" style={{borderRadius:"22px"}}>
                      <div className="absolute inset-0" style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)",
                      }} />
                    </div>
                    <GenieBottle className="relative z-10 text-amber-100 genie-bottle-alive" style={{width:48, height:56}} />
                  </div>
                  {/* Live status badge */}
                  <div className="absolute z-20 flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{
                      bottom: 8, right: 4,
                      background: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
                      boxShadow: "0 2px 8px rgba(5,150,105,0.55), 0 0 0 2px rgba(8,20,46,0.9)",
                    }}>
                    <span className="block w-1.5 h-1.5 rounded-full bg-white" style={{animation:"genie-typing-dot 1.4s ease-in-out infinite"}} />
                    <span className="text-[9px] font-bold text-white tracking-wide uppercase">Live</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-white mb-2 text-center">
                  Student Aid Hub.{" "}
                  <span className="genie-shimmer-text">AI-Powered Guidance.</span>
                </h2>
                <p className="text-sm text-white/55 leading-relaxed max-w-lg text-center mb-2">
                  Your calm companion for everything student aid related.
                </p>
                <p className="text-xs text-white/30 leading-relaxed max-w-md text-center mb-6">
                  Financial aid offer letters · R2T4 calculations · FSA audits · Title IV · SAP · Scholarships
                </p>

                {/* ── Trust strip ── */}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-7 px-2">
                  {[
                    { icon: Award,       text: "Built by a 15-yr FA Professional" },
                    { icon: BookOpen,    text: "34 CFR Parts 600–690 Coverage"    },
                    { icon: ShieldCheck, text: "Regulations & Resources Updated Weekly" },
                    { icon: Users,       text: "Students, Parents & FA Offices"   },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-indigo-400/70 shrink-0" aria-hidden="true" />
                      <span className="text-[11px] text-white/45 font-medium">{text}</span>
                    </div>
                  ))}
                </div>

                {/* ── How it works ── */}
                <div className="w-full max-w-2xl mb-7">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.08]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2">How it works</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.08]" />
                  </div>
                  <p className="text-center text-[10px] text-white/30 mb-4 tracking-wide">Non-linear — jump in anywhere, circle back anytime</p>

                  {/* Mobile: vertical flow with bidirectional arrows */}
                  <div className="sm:hidden flex flex-col gap-0">
                    {([
                      { icon: Sparkles,    title: "Choose your role",  body: "Student, Parent, Admin, Leader, or Auditor.", color: "text-violet-400" },
                      { icon: Paperclip,   title: "Ask or upload",     body: "Type a question, upload a doc, or use voice.",  color: "text-sky-400"    },
                      { icon: Library,     title: "Explore the Hub",   body: "Browse scholarships, jobs, resources & more.", color: "text-teal-400"   },
                      { icon: CheckCircle, title: "Get guidance",      body: "Plain-English answers with citations.",         color: "text-indigo-400" },
                    ] as const).map(({ icon: Icon, title, body, color }, i, arr) => (
                      <div key={title}>
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07]">
                          <div className="p-1.5 rounded-lg bg-white/[0.06] shrink-0 mt-0.5">
                            <Icon className={`h-3.5 w-3.5 ${color}`} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-white/80 leading-tight">{title}</p>
                            <p className="text-[10px] text-white/35 leading-snug mt-0.5">{body}</p>
                          </div>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="flex flex-col items-center py-0.5 gap-px">
                            <span className="text-indigo-400/40 text-[10px] leading-none">▲</span>
                            <div className="w-px h-3 bg-indigo-500/20" />
                            <span className="text-indigo-400/40 text-[10px] leading-none">▼</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop: hub-and-spoke with bidirectional arrows */}
                  <div className="hidden sm:block relative mx-auto" style={{ maxWidth: 580 }}>
                    <div className="relative w-full" style={{ paddingBottom: "86%" }}>
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 580 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          {/* Arrow tip pointing forward */}
                          <marker id="arr-fwd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0.5 0.5 L5.5 3 L0.5 5.5z" fill="rgba(99,102,241,0.55)" />
                          </marker>
                          {/* Arrow tip pointing backward (for markerStart) */}
                          <marker id="arr-rev" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
                            <path d="M0.5 0.5 L5.5 3 L0.5 5.5z" fill="rgba(99,102,241,0.55)" />
                          </marker>
                          {/* Diagonal cross arrow — dimmer */}
                          <marker id="arr-cross-fwd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0.5 0.5 L5.5 3 L0.5 5.5z" fill="rgba(139,92,246,0.35)" />
                          </marker>
                          <marker id="arr-cross-rev" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
                            <path d="M0.5 0.5 L5.5 3 L0.5 5.5z" fill="rgba(139,92,246,0.35)" />
                          </marker>
                        </defs>

                        {/* ── Outer ring arcs — bidirectional ── */}
                        {/* Top ↔ Right */}
                        <path d="M 356,68 C 430,68 458,128 458,200"
                          stroke="rgba(99,102,241,0.28)" strokeWidth="1.5" strokeDasharray="5 4"
                          markerEnd="url(#arr-fwd)" markerStart="url(#arr-rev)" />
                        {/* Right ↔ Bottom */}
                        <path d="M 458,318 C 458,392 422,444 356,444"
                          stroke="rgba(99,102,241,0.28)" strokeWidth="1.5" strokeDasharray="5 4"
                          markerEnd="url(#arr-fwd)" markerStart="url(#arr-rev)" />
                        {/* Bottom ↔ Left */}
                        <path d="M 224,444 C 152,444 122,392 122,318"
                          stroke="rgba(99,102,241,0.28)" strokeWidth="1.5" strokeDasharray="5 4"
                          markerEnd="url(#arr-fwd)" markerStart="url(#arr-rev)" />
                        {/* Left ↔ Top */}
                        <path d="M 122,200 C 122,128 150,68 224,68"
                          stroke="rgba(99,102,241,0.28)" strokeWidth="1.5" strokeDasharray="5 4"
                          markerEnd="url(#arr-fwd)" markerStart="url(#arr-rev)" />

                        {/* ── Cross diagonals — bidirectional, subtler ── */}
                        {/* Top ↔ Bottom */}
                        <path d="M 290,112 L 290,400"
                          stroke="rgba(139,92,246,0.18)" strokeWidth="1.2" strokeDasharray="3 6"
                          markerEnd="url(#arr-cross-fwd)" markerStart="url(#arr-cross-rev)" />
                        {/* Left ↔ Right */}
                        <path d="M 172,256 L 408,256"
                          stroke="rgba(139,92,246,0.18)" strokeWidth="1.2" strokeDasharray="3 6"
                          markerEnd="url(#arr-cross-fwd)" markerStart="url(#arr-cross-rev)" />
                      </svg>

                      {/* Top: Choose your role */}
                      <div className="absolute flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.04] ring-1 ring-violet-500/20"
                           style={{ left: "35.3%", top: "0%", width: "29.3%" }}>
                        <Sparkles className="h-4 w-4 text-violet-400/70" aria-hidden="true" />
                        <p className="text-xs font-semibold text-white/80 leading-tight">Choose your role</p>
                        <p className="text-[10px] text-white/38 leading-snug">Student, Parent, Admin, Leader, or Auditor.</p>
                      </div>

                      {/* Right: Ask or upload */}
                      <div className="absolute flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.04] ring-1 ring-sky-500/20"
                           style={{ left: "68.3%", top: "37%", width: "29.3%" }}>
                        <Paperclip className="h-4 w-4 text-sky-400/70" aria-hidden="true" />
                        <p className="text-xs font-semibold text-white/80 leading-tight">Ask or upload</p>
                        <p className="text-[10px] text-white/38 leading-snug">Type, upload a doc, or pick a quick-start.</p>
                      </div>

                      {/* Bottom: Get guidance */}
                      <div className="absolute flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.04] ring-1 ring-indigo-500/20"
                           style={{ left: "35.3%", top: "74%", width: "29.3%" }}>
                        <CheckCircle className="h-4 w-4 text-indigo-400/70" aria-hidden="true" />
                        <p className="text-xs font-semibold text-white/80 leading-tight">Get guidance</p>
                        <p className="text-[10px] text-white/38 leading-snug">Plain-English answers with citations.</p>
                      </div>

                      {/* Left: Explore the Hub */}
                      <div className="absolute flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.04] ring-1 ring-teal-500/20"
                           style={{ left: "2.4%", top: "37%", width: "29.3%" }}>
                        <Library className="h-4 w-4 text-teal-400/70" aria-hidden="true" />
                        <p className="text-xs font-semibold text-white/80 leading-tight">Explore the Hub</p>
                        <p className="text-[10px] text-white/38 leading-snug">Scholarships, jobs, resources & more.</p>
                      </div>

                      {/* Center: non-linear indicator */}
                      <div className="absolute z-10 flex flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5"
                           style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)",
                             background: "rgba(15,23,60,0.92)", boxShadow: "0 0 0 1px rgba(99,102,241,0.25), 0 4px 16px rgba(0,0,0,0.4)" }}>
                        {/* 4-way arrows SVG */}
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="rgba(139,92,246,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5V19M5 12H19" />
                          <path d="M9 8L12 5L15 8M9 16L12 19L15 16M8 9L5 12L8 15M16 9L19 12L16 15" />
                        </svg>
                        <p className="text-[7px] font-bold uppercase tracking-widest text-white/30 text-center leading-tight whitespace-nowrap">any direction</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions — role tabs + 2×2 grid */}
                <div className="w-full max-w-2xl">
                  {/* Role pill tabs */}
                  <div className="flex gap-1.5 flex-wrap justify-center mb-3">
                    {QUICK_ACTIONS_BY_ROLE.map(({ role, color }) => (
                      <button
                        key={role}
                        onClick={() => setActiveActionRole(role)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          activeActionRole === role
                            ? "text-white bg-indigo-600/70 ring-1 ring-indigo-500/50 shadow-sm"
                            : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {/* 2×2 card grid for selected role */}
                  {QUICK_ACTIONS_BY_ROLE.filter((r) => r.role === activeActionRole).map(({ role, color, items }) => (
                    <div key={role} className="grid grid-cols-2 gap-2">
                      {items.map(({ icon: Icon, label, description, q }) => (
                        <button
                          key={`${role}-${label}`}
                          onClick={() => sendMessage(q)}
                          className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/[0.08] hover:ring-indigo-500/30 text-left transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          <div className="p-1.5 rounded-lg bg-white/[0.06] group-hover:bg-indigo-500/20 transition-colors w-fit">
                            <Icon className="h-3.5 w-3.5 text-white/40 group-hover:text-indigo-300 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors leading-tight">
                              {label}
                            </p>
                            <p className="text-[11px] text-white/35 mt-0.5 leading-tight line-clamp-2">
                              {description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* ── Tips by Role ── */}
                <div className="w-full max-w-2xl mt-8">
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] ring-1 ring-white/10">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-white/50 tracking-wide">Tips by Role</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                  <div className="flex gap-1.5 justify-center flex-wrap mb-4">
                    {ROLE_TIPS.map(({ role, icon: Icon }) => (
                      <button
                        key={role}
                        onClick={() => setActiveRole(role)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          activeRole === role
                            ? "bg-indigo-600 text-white ring-1 ring-indigo-500/40 shadow-md shadow-indigo-900/40"
                            : "bg-white/[0.05] text-white/45 hover:text-white/75 hover:bg-white/[0.09] ring-1 ring-white/[0.07]"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {role}
                      </button>
                    ))}
                  </div>
                  {ROLE_TIPS.filter((r) => r.role === activeRole).map(({ role, icon: Icon, gradient, accent, tips }) => (
                    <div key={role} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm overflow-hidden">
                      <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center gap-3`}>
                        <div className="p-2 rounded-xl bg-white/20">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">As a {role}</p>
                          <p className="text-xs text-white/65 leading-tight mt-0.5">Click any tip to prefill a question</p>
                        </div>
                      </div>
                      <div className="divide-y divide-white/[0.06]">
                        {tips.map(({ text, prompt }, i) => (
                          <button
                            key={i}
                            onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                            className="w-full flex items-start gap-3 px-5 py-3.5 text-left group hover:bg-white/[0.05] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                          >
                            <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ring-1 ${accent}`} />
                            <p className="text-sm text-white/55 group-hover:text-white/85 leading-snug transition-colors duration-150 flex-1">{text}</p>
                            <ChevronRight className="h-3.5 w-3.5 text-white/15 group-hover:text-indigo-400 shrink-0 mt-1 transition-colors duration-150" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            ) : (

              /* ── Chat messages ── */
              <div className="px-4 py-6 space-y-5 max-w-4xl mx-auto w-full">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="shrink-0 mt-1">
                        <div className="p-1.5 rounded-xl bg-indigo-600 shadow-md shadow-indigo-900/40 ring-1 ring-indigo-500/30">
                          <GenieBottle className="h-4 w-4 text-white genie-icon-shimmer" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`relative ${
                        msg.role === "user"
                          ? "max-w-[72%] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed ring-1 ring-indigo-500/30 bg-indigo-600 shadow-lg shadow-indigo-900/30"
                          : "max-w-[82%] ring-1 ring-white/[0.10] px-5 py-4 rounded-2xl rounded-tl-sm bg-white/[0.05]"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <div>
                          {msg.senderRole && (() => {
                            const opt = ROLE_OPTIONS.find(r => r.label === msg.senderRole);
                            return (
                              <span className={`inline-block text-[10px] font-bold uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded-md ring-1 ${opt?.color ?? "text-white/50"} ${opt?.bg ?? "bg-white/10"} ${opt?.ring ?? "ring-white/20"}`}>
                                {msg.senderRole}
                              </span>
                            );
                          })()}
                          {msg.attachedFileName && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-white/50">
                              <Paperclip className="h-3 w-3 shrink-0" />
                              <span className="truncate">{msg.attachedFileName}</span>
                            </div>
                          )}
                          <p>{msg.content}</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-2" aria-label="AI-generated response">
                            <Sparkles className="h-3 w-3 text-indigo-400/60" aria-hidden="true" />
                            <span className="text-[10px] font-medium text-white/30 tracking-wide">AI-generated · Always verify with official sources</span>
                          </div>
                          <MarkdownRenderer
                            content={msg.content}
                            className="prose-invert text-sm text-white/85 leading-relaxed"
                          />
                          {msg.id === streamingMsgId && isStreaming && (
                            <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom rounded-full" />
                          )}
                          {msg.content && !isStreaming && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/[0.06]">
                              <button
                                onClick={() => speakMessage(msg.id, msg.content)}
                                title={speakingMsgId === msg.id ? "Stop reading" : "Read aloud"}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                  speakingMsgId === msg.id
                                    ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                                    : "text-white/30 hover:text-white/70 hover:bg-white/[0.07]"
                                }`}
                              >
                                {speakingMsgId === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                                {speakingMsgId === msg.id ? "Stop" : "Listen"}
                              </button>
                              <button
                                onClick={() => printMessage(msg.content)}
                                title="Print / Save as PDF"
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                              >
                                <Printer className="h-3 w-3" />
                                Print/View
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-3 justify-start genie-fade-in-up">
                    <div className="shrink-0 mt-1 p-1.5 rounded-xl bg-indigo-600 shadow-md ring-1 ring-indigo-500/30">
                      <GenieBottle className="h-4 w-4 text-white genie-icon-shimmer" />
                    </div>
                    <div className="ring-1 ring-white/[0.10] px-5 py-4 rounded-2xl rounded-tl-sm bg-white/[0.05]">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="genie-typing-dot" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 relative bg-white/[0.03] backdrop-blur-xl border-t border-white/[0.08] px-4 pt-4 pb-5">

            <div className="relative max-w-3xl mx-auto">
              {/* Prompt label row */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <GenieBottle className="h-3.5 w-3.5 text-amber-400 shrink-0 genie-icon-shimmer" />
                <span className="text-sm font-semibold tracking-wide genie-shimmer-text">
                  askGenie
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
                {messages.length > 0 && (
                  <button
                    onClick={goHome}
                    title="Back to Home"
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
                  >
                    <Home className="h-3 w-3" />
                    Home
                  </button>
                )}
              </div>

              {/* Role selector */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5 px-1">
                <span className="text-[10px] text-white/25 font-medium mr-0.5 shrink-0">I am a:</span>
                {ROLE_OPTIONS.map(({ label, icon: RoleIcon, color, ring, bg }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selectedRole === label}
                    onClick={() => setSelectedRole(selectedRole === label ? null : label)}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ring-1 ${
                      selectedRole === label
                        ? `${color} ${bg} ${ring}`
                        : "text-white/30 bg-transparent ring-white/[0.08] hover:text-white/60 hover:bg-white/[0.06]"
                    }`}
                  >
                    <RoleIcon className="h-2.5 w-2.5 shrink-0" />
                    {label}
                  </button>
                ))}
                {selectedRole && (
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="text-[10px] text-white/20 hover:text-white/50 transition-colors ml-0.5"
                  >
                    ✕ clear
                  </button>
                )}
              </div>

              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.txt,.doc,.docx,.csv,.md"
                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ""; }} />
              <input ref={cameraInputRef} type="file" className="hidden"
                accept="image/*" capture="environment"
                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ""; }} />

              {/* Attached file preview */}
              {attachedFile && (
                <div className="flex items-center gap-2 px-3 py-2 mb-1.5 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
                  {attachedFile.type === "image" ? (
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
                  ) : attachedFile.type === "audio" ? (
                    <Mic className="h-3.5 w-3.5 text-rose-300 shrink-0" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
                  )}
                  <span className="text-xs text-white/80 flex-1 truncate">{attachedFile.name}</span>
                  <button type="button" onClick={() => setAttachedFile(null)}
                    className="text-white/35 hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Input form */}
              <div className="rounded-2xl ring-1 ring-white/[0.12] focus-within:ring-indigo-500/50 transition-all duration-200 bg-white/[0.05]">
                <form
                  onSubmit={handleSubmit}
                  className="flex gap-2 items-end px-3 py-2.5"
                >
                  {/* Upload + mic buttons */}
                  <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                    <button type="button" title={canAccessFeature("document_upload", userTier) ? "Upload document (.pdf, .txt, .doc, .csv)" : "Pro — upload documents"}
                      onClick={() => canAccessFeature("document_upload", userTier) ? fileInputRef.current?.click() : openUpgrade("document_upload")}
                      className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${canAccessFeature("document_upload", userTier) ? "text-white/35 hover:text-indigo-300 hover:bg-indigo-500/20" : "text-white/20 hover:text-violet-400 hover:bg-violet-500/15"}`}>
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button type="button" title={canAccessFeature("document_upload", userTier) ? "Take or upload a photo for context" : "Pro — upload photos"}
                      onClick={() => canAccessFeature("document_upload", userTier) ? cameraInputRef.current?.click() : openUpgrade("document_upload")}
                      className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${canAccessFeature("document_upload", userTier) ? "text-white/35 hover:text-indigo-300 hover:bg-indigo-500/20" : "text-white/20 hover:text-violet-400 hover:bg-violet-500/15"}`}>
                      <Camera className="h-4 w-4" />
                    </button>
                    <button type="button"
                      title={!canAccessFeature("document_upload", userTier) ? "Pro — voice messages" : isRecording ? "Stop recording" : "Record voice message"}
                      onClick={!canAccessFeature("document_upload", userTier) ? () => openUpgrade("document_upload") : isRecording ? stopVoiceRecording : startVoiceRecording}
                      className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isRecording
                          ? "text-rose-400 bg-rose-500/20 animate-pulse"
                          : canAccessFeature("document_upload", userTier)
                          ? "text-white/35 hover:text-indigo-300 hover:bg-indigo-500/20"
                          : "text-white/20 hover:text-violet-400 hover:bg-violet-500/15"
                      }`}>
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    {isRecording && voiceTranscript && (
                      <p className="absolute top-0 left-2 right-2 text-xs text-rose-300/80 italic pointer-events-none truncate">
                        🎙 {voiceTranscript}
                      </p>
                    )}
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      aria-label="Ask Genie a financial aid question"
                      placeholder={isRecording ? "🎙 Listening… speak your question…" : "askGenie — or tell Genie what you're concerned about…"}
                      rows={1}
                      className="w-full resize-none px-2 py-1.5 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none leading-relaxed"
                      style={{ minHeight: "40px", maxHeight: "160px" }}
                    />
                  </div>
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stopStreaming}
                      title="Stop generating"
                      className="shrink-0 mb-0.5 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      Stop
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={(!input.trim() && !attachedFile) || isLoading}
                      className="shrink-0 mb-0.5 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/50 active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send
                    </button>
                  )}
                </form>
              </div>

              {/* Daily messages counter — shown to free/limited users */}
              {dailyUsage && dailyUsage.limit < 999999 && (
                <UsageMeter
                  initialUsage={{ used: dailyUsage.used, limit: dailyUsage.limit, tier: userTier }}
                  onLimitReached={() => setShowLimitToast(true)}
                  className="mt-2"
                />
              )}

              {/* Footer hints */}
              <div className="mt-2 flex flex-col items-center gap-0.5">
                <p className="text-[10px] text-white/20 text-center tracking-wide">
                  Enter to send · Shift+Enter for new line · Attach docs, photos, or voice · Always verify with the FSA Handbook
                </p>
                <p className="text-[10px] text-center text-white/25">
                  Unofficial reference tool — not affiliated with the U.S. Department of Education
                </p>
                <p className="text-[10px] text-center text-white/30 italic mt-0.5">
                  Built by a 15-year Student Financial Aid professional. Designed for the people who do this work every day.
                </p>
                <p className="text-[10px] text-center text-white/20 leading-relaxed">
                  <Link href="/pricing" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-indigo-300 transition-colors">Plans &amp; Pricing</Link>
                  {" · "}
                  <Link href="/pricing#faq" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">FAQ</Link>
                  {" · "}
                  <Link href="/support" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">Support Dev</Link>
                  {" · "}
                  <Link href="/legal" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">Legal</Link>
                  {" · "}
                  <Link href="/legal" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">Terms &amp; Privacy</Link>
                  {" · "}
                  <Link href="/dpa" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">School DPA</Link>
                  {" · "}
                  <Link href="/about" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">About</Link>
                  {" · "}
                  <Link href="/institutions" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">For Schools</Link>
                  {" · "}
                  <Link href="/legal#ccpa" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/40 transition-colors">Do Not Sell My Info</Link>
                </p>
                <p className="text-[10px] text-center text-white/15 mt-0.5">
                  © 2026 askGenie Student Aid Hub | Developed by One27 | All Rights Reserved
                </p>
              </div>
            </div>
          </div>

        </main>

        {/* ── Right Panel — Coverage + Quick Actions ── */}
        <aside className={`${showMobileRight ? "flex fixed inset-y-0 right-0 z-50" : "hidden"} xl:flex xl:static xl:z-auto flex-col w-72 shrink-0 border-l border-white/[0.10] bg-[#071035] xl:bg-white/[0.07] backdrop-blur-2xl`}>

          {/* Header — Administrators, Leaders & Auditors */}
          <div className="px-4 pt-4 pb-4 border-b border-white/[0.07]">
            <div className="flex items-center justify-end gap-2.5">
              <div className="text-right">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-none mb-0.5">Student Aid HUB</p>
                <p className="text-sm font-semibold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent leading-tight">
                  Admins, Leaders &amp; Auditors
                </p>
              </div>
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 shrink-0">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Scrollable: Quick Actions + Admin Resources */}
          <div className="flex-1 overflow-y-auto genie-scroll px-3 py-3 space-y-1.5">

            {/* ── Quick Actions (collapsible by role) ── */}
            {QUICK_ACTIONS_BY_ROLE.filter(({ role }) => role === "Administrators" || role === "Leaders" || role === "Auditors").map(({ role, color, items, more }) => {
              const isOpen = expandedSections.has(`rqa-open-${role}`);
              return (
                <div key={role} className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(`rqa-open-${role}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80 text-right">{role} Quick Actions</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-0.5 px-1.5 pb-2">
                      {[...items, ...more].map(({ icon: Icon, label, description, q }) => (
                        <button key={`rqa-${role}-${label}`} onClick={() => sendMessage(q)} disabled={isBusy}
                          title={label}
                          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-right group transition-all duration-150 hover:bg-indigo-500/20 ring-1 ring-transparent hover:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                          <ChevronRight className="h-3 w-3 text-white/25 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
                          <div className="mt-0.5 p-1.5 rounded-lg bg-white/[0.08] group-hover:bg-indigo-500/30 transition-colors shrink-0">
                            <Icon className="h-3 w-3 text-white/60 group-hover:text-indigo-300 transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1 text-right">
                            <p className="text-xs font-semibold text-white/85 group-hover:text-white transition-colors leading-tight">{label}</p>
                            <p className="text-[10px] text-white/55 mt-0.5 leading-tight">{description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Admin Federal Resources (collapsible by group) ── */}
            {FEDERAL_RESOURCES.filter(({ group }) => group !== "Students & Parents").map(({ group, links, more }) => {
              const key = `sec-admin-${group}`;
              const moreKey = `more-admin-${group}`;
              const isOpen = expandedSections.has(key);
              const isMoreOpen = expandedSections.has(moreKey);
              return (
                <div key={group} className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80 text-right">{group}</span>
                  </button>
                  {isOpen && (
                    <div className="px-1.5 pb-2 space-y-0.5">
                      {links.map(({ name, url }) => (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                          title={name}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-indigo-500/20 ring-1 ring-transparent hover:ring-indigo-500/20 transition-all duration-150 group">
                          <span>{name}</span>
                          <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-indigo-400 shrink-0" />
                        </a>
                      ))}
                      {more && more.length > 0 && (
                        <>
                          {isMoreOpen && (more as MaybeSubcat[]).map((item, idx) => {
                            if (isSubcat(item)) {
                              return <div key={`rsc-${idx}`} className="px-3 pt-2.5 pb-0.5 text-right"><span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{item.subcat}</span></div>;
                            }
                            return (
                              <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                                title={item.name}
                                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-indigo-500/20 ring-1 ring-transparent hover:ring-indigo-500/20 transition-all duration-150 group">
                                <span>{item.name}</span>
                                <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-indigo-400 shrink-0" />
                              </a>
                            );
                          })}
                          <button
                            onClick={() => toggleSection(moreKey)}
                            className="w-full text-left px-3 py-1.5 text-[10px] font-medium text-indigo-400/80 hover:text-indigo-300 transition-colors">
                            {isMoreOpen ? "Show less" : `Show more`}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Topics Covered (clickable chips) ── */}
            {(() => {
              const isOpen = expandedSections.has("rp-coverage");
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection("rp-coverage")}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80 text-right">Topics Covered</span>
                  </button>
                  {isOpen && (
                    <div className="px-2 pb-2.5 pt-1 flex flex-wrap gap-1 justify-end">
                      {COVERAGE_TOPICS.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => sendMessage(COVERAGE_TOPIC_PROMPTS[topic] ?? `Tell me about ${topic}.`)}
                          disabled={isBusy}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.07] text-white/50 ring-1 ring-white/[0.09] hover:bg-indigo-500/20 hover:text-indigo-300 hover:ring-indigo-500/30 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Videos ── */}
            {(() => {
              const key = "sec-videos-social";
              const moreKey = "sec-videos-social-more";
              const isOpen = expandedSections.has(key);
              const showMore = expandedSections.has(moreKey);
              const allIds = ["P6FORpg0KVo", "HAnw168huqA", "rhgwIhB58PA"];
              const visibleIds = showMore ? allIds : allIds.slice(0, 1);
              return (
                <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07] bg-white/[0.03]">
                  <button onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                    <ChevronRight className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80 text-right">Videos</span>
                  </button>
                  {isOpen && (
                    <div className="px-2 pb-3 pt-1 space-y-3">
                      {visibleIds.map((id) => (
                        <div key={id} className="rounded-lg overflow-hidden w-full" style={{ aspectRatio: "16/9" }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${id}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="w-full h-full border-0"
                          />
                        </div>
                      ))}
                      <button onClick={() => toggleSection(moreKey)}
                        className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg text-[11px] font-medium text-indigo-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show fewer" : `View ${allIds.length - 1} more`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>


        </aside>

      </div>

      {/* Cookie / data notice — first visit */}
      {showCookieNotice && (
        <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
          <div className="pointer-events-auto max-w-xl w-full rounded-2xl bg-[#071035]/95 border border-white/[0.12] shadow-2xl shadow-black/40 backdrop-blur-xl px-5 py-4 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 leading-relaxed">
                Genie uses essential session cookies only. We do not sell or share your personal information.
                See our{" "}
                <Link href="/legal" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>
                {" "}for details.{" "}
                <Link href="/legal#ccpa" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-indigo-400/70 hover:text-indigo-300 transition-colors">Do Not Sell My Personal Information</Link>.
              </p>
            </div>
            <button
              onClick={() => { localStorage.setItem("genie-cookie-accepted", "true"); setShowCookieNotice(false); }}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Limit toast — fires when daily cap is hit */}
      {showLimitToast && dailyUsage && (
        <LimitToast
          used={dailyUsage.used}
          limit={dailyUsage.limit}
          onUpgrade={() => { setShowLimitToast(false); openUpgrade("limit_reached"); }}
          onDismiss={() => setShowLimitToast(false)}
        />
      )}

      {/* Upgrade modal — triggered by Pro-gated features or limit */}
      {upgradeState.open && (
        <UpgradeModal
          feature={upgradeState.feature}
          onClose={closeUpgrade}
        />
      )}

      {/* Auth dialog — sign in / sign up */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultMode={authDialogMode}
      />

      {/* PWA install prompt — shows once per day if not installed */}
      <AppInstallPrompt />
    </>
  );
}
