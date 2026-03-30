"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
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
  Menu,
  X,
  Sun,
  Moon,
  Paperclip,
  Camera,
  ImageIcon,
  Mic,
  MicOff,
} from "lucide-react";

// ─── Genie Bottle Logo ────────────────────────────────────────────────────────

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
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
      { name: "Dear Colleague Letters (DCL) – All Years", url: "https://ifap.ed.gov/dear-colleague-letters" },
      { name: "Dear Colleague Letters 2025-26", url: "https://ifap.ed.gov/dear-colleague-letters" },
      { name: "Dear Colleague Letters 2026-27", url: "https://ifap.ed.gov/dear-colleague-letters" },
      { name: "Electronic Announcement – IFAP", url: "https://ifap.ed.gov/electronic-announcements" },
      { name: "G5 – Grants Management System", url: "https://www.g5.gov" },
      { name: "SAIG Enrollment (TDClient)", url: "https://fsawebenroll.ed.gov" },
      { name: "EDExpress – FA Software", url: "https://fsapartners.ed.gov/knowledge-center/fsa-software/edexpress" },
      { name: "EdConnect – SAIG Transmission", url: "https://fsapartners.ed.gov/knowledge-center/fsa-software/edconnect" },
      { name: "FSA Training & Professional Development", url: "https://fsapartners.ed.gov/training-events" },
      { name: "FSA Data Center (FAFSA Data)", url: "https://studentaid.gov/data-center" },
      { name: "CPS (Central Processing System) Info", url: "https://ifap.ed.gov" },
      { name: "SAR / ISIR Interpretation", url: "https://studentaid.gov/help-center/answers/topic/professionals" },
      { name: "FAFSA Simplification Act Resources", url: "https://fsapartners.ed.gov/knowledge-center/fafsa-simplification" },
      { name: "FAFSA Partner Toolkit", url: "https://studentaid.gov/help-center/answers/topic/outreach-and-resources" },
      { name: "MPN – Master Promissory Note", url: "https://studentaid.gov/mpn" },
      { name: "Entrance Counseling – studentaid.gov", url: "https://studentaid.gov/entrance-counseling" },
      { name: "Exit Counseling – studentaid.gov", url: "https://studentaid.gov/exit-counseling" },
      { name: "Professional Judgment Guidance (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/professional-judgment" },
      { name: "Dependency Override Policy Guidance", url: "https://ifap.ed.gov" },
      { name: "Conflicting Information Policy (34 CFR 668.16)", url: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-668/subpart-B/section-668.16" },
      { name: "Consortium Agreement Guidance", url: "https://ifap.ed.gov" },
      { name: "Study Abroad Aid Processing", url: "https://ifap.ed.gov" },
      { name: "Unusual Enrollment History (UEH) Guidance", url: "https://ifap.ed.gov" },
      { name: "Satisfactory Academic Progress (SAP) Regulations", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-C" },
      { name: "R2T4 Policy & Worksheets (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/return-title-iv" },
      { name: "Disbursement Timing Rules (34 CFR 668.164)", url: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-668/subpart-K/section-668.164" },
      { name: "Award Year Crossover Guidance", url: "https://ifap.ed.gov" },
      { name: "Transfer Monitoring – NSLDS", url: "https://nslds.ed.gov" },
      { name: "Credit Balance Management (34 CFR 668.164(e))", url: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-668/subpart-K/section-668.164" },
      { name: "Campus-Based Aid Allocation", url: "https://ecampusbased.ed.gov" },
      { name: "FISAP Filing (ecampusbased.ed.gov)", url: "https://ecampusbased.ed.gov" },
      { name: "TEACH Grant Program", url: "https://studentaid.gov/teach-grant-program" },
      { name: "Iraq/Afghanistan Service Grant", url: "https://studentaid.gov/understand-aid/types/grants/iraq-afghanistan-service" },
      { name: "Federal Pell Grant Lifetime Eligibility", url: "https://studentaid.gov/understand-aid/types/grants/pell/calculate-eligibility" },
      { name: "Pell Grant LEU Tracking – NSLDS", url: "https://nslds.ed.gov" },
      { name: "Direct Loan Aggregate Limits Guidance", url: "https://studentaid.gov/understand-aid/types/loans/subsidized-unsubsidized" },
      { name: "PLUS Loan Processing (COD)", url: "https://cod.ed.gov" },
      { name: "FSA Loan Origination & Disbursement (COD)", url: "https://cod.ed.gov" },
      { name: "Default Prevention Resources", url: "https://studentaid.gov/help-center/answers/topic/managing-repayment" },
      { name: "CDR – Cohort Default Rate Guide (IFAP)", url: "https://ifap.ed.gov/ilibrary/document-type/cohort-default-rate-guide" },
      { name: "IPEDS Data Collection (NCES)", url: "https://nces.ed.gov/ipeds" },
      { name: "Gainful Employment Disclosure Tool", url: "https://studentaid.gov/gainful-employment" },
      { name: "90/10 Rule Guidance (HEA § 487(a)(24))", url: "https://ifap.ed.gov" },
      { name: "Financial Responsibility Standards (Composite Score)", url: "https://studentaid.gov/financialresponsibility" },
      { name: "Incarcerated Students Initiative", url: "https://studentaid.gov/incarcerated" },
      { name: "Distance Education – Accreditation Guidance", url: "https://ifap.ed.gov" },
      { name: "Clock-to-Credit Hour Conversion", url: "https://ifap.ed.gov" },
      { name: "State Authorization Resources (NC-SARA)", url: "https://nc-sara.org" },
      { name: "Homeless/Foster Youth (Unaccompanied Youth)", url: "https://studentaid.gov/help-center/answers/article/foster-youth-and-homeless-youth" },
      { name: "AmeriCorps Segal Education Award Info", url: "https://americorps.gov/members-volunteers/segal-americorps-education-award" },
      { name: "Verification 2025-26 – IRS Tax Year 2023 Data", url: "https://ifap.ed.gov/ilibrary/document-type/verification-guide" },
      { name: "Verification 2026-27 – IRS Tax Year 2024 Data", url: "https://ifap.ed.gov/ilibrary/document-type/verification-guide" },
      { name: "IRS Data Retrieval Tool (FAFSA)", url: "https://studentaid.gov/help-center/answers/article/what-is-irs-data-retrieval-tool" },
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
      { name: "Single Audit Act (31 U.S.C. § 7501)", url: "https://www.govinfo.gov/content/pkg/USCODE-2011-title31/pdf/USCODE-2011-title31-subtitleV-chap75.pdf" },
      { name: "AICPA – Audit Standards (SAS)", url: "https://www.aicpa.org/research/standards/auditattest/clarity.html" },
      { name: "FSA Audit Guide – Title IV", url: "https://www2.ed.gov/about/offices/list/oig/aireports/auditguide.html" },
      { name: "Program Review Protocols – FSA", url: "https://studentaid.gov/about/announcements/program-review" },
      { name: "OIG Audit Reports – Higher Education", url: "https://www2.ed.gov/about/offices/list/oig/aireports/aireports.html" },
      { name: "34 CFR Part 674 – Federal Perkins Loan", url: "https://www.ecfr.gov/current/title-34/part-674" },
      { name: "34 CFR Part 675 – Federal Work-Study", url: "https://www.ecfr.gov/current/title-34/part-675" },
      { name: "34 CFR Part 676 – FSEOG", url: "https://www.ecfr.gov/current/title-34/part-676" },
      { name: "34 CFR Part 682 – FFEL Program", url: "https://www.ecfr.gov/current/title-34/part-682" },
      { name: "34 CFR Part 692 – LEAP Program", url: "https://www.ecfr.gov/current/title-34/part-692" },
      { name: "34 CFR Part 99 – FERPA", url: "https://www.ecfr.gov/current/title-34/part-99" },
      { name: "FERPA – Family Educational Rights & Privacy", url: "https://studentprivacy.ed.gov" },
      { name: "HEA Title IV – Higher Education Act", url: "https://uscode.house.gov/browse/prelim@title20/chapter28&edition=prelim" },
      { name: "FSA 2025-26 Final Rules (Federal Register)", url: "https://www.federalregister.gov/agencies/education-department" },
      { name: "FSA 2026-27 Award Year Regulations (Federal Register)", url: "https://www.federalregister.gov/agencies/education-department" },
      { name: "2025-26 Verification Requirements (34 CFR 668 Subpart E)", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-E" },
      { name: "2026-27 Verification Requirements (34 CFR 668 Subpart E)", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-E" },
      { name: "CDR Cohort Default Rate – National Data", url: "https://studentaid.gov/data-center/school/default" },
      { name: "90/10 Rule – HEA § 487(a)(24)", url: "https://ifap.ed.gov" },
      { name: "Composite Score / Financial Responsibility", url: "https://studentaid.gov/financialresponsibility" },
      { name: "Letters of Credit – ED Financial Standards", url: "https://studentaid.gov/financialresponsibility" },
      { name: "Gainful Employment Regulations (2023)", url: "https://www.federalregister.gov/documents/2023/10/30/2023-23715/programs-leading-to-gainful-employment" },
      { name: "Borrower Defense Regulations", url: "https://www.federalregister.gov/agencies/education-department" },
      { name: "Program Integrity Rules (34 CFR 668)", url: "https://www.ecfr.gov/current/title-34/part-668" },
      { name: "Cash Management Rules (34 CFR 668.162–164)", url: "https://www.ecfr.gov/current/title-34/part-668/subpart-K" },
      { name: "Foreign Gift Reporting (HEA § 117)", url: "https://www.ed.gov/about/offices/list/ope/foreigngifts.html" },
      { name: "Clery Act Compliance", url: "https://www2.ed.gov/admins/lead/safety/campus.html" },
      { name: "Drug-Free Schools & Communities Act", url: "https://www2.ed.gov/policy/elsec/guid/secletter/120725.html" },
      { name: "Title IX Compliance – ED OCR", url: "https://www2.ed.gov/about/offices/list/ocr/docs/tix_dis.html" },
      { name: "ADA Compliance in Higher Education", url: "https://www.ada.gov" },
      { name: "HEOA – Higher Education Opportunity Act", url: "https://www.congress.gov/110/plaws/publ315/PLAW-110publ315.pdf" },
      { name: "HEERF / CARES Act Audit Requirements", url: "https://www2.ed.gov/about/offices/list/oig/aireports/auditguide.html" },
      { name: "Emergency Aid – COVID Relief Reporting", url: "https://www2.ed.gov/about/offices/list/ope/caresact.html" },
      { name: "IPEDS Reporting (NCES)", url: "https://nces.ed.gov/ipeds" },
      { name: "Title III – HBCUs & Strengthening Institutions", url: "https://www.ed.gov/about/offices/list/ope/idues/index.html" },
      { name: "Title V – Hispanic-Serving Institutions", url: "https://www.ed.gov/about/offices/list/ope/idues/index.html" },
      { name: "MSI – Minority Serving Institutions", url: "https://www.ed.gov/about/offices/list/ope/idues/index.html" },
      { name: "State Authorization – NC-SARA", url: "https://nc-sara.org" },
      { name: "Accreditation Recognition Database (DAPIP)", url: "https://ope.ed.gov/dapip" },
      { name: "NASFAA Standards of Excellence (SOE)", url: "https://www.nasfaa.org/SOE" },
      { name: "NASFAA Code of Ethics & Professional Standards", url: "https://www.nasfaa.org/professional_standards" },
      { name: "NASFAA AskRegs – Compliance Q&A", url: "https://askregs.nasfaa.org" },
      { name: "FSA Modernization – FUTURE Act", url: "https://fsapartners.ed.gov/knowledge-center/fafsa-simplification" },
      { name: "Overpayment Recovery – NSLDS", url: "https://nslds.ed.gov" },
      { name: "Title IV Reconciliation Guidance", url: "https://cod.ed.gov" },
      { name: "Internal Controls – 2 CFR 200.303", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.303" },
      { name: "Allowable Costs – 2 CFR 200.420-.476", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E" },
      { name: "Questioned Costs & Findings – 2 CFR 200.516", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-F/section-200.516" },
      { name: "Corrective Action Plans – OIG Guidance", url: "https://www2.ed.gov/about/offices/list/oig/aireports/aireports.html" },
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
      { name: "GLBA – Gramm-Leach-Bliley Cybersecurity (FTC)", url: "https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act" },
      { name: "COPPA Compliance (Children Under 13)", url: "https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy" },
      { name: "CCPA – California Consumer Privacy Act", url: "https://oag.ca.gov/privacy/ccpa" },
      { name: "FSA Access – MyFSAID Account Management", url: "https://fsaid.ed.gov" },
      { name: "SAIG Mailbox Management & Security", url: "https://fsawebenroll.ed.gov" },
      { name: "Congressional Research Service – Higher Ed Reports", url: "https://crsreports.congress.gov" },
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
      { name: "Mental Health First Aid — Workplace Training", url: "https://www.mentalhealthfirstaid.org/apply/workplace" },
      { name: "One Mind at Work — Employer Pledge", url: "https://onemindatwork.org" },
      { name: "Mind Share Partners — Employer Resources", url: "https://www.mindsharepartners.org" },
      { name: "EAPA — Employee Assistance Professionals Assoc.", url: "https://www.eapassn.org" },
      { name: "SHRM — Employee Mental Health & Wellness", url: "https://www.shrm.org/topics-tools/topics/employee-relations/mental-health" },
      { name: "ADA.gov — Reasonable Workplace Accommodations", url: "https://www.ada.gov/employment/employ.htm" },
      { name: "Job Accommodation Network (JAN)", url: "https://askjan.org" },
      { name: "EEOC — ADA & Psychiatric Disabilities FAQs", url: "https://www.eeoc.gov/laws/guidance/questions-and-answers-clarifications-application-ada-psychiatric-disabilities" },
      { name: "ADA National Network — Workplace Accommodation", url: "https://adata.org" },
      { name: "988 Suicide & Crisis Lifeline", url: "https://988lifeline.org" },
      { name: "Crisis Text Line — Text HOME to 741741", url: "https://www.crisistextline.org" },
      { name: "SAMHSA National Helpline — 1-800-662-4357", url: "https://www.samhsa.gov/find-help/national-helpline" },
      { name: "NIMH — Caring for Your Mental Health", url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health" },
      { name: "ADAA — Workplace Anxiety & Depression", url: "https://adaa.org/living-with-anxiety/workplace" },
      { name: "DBSA — Working Well Employee Resources", url: "https://www.dbsalliance.org/wellness/working-well" },
      { name: "National Safety Council — Employee Wellbeing", url: "https://www.nsc.org/workplace/safety-topics/employee-wellness" },
      { name: "OSHA — Preventing Workplace Violence", url: "https://www.osha.gov/workplace-violence" },
      { name: "Business Group on Health — Employer MH", url: "https://www.businessgrouphealth.org/resources/mental-health" },
      { name: "WELCOA — Wellness Council of America", url: "https://www.welcoa.org" },
      { name: "HERO — Health Enhancement Research Org.", url: "https://hero-health.org" },
      { name: "National Wellness Institute", url: "https://nationalwellness.org" },
      { name: "IFEBP — Employee Benefit Plans Foundation", url: "https://www.ifebp.org" },
      { name: "ACOEM — Occupational Medicine & Wellness", url: "https://acoem.org" },
      { name: "ILO — Mental Health at Work", url: "https://www.ilo.org/global/topics/safety-and-health-at-work" },
      { name: "Gallup — Employee Wellbeing Index", url: "https://www.gallup.com/workplace/employee-wellbeing.aspx" },
      { name: "OPM — Work-Life Balance Programs", url: "https://www.opm.gov/policy-data-oversight/worklife" },
      { name: "DOL — Workplace Safety & Health Resources", url: "https://www.dol.gov/general/topic/safety-health" },
      { name: "TIAA — Financial Wellness & Mental Health", url: "https://www.tiaa.org/public/institute/research/wellness" },
      { name: "National Council for Mental Wellbeing", url: "https://www.thenationalcouncil.org" },
      { name: "MHWorks — National Council Workplace Program", url: "https://www.thenationalcouncil.org/mental-health-works" },
      { name: "SAMHSA — Trauma-Informed Workplace Care", url: "https://www.samhsa.gov/trauma-violence" },
      { name: "SAMHSA — Strategic Prevention Framework", url: "https://www.samhsa.gov/prevention" },
      { name: "NAADAC — Addiction Counselors in the Workplace", url: "https://www.naadac.org" },
      { name: "LivingWorks — ASIST Suicide Intervention", url: "https://www.livingworks.net/asist" },
      { name: "QPR Institute — Suicide Prevention Training", url: "https://qprinstitute.com" },
      { name: "safeTALK — Suicide Alertness for Everyone", url: "https://www.livingworks.net/safetalk" },
      { name: "AFSP — Workplace Suicide Prevention", url: "https://afsp.org/programs/workplace" },
      { name: "American Institute of Stress — Workplace", url: "https://www.stress.org/workplace-stress" },
      { name: "NAMI — Workplace Mental Health Resources", url: "https://www.nami.org" },
      { name: "NBCC — Counselor Certification Board", url: "https://www.nbcc.org" },
      { name: "NASW — Social Work & Workplace Health", url: "https://www.socialworkers.org/Practice/Mental-Health" },
      { name: "APA — Work, Stress & Health Resources", url: "https://www.apa.org/health/work" },
      { name: "McKinsey — Workplace Mental Health Insights", url: "https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/reframing-employee-health-moving-beyond-burnout-to-holistic-health" },
      { name: "HBR — Work & Mental Health Collection", url: "https://hbr.org/topic/subject/mental-health" },
      { name: "Lyra Health — Employer Mental Health Benefits", url: "https://lyrahealth.com" },
      { name: "Spring Health — Workplace Mental Health", url: "https://springhealth.com" },
      { name: "Modern Health — Employee Mental Health Platform", url: "https://modernhealth.com" },
      { name: "Headspace for Work — Mindfulness at Work", url: "https://work.headspace.com" },
      { name: "Calm for Business — Workplace Wellness", url: "https://business.calm.com" },
      { name: "Talkspace for Business — Employee Therapy", url: "https://www.talkspace.com/business" },
      { name: "NIH — Employee Wellness Program Model", url: "https://hr.nih.gov/benefits-and-wellness/wellness" },
      { name: "CDC — Violence Prevention in the Workplace", url: "https://www.cdc.gov/violenceprevention/index.html" },
      { name: "CIPD — Work & Mental Health Research", url: "https://www.cipd.org/uk/knowledge/factsheets/mental-health-factsheet" },
    ],
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
      { name: "InterVarsity Christian Fellowship", url: "https://intervarsity.org" },
      { name: "Campus Crusade for Christ (CRU)", url: "https://www.cru.org" },
      { name: "Wesley Foundation — Methodist Campus", url: "https://gbhem.org/campus-ministry" },
      { name: "Secular Student Alliance", url: "https://www.secularstudents.org" },
      { name: "Unitarian Universalist Campus Ministry", url: "https://www.uua.org/lgbtq/youth/campus" },
      { name: "Greek Orthodox Campus Ministry", url: "https://www.goarch.org" },
      { name: "Chi Alpha Campus Ministries", url: "https://chialpha.com" },
      { name: "IFYC — Interfaith Campus Research", url: "https://ifyc.org/research" },
      { name: "Center for Contemplative Mind in Society", url: "https://www.contemplativemind.org" },
      { name: "Fetzer Institute — Love & Forgiveness", url: "https://fetzer.org" },
      { name: "Spirituality & Practice", url: "https://www.spiritualityandpractice.com" },
      { name: "Daily Stoic — Staff Resilience", url: "https://dailystoic.com" },
      { name: "Modern Stoicism", url: "https://modernstoicism.com" },
      { name: "The School of Life — Life Philosophy", url: "https://www.theschooloflife.com" },
      { name: "Viktor Frankl — Logotherapy & Purpose", url: "https://www.viktorfrankl.org" },
      { name: "Self-Compassion — Kristin Neff", url: "https://self-compassion.org" },
      { name: "Brené Brown — Courage & Vulnerability", url: "https://brenebrown.com" },
      { name: "Positive Psychology Center — Penn", url: "https://www.authentichappiness.sas.upenn.edu" },
      { name: "VIA Character Strengths Survey", url: "https://www.viacharacter.org" },
      { name: "Harvard Human Flourishing Program", url: "https://hwpi.harvard.edu/humanflourishingprogram" },
      { name: "Character Lab — Character Research", url: "https://characterlab.org" },
      { name: "Growth Mindset — Carol Dweck", url: "https://www.mindsetonline.com" },
      { name: "Grit Scale — Angela Duckworth", url: "https://angeladuckworth.com" },
      { name: "Mindful.org — Mindfulness in Education", url: "https://www.mindful.org/mindfulness-in-higher-education" },
      { name: "UMass MBSR — Mindfulness Research", url: "https://www.umassmed.edu/cfm" },
      { name: "Brown Contemplative Studies Program", url: "https://www.brown.edu/academics/contemplative-studies" },
      { name: "On Being — Krista Tippett", url: "https://onbeing.org" },
      { name: "Philosophy Now — For Educators", url: "https://philosophynow.org" },
      { name: "MIT OCW Philosophy", url: "https://ocw.mit.edu/search/?d=Philosophy" },
      { name: "Yale OCW — Death & Philosophy", url: "https://oyc.yale.edu/death/phil-176" },
      { name: "Patheos — Faith in Higher Education", url: "https://www.patheos.com/channels/higheredprofessor" },
      { name: "Religion News Service — Campus Religion", url: "https://religionnews.com/category/campus" },
      { name: "Association for the Sociology of Religion", url: "https://www.sociologyofreligion.com" },
      { name: "American Academy of Religion", url: "https://www.aarweb.org" },
      { name: "Society for the Scientific Study of Religion", url: "https://www.sssrweb.org" },
      { name: "Journal of College & Character", url: "https://www.tandfonline.com/toc/ujcc20/current" },
      { name: "NACADA — Advising Students of Faith", url: "https://www.nacada.ksu.edu" },
      { name: "NASPA — Spirituality & Faith in Student Affairs", url: "https://www.naspa.org/constituent-groups/kcs/spirituality" },
      { name: "ACPA — Spirituality in Higher Ed", url: "https://myacpa.org" },
      { name: "Civic Responsibility & Religious Freedom — FIRE", url: "https://www.thefire.org/issues/religious-liberty" },
      { name: "Becket Fund — Religious Freedom Law", url: "https://www.becketlaw.org" },
      { name: "First Amendment — Religious Expression on Campus", url: "https://www.thefire.org/rights/first-amendment" },
      { name: "Campus Ministry Today", url: "https://campusministrytoday.org" },
      { name: "Campus Compact — Community & Service", url: "https://compact.org" },
      { name: "Ethics & Religious Liberty Commission", url: "https://erlc.com" },
      { name: "ACE — Religion in Higher Education", url: "https://www.acenet.edu" },
      { name: "Harvard Divinity School — Resources", url: "https://hds.harvard.edu" },
      { name: "Fuller Theological Seminary", url: "https://fuller.edu" },
      { name: "Duke Divinity School — Resources", url: "https://divinity.duke.edu" },
      { name: "Yale Divinity School", url: "https://divinity.yale.edu" },
      { name: "Gordon-Conwell Theological Seminary", url: "https://www.gordonconwell.edu" },
      { name: "Jewish Theological Seminary", url: "https://www.jtsa.edu" },
      { name: "Islamic Online University", url: "https://www.islamiconlineuniversity.com" },
      { name: "Mindfulness in Higher Education Network", url: "https://mindfuleducation.net" },
      { name: "Association for Contemplative Mind in Higher Ed", url: "https://www.contemplativemind.org/programs/acmhe" },
      { name: "Institute for Mindful Leadership", url: "https://instituteformindfulleadership.org" },
      { name: "Courage & Renewal — Parker Palmer", url: "https://couragerenewal.org" },
      { name: "Appreciative Inquiry Commons", url: "https://appreciativeinquiry.champlain.edu" },
      { name: "Positive Organizational Scholarship", url: "https://positiveorgs.bus.umich.edu" },
      { name: "Human Dignity — Witherspoon Institute", url: "https://www.winst.org" },
      { name: "Veritas Forum — Faith & Ideas", url: "https://www.veritas.org" },
      { name: "Q Ideas — Christian Thought Leadership", url: "https://qideas.org" },
      { name: "BioLogos — Faith & Science", url: "https://biologos.org" },
      { name: "Reasons to Believe — Apologetics", url: "https://reasons.org" },
      { name: "Liberty University — Faith Integration", url: "https://www.liberty.edu" },
      { name: "WorldViews in Conflict — Wheaton College", url: "https://www.wheaton.edu" },
    ],
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
      { name: "Government Accountability Project", url: "https://whistleblower.org" },
      { name: "National Whistleblower Center", url: "https://www.whistleblowers.org" },
      { name: "Taxpayers Against Fraud — False Claims Act", url: "https://www.taf.org" },
      { name: "Project on Government Oversight (POGO)", url: "https://www.pogo.org" },
      { name: "Whistleblower Aid — Legal Support", url: "https://whistlebloweraid.org" },
      { name: "SEC Whistleblower Program", url: "https://www.sec.gov/whistleblower" },
      { name: "CFTC Whistleblower Program", url: "https://www.cftc.gov/whistleblower" },
      { name: "Inspector General Network — Whistleblower", url: "https://www.ignet.gov/content/whistleblower-protection-resources" },
      { name: "GAO — Federal Whistleblower Resources", url: "https://www.gao.gov/legal/other-legal-work/whistleblower-protection" },
      { name: "SecureDrop — Anonymous Tips to Media", url: "https://securedrop.org" },
      { name: "GlobalLeaks — Secure Whistleblowing", url: "https://www.globaleaks.org" },
      { name: "EFF — Electronic Frontier Foundation", url: "https://www.eff.org" },
      { name: "EFF — Surveillance Self-Defense", url: "https://ssd.eff.org" },
      { name: "Signal — Encrypted Communication", url: "https://signal.org" },
      { name: "ProtonMail — Anonymous Encrypted Email", url: "https://proton.me" },
      { name: "Tor Project — Anonymous Browsing", url: "https://www.torproject.org" },
      { name: "FOIA — Freedom of Information Act", url: "https://www.foia.gov" },
      { name: "PrivacyRights.org — Consumer Data Rights", url: "https://privacyrights.org" },
      { name: "FERPA — Student Privacy Rights", url: "https://studentprivacy.ed.gov" },
      { name: "CCPA — California Consumer Privacy Act", url: "https://oag.ca.gov/privacy/ccpa" },
      { name: "EPIC — Electronic Privacy Info Center", url: "https://epic.org" },
      { name: "NCLC — Student Loan Borrower Rights", url: "https://www.nclc.org/issues/student-loans.html" },
      { name: "TICAS — College Access & Student Rights", url: "https://ticas.org" },
      { name: "Public Citizen — Consumer Advocacy", url: "https://www.citizen.org" },
      { name: "National Consumer Law Center", url: "https://www.nclc.org" },
      { name: "LawHelp.org — Legal Aid by State", url: "https://www.lawhelp.org" },
      { name: "LSC — Legal Services Corporation", url: "https://www.lsc.gov" },
      { name: "ABA — Free Legal Answers", url: "https://www.lawhelp.org" },
      { name: "FTC — Scholarship & FA Scam Alerts", url: "https://consumer.ftc.gov/articles/scholarship-and-financial-aid-scams" },
      { name: "USA.gov — Student Aid Scam Resources", url: "https://www.usa.gov/student-aid-scams" },
      { name: "College Scorecard — School Verification", url: "https://collegescorecard.ed.gov" },
      { name: "DAPIP — Accreditation Database", url: "https://ope.ed.gov/dapip" },
      { name: "Diploma Mill Awareness — ED", url: "https://www.ed.gov/accreditation" },
      { name: "School Closure Discharge (ED)", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/closed-school" },
      { name: "False Certification Discharge (ED)", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/false-certification" },
      { name: "IRS — Tax Scams & Fraud Alerts", url: "https://www.irs.gov/newsroom/tax-scams-consumer-alerts" },
      { name: "FBI — Financial Crime Reporting", url: "https://www.fbi.gov/investigate/white-collar-crime/financial-crimes" },
      { name: "IC3 — Internet Crime Complaint Center", url: "https://www.ic3.gov" },
      { name: "EEOC — File Discrimination Complaint", url: "https://www.eeoc.gov/filing-charge-discrimination" },
      { name: "DOJ — ADA Disability Rights Complaints", url: "https://www.ada.gov/filing-a-complaint" },
      { name: "HUD — Housing Discrimination Complaints", url: "https://www.hud.gov/topics/housing_discrimination" },
      { name: "ACLU — Know Your Rights", url: "https://www.aclu.org/know-your-rights" },
      { name: "NAACP Legal Defense Fund", url: "https://www.naacpldf.org" },
      { name: "Asian Americans Advancing Justice", url: "https://www.advancingjustice-aajc.org" },
      { name: "MALDEF — Latino Civil Rights", url: "https://maldef.org" },
      { name: "NCUA — Credit Union Consumer Resources", url: "https://www.ncua.gov/consumers" },
      { name: "OCC — National Bank Customer Assistance", url: "https://www.helpwithmybank.gov" },
      { name: "FDIC — Consumer Resources", url: "https://www.fdic.gov/consumers" },
      { name: "Federal Reserve — Consumer Resources", url: "https://www.federalreserve.gov/consumerscommunities.htm" },
      { name: "FINRA — Investor Complaint Center", url: "https://www.finra.org/investors/have-problem/file-complaint" },
      { name: "SEC — Investor Complaint Center", url: "https://investor.gov" },
      { name: "BBB — Better Business Bureau Complaints", url: "https://www.bbb.org" },
      { name: "USA.gov — Consumer Complaint Resources", url: "https://www.usa.gov/consumer-complaints" },
      { name: "State AG — Consumer Protection Finder", url: "https://www.naag.org/find-my-ag" },
      { name: "Reporters Without Borders", url: "https://rsf.org" },
      { name: "Reporter's Committee for Freedom of Press", url: "https://www.rcfp.org" },
      { name: "AARP Fraud Watch Network", url: "https://www.aarp.org/money/scams-fraud" },
      { name: "FTC Identity Theft Resources", url: "https://www.identitytheft.gov" },
      { name: "Identity Theft Resource Center", url: "https://www.idtheftcenter.org" },
      { name: "HHS OIG — Report Fraud Hotline", url: "https://oig.hhs.gov/fraud/report-fraud" },
      { name: "CFPB — Know Before You Owe", url: "https://www.consumerfinance.gov/paying-for-college" },
      { name: "Gainful Employment Disclosure Tool", url: "https://studentaid.gov/gainful-employment" },
      { name: "90/10 Rule Consumer Protection", url: "https://studentaid.gov" },
      { name: "NASFAA — Ethical Standards & Complaints", url: "https://www.nasfaa.org/professional_standards" },
    ],
  },
];

const SCHOLARSHIP_ENGINES = [
  { name: "Scholarships.com", url: "https://www.scholarships.com" },
  { name: "Fastweb", url: "https://www.fastweb.com" },
  { name: "BigFuture (College Board)", url: "https://bigfuture.collegeboard.org/scholarship-search" },
  { name: "Cappex", url: "https://www.cappex.com" },
  { name: "College Raptor", url: "https://www.collegeraptor.com/scholarships" },
];
const SCHOLARSHIP_ENGINES_MORE = [
  // General search engines
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
  // Prestigious national programs
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
  // Minority & diversity
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
  // Women's scholarships
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
  // STEM scholarships
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
  // Healthcare & nursing
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
  // Business & finance
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
  // Arts, humanities & social sciences
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
  // Military & veterans
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
  // State higher education agencies
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
  // International & study abroad
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

const PRIVATE_STUDENT_LOANS = [
  { name: "Sallie Mae", url: "https://www.salliemae.com/student-loans" },
  { name: "College Ave Student Loans", url: "https://www.collegeavestudentloans.com" },
  { name: "Earnest", url: "https://www.earnest.com/student-loans" },
  { name: "SoFi Student Loans", url: "https://www.sofi.com/student-loans" },
  { name: "Discover Student Loans", url: "https://www.discover.com/student-loans" },
  { name: "Citizens Bank Student Loans", url: "https://www.citizensbank.com/learning/student-loans.aspx" },
  { name: "Ascent Student Loans", url: "https://www.ascentfunding.com" },
  { name: "MEFA (MA Educational Financing)", url: "https://www.mefa.org/loans" },
  { name: "RISLA (RI Student Loan Auth.)", url: "https://www.risla.com" },
  { name: "Laurel Road", url: "https://www.laurelroad.com" },
];
const PRIVATE_STUDENT_LOANS_MORE = [
  { name: "LendKey", url: "https://www.lendkey.com" },
  { name: "MPOWER (International Students)", url: "https://www.mpowerfinancing.com" },
  { name: "Prodigy Finance (International)", url: "https://prodigyfinance.com" },
  { name: "PNC Student Loans", url: "https://www.pnc.com/student-loans" },
  { name: "Custom Choice (SouthState)", url: "https://www.customchoiceloan.com" },
  { name: "ISL Education Lending", url: "https://islelend.com" },
  { name: "Advantage Education Loan (KHESLC)", url: "https://www.advantageeducationloan.com" },
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
  { name: "Navy Federal CU Education Loans", url: "https://www.navyfederal.org/loans-cards/student-loans.html" },
  { name: "PenFed Credit Union", url: "https://www.penfed.org/student-loans" },
  { name: "First Tech FCU Student Loans", url: "https://www.firsttechfed.com/borrow/student-loans" },
  { name: "Purefy (refi marketplace)", url: "https://www.purefy.com" },
  { name: "Brazos Higher Education", url: "https://www.brazos.org" },
  { name: "South Carolina Student Loan", url: "https://www.scstudentloan.org" },
  { name: "College Foundation of NC (CFNC)", url: "https://www.cfnc.org/pay-for-college/apply-for-a-loan" },
  { name: "VSAC (Vermont Student Assistance)", url: "https://www.vsac.org/pay/loans" },
  { name: "HESC (NY Higher Education Svcs.)", url: "https://www.hesc.ny.gov" },
  { name: "PHEAA (PA Higher Education)", url: "https://www.pheaa.org" },
  { name: "HESAA (NJ Higher Education)", url: "https://www.hesaa.org" },
  { name: "Juno (group negotiated rates)", url: "https://joinjuno.com" },
  { name: "Student Choice (CU network)", url: "https://www.studentchoice.org" },
  { name: "Yrefy (defaulted loan refi)", url: "https://www.yrefy.com" },
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
const STUDENT_JOB_SEARCH_MORE = [
  { name: "Monster", url: "https://www.monster.com" },
  { name: "CareerBuilder", url: "https://www.careerbuilder.com" },
  { name: "SimplyHired", url: "https://www.simplyhired.com" },
  { name: "Dice (Tech)", url: "https://www.dice.com" },
  { name: "Wellfound / AngelList (Startups)", url: "https://wellfound.com" },
  { name: "Built In (Tech Startups)", url: "https://builtin.com" },
  { name: "FlexJobs (Remote/Flexible)", url: "https://www.flexjobs.com" },
  { name: "We Work Remotely", url: "https://weworkremotely.com" },
  { name: "Remote.co", url: "https://remote.co" },
  { name: "Snagajob (Hourly/Part-Time)", url: "https://www.snagajob.com" },
  { name: "JobList", url: "https://www.joblist.com" },
  { name: "Nexxt", url: "https://www.nexxt.com" },
  { name: "HealthcareJobsite", url: "https://www.healthcarejobsite.com" },
  { name: "Health eCareers", url: "https://www.healthecareers.com" },
  { name: "eFinancialCareers", url: "https://www.efinancialcareers.com" },
  { name: "HigherEdJobs", url: "https://www.higheredjobs.com" },
  { name: "Chronicle of Higher Ed Jobs", url: "https://jobs.chronicle.com" },
  { name: "GovernmentJobs.com", url: "https://www.governmentjobs.com" },
  { name: "ClearanceJobs (Security Clearance)", url: "https://www.clearancejobs.com" },
  { name: "PowerToFly (Women & Diversity)", url: "https://powertofly.com" },
  { name: "Jopwell (Diverse Professionals)", url: "https://www.jopwell.com" },
  { name: "DiversityJobs", url: "https://www.diversityjobs.com" },
  { name: "iHispano", url: "https://ihispano.com" },
  { name: "VetJobs (Veterans)", url: "https://www.vetjobs.com" },
  { name: "HireHeroesUSA (Veterans)", url: "https://www.hireheroesusa.org" },
  { name: "DisabilityJobs.net", url: "https://www.disabilityjobs.net" },
  { name: "AbilityLinks", url: "https://abilitylinks.org" },
  { name: "LawJobs", url: "https://www.lawjobs.com" },
  { name: "Mediabistro (Media/Comms)", url: "https://www.mediabistro.com" },
  { name: "JournalismJobs", url: "https://www.journalismjobs.com" },
  { name: "EngineeringJobs.com", url: "https://www.engineeringjobs.com" },
  { name: "AccountingJobsToday", url: "https://www.accountingjobstoday.com" },
  { name: "The Ladders ($100K+)", url: "https://www.theladders.com" },
  { name: "Vault Career Guides", url: "https://www.vault.com" },
  { name: "Chegg Internships & Jobs", url: "https://www.chegg.com/internships" },
  { name: "Parker Dewey (Micro-Internships)", url: "https://www.parkerdewey.com" },
  { name: "Campus Job", url: "https://www.campusjob.com" },
  { name: "JobSpider", url: "https://www.jobspider.com" },
  { name: "Career.io", url: "https://career.io" },
  { name: "Himalayas (Remote Jobs)", url: "https://himalayas.app" },
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
const INTERNSHIP_SEARCH_MORE = [
  { name: "InternQueen", url: "https://www.internqueen.com" },
  { name: "Idealist Internships", url: "https://www.idealist.org" },
  { name: "Go Overseas (Abroad)", url: "https://www.gooverseas.com" },
  { name: "AIESEC (International)", url: "https://aiesec.org" },
  { name: "BUNAC (Work Abroad)", url: "https://www.bunac.org" },
  { name: "Global Experiences (Abroad)", url: "https://www.globalexperiences.com" },
  { name: "IAESTE (STEM Abroad)", url: "https://www.iaeste.us" },
  { name: "SEO Career (Diversity)", url: "https://www.seo-usa.org" },
  { name: "Management Leadership for Tomorrow (MLT)", url: "https://mlt.org" },
  { name: "Out for Undergrad (O4U)", url: "https://www.outforundergrad.org" },
  { name: "Hispanic Scholarship Fund Internships", url: "https://www.hsf.net" },
  { name: "UNCF Internship Programs", url: "https://uncf.org" },
  { name: "Congressional Black Caucus Foundation", url: "https://www.cbcfinc.org" },
  { name: "Washington Center Internships", url: "https://twc.edu" },
  { name: "White House Internship Program", url: "https://www.whitehouse.gov/get-involved/internships" },
  { name: "State Department Student Internships", url: "https://www.state.gov/internships" },
  { name: "NSF REU Programs (Research)", url: "https://www.nsf.gov/crssprgm/reu" },
  { name: "NASA Internships", url: "https://intern.nasa.gov" },
  { name: "NIH Training & Internships", url: "https://www.training.nih.gov" },
  { name: "CDC Student Internships", url: "https://www.cdc.gov/employment" },
  { name: "DOE Science Internships (WDTS)", url: "https://science.osti.gov/wdts" },
  { name: "Smithsonian Internships", url: "https://www.si.edu/OFG/Internships" },
  { name: "Peace Corps (Post-Grad)", url: "https://www.peacecorps.gov" },
  { name: "AmeriCorps", url: "https://americorps.gov" },
  { name: "City Year", url: "https://www.cityyear.org" },
  { name: "Teach For America", url: "https://www.teachforamerica.org" },
  { name: "Google STEP Internship", url: "https://buildyourfuture.withgoogle.com/programs/step" },
  { name: "Microsoft Intern Programs", url: "https://careers.microsoft.com/students" },
  { name: "Goldman Sachs Summer Analyst", url: "https://www.goldmansachs.com/careers/students" },
  { name: "Apple Internships", url: "https://jobs.apple.com/en-us/search?team=internships-STDNT-INTRN" },
  { name: "Facebook/Meta Internships", url: "https://www.metacareers.com/students-and-grads" },
  { name: "Amazon Student Programs", url: "https://www.amazon.jobs/en/teams/internships-for-students" },
  { name: "Getting Hired (Disability)", url: "https://www.gettinghired.com" },
  { name: "Jopwell Internships (Diversity)", url: "https://www.jopwell.com" },
  { name: "Vault Internship Rankings", url: "https://www.vault.com/best-companies/internships" },
  { name: "College Recruiter Internships", url: "https://www.collegerecruiter.com" },
  { name: "Glassdoor Internships", url: "https://www.glassdoor.com" },
  { name: "ZipRecruiter Internships", url: "https://www.ziprecruiter.com" },
  { name: "USAJobs Student Programs", url: "https://www.usajobs.gov/students" },
  { name: "Hire Heroes USA (Veterans Internships)", url: "https://www.hireheroesusa.org" },
];

const RESUME_ASSISTANCE = [
  { name: "Resume.io", url: "https://resume.io" },
  { name: "Canva Resume Builder (Free)", url: "https://www.canva.com/resumes" },
  { name: "Zety Resume Builder", url: "https://zety.com" },
  { name: "Novoresume", url: "https://novoresume.com" },
  { name: "Enhancv", url: "https://enhancv.com" },
  { name: "Resume Genius", url: "https://resumegenius.com" },
  { name: "VisualCV", url: "https://www.visualcv.com" },
  { name: "Kickresume", url: "https://www.kickresume.com" },
  { name: "JobScan (ATS Optimization)", url: "https://www.jobscan.co" },
  { name: "Rezi (AI Resume Builder)", url: "https://www.rezi.ai" },
];
const RESUME_ASSISTANCE_MORE = [
  { name: "Teal HQ (AI Career Tools)", url: "https://www.tealhq.com" },
  { name: "ResumeWorded (AI Feedback)", url: "https://resumeworded.com" },
  { name: "My Perfect Resume", url: "https://www.myperfectresume.com" },
  { name: "LiveCareer", url: "https://www.livecareer.com" },
  { name: "Resume Now", url: "https://www.resume-now.com" },
  { name: "Standard Resume", url: "https://standardresume.co" },
  { name: "CakeResume", url: "https://www.cakeresume.com" },
  { name: "RxResume (Free & Open Source)", url: "https://rxresu.me" },
  { name: "Indeed Resume Builder", url: "https://www.indeed.com/create-resume" },
  { name: "LinkedIn Resume Builder", url: "https://www.linkedin.com/resume-builder" },
  { name: "Wonsulting AI Resume", url: "https://www.wonsulting.com" },
  { name: "TopResume (Professional Service)", url: "https://www.topresume.com" },
  { name: "ZipJob (Professional Service)", url: "https://www.zipjob.com" },
  { name: "ResumeSpice (Professional)", url: "https://www.resumespice.com" },
  { name: "Big Interview (Mock Interviews)", url: "https://biginterview.com" },
  { name: "Pramp (Mock Interviews)", url: "https://www.pramp.com" },
  { name: "InterviewBit", url: "https://www.interviewbit.com" },
  { name: "PathRise (Career Coaching)", url: "https://www.pathrise.com" },
  { name: "Career Contessa", url: "https://www.careercontessa.com" },
  { name: "The Muse — Resume Tips", url: "https://www.themuse.com/advice/resume" },
  { name: "Purdue OWL Resume Guide", url: "https://owl.purdue.edu/owl/job_search_writing/resumes_and_vitas" },
  { name: "Harvard OCS Resume Guide", url: "https://ocs.fas.harvard.edu/resumes-cvs" },
  { name: "MIT Resume Guide", url: "https://capd.mit.edu/jobs-and-internships/resumes-cvs-cover-letters-linkedin" },
  { name: "NACE Career Resources", url: "https://www.naceweb.org" },
  { name: "Google Docs Resume Templates", url: "https://docs.google.com/templates" },
  { name: "Microsoft Office Resume Templates", url: "https://templates.office.com/en-us/resumes-and-cover-letters" },
  { name: "Grammarly (Writing Polish)", url: "https://www.grammarly.com" },
  { name: "Hemingway Editor (Clarity)", url: "https://hemingwayapp.com" },
  { name: "Quillbot (Paraphrase & Improve)", url: "https://quillbot.com" },
  { name: "Career Karma (Bootcamp/Tech)", url: "https://careerkarma.com" },
  { name: "Vault Career Guides", url: "https://www.vault.com" },
  { name: "Monster Resume Advice", url: "https://www.monster.com/career-advice/article/how-to-write-a-resume" },
  { name: "Glassdoor Resume Tips", url: "https://www.glassdoor.com/blog/guide/how-to-write-a-resume" },
  { name: "Creddle (Visual Resume)", url: "https://creddle.io" },
  { name: "Resume Builder (Free)", url: "https://www.resumebuilder.com" },
  { name: "Resumake (Open Source)", url: "https://resumake.io" },
  { name: "Skillroads (AI Resume)", url: "https://skillroads.com" },
  { name: "Interview Warmup (Google)", url: "https://grow.google/certificates/interview-warmup" },
  { name: "LinkedIn Interview Prep", url: "https://www.linkedin.com/interview-prep" },
  { name: "iinterview AI (Mock)", url: "https://iinterview.ai" },
];

const AI_LITERACY = [
  { name: "Elements of AI (Free)", url: "https://www.elementsofai.com" },
  { name: "Google AI Essentials (Free)", url: "https://grow.google/intl/en_us/courses-and-tools" },
  { name: "Microsoft AI Skills Initiative (Free)", url: "https://microsoft.com/en-us/ai/ai-skills" },
  { name: "Coursera: AI for Everyone — Andrew Ng (Free Audit)", url: "https://www.coursera.org/learn/ai-for-everyone" },
  { name: "DeepLearning.AI Short Courses (Free)", url: "https://www.deeplearning.ai/short-courses" },
  { name: "Google ML Crash Course (Free)", url: "https://developers.google.com/machine-learning/crash-course" },
  { name: "Kaggle Learn — AI/ML (Free)", url: "https://www.kaggle.com/learn" },
  { name: "fast.ai — Practical Deep Learning (Free)", url: "https://www.fast.ai" },
  { name: "Harvard CS50 AI with Python (Free)", url: "https://cs50.harvard.edu/ai" },
  { name: "IBM AI Fundamentals (Free)", url: "https://skills.yourlearning.ibm.com" },
];
const AI_LITERACY_MORE = [
  { name: "Hugging Face AI Courses (Free)", url: "https://huggingface.co/learn" },
  { name: "Google Generative AI Learning Path (Free)", url: "https://cloudskillsboost.google/paths/118" },
  { name: "AWS AI/ML Training (Free Tier)", url: "https://aws.amazon.com/training/learn-about/machine-learning" },
  { name: "NVIDIA Deep Learning Institute (Free/Paid)", url: "https://www.nvidia.com/en-us/training" },
  { name: "MIT OpenCourseWare — AI (Free)", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010" },
  { name: "Stanford HAI Resources (Free)", url: "https://hai.stanford.edu" },
  { name: "AI Business School — Microsoft (Free)", url: "https://www.microsoft.com/en-us/ai/ai-business-school" },
  { name: "Salesforce AI Associate — Trailhead (Free)", url: "https://trailhead.salesforce.com" },
  { name: "Class Central — AI Courses (Free Aggregator)", url: "https://www.classcentral.com/subject/ai" },
  { name: "OpenAI Prompt Engineering Guide (Free)", url: "https://platform.openai.com/docs/guides/prompt-engineering" },
  { name: "Anthropic Prompt Library (Free)", url: "https://docs.anthropic.com/en/prompt-library/library" },
  { name: "ChatGPT Prompt Engineering for Developers (Free)", url: "https://learn.deeplearning.ai/chatgpt-prompt-eng" },
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
  { name: "Coursera: AI in Education (Paid Cert)", url: "https://www.coursera.org/learn/ai-education" },
  { name: "Perplexity AI Learning Guide (Free)", url: "https://www.perplexity.ai" },
  { name: "Claude.ai — Hands-On AI Practice (Free)", url: "https://claude.ai" },
  { name: "ChatGPT — Hands-On AI Practice (Free/Paid)", url: "https://chatgpt.com" },
  { name: "Google NotebookLM (Free)", url: "https://notebooklm.google.com" },
  { name: "Gamma AI Presentations (Free/Paid)", url: "https://gamma.app" },
  { name: "Coursera: Generative AI for Everyone (Free Audit)", url: "https://www.coursera.org/learn/generative-ai-for-everyone" },
];

// ── Mental Health Literacy — Students & Parents ──
const MENTAL_HEALTH_STUDENT = [
  { name: "988 Suicide & Crisis Lifeline", url: "https://988lifeline.org" },
  { name: "Crisis Text Line — Text HOME to 741741", url: "https://www.crisistextline.org" },
  { name: "NAMI — National Alliance on Mental Illness", url: "https://www.nami.org" },
  { name: "Active Minds — Student Mental Health", url: "https://www.activeminds.org" },
  { name: "JED Foundation — Young Adult Mental Health", url: "https://jedfoundation.org" },
  { name: "MentalHealth.gov — What Is Mental Health", url: "https://www.mentalhealth.gov" },
  { name: "SAMHSA National Helpline 1-800-662-4357", url: "https://www.samhsa.gov/find-help/national-helpline" },
  { name: "Trevor Project — LGBTQ+ Youth Crisis", url: "https://www.thetrevorproject.org" },
  { name: "Suicide Prevention Resource Center (SPRC)", url: "https://sprc.org" },
  { name: "National Eating Disorders Association (NEDA)", url: "https://www.nationaleatingdisorders.org" },
];
const MENTAL_HEALTH_STUDENT_MORE = [
  { name: "AFSP — American Foundation for Suicide Prevention", url: "https://afsp.org" },
  { name: "Half of Us — Campus Mental Health", url: "https://halfofus.com" },
  { name: "ULifeline — College Mental Health Resource", url: "https://www.ulifeline.org" },
  { name: "Headspace for Students", url: "https://www.headspace.com/students" },
  { name: "Calm App — Stress & Sleep", url: "https://www.calm.com" },
  { name: "Woebot — AI Mental Health Support", url: "https://woebothealth.com" },
  { name: "BetterHelp — Online Therapy", url: "https://www.betterhelp.com" },
  { name: "Talkspace — Online Therapy for Students", url: "https://www.talkspace.com" },
  { name: "NAMI HelpLine 1-800-950-6264", url: "https://www.nami.org/help" },
  { name: "MHA — Mental Health America Screening", url: "https://screening.mhanational.org" },
  { name: "Anxiety & Depression Association (ADAA)", url: "https://adaa.org" },
  { name: "Child Mind Institute — Youth Mental Health", url: "https://childmind.org" },
  { name: "Psychology Today Therapist Finder", url: "https://www.psychologytoday.com/us/therapists" },
  { name: "Open Path Collective — Affordable Therapy", url: "https://openpathcollective.org" },
  { name: "7 Cups — Free Online Chat Support", url: "https://www.7cups.com" },
  { name: "Sanvello — Anxiety & Depression App", url: "https://www.sanvello.com" },
  { name: "Shine — Mental Health for People of Color", url: "https://www.theshineapp.com" },
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
  { name: "Student Veterans of America — Mental Health", url: "https://studentveterans.org/programs/mental-health" },
  { name: "Veterans Crisis Line 1-800-273-8255 #1", url: "https://www.veteranscrisisline.net" },
  { name: "NAMI Veterans & Military Resource", url: "https://www.nami.org/Your-Journey/Veterans-Active-Duty" },
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
  { name: "DBSA — Depression & Bipolar Support Alliance", url: "https://www.dbsalliance.org" },
  { name: "International OCD Foundation", url: "https://iocdf.org" },
  { name: "PTSD Alliance", url: "https://www.ptsdalliance.org" },
  { name: "Insomnia Coach — Sleep & Mental Health", url: "https://www.insomniacoach.org" },
  { name: "Black Mental Health Alliance", url: "https://blackmentalhealth.com" },
  { name: "Asian Mental Health Collective", url: "https://www.asianmhc.org" },
  { name: "Latinx Therapy — Therapist Directory", url: "https://latinxtherapy.com" },
  { name: "NQTTCN — Queer Trans Therapists of Color", url: "https://www.nqttcn.com" },
  { name: "National Council for Mental Wellbeing", url: "https://www.thenationalcouncil.org" },
  { name: "CHADD — ADHD Resources", url: "https://chadd.org" },
  { name: "Autism Society of America", url: "https://autismsociety.org" },
  { name: "ADAA — Find a Therapist (Anxiety)", url: "https://adaa.org/finding-help/finding-therapist" },
  { name: "NARSAD — Mental Health Research", url: "https://www.bbrfoundation.org" },
  { name: "SAMHSA Mental Health Treatment Locator", url: "https://findtreatment.samhsa.gov" },
  { name: "United Way 211 — Local Mental Health Services", url: "https://www.211.org" },
  { name: "Peer.org — Peer Support Community", url: "https://peer.org" },
  { name: "Child Welfare Information Gateway", url: "https://www.childwelfare.gov/topics/responding/mental-health" },
  { name: "Understood.org — Learning & Mental Health", url: "https://www.understood.org" },
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
  { name: "The Steve Fund — BIPOC Mental Health", url: "https://stevefund.org" },
  { name: "AFSP — Campus Programs", url: "https://afsp.org/chapter/programs/campus-programs" },
  { name: "Suicide Attempt Survivors — AFSP", url: "https://afsp.org/find-your-local-chapter" },
  { name: "Now Matters Now — DBT Skills", url: "https://www.nowmattersnow.org" },
  { name: "Calm Harm App — Self Harm", url: "https://calmharm.co.uk" },
  { name: "ReachOut Australia — Youth Mental Health", url: "https://au.reachout.com" },
  { name: "Mindline Trans+ — Trans Mental Health", url: "https://mindlinetrans.org.uk" },
  { name: "Safe Space — LGBTQ+ Mental Health", url: "https://www.safespace.org" },
  { name: "NSVRC — Sexual Violence & Mental Health", url: "https://www.nsvrc.org" },
  { name: "ASCA — Adult Survivors of Child Abuse", url: "https://www.ascasupport.org" },
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
  { name: "Postpartum Support International", url: "https://www.postpartum.net" },
  { name: "Mental Health Foundation — UK", url: "https://www.mentalhealth.org.uk" },
  { name: "Mind.org — UK Mental Health Charity", url: "https://www.mind.org.uk" },
  { name: "WHO — Mental Health", url: "https://www.who.int/health-topics/mental-health" },
  { name: "PAHO — Mental Health in the Americas", url: "https://www.paho.org/en/topics/mental-health" },
  { name: "International Association for Suicide Prevention", url: "https://www.iasp.info" },
  { name: "Finding Hope in College — Flourishing in FA", url: "https://studentaid.gov/help-center/answers/topic/general-info" },
  { name: "NAMI — Mental Health & Financial Stress", url: "https://www.nami.org/Blogs/NAMI-Blog/November-2019/How-Financial-Stress-Can-Impact-Mental-Health" },
  { name: "College and Career Readiness & Mental Health", url: "https://www.cdc.gov/healthyyouth/mental-health/index.htm" },
  { name: "SAMHSA — College Mental Health", url: "https://www.samhsa.gov/resource-search/ebp?f[0]=population_group%3A1552" },
];

// ── Religion, Faith & Philosophy ──
const RELIGION_FAITH_PHILOSOPHY = [
  { name: "Patheos — World Religions & Philosophy", url: "https://www.patheos.com" },
  { name: "Beliefnet — Spirituality & Faith", url: "https://www.beliefnet.com" },
  { name: "Philosophy Bro — Accessible Philosophy", url: "https://www.philosophybro.com" },
  { name: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu" },
  { name: "Internet Encyclopedia of Philosophy", url: "https://iep.utm.edu" },
  { name: "Daily Stoic — Stoic Philosophy", url: "https://dailystoic.com" },
  { name: "Awakin.org — Inner-Life Weekly Readings", url: "https://www.awakin.org" },
  { name: "Coursera — Religion & Philosophy Courses", url: "https://www.coursera.org/browse/arts-and-humanities/philosophy" },
  { name: "Khan Academy — World History of Religion", url: "https://www.khanacademy.org/humanities/world-history/world-history-beginnings/birth-of-religion/a/the-first-religions" },
  { name: "TED Talks — Philosophy & Religion", url: "https://www.ted.com/topics/philosophy" },
];
const RELIGION_FAITH_PHILOSOPHY_MORE = [
  // Christianity
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
  // Islam
  { name: "IslamicFinder — Prayer Times & Quran", url: "https://www.islamicfinder.org" },
  { name: "Quran.com — Read & Listen to Quran", url: "https://quran.com" },
  { name: "Islamic Society of North America (ISNA)", url: "https://www.isna.net" },
  { name: "Yaqeen Institute — Islamic Research", url: "https://yaqeeninstitute.org" },
  { name: "SeekersGuidance — Islamic Learning", url: "https://seekersguidance.org" },
  // Judaism
  { name: "My Jewish Learning — Torah & Traditions", url: "https://www.myjewishlearning.com" },
  { name: "Chabad.org — Jewish Resources", url: "https://www.chabad.org" },
  { name: "Union for Reform Judaism", url: "https://urj.org" },
  { name: "United Synagogue of Conservative Judaism", url: "https://www.uscj.org" },
  { name: "Jewish Virtual Library", url: "https://www.jewishvirtuallibrary.org" },
  // Hinduism
  { name: "Hinduism Today — Cultural Magazine", url: "https://www.hinduismtoday.com" },
  { name: "Hindu American Foundation", url: "https://www.hinduamerican.org" },
  { name: "Vedanta Society — Vedanta Philosophy", url: "https://www.vedanta.org" },
  { name: "Bhagavad Gita Online", url: "https://www.holy-bhagavad-gita.org" },
  // Buddhism
  { name: "Lion's Roar — Buddhist Wisdom", url: "https://www.lionsroar.com" },
  { name: "Dharma.org — Insight Meditation", url: "https://www.dharma.org" },
  { name: "BuddhaNet — Buddhist Education", url: "https://www.buddhanet.net" },
  { name: "Zen Mountain Monastery", url: "https://zmm.org" },
  { name: "Plum Village — Thich Nhat Hanh", url: "https://plumvillage.org" },
  // Sikhism
  { name: "Sikh Net — Sikh Resource Center", url: "https://www.sikhnet.com" },
  { name: "Sri Granth — Guru Granth Sahib", url: "https://www.srigranth.org" },
  { name: "Sikh Coalition", url: "https://www.sikhcoalition.org" },
  // Indigenous / Earth-based
  { name: "Native American Church Resources", url: "https://www.nativeamericanchurchofna.org" },
  { name: "Longhouse Media — Indigenous Spirituality", url: "https://www.longhousemedia.org" },
  // Bahai
  { name: "Bahai.org — Bahai Faith", url: "https://www.bahai.org" },
  // Interfaith & Spiritual but not Religious
  { name: "Interfaith Youth Core (IFYC)", url: "https://ifyc.org" },
  { name: "Parliament of World Religions", url: "https://parliamentofreligions.org" },
  { name: "Fetzer Institute — Love & Forgiveness", url: "https://fetzer.org" },
  { name: "Spirituality & Practice — Multifaith", url: "https://www.spiritualityandpractice.com" },
  { name: "Secular Student Alliance", url: "https://www.secularstudents.org" },
  { name: "Unitarian Universalist Association", url: "https://www.uua.org" },
  { name: "Center for Contemplative Mind in Society", url: "https://www.contemplativemind.org" },
  // Philosophy — Classical & Modern
  { name: "Philosophy Now — Philosophy Magazine", url: "https://philosophynow.org" },
  { name: "Philosophy Pages — Western Philosophy", url: "https://www.philosophypages.com" },
  { name: "The School of Life — Life Philosophy", url: "https://www.theschooloflife.com" },
  { name: "Big Think — Philosophy & Ideas", url: "https://bigthink.com/series/the-big-think-interview" },
  { name: "Closer to Truth — Cosmos & Philosophy", url: "https://www.closertotruth.com" },
  { name: "Philosophy Talk — Radio Show & Podcast", url: "https://www.philosophytalk.org" },
  // Stoicism & Positive Philosophy
  { name: "The Stoic Fellowship", url: "https://stoicfellowship.com" },
  { name: "Modern Stoicism — Stoic Week", url: "https://modernstoicism.com" },
  { name: "Stoicism Today", url: "https://stoicismtoday.com" },
  { name: "Stoic Meditations — Ryan Holiday", url: "https://ryanholiday.net/stoicism" },
  { name: "Marcus Aurelius — Meditations (Free)", url: "https://classics.mit.edu/Antoninus/meditations.html" },
  { name: "Epictetus Discourses (Online Text)", url: "https://www.gutenberg.org/ebooks/4135" },
  { name: "Seneca's Letters (Online Text)", url: "https://www.gutenberg.org/ebooks/900" },
  { name: "Positive Psychology — VIA Strengths", url: "https://www.viacharacter.org" },
  { name: "Greater Good Science Center — UC Berkeley", url: "https://greatergood.berkeley.edu" },
  { name: "Happiness Lab — Yale Course", url: "https://www.happinesslab.fm" },
  { name: "Mindfulness-Based Cognitive Therapy", url: "https://www.mbct.com" },
  // Existentialism & Ethics
  { name: "Existentialism — SparkNotes Philosophy", url: "https://www.sparknotes.com/philosophy" },
  { name: "Ethics Unwrapped — UT Austin", url: "https://ethicsunwrapped.utexas.edu" },
  { name: "Practical Ethics — Oxford University", url: "https://www.practicalethics.ox.ac.uk" },
  { name: "Markkula Center for Applied Ethics", url: "https://www.scu.edu/ethics" },
  { name: "Philosophy Foundation — UK Outreach", url: "https://www.philosophy-foundation.org" },
  // Eastern Philosophy
  { name: "Tao Te Ching — Laozi (Free Text)", url: "https://www.gutenberg.org/ebooks/216" },
  { name: "Confucius Institute Online", url: "https://www.chinese-ki.com" },
  { name: "Alan Watts Lectures — Eastern Philosophy", url: "https://www.alanwatts.org" },
  { name: "Zen Buddhism Resources — Shambhala", url: "https://www.shambhala.org" },
  // Growth & Purpose
  { name: "Purpose in Life — Stanford Center on Longevity", url: "https://longevity.stanford.edu" },
  { name: "The Purpose Institute", url: "https://www.thepurposeinstitute.com" },
  { name: "Viktor Frankl Institute — Logotherapy", url: "https://www.viktorfrankl.org" },
  { name: "Simon Sinek — Find Your Why", url: "https://simonsinek.com" },
  { name: "Character Strengths — VIA Survey", url: "https://www.viacharacter.org/surveys/takesurvey" },
  { name: "Flourishing — Harvard Divinity School", url: "https://hwpi.harvard.edu/humanflourishingprogram" },
  { name: "Positive Intelligence — Shirzad Chamine", url: "https://www.positiveintelligence.com" },
  // Mindfulness & Contemplative Practice
  { name: "Center for Mindfulness — UMass Medical", url: "https://www.umassmed.edu/cfm" },
  { name: "Mindful.org — Mindfulness Resources", url: "https://www.mindful.org" },
  { name: "Insight Meditation Society", url: "https://www.dharma.org" },
  { name: "Contemplative Studies — Brown University", url: "https://www.brown.edu/academics/contemplative-studies" },
  { name: "Tara Brach — Meditation & Teachings", url: "https://www.tarabrach.com" },
  { name: "Jack Kornfield — Mindfulness & Buddhism", url: "https://jackkornfield.com" },
  { name: "Pema Chodron — Buddhist Teachings", url: "https://pemachodronfoundation.org" },
  // Prayer & Devotion
  { name: "Daily Prayer — Pray.com", url: "https://pray.com" },
  { name: "Hallow — Catholic Prayer App", url: "https://hallow.com" },
  { name: "YouVersion Bible App", url: "https://www.bible.com" },
  { name: "Jewish Prayer Resources — Siddur", url: "https://www.jewishvirtuallibrary.org/jewish-prayer" },
  { name: "Islamicity — Quran & Hadith", url: "https://www.islamicity.org" },
  // Open Courseware
  { name: "MIT OpenCourseWare — Philosophy", url: "https://ocw.mit.edu/search/?d=Philosophy" },
  { name: "Yale Open Courses — Philosophy & Death", url: "https://oyc.yale.edu/death/phil-176" },
  { name: "Coursera — Buddhism & Modern Psychology", url: "https://www.coursera.org/learn/science-of-meditation" },
  { name: "edX — World Religions & Spirituality", url: "https://www.edx.org/search?q=religion" },
  { name: "FutureLearn — Philosophy Courses", url: "https://www.futurelearn.com/subjects/philosophy-and-religion-courses" },
  { name: "Udemy — Philosophy for Beginners", url: "https://www.udemy.com/topic/philosophy" },
  // Books & Reading
  { name: "Goodreads — Philosophy & Religion Reading Lists", url: "https://www.goodreads.com/shelf/show/philosophy" },
  { name: "Project Gutenberg — Free Philosophy Texts", url: "https://www.gutenberg.org/ebooks/search/?query=philosophy&submit_search=Search+Catalog" },
  { name: "Open Library — Free Religion Books", url: "https://openlibrary.org/subjects/religion" },
  // Campus & Interfaith
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
  // Growth mindset & Resilience
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
  // Podcasts & Audio
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
];

// ── Consumer Rights & Whistleblower Protection ──
const CONSUMER_RIGHTS = [
  { name: "CFPB — Consumer Financial Protection Bureau", url: "https://www.consumerfinance.gov" },
  { name: "FTC — Federal Trade Commission Consumer Info", url: "https://consumer.ftc.gov" },
  { name: "CFPB Student Loan Complaint Portal", url: "https://www.consumerfinance.gov/complaint" },
  { name: "ED Feedback System — Ombudsman", url: "https://studentaid.gov/feedback-center" },
  { name: "FSA Ombudsman (Student Loan Disputes)", url: "https://studentaid.gov/feedback-center" },
  { name: "FTC Identity Theft Resources", url: "https://www.identitytheft.gov" },
  { name: "BBB — Better Business Bureau", url: "https://www.bbb.org" },
  { name: "USA.gov — File a Consumer Complaint", url: "https://www.usa.gov/consumer-complaints" },
  { name: "State Attorney General — Consumer Protection", url: "https://www.naag.org/find-my-ag" },
  { name: "ED OIG Hotline — Report Fraud/Waste/Abuse", url: "https://www2.ed.gov/about/offices/list/oig/hotline.html" },
];
const CONSUMER_RIGHTS_MORE = [
  // Consumer financial protection
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
  // Whistleblower protection — Federal
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
  // Whistleblower — State & legal
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
  // Privacy & data rights
  { name: "FERPA — Student Privacy Rights", url: "https://studentprivacy.ed.gov" },
  { name: "FOIA — Freedom of Information Act Requests", url: "https://www.foia.gov" },
  { name: "PrivacyRights.org — Consumer Data Rights", url: "https://privacyrights.org" },
  { name: "CCPA — California Consumer Privacy", url: "https://oag.ca.gov/privacy/ccpa" },
  { name: "FTC — Privacy Consumer Information", url: "https://consumer.ftc.gov/privacy-identity-online-security" },
  { name: "Electronic Privacy Information Center (EPIC)", url: "https://epic.org" },
  { name: "Privacy International", url: "https://privacyinternational.org" },
  { name: "Data Privacy Day Resources", url: "https://staysafeonline.org/programs/data-privacy-week" },
  // Discrimination & civil rights
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

const FINANCIAL_LITERACY = [
  // Budgeting & money basics
  { name: "CFPB — Your Money, Your Goals", url: "https://www.consumerfinance.gov/consumer-tools/money-as-you-grow" },
  { name: "NerdWallet Student Budgeting", url: "https://www.nerdwallet.com/article/finance/budgeting-for-college-students" },
  { name: "Mint Budgeting App", url: "https://mint.intuit.com" },
  { name: "YNAB (You Need A Budget)", url: "https://www.ynab.com" },
  { name: "Copilot Money", url: "https://copilot.money" },
];
const FINANCIAL_LITERACY_MORE = [
  // Budgeting & tools (continued)
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
  // Financial literacy education
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
  // Student credit cards
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
  // Credit scores & building credit
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
  // Student loan repayment tools
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
  // Student debt resources & counseling
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
  // Investing & wealth building basics
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
  // Side income & gig economy for students
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
  // Student mental health & money psychology
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
  // Student housing, food & basic needs
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
  // Tax resources for students
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
  // Career, jobs & financial planning after graduation
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
  // Graduate school financial planning
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
  // Frugal living, discounts & student perks
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
  // Consumer protection & financial rights
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
  { label: "Student",       color: "text-sky-400",    ring: "ring-sky-500/40",    bg: "bg-sky-500/15"    },
  { label: "Parent",        color: "text-blue-400",   ring: "ring-blue-500/40",   bg: "bg-blue-500/15"   },
  { label: "Administrator", color: "text-emerald-400",ring: "ring-emerald-500/40",bg: "bg-emerald-500/15"},
  { label: "Leader",        color: "text-violet-400", ring: "ring-violet-500/40", bg: "bg-violet-500/15" },
  { label: "Auditor",       color: "text-rose-400",   ring: "ring-rose-500/40",   bg: "bg-rose-500/15"   },
];


// ─── Background ───────────────────────────────────────────────────────────────

function EducationalBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Light sky-blue base */}
      <div className="absolute inset-0 bg-[#0d3b8e]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e7a] via-[#0e4099] to-[#1252b8]" />

      {/* Atmospheric orbs — brighter sky / azure / cerulean palette */}
      <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full bg-sky-300/[0.22] blur-[140px]" />
      <div className="absolute top-1/3 -right-64 w-[600px] h-[600px] rounded-full bg-blue-300/[0.18] blur-[120px]" />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-400/[0.16] blur-[110px]" />
      <div className="absolute top-2/3 left-2/3 w-[300px] h-[300px] rounded-full bg-sky-200/[0.14] blur-[90px]" />
      <div className="absolute top-1/4 left-1/2 w-[400px] h-[400px] rounded-full bg-indigo-300/[0.12] blur-[100px]" />

      {/* SVG: dot grid + educational symbols in blue/cyan tones */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Dot grid — brighter sky-blue tint on lighter bg */}
          <pattern id="edu-dots" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="24" cy="24" r="0.9" fill="#bae6fd" fillOpacity="0.28" />
          </pattern>
          {/* Grid lines */}
          <pattern id="edu-grid" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M120 0 L0 0 0 120" fill="none" stroke="#bfdbfe" strokeWidth="0.4" strokeOpacity="0.13" />
          </pattern>
        </defs>

        {/* Grid layers */}
        <rect width="1440" height="900" fill="url(#edu-grid)" />
        <rect width="1440" height="900" fill="url(#edu-dots)" />

        {/* ── Mathematical & academic symbols — brighter on lighter bg ── */}
        <text x="62" y="155" fontSize="96" fill="#e0f2fe" fillOpacity="0.09" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="400">∑</text>
        <text x="1280" y="110" fontSize="72" fill="#e0f2fe" fillOpacity="0.08" fontFamily="Georgia, 'Times New Roman', serif">π</text>
        <text x="620" y="78" fontSize="60" fill="#f0f9ff" fillOpacity="0.08" fontFamily="Georgia, 'Times New Roman', serif">∫</text>
        <text x="1380" y="300" fontSize="80" fill="#e0f2fe" fillOpacity="0.08" fontFamily="Georgia, 'Times New Roman', serif">√</text>
        <text x="75" y="500" fontSize="68" fill="#f0f9ff" fillOpacity="0.07" fontFamily="Georgia, 'Times New Roman', serif">φ</text>
        <text x="850" y="520" fontSize="74" fill="#e0f2fe" fillOpacity="0.08" fontFamily="Georgia, 'Times New Roman', serif">Δ</text>
        <text x="380" y="798" fontSize="66" fill="#f0f9ff" fillOpacity="0.07" fontFamily="Georgia, 'Times New Roman', serif">∞</text>
        <text x="1175" y="820" fontSize="54" fill="#e0f2fe" fillOpacity="0.08" fontFamily="Georgia, 'Times New Roman', serif">≈</text>
        <text x="38" y="845" fontSize="60" fill="#f0f9ff" fillOpacity="0.07" fontFamily="Georgia, 'Times New Roman', serif">θ</text>
        <text x="710" y="878" fontSize="52" fill="#e0f2fe" fillOpacity="0.07" fontFamily="Georgia, 'Times New Roman', serif">λ</text>
        <text x="1340" y="520" fontSize="58" fill="#f0f9ff" fillOpacity="0.08" fontFamily="Georgia, 'Times New Roman', serif">Ω</text>
        <text x="240" y="330" fontSize="50" fill="#e0f2fe" fillOpacity="0.07" fontFamily="Georgia, 'Times New Roman', serif">α</text>

        {/* Financial aid domain labels */}
        <text x="1330" y="168" fontSize="58" fill="#f0f9ff" fillOpacity="0.07" fontFamily="Georgia, serif" fontStyle="italic">$</text>
        <text x="290" y="198" fontSize="34" fill="#bfdbfe" fillOpacity="0.09" fontFamily="'Courier New', monospace" letterSpacing="3">34 CFR</text>
        <text x="960" y="862" fontSize="30" fill="#e0f2fe" fillOpacity="0.07" fontFamily="'Courier New', monospace" letterSpacing="4">FAFSA</text>
        <text x="100" y="695" fontSize="28" fill="#bfdbfe" fillOpacity="0.07" fontFamily="'Courier New', monospace" letterSpacing="3">Title IV</text>
        <text x="1200" y="660" fontSize="26" fill="#e0f2fe" fillOpacity="0.07" fontFamily="'Courier New', monospace" letterSpacing="2">HEA</text>

        {/* ── Geometric decorations — brighter strokes ── */}
        <circle cx="145" cy="248" r="92" fill="none" stroke="#bae6fd" strokeOpacity="0.18" strokeWidth="0.8" />
        <circle cx="1310" cy="580" r="135" fill="none" stroke="#93c5fd" strokeOpacity="0.14" strokeWidth="0.8" />
        <circle cx="720" cy="830" r="68" fill="none" stroke="#bae6fd" strokeOpacity="0.16" strokeWidth="0.8" />
        <circle cx="1050" cy="200" r="55" fill="none" stroke="#e0f2fe" strokeOpacity="0.14" strokeWidth="0.8" />
        <circle cx="420" cy="620" r="44" fill="none" stroke="#93c5fd" strokeOpacity="0.13" strokeWidth="0.6" />

        {/* Hexagons */}
        <polygon points="215,52 255,75 255,121 215,144 175,121 175,75" fill="none" stroke="#bae6fd" strokeOpacity="0.16" strokeWidth="0.8" />
        <polygon points="1350,640 1378,656 1378,688 1350,704 1322,688 1322,656" fill="none" stroke="#93c5fd" strokeOpacity="0.13" strokeWidth="0.7" />

        {/* Diagonal perspective lines */}
        <line x1="0" y1="0" x2="432" y2="900" stroke="#e0f2fe" strokeOpacity="0.08" strokeWidth="0.8" />
        <line x1="1440" y1="0" x2="1008" y2="900" stroke="#e0f2fe" strokeOpacity="0.07" strokeWidth="0.8" />
        <line x1="0" y1="900" x2="600" y2="0" stroke="#f0f9ff" strokeOpacity="0.05" strokeWidth="0.6" />

        {/* Constellation dots — brighter azure */}
        <circle cx="504" cy="148" r="2.2" fill="#7dd3fc" fillOpacity="0.55" />
        <circle cx="936" cy="198" r="3.0" fill="#38bdf8" fillOpacity="0.45" />
        <circle cx="288" cy="442" r="2.0" fill="#7dd3fc" fillOpacity="0.50" />
        <circle cx="1152" cy="336" r="2.5" fill="#38bdf8" fillOpacity="0.40" />
        <circle cx="720" cy="468" r="1.8" fill="#bae6fd" fillOpacity="0.60" />
        <circle cx="216" cy="756" r="2.2" fill="#7dd3fc" fillOpacity="0.50" />
        <circle cx="1224" cy="756" r="3.0" fill="#38bdf8" fillOpacity="0.38" />
        <circle cx="576" cy="828" r="1.6" fill="#bae6fd" fillOpacity="0.35" />
        <circle cx="864" cy="108" r="2.4" fill="#7dd3fc" fillOpacity="0.28" />
        <circle cx="1368" cy="432" r="1.8" fill="#38bdf8" fillOpacity="0.30" />

        {/* Constellation connector lines */}
        <line x1="504" y1="148" x2="936" y2="198" stroke="#7dd3fc" strokeOpacity="0.12" strokeWidth="0.6" />
        <line x1="936" y1="198" x2="1152" y2="336" stroke="#93c5fd" strokeOpacity="0.10" strokeWidth="0.6" />
        <line x1="288" y1="442" x2="720" y2="468" stroke="#7dd3fc" strokeOpacity="0.12" strokeWidth="0.6" />
        <line x1="720" y1="468" x2="864" y2="108" stroke="#bae6fd" strokeOpacity="0.09" strokeWidth="0.5" />

        {/* Genie lamp silhouette */}
        <g transform="translate(1135, 50)" fill="#bfdbfe" fillOpacity="0.065">
          {/* Flame */}
          <path d="M102 32C108 22 109 12 103 4C97 12 95 24 102 32Z" />
          {/* Spout */}
          <path d="M60 60C66 47 76 36 88 28L97 36C87 45 79 56 76 66Z" />
          {/* Lid */}
          <ellipse cx="42" cy="56" rx="22" ry="7" />
          <ellipse cx="42" cy="50" rx="13" ry="5" />
          {/* Handle */}
          <path d="M10 66C2 63 -4 71 -3 80C-2 89 6 93 11 89C4 86 2 77 6 72C9 68 10 66 10 66Z" />
          {/* Body */}
          <ellipse cx="46" cy="88" rx="46" ry="26" />
          <path d="M6 92C4 85 6 75 16 67C26 59 36 56 46 56C60 56 74 62 80 70C86 78 85 87 77 94C67 103 52 108 38 108C23 107 9 102 6 92Z" />
        </g>

        {/* Open book silhouette */}
        <g transform="translate(68, 560)" fill="none" stroke="#7dd3fc" strokeOpacity="0.10" strokeWidth="1.2">
          <path d="M40,0 Q20,-10 0,0 L0,65 Q20,55 40,65 Q60,55 80,65 L80,0 Q60,-10 40,0 Z" />
          <line x1="40" y1="0" x2="40" y2="65" />
        </g>
      </svg>
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showMobileLeft, setShowMobileLeft] = useState(false);
  const [showMobileRight, setShowMobileRight] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showCookieNotice, setShowCookieNotice] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (localStorage.getItem("genie-terms-accepted")) setShowDisclaimer(false);
    if (!localStorage.getItem("genie-cookie-accepted")) setShowCookieNotice(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("genie-terms-accepted", "true");
    setShowDisclaimer(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      if (finalText.trim()) {
        setAttachedFile({ name: "Voice recording", content: finalText.trim(), type: "audio" });
      }
      setVoiceTranscript("");
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

      if (!res.ok) throw new Error("Request failed");

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
    } catch {
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
          <div class="letterhead-sub">Financial Aid Hub &nbsp;·&nbsp; AI-Powered Guidance</div>
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
                <h2 id="disclaimer-title" className="text-base font-bold text-white leading-tight">askGenie — Financial Aid Hub</h2>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-900/40 hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
              >
                I Accept — Continue to Genie
              </button>
            </div>
          </div>
        </div>
      )}

      <EducationalBackground />

      {/* Bright theme overlay — slightly lighter cobalt blue, still dark enough for white text contrast */}
      {!isDark && (
        <div className="fixed inset-0 -z-9 pointer-events-none" style={{ background: "linear-gradient(135deg, #0f3ba0d0 0%, #1a52ccd0 50%, #1e60ddd0 100%)" }} />
      )}

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
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-none mb-0.5">Financial Aid Hub</p>
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
                        {list.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-sky-500/20 ring-1 ring-transparent hover:ring-sky-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-sky-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                      <button onClick={() => toggleSection("scholarships")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-indigo-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View ${SCHOLARSHIP_ENGINES_MORE.length} more`}
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
                        {list.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-emerald-500/20 ring-1 ring-transparent hover:ring-emerald-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-emerald-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                      <button onClick={() => toggleSection("jobs")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-emerald-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View ${STUDENT_JOB_SEARCH_MORE.length} more`}
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
                        {list.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-teal-500/20 ring-1 ring-transparent hover:ring-teal-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-teal-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                      <button onClick={() => toggleSection("internships")}
                        className="w-full flex items-center justify-center gap-1.5 mt-1 py-1 rounded-lg text-[11px] font-medium text-teal-400 hover:bg-white/[0.06] opacity-70 hover:opacity-100 transition-all duration-150">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : "-rotate-90"}`} />
                        {showMore ? "Show less" : `View ${INTERNSHIP_SEARCH_MORE.length} more`}
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
                        {list.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-amber-500/20 ring-1 ring-transparent hover:ring-amber-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-amber-400 shrink-0" />
                          </a>
                        ))}
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
                        {list.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-violet-500/20 ring-1 ring-transparent hover:ring-violet-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-violet-400 shrink-0" />
                          </a>
                        ))}
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
                        {list.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-sky-500/20 ring-1 ring-transparent hover:ring-sky-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-sky-400 shrink-0" />
                          </a>
                        ))}
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
                        {RELIGION_FAITH_PHILOSOPHY.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-fuchsia-500/20 ring-1 ring-transparent hover:ring-fuchsia-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-fuchsia-400 shrink-0" />
                          </a>
                        ))}
                        {isMoreOpen && RELIGION_FAITH_PHILOSOPHY_MORE.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-fuchsia-500/20 ring-1 ring-transparent hover:ring-fuchsia-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-fuchsia-400 shrink-0" />
                          </a>
                        ))}
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
                        {CONSUMER_RIGHTS.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-orange-500/20 ring-1 ring-transparent hover:ring-orange-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-orange-400 shrink-0" />
                          </a>
                        ))}
                        {isMoreOpen && CONSUMER_RIGHTS_MORE.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-orange-500/20 ring-1 ring-transparent hover:ring-orange-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-orange-400 shrink-0" />
                          </a>
                        ))}
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
                        {MENTAL_HEALTH_STUDENT.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-emerald-500/20 ring-1 ring-transparent hover:ring-emerald-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-emerald-400 shrink-0" />
                          </a>
                        ))}
                        {isMoreOpen && MENTAL_HEALTH_STUDENT_MORE.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-emerald-500/20 ring-1 ring-transparent hover:ring-emerald-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-emerald-400 shrink-0" />
                          </a>
                        ))}
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
                        {list.map(({ name, url }) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            title={name}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-violet-500/20 ring-1 ring-transparent hover:ring-violet-500/20 transition-all duration-150 group">
                            <span>{name}</span>
                            <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-violet-400 shrink-0" />
                          </a>
                        ))}
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

          </div>

          {/* Disclaimer footer */}
          <div className="shrink-0 px-4 py-3 border-t border-white/[0.07]">
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/70 leading-relaxed">
                General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Link href="/pricing" className="text-[11px] text-indigo-400/60 underline underline-offset-2 hover:text-indigo-300 transition-colors">Plans & Pricing</Link>
              <Link href="/account" className="text-[11px] text-white/20 underline underline-offset-2 hover:text-white/40 transition-colors">Account</Link>
              <Link href="/support" className="text-[11px] text-white/20 underline underline-offset-2 hover:text-white/40 transition-colors">Support Dev</Link>
              <Link href="/legal" className="text-[11px] text-white/20 underline underline-offset-2 hover:text-white/40 transition-colors">Legal</Link>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex flex-1 flex-col min-w-0 min-h-0" aria-label="askGenie AI Assistant">

          {/* Header */}
          <header className="relative shrink-0 border-b border-white/[0.10] bg-white/[0.07] backdrop-blur-xl px-5 py-3 flex items-center justify-between">
            {/* Left — theme toggle + home + mobile left-panel toggle */}
            <div className="flex items-center gap-1.5 w-40">
              <button
                onClick={() => setIsDark(!isDark)}
                title={isDark ? "Switch to bright mode" : "Switch to dark mode"}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
                onClick={() => { setShowMobileLeft(!showMobileLeft); setShowMobileRight(false); }}
                title="Students & Parents panel"
                className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {showMobileLeft ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>

            {/* Center — title */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 select-none">
              <h1 className="text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-sky-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent whitespace-nowrap drop-shadow-lg">
                askGenie
              </h1>
            </div>

            {/* Right — status + mobile right-panel toggle + actions */}
            <div className="flex items-center gap-2 w-36 justify-end">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="hidden sm:inline">Online</span>
              </span>
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
          <div className="flex-1 overflow-y-auto min-h-0 genie-scroll-main" role="log" aria-live="polite" aria-label="Conversation">
            {messages.length === 0 ? (

              /* ── Welcome state ── */
              <div className="flex flex-col items-center px-6 py-12">
                {/* Hero badge */}
                <div className="relative mb-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30 ring-1 ring-white/10">
                    <GenieBottle className="h-9 w-9 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/40">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 text-center">
                  Student Financial Aid HUB. AI Simplified.
                </h2>
                <p className="text-sm text-white/45 leading-relaxed max-w-lg text-center mb-8">
                  Generate estimated FA offer letters as a student/parent prior to visiting a FA office, run tentative R2T4 calculations as a student/institution, prep for FSA audits, and get answers on Title IV regulations, FAFSA, SAP, tax credits, state aid, repayment, and much more.
                </p>

                {/* Quick actions — role tabs + 2×2 grid */}
                <div className="w-full max-w-2xl">
                  {/* Role pill tabs */}
                  <div className="flex gap-1.5 flex-wrap justify-center mb-3">
                    {QUICK_ACTIONS_BY_ROLE.map(({ role, color }) => (
                      <button
                        key={role}
                        onClick={() => setActiveActionRole(role)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          activeActionRole === role
                            ? `${color} bg-white/[0.12] ring-1 ring-white/20 shadow-sm`
                            : "text-white/40 hover:text-white/65 hover:bg-white/[0.06]"
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
                          className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] ring-1 ring-white/[0.09] hover:ring-indigo-400/40 text-left transition-all duration-200 group backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          <div className={`p-1.5 rounded-lg bg-white/[0.07] group-hover:bg-white/[0.12] transition-colors w-fit`}>
                            <Icon className={`h-3.5 w-3.5 text-white/40 group-hover:${color} transition-colors`} />
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
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400/30"
                            : "bg-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.10] ring-1 ring-white/[0.07]"
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
                        <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                          <GenieBottle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`relative ${
                        msg.role === "user"
                          ? "max-w-[72%] bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-xl shadow-indigo-500/20 text-sm leading-relaxed ring-1 ring-white/10"
                          : "max-w-[82%] bg-white/[0.07] ring-1 ring-white/[0.10] px-5 py-4 rounded-2xl rounded-tl-sm"
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
                            <Sparkles className="h-3 w-3 text-indigo-400/70" aria-hidden="true" />
                            <span className="text-[10px] font-semibold text-indigo-300/70 uppercase tracking-widest">Powered by AI · Responses are AI-generated</span>
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
                                Print
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
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 mt-1 p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                      <GenieBottle className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white/[0.07] ring-1 ring-white/[0.10] px-5 py-4 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-indigo-400/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
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
          <div className="shrink-0 relative bg-white/[0.05] backdrop-blur-xl border-t border-white/[0.10] px-4 pt-4 pb-5">
            {/* Ambient glow behind input */}
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-t from-indigo-600/[0.10] via-sky-500/[0.06] to-transparent blur-xl" />

            <div className="relative max-w-3xl mx-auto">
              {/* Prompt label row */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="h-4 w-4 text-indigo-300 shrink-0" />
                <span className="text-base font-black bg-gradient-to-r from-sky-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent tracking-wide">
                  askGenie
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
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
                {ROLE_OPTIONS.map(({ label, color, ring, bg }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedRole(selectedRole === label ? null : label)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ring-1 ${
                      selectedRole === label
                        ? `${color} ${bg} ${ring}`
                        : "text-white/30 bg-transparent ring-white/[0.08] hover:text-white/60 hover:bg-white/[0.06]"
                    }`}
                  >
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

              {/* Gradient-border form wrapper */}
              <div className="p-[1px] rounded-2xl bg-gradient-to-r from-sky-500/40 via-indigo-500/50 to-violet-500/40 focus-within:from-sky-400/70 focus-within:via-indigo-400/70 focus-within:to-violet-400/70 transition-all duration-300 shadow-lg shadow-indigo-900/30">
                <form
                  onSubmit={handleSubmit}
                  className="flex gap-2 items-end px-3 py-2.5 rounded-2xl bg-[#0a2a72]/90 backdrop-blur-sm"
                >
                  {/* Upload + mic buttons */}
                  <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                    <button type="button" title="Upload document (.pdf, .txt, .doc, .csv)"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-white/35 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button type="button" title="Take or upload a photo for context"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-white/35 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      <Camera className="h-4 w-4" />
                    </button>
                    <button type="button"
                      title={isRecording ? "Stop recording" : "Record voice message"}
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isRecording
                          ? "text-rose-400 bg-rose-500/20 animate-pulse"
                          : "text-white/35 hover:text-indigo-300 hover:bg-indigo-500/20"
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
                      className="shrink-0 mb-0.5 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 hover:from-sky-400 hover:via-indigo-400 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/40 hover:shadow-indigo-500/60 active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send
                    </button>
                  )}
                </form>
              </div>

              {/* Footer hints */}
              <div className="mt-2.5 flex flex-col items-center gap-0.5">
                <p className="text-[10px] text-white/20 text-center tracking-wide">
                  Enter to send · Shift+Enter new line · 📎 Docs · 📷 Photo · 🎙 Voice · Always verify with the FSA Handbook
                </p>
                <p className="text-[10px] text-center text-white/25">
                  Unofficial reference tool — not affiliated with the U.S. Department of Education
                </p>
                <p className="text-[10px] text-center text-white/30 italic mt-0.5">
                  Built by a 15-year Student Financial Aid professional. Designed for the people who do this work every day.
                </p>
                <p className="text-[10px] text-center text-white/20">
                  <Link href="/legal" className="underline underline-offset-2 hover:text-white/40 transition-colors">Terms &amp; Privacy</Link>
                  {" · "}
                  <Link href="/dpa" className="underline underline-offset-2 hover:text-white/40 transition-colors">School DPA</Link>
                  {" · "}
                  <Link href="/about" className="underline underline-offset-2 hover:text-white/40 transition-colors">About</Link>
                  {" · "}
                  <Link href="/institutions" className="underline underline-offset-2 hover:text-white/40 transition-colors">For Schools</Link>
                  {" · "}
                  <Link href="/legal#ccpa" className="underline underline-offset-2 hover:text-white/40 transition-colors">Do Not Sell My Info</Link>
                </p>
                <p className="text-[10px] text-center text-white/15 mt-0.5">
                  © 2026 askGenie Financial Aid Hub | Developed by One27 | All Rights Reserved
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
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-none mb-0.5">Financial Aid Hub</p>
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
                          {isMoreOpen && more.map(({ name, url }) => (
                            <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                              title={name}
                              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-indigo-500/20 ring-1 ring-transparent hover:ring-indigo-500/20 transition-all duration-150 group">
                              <span>{name}</span>
                              <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-indigo-400 shrink-0" />
                            </a>
                          ))}
                          <button
                            onClick={() => toggleSection(moreKey)}
                            className="w-full text-left px-3 py-1.5 text-[10px] font-medium text-indigo-400/80 hover:text-indigo-300 transition-colors">
                            {isMoreOpen ? "Show less" : `Show ${more.length} more`}
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
                <Link href="/legal" className="underline underline-offset-2 text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>
                {" "}for details.{" "}
                <Link href="/legal#ccpa" className="underline underline-offset-2 text-indigo-400/70 hover:text-indigo-300 transition-colors">Do Not Sell My Personal Information</Link>.
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
    </>
  );
}
