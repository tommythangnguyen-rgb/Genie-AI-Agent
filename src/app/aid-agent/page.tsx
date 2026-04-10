"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { AppInstallPrompt } from "@/components/AppInstallPrompt";
import { AppInstallModal } from "@/components/AppInstallModal";
import { BackgroundMusic } from "@/components/BackgroundMusic";
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
  ChevronLeft,
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
  ChevronDown,
  Search,
  Gavel,
  MapPin,
  RefreshCcw,
  PiggyBank,
  Clock,
  Trash2,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Star,
} from "lucide-react";

// ─── Genie Bottle Logo ────────────────────────────────────────────────────────

function GenieBottle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 48 60" fill="none" className={className} style={style} aria-hidden="true">
      {/* Magic smoke wisps */}
      <path d="M24 2.5C22.8 0.8 25.5 0.2 24 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <path d="M20.5 4C18 1.5 20 7 18.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.28"/>
      <path d="M27.5 4C30 1.5 28 7 29.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.28"/>
      {/* Stopper finial — jewel cap */}
      <circle cx="24" cy="6" r="2.4" fill="currentColor" opacity="0.82"/>
      <ellipse cx="24" cy="8.5" rx="5" ry="2" fill="currentColor" opacity="0.78"/>
      {/* Jewel gleam */}
      <circle cx="23" cy="5.3" r="0.9" fill="white" opacity="0.38"/>
      {/* Upper collar ring */}
      <rect x="17.5" y="10" width="13" height="2.8" rx="1.4" fill="currentColor" opacity="0.92"/>
      <rect x="17.5" y="10" width="13" height="1" rx="0.5" fill="white" opacity="0.22"/>
      {/* Neck */}
      <rect x="20.5" y="12.8" width="7" height="6.5" rx="1" fill="currentColor" opacity="0.86"/>
      {/* Lower collar ring */}
      <rect x="17.5" y="18.5" width="13" height="2.5" rx="1.25" fill="currentColor" opacity="0.86"/>
      <rect x="17.5" y="18.5" width="13" height="0.8" rx="0.4" fill="white" opacity="0.18"/>
      {/* Shoulder taper — broad round belly */}
      <path d="M17.5 21C13 23.5 10 29.5 10 36L10 47.5C10 52 16.5 55.5 24 55.5C31.5 55.5 38 52 38 47.5L38 36C38 29.5 35 23.5 30.5 21Z" fill="currentColor" opacity="0.94"/>
      {/* Belly highlight — left edge shimmer */}
      <path d="M15 31C13.2 35 12.8 41 13.5 46" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.18"/>
      {/* Belly gleam — upper left */}
      <ellipse cx="18" cy="33" rx="2.2" ry="5" fill="white" opacity="0.12" transform="rotate(-18 18 33)"/>
      {/* Top sparkle */}
      <circle cx="17" cy="28.5" r="1.5" fill="white" opacity="0.22"/>
      {/* Decorative belly band — twin lines */}
      <path d="M10.2 39.5L37.8 39.5" stroke="white" strokeWidth="0.9" opacity="0.32"/>
      <path d="M10.2 42.5L37.8 42.5" stroke="white" strokeWidth="0.6" opacity="0.18"/>
      <path d="M10.2 39.5L37.8 39.5L37.8 42.5L10.2 42.5Z" fill="white" opacity="0.06"/>
      {/* Base flare ring */}
      <ellipse cx="24" cy="51.5" rx="12" ry="3.5" fill="currentColor" opacity="0.50"/>
      {/* Base shadow accent */}
      <ellipse cx="24" cy="53" rx="8.5" ry="2" fill="currentColor" opacity="0.26"/>
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

interface HistoryEntry {
  id: string;
  ts: number;       // Unix ms
  bookmarked?: boolean;
  prompt: string;
  response: string;
  role?: string;
}

interface SavedPdfEntry {
  id: string;
  ts: number;
  prompt: string;
  role?: string;
}

const HISTORY_KEY = "genie-history";
const PDF_KEY = "genie-saved-pdfs";
const HISTORY_MAX_DAYS = 30;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: HistoryEntry[] = JSON.parse(raw);
    const cutoff = Date.now() - HISTORY_MAX_DAYS * 24 * 60 * 60 * 1000;
    return parsed.filter(e => e.ts > cutoff).slice(0, 500);
  } catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 500))); } catch {}
}

function loadSavedPdfs(): SavedPdfEntry[] {
  try {
    const raw = localStorage.getItem(PDF_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPdfEntry[];
  } catch { return []; }
}

function savePdfs(entries: SavedPdfEntry[]) {
  try { localStorage.setItem(PDF_KEY, JSON.stringify(entries.slice(0, 200))); } catch {}
}

// ─── Link list helpers ────────────────────────────────────────────────────────

type LinkItem = { name: string; url: string };
type SubcatItem = { subcat: string };
type MaybeSubcat = LinkItem | SubcatItem;
function isSubcat(item: MaybeSubcat): item is SubcatItem { return "subcat" in item; }
function parseSections(items: MaybeSubcat[]): { title: string; links: LinkItem[] }[] {
  const out: { title: string; links: LinkItem[] }[] = [];
  let cur: { title: string; links: LinkItem[] } | null = null;
  for (const item of items) {
    if (isSubcat(item)) { if (cur) out.push(cur); cur = { title: item.subcat, links: [] }; }
    else if (cur) cur.links.push(item as LinkItem);
  }
  if (cur) out.push(cur);
  return out;
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
  {
    role: "Administrators",
    color: "text-emerald-400",
    items: [
      { icon: Hash, label: "Excel Help", description: "Troubleshoot issues & build sheets", q: "I need help with an Excel issue in my financial aid office — help me troubleshoot a formula, build a spreadsheet, or organize data more effectively." },
      { icon: ClipboardList, label: "Generate R2T4", description: "Tentative calc from uploaded docs", q: "Help me generate a tentative Return to Title IV (R2T4) calculation. I'll provide the student's withdrawal details — walk me through the full calculation step by step." },
      { icon: FileText, label: "FA Offer Letter", description: "Estimated letter with FAFSA data", q: "Generate an estimated financial aid offer letter for a student at our school using FAFSA data and institutional aid. Tell me what information you need to produce it." },
      { icon: Scale, label: "Clarify a Guideline", description: "Federal or institutional rule explained", q: "Help me clarify a federal or institutional financial aid guideline. I'll describe the rule or policy I'm unsure about, and you explain it in plain language with the relevant 34 CFR citation and what compliance looks like in practice." },
      { icon: Users, label: "Resolve a Student Issue", description: "Navigate conflicts or concerns", q: "Help me resolve a student issue or conflict in my financial aid office. I'll describe the situation — the student's concern, any escalation, and what's been tried — and you help me determine the best course of action professionally and in compliance with regulations." },
      { icon: SquarePen, label: "Draft an Email", description: "Clear, professional FA communication", q: "Help me write a professional email for a financial aid matter — I'll describe the situation and you can draft something clear and appropriate." },
      { icon: Sparkles, label: "Manage My Stress", description: "Wellness strategies for FA professionals", q: "Help me manage workplace stress as a financial aid administrator. Share practical, evidence-based strategies for handling high-volume seasons, difficult student interactions, and regulatory pressure while maintaining my mental health and preventing burnout." },
    ],
    more: [
      { icon: CheckCircle, label: "Fact Check", description: "Verify a regulation or procedure", q: "Help me fact-check something or verify my memory on a regulation, policy, or procedure. I'll share what I think I know and you can confirm or correct it." },
      { icon: Printer, label: "Create a Calendar", description: "Day, week, month, or year printout", q: "Create a calendar printout for my day, week, month, or year. I'll specify the dates, deadlines, and events to include." },
      { icon: Zap, label: "Student-Facing Session", description: "Interactive UI for appointments", q: "I'm preparing for a student-facing appointment. Help me set up interactive prompts or talking points so the student can engage with the information during our session." },
      { icon: Scale, label: "Prof. Judgment", description: "Special circumstances documentation", q: "Guide me through using Professional Judgment (Special Circumstances) to adjust a student's financial aid — what circumstances qualify, what documentation is needed, and how to document the decision properly." },
      { icon: CheckCircle, label: "Verification", description: "V1–V5 tracking & documentation", q: "Walk me through the verification process for Title IV aid — which verification groups require what documents, how to request items from students, and how to clear conflicting information." },
      { icon: DollarSign, label: "Cost of Attendance", description: "Components & adjustment authority", q: "Help me build or review our institution's Cost of Attendance — what components must be included, what documentation supports adjustments, and how COA affects packaging decisions." },
      { icon: Users, label: "Dependency Override", description: "Criteria & documentation guide", q: "Walk me through the dependency override process — what circumstances justify overriding a student's dependency status, what documentation is required, and how to document the professional judgment decision." },
      { icon: BookOpen, label: "SAP Appeal", description: "Review process & templates", q: "Help me process a Satisfactory Academic Progress (SAP) appeal — what makes an appeal approvable, what documentation to require, and what an academic plan should include." },
      { icon: Hash, label: "Federal Reporting", description: "COD, NSLDS & G5 reconciliation", q: "Help me with federal reporting — walk me through COD origination and disbursement reporting, NSLDS enrollment reporting, and G5 drawdown procedures for our institution." },
    ],
  },
  {
    role: "Students",
    color: "text-sky-400",
    items: [
      { icon: FileText, label: "Decode My Award Letter", description: "Upload & understand your FA offer", q: "I received my financial aid award letter — can you decode it for me? Explain what each award means (grants, scholarships, loans, work-study), my true out-of-pocket cost, and what I should accept or decline." },
      { icon: Users, label: "Compare Schools", description: "Side-by-side cost & aid breakdown", q: "Help me compare the schools I'm considering — break down tuition, fees, average financial aid, net price, and outcomes so I can make the best decision." },
      { icon: Calculator, label: "Estimate My FA Offer", description: "Projected award for any school", q: "Can you estimate what my financial aid offer letter might look like for a school or program I'm considering? Tell me what info you need and give me a projected breakdown." },
      { icon: ClipboardList, label: "Build a Calendar", description: "Day, week, month, or year planner", q: "Help me create a calendar for my day, week, month, or year — including financial aid deadlines, class schedules, and important milestones." },
      { icon: DollarSign, label: "Build a Budget", description: "Track aid, income & expenses", q: "Help me build a practical student budget — I want to track my income, financial aid, and monthly expenses so I can stay financially on track through the school year." },
      { icon: TrendingUp, label: "Manage My Debt", description: "Loan strategies & repayment plans", q: "Help me manage my student loan debt — explain my repayment options, income-driven plans, and forgiveness programs, then give me a strategy to pay it off wisely." },
      { icon: Sparkles, label: "Beat School Stress", description: "Tips for handling academic pressure", q: "Help me deal with stress during the school year — share proven strategies for managing academic pressure, staying focused, and maintaining mental wellbeing as a student." },
    ],
    more: [
      { icon: BookOpen, label: "My Educational Plan", description: "High school through career roadmap", q: "Help me create an educational plan starting from where I am now through college and into my career — including courses, test prep, applications, and next steps." },
      { icon: TrendingUp, label: "Career Path Plan", description: "Step-by-step path to your goal", q: "Help me build a step-by-step career path plan based on my interests and goals — what education, certifications, and experience I'll need to get there." },
      { icon: Lightbulb, label: "Career Path Ideas", description: "Suggestions based on your profile", q: "Based on my interests, strengths, and background, suggest some career paths that might be a good fit for me and explain the education requirements and earning potential for each." },
      { icon: DollarSign, label: "Budget My Finances", description: "Track income, aid & expenses", q: "Help me budget my finances as a student — I want to track income, expenses, financial aid, and savings to make sure I'm staying on track." },
      { icon: Sparkles, label: "Brainstorm with Me", description: "Essays, papers & projects", q: "Help me brainstorm ideas for my essay, research paper, or project — give me topic ideas, an outline, or a starting point based on what I'm working on." },
      { icon: FileText, label: "FAFSA Help", description: "Step-by-step FAFSA walkthrough", q: "Walk me through completing the FAFSA step by step — explain each section, what documents I need, and common mistakes to avoid." },
      { icon: Award, label: "Find Scholarships", description: "Personalized scholarship search tips", q: "Help me find scholarships I'm most likely to qualify for. What types of scholarships should I focus on, what platforms to use, and how do I write a strong application?" },
      { icon: RefreshCcw, label: "Loan Forgiveness", description: "PSLF, IDR & forgiveness options", q: "Explain the federal student loan forgiveness programs available to me — PSLF, IDR forgiveness, teacher forgiveness, and others. What are the requirements and how do I qualify?" },
      { icon: Briefcase, label: "Internship Search", description: "Find paid opportunities in your field", q: "Help me find and apply for internships in my field. What platforms should I use, how do I write a strong application, and what should I expect during the process?" },
      { icon: Search, label: "Graduate School", description: "Funding & admissions strategy", q: "Help me plan for graduate school — what funding options are available, how financial aid works for graduate students, and what I should consider when choosing a program." },
      { icon: Scale, label: "Academic Appeal", description: "SAP & financial aid reinstatement", q: "Help me understand how to appeal my financial aid suspension due to Satisfactory Academic Progress — what to include in my appeal letter and what documentation to provide." },
      { icon: BookOpen, label: "Study Smarter", description: "Time management & study strategies", q: "Help me study smarter — give me evidence-based strategies for time management, retaining information, and performing better in my classes." },
    ],
  },
  {
    role: "Parents",
    color: "text-blue-400",
    items: [
      { icon: FileText, label: "Decode the Award Letter", description: "Understand your child's FA offer", q: "My child received their financial aid award letter — help me decode it. Explain what each award means, the real out-of-pocket cost, and what we should accept or decline." },
      { icon: BookOpen, label: "Educational Plan", description: "High school through college roadmap", q: "Help me develop an educational plan for my child who is in high school or college — including course planning, college applications, financial aid strategy, and career direction." },
      { icon: Calculator, label: "Estimate Tuition Costs", description: "Direct costs at schools they're considering", q: "Help me estimate the direct cost of tuition and fees at the institutions my child is considering attending, so we can compare options and plan our finances." },
      { icon: DollarSign, label: "Budget for College", description: "Plan your child's full education costs", q: "Help me build a comprehensive budget for my child's college education — covering tuition, room and board, books, personal expenses, and how financial aid offsets each cost. I want a realistic year-by-year plan." },
      { icon: Receipt, label: "Finance Child's Education", description: "Savings, loans & aid strategies", q: "Help me develop a strategy to finance my child's education — walk me through the best combination of savings, 529 plans, federal aid, scholarships, and loans to minimize our out-of-pocket cost." },
      { icon: Lightbulb, label: "Career Path Ideas", description: "Suggestions based on your child's profile", q: "Based on my child's interests, strengths, and academic profile, suggest some career paths that could be a good fit and what education or training each would require." },
      { icon: Sparkles, label: "Support Your Child", description: "Guidance for parents through the process", q: "Help me understand how I can best support my child through the college application and financial aid process — what my role should be, what to watch out for, and how to keep them motivated and on track." },
    ],
    more: [
      { icon: Award, label: "Federal Aid Types", description: "Grants, loans & work-study explained", q: "Give me a quick, plain-language breakdown of the main types of federal student aid — grants, loans, and work-study — so I understand what my child has been offered." },
      { icon: Landmark, label: "Direct PLUS Loan", description: "Short, straight-to-the-point breakdown", q: "Give me a short, straight-to-the-point breakdown of the Federal Direct PLUS Loan — who qualifies, the interest rate, repayment options, and what to watch out for." },
      { icon: Receipt, label: "Private Student Loans", description: "Key differences & risks to know", q: "Give me a short, straight-to-the-point breakdown of private student loans — how they differ from federal loans, what to compare when shopping, and the risks I should know." },
      { icon: ShieldCheck, label: "Credit History & Score", description: "FAQs for student loan applicants", q: "Explain credit history, credit scores, and adverse credit history — and answer common FAQs especially as they relate to student loans and the PLUS loan application." },
      { icon: Users, label: "Co-signers Explained", description: "Responsibilities & release options", q: "Give me a short, straight-to-the-point explanation of co-signers on student loans — when they're needed, what responsibilities they take on, and how a co-signer can be released." },
      { icon: FileText, label: "FAFSA Tips", description: "Parent-specific FAFSA guidance", q: "Walk me through the parent sections of the FAFSA — what income and asset information we need to provide, common mistakes to avoid, and how our financial information affects aid eligibility." },
      { icon: PiggyBank, label: "529 Benefits", description: "Tax advantages & withdrawal rules", q: "Explain the tax benefits of 529 college savings plans — how contributions work, investment options, tax-free withdrawals, and how having a 529 affects financial aid calculations." },
      { icon: Scale, label: "Negotiate Aid", description: "Appeal & leverage competing offers", q: "Help me understand how to negotiate a better financial aid package for my child — what circumstances justify an appeal, how to write a compelling request, and what documentation to provide." },
      { icon: MapPin, label: "State Aid Guide", description: "State grants & programs by state", q: "What state-based financial aid programs are available for my child's college? Walk me through how to research and apply for state grants and scholarships." },
      { icon: Calculator, label: "Aid Calculator", description: "Estimate SAI & aid eligibility", q: "Help me estimate our Student Aid Index and understand roughly what financial aid my child might receive based on our income and assets." },
      { icon: Award, label: "Scholarship Strategy", description: "Merit & need-based search plan", q: "Help me build a scholarship search strategy for my child — what types of scholarships to prioritize, which platforms to use, and how to improve their chances of winning." },
    ],
  },
  {
    role: "Leaders",
    color: "text-violet-400",
    items: [
      { icon: Hash, label: "Excel for Leaders", description: "Dashboards, reports & automation", q: "Help me leverage Excel for leadership reporting and day-to-day assignments in financial aid. I need help building dashboards, automating repetitive tasks, or creating reports I can present to stakeholders — tell me what you need and I'll describe my use case." },
      { icon: Scale, label: "Federal Rules Clarity", description: "Plain-language reg explanations", q: "Help me get clarity on a specific federal rule or regulation — explain it in plain language, give me the relevant citation, and describe what it means for our institution." },
      { icon: Landmark, label: "Institutional Policy", description: "Draft, review, or interpret policy", q: "I need guidance on institutional policy — help me understand, draft, or review a policy related to financial aid, compliance, or operations at our institution." },
      { icon: Users, label: "Workplace Diversity", description: "Build an inclusive, equitable team", q: "Help me educate myself and my team on workplace diversity, equity, and inclusion — share best practices, frameworks, and actionable strategies for building a more inclusive financial aid office where everyone feels valued and represented." },
      { icon: Sparkles, label: "Manage My Stress", description: "Executive wellness & resilience strategies", q: "Help me manage leadership stress and prevent burnout. I lead a financial aid team and face high-stakes decisions, regulatory pressure, and demanding stakeholders — share practical evidence-based strategies to stay resilient, focused, and effective without sacrificing my wellbeing." },
      { icon: FileText, label: "Analyze a Document", description: "Summarize, review & extract insights", q: "I have a document I'd like you to analyze — share it and I'll ask you to summarize it, identify key points, or answer specific questions about its content." },
      { icon: Sparkles, label: "Foster Motivation", description: "Strategies for a productive team", q: "Research evidence-based ways to foster motivation and a productive work environment for my team — share practical strategies I can implement right away." },
    ],
    more: [
      { icon: Camera, label: "Analyze Photo / Voice", description: "Interpret or transcribe shared media", q: "I have a photo or voice message I'd like analyzed — help me interpret, transcribe, or extract key information from the content I'll share." },
      { icon: Users, label: "Team Environment", description: "Office, remote & hybrid strategies", q: "Research effective strategies for building strong team environments — including approaches for office-based, fully remote, and hybrid teams. What works best in each setting?" },
      { icon: ClipboardList, label: "Create a PIP", description: "Performance Improvement Plan guide", q: "Help me create a Performance Improvement Plan (PIP) — walk me through what to include, how to set measurable goals, timelines, and how to document it appropriately." },
      { icon: DollarSign, label: "Budget Planning", description: "FA office budget & resource allocation", q: "Help me plan the financial aid office budget — what expense categories to include, how to justify staffing needs, and how to present our budget request to senior leadership." },
      { icon: TrendingUp, label: "Default Rates", description: "CDR analysis & reduction strategy", q: "Help me analyze our institution's Cohort Default Rate and develop strategies to reduce it — what outreach programs work best, what data to track, and what are the compliance thresholds?" },
      { icon: BookOpen, label: "Staff Training", description: "Training plans & compliance updates", q: "Help me create a staff training plan for our financial aid team — what topics are most critical, how to stay current on regulatory changes, and how to document training for compliance." },
      { icon: ClipboardList, label: "Compliance Report", description: "Internal audit & self-assessment", q: "Help me draft an internal compliance report for our financial aid office — what areas to assess, how to document findings, and what corrective actions to recommend." },
      { icon: Users, label: "Enrollment Strategy", description: "Aid packaging & enrollment goals", q: "Help me develop an aid packaging strategy that supports our enrollment goals — how to balance merit and need-based aid, what benchmarking data to use, and how to measure packaging impact." },
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
      { icon: FileText, label: "Single Audit Requirements", description: "Uniform Guidance & major programs", q: "Walk me through Single Audit Act requirements for higher education under OMB Uniform Guidance — how is the Type A/B threshold calculated, how are major programs determined, and what is required for Title IV?" },
      { icon: ShieldCheck, label: "OIG Audit Alerts", description: "Fraud indicators and red flags", q: "What are the current OIG audit alerts and fraud risk indicators in financial aid? What red flags in student files should trigger additional testing procedures?" },
      { icon: Hash, label: "90/10 Audit Steps", description: "Revenue percentage calculation test", q: "What are the specific audit steps for testing an institution's 90/10 calculation — what revenues to include or exclude, what documentation to verify, and what ED guidance applies?" },
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
  "Verification Requirements",
  "Professional Judgment",
  "Cost of Attendance",
  "Dependency Status Rules",
  "Work-Study Programs",
  "TEACH Grant & Perkins",
  "Veterans & GI Bill Aid",
  "Cohort Default Rates",
  "Loan Consolidation",
  "Consortium Agreements",
  "Study Abroad Aid Rules",
  "Accreditation & Eligibility",
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
  "Verification Requirements": "Walk me through the Title IV verification requirements — which verification groups require what documents, how to handle conflicting information, and common compliance issues.",
  "Professional Judgment": "Explain how Professional Judgment works under Title IV — what circumstances allow adjustments, what documentation is required, and how to properly document PJ decisions.",
  "Cost of Attendance": "What components must be included in Cost of Attendance, what authority do institutions have to adjust COA, and how does COA affect student aid packaging?",
  "Dependency Status Rules": "Explain the dependency status rules under Title IV — what makes a student independent, what circumstances allow a dependency override, and how this affects aid eligibility.",
  "Work-Study Programs": "How does the Federal Work-Study program work — allocation, job eligibility, payroll requirements, and how work-study affects a student's overall aid package?",
  "TEACH Grant & Perkins": "Explain the TEACH Grant program and the discontinued Perkins Loan program — eligibility, service obligations, and what happens when obligations aren't met.",
  "Veterans & GI Bill Aid": "How do veterans' education benefits interact with Title IV financial aid — GI Bill, Yellow Ribbon, VA vocational rehab, and institutional responsibilities for veteran students?",
  "Cohort Default Rates": "What is the Cohort Default Rate, how is it calculated, what are the consequences of high CDRs, and what strategies can institutions use to reduce their CDR?",
  "Loan Consolidation": "Explain federal student loan consolidation — eligibility, how it affects interest rates and repayment, impact on forgiveness programs, and when consolidation is or isn't recommended.",
  "Consortium Agreements": "What are consortium agreements in financial aid — when are they used, what must they include, how do they affect enrollment status and Title IV eligibility?",
  "Study Abroad Aid Rules": "What Title IV rules apply to study abroad programs — what qualifies, how to package aid, what documentation is required, and what are the most common compliance issues?",
  "Accreditation & Eligibility": "How does institutional accreditation relate to Title IV eligibility — what accrediting agencies are recognized, what triggers loss of eligibility, and what is the appeals process?",
};

const FEDERAL_RESOURCES = [
  {
    group: "Students & Parents",
    links: [
      { name: "Federal Student Aid", url: "https://studentaid.gov" },
      { name: "FAFSA Application", url: "https://studentaid.gov/h/apply-for-aid/fafsa" },
      { name: "Loan Simulator", url: "https://studentaid.gov/loan-simulator" },
      { name: "College Scorecard", url: "https://collegescorecard.ed.gov" },
      { name: "NSLDS Student Access", url: "https://nslds.ed.gov/nslds/nslds_SA" },
      { name: "Net Price Calculator", url: "https://studentaid.gov/understand-aid/types/loans/interest-rates" },
      { name: "studentaid.gov Aid Summary", url: "https://studentaid.gov/aid-summary" },
      { name: "studentaid.gov Repayment", url: "https://studentaid.gov/manage-loans/repayment" },
      { name: "PSLF Help Tool", url: "https://studentaid.gov/pslf" },
      { name: "Income-Driven Repayment", url: "https://studentaid.gov/manage-loans/repayment/plans/income-driven" },
      { name: "SAVE Plan Info", url: "https://studentaid.gov/announcements-events/save-plan" },
      { name: "Teacher Loan Forgiveness", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/teacher" },
      { name: "Scholarships.gov", url: "https://www.scholarships.gov" },
      { name: "MyFSA ID (Create/Manage)", url: "https://fsaid.ed.gov" },
      { name: "FAFSA Parent Guide", url: "https://studentaid.gov/help-center/answers/article/parent-fafsa-guide" },
      { name: "Entrance Counseling", url: "https://studentaid.gov/entrance-counseling" },
      { name: "Exit Counseling", url: "https://studentaid.gov/exit-counseling" },
      { name: "Federal Pell Grant", url: "https://studentaid.gov/understand-aid/types/grants/pell" },
      { name: "TEACH Grant Program", url: "https://studentaid.gov/teach-grant-program" },
      { name: "Work-Study Program", url: "https://studentaid.gov/understand-aid/types/work-study" },
      { name: "Borrower Defense", url: "https://studentaid.gov/borrower-defense" },
      { name: "School Closure Discharge", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/closed-school" },
      { name: "Grad PLUS Loan Info", url: "https://studentaid.gov/understand-aid/types/loans/plus/grad" },
      { name: "FAFSA Simplification Act", url: "https://studentaid.gov/announcements-events/fafsa-simplification" },
      { name: "State Aid Programs", url: "https://studentaid.gov/understand-aid/types/state" },
      { name: "GI Bill & Veterans Aid", url: "https://www.va.gov/education/gi-bill-benefits" },
      { name: "Student Loan Ombudsman", url: "https://studentaid.gov/feedback-center" },
      { name: "MPN — Master Promissory Note", url: "https://studentaid.gov/mpn" },
      { name: "IRS AOTC Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/aotc" },
      { name: "IRS Education Tax Benefits", url: "https://www.irs.gov/publications/p970" },
      { name: "Federal Student Aid Data Center", url: "https://studentaid.gov/data-center" },
      { name: "CFPB Know Before You Owe", url: "https://www.consumerfinance.gov/paying-for-college" },
      { name: "529 College Savings Plans", url: "https://www.sec.gov/investor/pubs/intro529.htm" },
      { name: "Fastweb Scholarships", url: "https://www.fastweb.com" },
      { name: "Scholarships.com", url: "https://www.scholarships.com" },
      { name: "BigFuture (College Board)", url: "https://bigfuture.collegeboard.org" },
      { name: "Gates Scholarship", url: "https://www.thegatesscholarship.org" },
      { name: "QuestBridge", url: "https://www.questbridge.org" },
      { name: "Khan Academy SAT Prep (Free)", url: "https://www.khanacademy.org/sat" },
    ],
  },
  {
    group: "Administrators & Advisors",
    links: [
      { name: "FSA Handbook (IFAP)", url: "https://fsapartners.ed.gov/knowledge-center/fsa-handbook" },
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
      { name: "EDExpress – FA Software", url: "https://fsapartners.ed.gov/knowledge-center/topics/software-and-other-tools/edexpress" },
      { name: "EdConnect – SAIG Transmission", url: "https://fsapartners.ed.gov/knowledge-center/topics/software-and-other-tools/edconnect" },
      { name: "FSA Training & Professional Development", url: "https://fsapartners.ed.gov/training-events" },
      { name: "FSA Data Center (FAFSA Data)", url: "https://studentaid.gov/data-center" },
      { subcat: "FAFSA & Verification" },
      { name: "CPS (Central Processing System) Info", url: "https://ifap.ed.gov" },
      { name: "SAR / ISIR Interpretation", url: "https://studentaid.gov/help-center/answers/topic/professionals" },
      { name: "FAFSA Simplification Act Resources", url: "https://fsapartners.ed.gov/knowledge-center/topics/fafsa-simplification-information" },
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
      { name: "OIG Semiannual Report to Congress", url: "https://oig.ed.gov/resources/congressional-reports" },
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
      { name: "AICPA – Audit Standards (SAS)", url: "https://www.aicpa-cima.com/resources/landing/audit-attest-and-quality-management-standards" },
      { name: "FSA Audit Guide – Title IV", url: "https://oig.ed.gov/non-federal-audits/title-iv-audits" },
      { name: "Program Review Protocols – FSA", url: "https://studentaid.gov/about/announcements/program-review" },
      { name: "OIG Audit Reports – Higher Education", url: "https://oig.ed.gov/audit-reports" },
      { name: "HEERF / CARES Act Audit Requirements", url: "https://oig.ed.gov/non-federal-audits/title-iv-audits" },
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
      { name: "FSA Modernization – FUTURE Act", url: "https://fsapartners.ed.gov/knowledge-center/topics/fafsa-simplification-information" },
      { name: "Congressional Research Service – Higher Ed Reports", url: "https://crsreports.congress.gov" },
      { subcat: "Recovery, Controls & Governance" },
      { name: "Overpayment Recovery – NSLDS", url: "https://nslds.ed.gov" },
      { name: "Title IV Reconciliation Guidance", url: "https://cod.ed.gov" },
      { name: "Internal Controls – 2 CFR 200.303", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.303" },
      { name: "Allowable Costs – 2 CFR 200.420-.476", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E" },
      { name: "Questioned Costs & Findings – 2 CFR 200.516", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-F/section-200.516" },
      { name: "Corrective Action Plans – OIG Guidance", url: "https://oig.ed.gov/audit-reports" },
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
      { name: "SHRM — Employee Mental Health & Wellness", url: "https://www.shrm.org/topics-tools/topics/mental-health" },
      { subcat: "Disability & Accommodations" },
      { name: "ADA.gov — Reasonable Workplace Accommodations", url: "https://www.ada.gov/resources/employment-seeking-guide/" },
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
      { name: "Mindful Schools — Mindfulness in Education", url: "https://www.mindfulschools.org" },
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
      { name: "ED OIG — Report Fraud/Waste/Abuse", url: "https://oig.ed.gov/oig-hotline" },
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
  { name: "CommonBond (Now Firstmark)", url: "https://www.firstmarkservices.com" },
  { name: "LendKey Network", url: "https://www.lendkey.com" },
  { name: "Custom Choice Loan (SouthState)", url: "https://www.customchoiceloan.com" },
  { subcat: "Comparison & Research" },
  { name: "NerdWallet — Best Private Loans", url: "https://www.nerdwallet.com/best/loans/student-loans/private-student-loans" },
  { name: "Bankrate — Compare Student Loans", url: "https://www.bankrate.com/loans/student-loans" },
  { name: "Credible — Student Loan Compare", url: "https://www.credible.com/student-loans" },
  { name: "LendingTree Student Loans", url: "https://www.lendingtree.com/student" },
  { name: "Student Loan Hero (LendingTree)", url: "https://studentloanhero.com" },
  { name: "CFPB — Know Before You Owe", url: "https://www.consumerfinance.gov/paying-for-college" },
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
  { subcat: "Loan Calculators & Repayment Tools" },
  { name: "StudentAid.gov Loan Simulator", url: "https://studentaid.gov/loan-simulator" },
  { name: "NerdWallet Loan Calculator", url: "https://www.nerdwallet.com/article/loans/student-loans/student-loan-calculator" },
  { name: "Bankrate Student Loan Calculator", url: "https://www.bankrate.com/loans/student-loans/student-loan-calculator" },
  { name: "SoFi Student Loan Calculator", url: "https://www.sofi.com/resources/student-loan-calc" },
  { name: "College Ave Loan Calculator", url: "https://www.collegeavestudentloans.com/calculator" },
  { name: "Sallie Mae Payment Estimator", url: "https://www.salliemae.com/student-loans/student-loan-payment-calculator" },
  { name: "Credible Loan Comparison Tool", url: "https://www.credible.com/student-loans" },
  { name: "Earnest Loan Calculator", url: "https://www.earnest.com/student-loans/calculator" },
  { name: "MeasureOne — Private Loan Data", url: "https://measureone.com" },
  { name: "CFPB Student Loan Repayment Tool", url: "https://www.consumerfinance.gov/paying-for-college/repay-student-debt" },
  { subcat: "Alternative Funding & Income Share" },
  { name: "Edly — Income Share Agreements", url: "https://www.edly.com" },
  { name: "Lambda School ISA (Bloom Institute)", url: "https://www.bloomtech.com/financing" },
  { name: "Stride Funding — ISA for College", url: "https://www.stridefunding.com" },
  { name: "Vemo Education — ISA Platform", url: "https://www.vemo.com" },
  { name: "Blair — Income Share Agreement", url: "https://www.blair.io" },
  { name: "Align Income Share Funding", url: "https://www.alignfunding.com" },
  { name: "Meratas — ISA Management", url: "https://www.meratas.com" },
  { name: "Coding Bootcamp Financing Options", url: "https://www.coursereport.com/blog/coding-bootcamp-financing" },
  { name: "Opportunity@Work — STARs Initiative", url: "https://opportunityatwork.org" },
  { name: "Kiva — Microloans for Students", url: "https://www.kiva.org" },
  { subcat: "Graduate & Professional Loans" },
  { name: "Grad PLUS Loan (Federal)", url: "https://studentaid.gov/understand-aid/types/loans/plus/grad" },
  { name: "CommonBond Graduate Loans", url: "https://www.firstmarkservices.com" },
  { name: "Earnest Graduate School Loans", url: "https://www.earnest.com/student-loans/graduate-school" },
  { name: "SoFi Graduate School Loans", url: "https://www.sofi.com/student-loans/graduate" },
  { name: "Sallie Mae Graduate School Loans", url: "https://www.salliemae.com/student-loans/graduate-student-loans" },
  { name: "College Ave Graduate Loans", url: "https://www.collegeavestudentloans.com/graduate-student-loans" },
  { name: "Discover Graduate Loans", url: "https://www.discover.com/student-loans/graduate" },
  { name: "Citizens One Graduate Loans", url: "https://www.citizensbank.com/learning/student-loans-for-graduate-students.aspx" },
  { name: "MPOWER Financing — International Grad", url: "https://www.mpowerfinancing.com" },
  { name: "Prodigy Finance — MBA Loans", url: "https://prodigyfinance.com/mba-loans" },
  { subcat: "Law & Medical School Loans" },
  { name: "Access Group (Grad PLUS Alternative)", url: "https://www.accesslex.org" },
  { name: "Sallie Mae Law School Loans", url: "https://www.salliemae.com/student-loans/law-school-loans" },
  { name: "AAMC FIRST (Medical School Aid)", url: "https://www.aamc.org/services/first" },
  { name: "Medloans Organizer & Calculator", url: "https://www.aamc.org/services/first/medloans" },
  { name: "Doctor Loan (Physician Mortgages)", url: "https://www.physicianloans.com" },
  { name: "Laurel Road — Doctor Student Loans", url: "https://www.laurelroad.com/student-loans-for-doctors" },
  { name: "AMA — Medical Student Loans Guide", url: "https://www.ama-assn.org/residents-students/resident-student-finance/medical-student-loans" },
  { name: "DENTASIM — Dental School Loans", url: "https://www.ada.org/resources/ada-member-advantage/student-resources/student-financial-tools" },
  { subcat: "Understanding Your Rights" },
  { name: "CFPB — Student Loan Rights", url: "https://www.consumerfinance.gov/consumer-tools/student-loans" },
  { name: "Student Borrower Protection Center", url: "https://protectborrowers.org" },
  { name: "National Consumer Law Center — Student Loans", url: "https://www.nclc.org/issues/student-loans.html" },
  { name: "Student Defense — Legal Help", url: "https://www.studentdefense.org" },
  { name: "Project on Predatory Student Lending", url: "https://predatorystudentlending.org" },
  { name: "U.S. PIRG — Student Debt Campaign", url: "https://studentpirgs.org" },
  { name: "Young Invincibles — Student Debt Policy", url: "https://younginvincibles.org/issues/higher-education" },
  { name: "Debt Collective — Student Debt Campaigns", url: "https://debtcollective.org" },
  { name: "American Federation of Teachers — Debt Aid", url: "https://www.aft.org/yourloans" },
  { name: "BrightPoint — Student Loan Legal Aid", url: "https://www.brightpointindy.org" },
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
  { name: "Monster", url: "https://www.monster.com" },
  { name: "CareerBuilder", url: "https://www.careerbuilder.com" },
  { name: "Wellfound / AngelList", url: "https://wellfound.com" },
  { name: "Snagajob (Hourly Jobs)", url: "https://www.snagajob.com" },
  { name: "Internships.com", url: "https://www.internships.com" },
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
  { name: "Forage (Virtual Experience)", url: "https://www.theforage.com" },
  { name: "RippleMatch (Campus Recruiting)", url: "https://ripplematch.com" },
  { name: "Symplicity (Career Services)", url: "https://www.symplicity.com" },
  { name: "12twenty (Campus Recruiting)", url: "https://www.12twenty.com" },
  { name: "Joinhandshake Premium", url: "https://joinhandshake.com/employers" },
  { subcat: "On-Campus & Work-Study" },
  { name: "Federal Work-Study Program", url: "https://studentaid.gov/understand-aid/types/work-study" },
  { name: "On-Campus Jobs — Your University HR", url: "https://www.usajobs.gov" },
  { name: "AmeriCorps (Paid Service)", url: "https://americorps.gov" },
  { name: "VISTA — AmeriCorps Anti-Poverty", url: "https://americorps.gov/serve/americorps/americorps-vista" },
  { name: "City Year — Education Service", url: "https://www.cityyear.org" },
  { name: "Teach For America", url: "https://www.teachforamerica.org" },
  { name: "Peace Corps (Post-Grad)", url: "https://www.peacecorps.gov" },
  { subcat: "Gig & Freelance" },
  { name: "Upwork (Freelancing)", url: "https://www.upwork.com" },
  { name: "Fiverr (Gig Services)", url: "https://www.fiverr.com" },
  { name: "Toptal (High-End Freelance)", url: "https://www.toptal.com" },
  { name: "Guru (Freelance Platform)", url: "https://www.guru.com" },
  { name: "Freelancer.com", url: "https://www.freelancer.com" },
  { name: "Taskrabbit (Local Gigs)", url: "https://www.taskrabbit.com" },
  { name: "DoorDash Driver", url: "https://www.doordash.com/dasher/signup" },
  { name: "Uber Eats Driver", url: "https://www.ubereats.com/restaurant/en-US/signup" },
  { name: "Instacart Shopper", url: "https://shoppers.instacart.com" },
  { name: "Rover (Pet Care Jobs)", url: "https://www.rover.com/become-a-sitter" },
  { name: "Wyzant (Tutoring Jobs)", url: "https://www.wyzant.com/become_a_tutor" },
  { name: "Varsity Tutors", url: "https://www.varsitytutors.com/tutors" },
  { name: "Chegg Tutors", url: "https://www.chegg.com/tutors" },
  { name: "Rev (Transcription & Captions)", url: "https://www.rev.com/freelancers" },
  { name: "Appen (AI Data Annotation)", url: "https://appen.com/join-our-crowd" },
  { name: "UserTesting (UX Testing)", url: "https://www.usertesting.com/be-a-user-tester" },
  { name: "Survey Junkie (Surveys)", url: "https://www.surveyjunkie.com" },
  { subcat: "Skills & Networking" },
  { name: "Bumble Bizz (Networking)", url: "https://bumble.com/bizz" },
  { name: "Meetup — Professional Groups", url: "https://www.meetup.com" },
  { name: "Lunchclub — AI Networking", url: "https://lunchclub.com" },
  { name: "NACE — Career Services Network", url: "https://www.naceweb.org" },
  { name: "Bureau of Labor Statistics OOH", url: "https://www.bls.gov/ooh" },
  { name: "CareerOneStop — Career Exploration", url: "https://www.careeronestop.org" },
  { name: "O*NET — Occupation Info", url: "https://www.onetonline.org" },
  { name: "My Next Move — Career Quiz", url: "https://www.mynextmove.org" },
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
  { name: "Glassdoor Internships", url: "https://www.glassdoor.com" },
  { name: "ZipRecruiter Internships", url: "https://www.ziprecruiter.com" },
  { name: "College Recruiter", url: "https://www.collegerecruiter.com" },
  { name: "AfterCollege", url: "https://www.aftercollege.com" },
  { name: "Idealist Internships", url: "https://www.idealist.org" },
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
  { name: "Tesla Internship Program", url: "https://www.tesla.com/careers/search#/?type=3" },
  { name: "Salesforce Futureforce", url: "https://www.salesforce.com/company/careers/university-recruiting" },
  { name: "JPMorgan Chase Internships", url: "https://careers.jpmorgan.com/us/en/students" },
  { name: "Morgan Stanley Student Programs", url: "https://www.morganstanley.com/people/diversity/programs" },
  { name: "Bank of America Student Programs", url: "https://campus.bankofamerica.com" },
  { name: "Deloitte Internships", url: "https://www.deloitte.com/us/en/pages/careers/topics/internships.html" },
  { name: "McKinsey Summer Internship", url: "https://www.mckinsey.com/careers/students" },
  { name: "Accenture Technology Internship", url: "https://www.accenture.com/us-en/careers/local/students" },
  { name: "IBM Internship Programs", url: "https://www.ibm.com/us-en/employment/entry_level.html" },
  { name: "Intel Internship Program", url: "https://jobs.intel.com/en/internship" },
  { name: "Oracle Student Programs", url: "https://www.oracle.com/careers/students-grads" },
  { name: "Nvidia Internships", url: "https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting" },
  { name: "Lockheed Martin Internships", url: "https://www.lockheedmartin.com/en-us/who-we-are/global-talent/internships.html" },
  { name: "Boeing Internship & Co-op", url: "https://www.boeing.com/careers/college-internships" },
  { name: "Raytheon Technologies Interns", url: "https://careers.rtx.com/global/en/students-and-recent-graduates" },
  { name: "Northrop Grumman Internships", url: "https://www.northropgrumman.com/careers/internships" },
  { name: "PwC Internship Program", url: "https://www.pwc.com/us/en/careers/campus.html" },
  { name: "EY (Ernst & Young) Internships", url: "https://www.ey.com/en_us/careers/students" },
  { name: "KPMG Internship Program", url: "https://www.kpmg.com/us/en/careers/campus-recruiting.html" },
  { name: "Citi Summer Analyst Program", url: "https://jobs.citi.com/students" },
  { name: "BlackRock Summer Analyst", url: "https://careers.blackrock.com/students" },
  { name: "Procter & Gamble Internships", url: "https://www.pgcareers.com/internship" },
  { name: "Johnson & Johnson Internships", url: "https://jobs.jnj.com/en/students-and-recent-graduates" },
  { name: "3M Internship & Co-op", url: "https://www.3m.com/3M/en_US/careers-us/students" },
  { subcat: "Specific Fields" },
  { name: "PolicyGenius (Fintech Internships)", url: "https://www.policygenius.com/about/careers" },
  { name: "Idealist — Nonprofit Internships", url: "https://www.idealist.org/en/jobs?type=INTERNSHIP" },
  { name: "USAJobs — Federal Internships", url: "https://www.usajobs.gov/Search/Results?j=1170&p=1" },
  { name: "Paid Summer Research (SROP)", url: "https://www.btaa.org/resources-for/students/srop/introduction" },
  { name: "REU Sites — NSF Research", url: "https://www.nsf.gov/crssprgm/reu/reu_search.jsp" },
  { name: "Summer Research Diversity Programs", url: "https://www.pathwaystoscience.org/Programs.aspx" },
  { name: "Washington Center Programs", url: "https://twc.edu" },
  { name: "UN Secretariat Internships", url: "https://careers.un.org/lbw/home.aspx?viewtype=IP" },
  { name: "World Bank Internship Program", url: "https://www.worldbank.org/en/about/careers/programs-and-internships/internship" },
  { name: "IMF Internship Program", url: "https://www.imf.org/en/About/Recruitment/Internship-Program" },
  { name: "Congressional Internships", url: "https://www.congress.gov/internships-fellowships" },
  { name: "Senate Internship Program", url: "https://www.senate.gov/employment/interns.htm" },
  { name: "House of Representatives Internships", url: "https://www.house.gov/educators-and-students/college-internships" },
  { name: "State Dept Student Intern Program", url: "https://www.state.gov/student-internship-program" },
  { name: "CIA Undergraduate Internship", url: "https://www.cia.gov/careers/student-opportunities" },
  { name: "FBI Honors Internship Program", url: "https://www.fbijobs.gov/students" },
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
  { subcat: "AI Safety & Ethics" },
  { name: "AI Safety Fundamentals (BlueDot Impact, Free)", url: "https://aisafetyfundamentals.com" },
  { name: "Center for AI Safety Resources", url: "https://www.safe.ai" },
  { name: "Future of Life Institute — AI Risk", url: "https://futureoflife.org/ai" },
  { name: "Alignment Forum — AI Research", url: "https://www.alignmentforum.org" },
  { name: "LessWrong — AI & Rationality", url: "https://www.lesswrong.com" },
  { name: "AI Ethics Guidelines Global Inventory", url: "https://algorithmwatch.org/en/ai-ethics-guidelines-global-inventory" },
  { name: "Montreal Declaration for Responsible AI", url: "https://www.montrealdeclaration-responsibleai.com" },
  { name: "IEEE Ethically Aligned Design", url: "https://ethicsinaction.ieee.org" },
  { name: "NIST AI Risk Management Framework", url: "https://www.nist.gov/artificial-intelligence" },
  { name: "EU AI Act Compliance Guide", url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai" },
  { subcat: "AI Tools for Students" },
  { name: "Grammarly AI Writing Assistant", url: "https://www.grammarly.com" },
  { name: "Otter.ai — AI Meeting Notes", url: "https://otter.ai" },
  { name: "Notion AI — Smart Workspace", url: "https://www.notion.so/product/ai" },
  { name: "Canva AI — Design Tools (Free)", url: "https://www.canva.com/ai-image-generator" },
  { name: "Adobe Firefly — AI Creative Tools", url: "https://firefly.adobe.com" },
  { name: "Elicit — AI Research Assistant (Free)", url: "https://elicit.com" },
  { name: "Consensus — AI Research Citations (Free)", url: "https://consensus.app" },
  { name: "Semantic Scholar — AI-Powered Papers", url: "https://www.semanticscholar.org" },
  { name: "Connected Papers — Research Map", url: "https://www.connectedpapers.com" },
  { name: "Research Rabbit — Citation Mapping", url: "https://www.researchrabbit.ai" },
  { name: "Scite — Smart Citation Analysis", url: "https://scite.ai" },
  { name: "SciSpace — AI Research Tool (Free/Paid)", url: "https://typeset.io" },
  { name: "Wordtune — AI Rewriting Tool (Free)", url: "https://www.wordtune.com" },
  { name: "Quillbot — Paraphrase & Summarize (Free)", url: "https://quillbot.com" },
  { name: "Hemingway Editor — Readability (Free)", url: "https://hemingwayapp.com" },
  { name: "Sudowrite — Creative AI Writing (Paid)", url: "https://www.sudowrite.com" },
  { name: "MagicSchool AI — Student Study Tools", url: "https://www.magicschool.ai" },
  { name: "Khanmigo by Khan Academy (AI Tutor)", url: "https://www.khanacademy.org/khan-labs" },
  { name: "Duolingo Max — AI Language Learning", url: "https://blog.duolingo.com/duolingo-max" },
  { name: "Socratic by Google — Homework Help (Free)", url: "https://socratic.org" },
  { name: "Wolfram Alpha — Computational AI (Free/Paid)", url: "https://www.wolframalpha.com" },
  { name: "Photomath — AI Math Solver (Free)", url: "https://photomath.com" },
  { name: "Mathway — Step-by-Step Math AI (Free)", url: "https://www.mathway.com" },
  { subcat: "AI News & Policy" },
  { name: "MIT Technology Review — AI", url: "https://www.technologyreview.com/topic/artificial-intelligence" },
  { name: "The Verge — AI Section", url: "https://www.theverge.com/ai-artificial-intelligence" },
  { name: "TechCrunch — AI Coverage", url: "https://techcrunch.com/category/artificial-intelligence" },
  { name: "Wired — AI Coverage", url: "https://www.wired.com/tag/artificial-intelligence" },
  { name: "VentureBeat — AI Section", url: "https://venturebeat.com/category/ai" },
  { name: "AI Weekly Newsletter (The Algorithm)", url: "https://www.technologyreview.com/newsletters/the-algorithm" },
  { name: "Import AI — Jack Clark Newsletter", url: "https://importai.substack.com" },
  { name: "Politico AI & Tech Policy", url: "https://www.politico.com/news/artificial-intelligence" },
  { name: "AI Now Institute — Policy Research", url: "https://ainowinstitute.org" },
  { name: "Brookings — AI Policy Reports", url: "https://www.brookings.edu/topic/artificial-intelligence" },
  { name: "CSET — Center for Security & Emerging Tech", url: "https://cset.georgetown.edu" },
  { name: "Information Technology & Innovation Foundation (ITIF)", url: "https://itif.org/collections/artificial-intelligence" },
  { name: "RAND Corporation — AI Research", url: "https://www.rand.org/topics/artificial-intelligence.html" },
  { name: "GAO — AI Federal Reports", url: "https://www.gao.gov/artificial-intelligence" },
  { name: "White House OSTP — AI Executive Order", url: "https://www.whitehouse.gov/ostp/ai-bill-of-rights" },
  { name: "NSF — AI Research Institutes", url: "https://www.nsf.gov/cise/ai.jsp" },
  { name: "DARPA — AI Programs", url: "https://www.darpa.mil/our-research" },
  { name: "OpenAI Research Blog", url: "https://openai.com/research" },
  { name: "DeepMind Research Papers", url: "https://deepmind.google/research/publications" },
  { name: "Google AI Blog", url: "https://ai.googleblog.com" },
  { name: "Meta AI Research", url: "https://ai.meta.com/research" },
  { name: "Microsoft Research — AI", url: "https://www.microsoft.com/en-us/research/research-area/artificial-intelligence" },
  { name: "Anthropic Research Papers", url: "https://www.anthropic.com/research" },
  { name: "arXiv — AI/ML Preprints (cs.AI)", url: "https://arxiv.org/list/cs.AI/recent" },
  { name: "Papers With Code — ML Papers", url: "https://paperswithcode.com" },
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

// ── Mental Health — Admin / Leader / Auditor (Professional Wellness) ──
const MENTAL_HEALTH_ADMIN: LinkItem[] = [
  { name: "SAMHSA Workplace Wellness",         url: "https://www.samhsa.gov/workplace" },
  { name: "Mental Health First Aid",           url: "https://www.mentalhealthfirstaid.org" },
  { name: "EAPA — Employee Assistance Pros",  url: "https://www.eapassn.org" },
  { name: "CDC Workplace Health",              url: "https://www.cdc.gov/workplacehealthpromotion" },
  { name: "National Wellness Institute",       url: "https://nationalwellness.org" },
  { name: "APA — Psychologically Healthy Workplace", url: "https://www.apaexcellence.org" },
  { name: "Headspace for Work",                url: "https://www.headspace.com/work" },
  { name: "SHRM — Mental Health at Work",      url: "https://www.shrm.org/topics-tools/topics/mental-health-wellness" },
  { name: "NIMH — Workplace Mental Health",    url: "https://www.nimh.nih.gov/health/topics/mental-health-in-the-workplace" },
  { name: "Calm for Business",                 url: "https://www.calm.com/business" },
  { name: "Mind Tools — Stress Management",    url: "https://www.mindtools.com/pages/article/newTCS_05.htm" },
  { name: "American Institute of Stress",      url: "https://www.stress.org" },
  { name: "AFSP Workplace Suicide Prevention", url: "https://afsp.org/workplace-suicide-prevention" },
  { name: "QPR Institute — Suicide Training",  url: "https://qprinstitute.com" },
  { name: "Zero Suicide Institute",            url: "https://zerosuicide.edc.org" },
  { name: "Thrive Global — Burnout Resources", url: "https://thriveglobal.com" },
  { name: "Wellbeing at Work (Gallup)", url: "https://www.gallup.com/workplace/215924/well-being.aspx" },
  { name: "SHRM — Burnout Prevention", url: "https://www.shrm.org/topics-tools/topics/burnout" },
  { name: "National Alliance on Mental Illness (NAMI) — Workplace", url: "https://www.nami.org/Your-Journey/Identity-and-Cultural-Dimensions/Workplace" },
  { name: "APA Work & Well-Being Survey", url: "https://www.apaexcellence.org/resources/special-topics" },
  { name: "Calm for Business", url: "https://www.calm.com/business" },
  { name: "Lyra Health — EAP Platform", url: "https://www.lyrahealth.com" },
  { name: "Spring Health — Employee Mental Health", url: "https://www.springhealth.com" },
  { name: "Modern Health — Workforce Mental Health", url: "https://www.modernhealth.com" },
  { name: "Ginger.io — Mental Health Coaching", url: "https://www.ginger.com" },
  { name: "Telus Health (LifeWorks) EAP", url: "https://telus.com/health" },
  { name: "ComPsych — Largest EAP Provider", url: "https://www.compsych.com" },
  { name: "Magellan Health EAP", url: "https://www.magellanhealth.com/employer" },
  { name: "Optum EAP", url: "https://www.optum.com/health-services/employee-assistance-programs.html" },
  { name: "NAMI Higher Education Mental Health", url: "https://www.nami.org/Support-Education/Mental-Health-Education/NAMI-on-Campus-Colleges" },
  { name: "Active Minds — Campus Mental Health", url: "https://www.activeminds.org/programs" },
  { name: "Suicide Prevention Resource Center (SPRC)", url: "https://www.sprc.org/settings/colleges-universities" },
  { name: "Jed Foundation — Campus Programs", url: "https://jedfoundation.org/jed-campus" },
  { name: "University of Michigan Depression Center", url: "https://depressioncenter.org" },
  { name: "Psych Hub — Mental Health Education", url: "https://psychhub.com" },
  { name: "Workplace Mental Health Alliance", url: "https://workplacementalhealth.org" },
  { name: "Mental Health America — Employer Toolkit", url: "https://www.mhanational.org/employer-resources" },
  { name: "One Mind at Work", url: "https://onemindatwork.org" },
  { name: "ADAA Workplace Resources", url: "https://adaa.org/finding-help/workplace" },
  { name: "Crisis Text Line — Training for Workplaces", url: "https://www.crisistextline.org" },
  { name: "988 Suicide & Crisis Lifeline — Admin Info", url: "https://988lifeline.org/professionals" },
  { name: "International Employee Assistance Professionals Assoc.", url: "https://www.eapassn.org" },
  { name: "Robert Wood Johnson Foundation — Well-Being", url: "https://www.rwjf.org/en/our-focus-areas/outcomes/well-being.html" },
  { name: "BetterUp — Coaching for Organizations", url: "https://www.betterup.com" },
  { name: "Noom for Work — Weight & Wellness", url: "https://www.noom.com/business" },
  { name: "Talkspace for Business", url: "https://business.talkspace.com" },
  { name: "BetterHelp for Organizations", url: "https://www.betterhelp.com/organizations" },
  { name: "Wellthy — Complex Care Support", url: "https://wellthy.com" },
  { name: "Virgin Pulse — Employee Wellness Platform", url: "https://www.virginpulse.com" },
  { name: "Limeade — Employee Wellbeing", url: "https://www.limeade.com" },
  { name: "Voya Financial Wellness", url: "https://www.voya.com/page/financial-wellness" },
  { name: "Brightside Health — Depression & Anxiety", url: "https://www.brightside.com" },
  { name: "Woebot Health — AI Mental Health Tool", url: "https://woebothealth.com" },
  { name: "NORC at University of Chicago — Workforce", url: "https://www.norc.org/research/projects/employee-wellbeing.html" },
  { name: "Harvard Pilgrim — Resilience Training", url: "https://www.harvardpilgrim.org/employer-toolkits" },
  { name: "CCMH — College Counseling Center Benchmarking", url: "https://ccmh.psu.edu" },
  { name: "American College Health Association", url: "https://www.acha.org/resources" },
  { name: "Association for University and College Counseling Center Directors", url: "https://www.aucccd.org" },
  { name: "NAADAC — Addiction Counseling Resources", url: "https://www.naadac.org/resources" },
  { name: "SAMHSA Substance Abuse Help Line", url: "https://www.samhsa.gov/find-help/national-helpline" },
  { name: "World Health Organization — Workplace Mental Health", url: "https://www.who.int/teams/mental-health-and-substance-use/promotion-prevention/mental-health-in-the-workplace" },
  { name: "ILO — Work-Related Stress Guide", url: "https://www.ilo.org/safework/areasofwork/workplace-health-promotion-and-well-being/WCMS_108557/lang--en/index.htm" },
  { name: "National Institute for Occupational Safety & Health (NIOSH)", url: "https://www.cdc.gov/niosh/topics/stress/default.html" },
  { name: "OSHA — Stress at Work", url: "https://www.osha.gov/workplace-violence" },
  { name: "Employee Benefit Research Institute", url: "https://www.ebri.org" },
  { name: "Society for Human Resource Management (SHRM) Foundation", url: "https://www.shrm.org/foundation" },
  { name: "Gallup Wellbeing Index", url: "https://news.gallup.com/poll/146927/gallup-wellbeing.aspx" },
  { name: "Kaiser Family Foundation — Employer Health Benefits", url: "https://www.kff.org/health-costs/report/employer-health-benefits-survey" },
  { name: "Business Group on Health", url: "https://www.businessgrouphealth.org" },
  { name: "National Business Group on Health — Employee Assistance", url: "https://www.businessgrouphealth.org/topic-areas/employee-assistance-programs" },
  { name: "Families First Coronavirus Response — FMLA", url: "https://www.dol.gov/agencies/whd/fmla" },
  { name: "EEOC — Mental Health & Employment Discrimination", url: "https://www.eeoc.gov/laws/guidance/depression-ptsd-other-mental-health-conditions-workplace-your-legal-rights" },
  { name: "ADA National Network — Reasonable Accommodation", url: "https://adata.org/factsheet/reasonable-accommodations-workplace" },
  { name: "Bazelon Center — Mental Health in Schools & Work", url: "https://www.bazelon.org" },
  { name: "NIMH — Mental Disorders Statistics", url: "https://www.nimh.nih.gov/health/statistics" },
  { name: "Anxiety & Depression Association of America", url: "https://adaa.org" },
  { name: "Depression & Bipolar Support Alliance", url: "https://www.dbsalliance.org" },
  { name: "International OCD Foundation", url: "https://iocdf.org" },
  { name: "National Eating Disorders Association — Workplace", url: "https://www.nationaleatingdisorders.org" },
  { name: "Grief Share — Support Group Locator", url: "https://www.griefshare.org" },
  { name: "American Foundation for Suicide Prevention — Workplaces", url: "https://afsp.org/suicide-prevention-in-the-workplace" },
  { name: "Trevor Project — LGBTQ Youth Crisis", url: "https://www.thetrevorproject.org" },
  { name: "Trans Lifeline — Crisis Support", url: "https://translifeline.org" },
  { name: "PFLAG — Family Support", url: "https://pflag.org" },
  { name: "National Domestic Violence Hotline — Employer Toolkit", url: "https://www.thehotline.org/resources/workplace-resources" },
  { name: "Futures Without Violence — Employer Programs", url: "https://www.futureswithoutviolence.org/health/workplace-programs" },
  { name: "MindWise — Screening & Prevention Programs", url: "https://www.mindwise.org" },
  { name: "Mental Health Technology Transfer Center Network", url: "https://mhttcnetwork.org" },
  { name: "Recovery Research Institute", url: "https://www.recoveryanswers.org" },
];

// ── Volunteer & Community Service — Admin / Leader / Auditor ──
const VOLUNTEER_ADMIN: LinkItem[] = [
  { name: "AmeriCorps — Institutional Partnerships", url: "https://americorps.gov/partner" },
  { name: "Campus Compact — Civic Engagement",       url: "https://compact.org" },
  { name: "Points of Light — Corporate Volunteering",url: "https://www.pointsoflight.org/programs/corporate-service-council" },
  { name: "United Way Workplace Giving",             url: "https://www.unitedway.org/our-impact/featured-programs/workplace-campaign" },
  { name: "Idealist — Nonprofit & Volunteer Opps",  url: "https://www.idealist.org" },
  { name: "Independent Sector — Nonprofit Leaders",  url: "https://independentsector.org" },
  { name: "NASPA — Community Engagement",            url: "https://www.naspa.org/topics/civic-engagement" },
  { name: "VolunteerMatch — Nonprofit Partnerships", url: "https://www.volunteermatch.org/nonprofits" },
  { name: "HandsOn Network — Corporate Volunteer",   url: "https://www.handsonnetwork.org" },
  { name: "National Service-Learning Clearinghouse", url: "https://www.servicelearning.org" },
  { name: "Corporation for Nat'l & Community Svc",   url: "https://americorps.gov/about/agency" },
  { name: "Council on Foundations",                  url: "https://cof.org" },
  { name: "SHRM Foundation — Workforce Programs",    url: "https://www.shrm.org/foundation" },
  { name: "Habitat for Humanity — Campus Chapters",  url: "https://www.habitat.org/volunteer/near-you/campus-chapters-and-clubs" },
  { name: "United Nations Volunteers — Online",      url: "https://www.onlinevolunteering.org" },
  { name: "Catchafire — Skills-Based Volunteering",  url: "https://www.catchafire.org" },
  { name: "Volunteer Hub — Nonprofit Software",        url: "https://www.volunteerhub.com" },
  { name: "Galaxy Digital — Volunteer Management",     url: "https://www.galaxydigital.com" },
  { name: "Better Impact — Volunteer Software",        url: "https://www.betterimpact.com" },
  { name: "InitLive — Event Volunteer Platform",       url: "https://www.initlive.com" },
  { name: "Shift — Corporate Volunteering Platform",   url: "https://www.shiftnow.org" },
  { name: "Benevity — Corporate Giving & Volunteering",url: "https://benevity.com" },
  { name: "YourCause — CSR & Volunteering",            url: "https://www.yourcause.com" },
  { name: "Submittable — Grant & Program Management",  url: "https://www.submittable.com" },
  { name: "Charity Navigator — Nonprofit Vetting",     url: "https://www.charitynavigator.org" },
  { name: "GuideStar (Candid) — Nonprofit Research",   url: "https://www.guidestar.org" },
  { name: "GiveWell — Evidence-Based Giving",          url: "https://www.givewell.org" },
  { name: "Giving What We Can — Effective Giving",     url: "https://www.givingwhatwecan.org" },
  { name: "Network for Good — Nonprofit Fundraising",  url: "https://www.networkforgood.com" },
  { name: "BoardSource — Nonprofit Leadership",        url: "https://boardsource.org" },
  { name: "National Council of Nonprofits",             url: "https://www.councilofnonprofits.org" },
  { name: "Nonprofit Finance Fund",                     url: "https://nff.org" },
  { name: "Foundation Center Learning Lab",             url: "https://learninglab.foundationcenter.org" },
  { name: "Grants.gov — Federal Grant Finder",          url: "https://www.grants.gov" },
  { name: "GrantWatch — Grant Database",                url: "https://www.grantwatch.com" },
  { name: "Do Good Institute — Service-Learning Toolkit", url: "https://dogood.umd.edu" },
  { name: "Learn and Serve America",                    url: "https://americorps.gov/serve/fit-finder" },
  { name: "National Service-Learning Partnership",      url: "https://nslp.org" },
  { name: "CASE — Campus Compact Research",             url: "https://compact.org/resources" },
  { name: "Bonner Foundation — Service-Learning",       url: "https://bonner.org" },
  { name: "Project Pericles — Civic Engagement",        url: "https://www.projectpericles.org" },
  { name: "AAC&U — Civic Engagement VALUE Rubric",      url: "https://www.aacu.org/civic-engagement-VALUE-rubric" },
  { name: "AACU — Service-Learning Resources",          url: "https://www.aacu.org/resources/service-learning" },
  { name: "COOL — Campus Outreach Opportunity League",  url: "https://www.cool2serve.org" },
  { name: "Grantmakers for Education",                  url: "https://www.grantmakerforeducation.org" },
  { name: "VolunteerPro — Training & Consulting",       url: "https://www.volpro.net" },
  { name: "Energize Inc. — Volunteer Management Resources", url: "https://www.energizeinc.com" },
  { name: "NAVSM — Assoc. for Volunteer Administration", url: "https://www.navs-online.org" },
  { name: "COVOA — Council of Volunteer Admin Org.",    url: "https://covoa.org" },
  { name: "Urban Institute — Nonprofit Sector",         url: "https://www.urban.org/policy-centers/center-nonprofits-philanthropy" },
  { name: "Independent Sector — Trends & Research",     url: "https://independentsector.org/research" },
  { name: "Bridgespan Group — Nonprofit Strategy",      url: "https://www.bridgespan.org" },
  { name: "McKinsey Center for Government",             url: "https://www.mckinsey.com/industries/public-sector/how-we-help-clients/center-for-government" },
  { name: "Stanford Social Innovation Review",          url: "https://ssir.org" },
  { name: "Nonprofit Quarterly — News & Analysis",      url: "https://nonprofitquarterly.org" },
  { name: "Community Commons — Data & Tools",           url: "https://commonsdata.org" },
  { name: "United Way Worldwide",                       url: "https://www.unitedway.org" },
  { name: "YMCA — Community Partnership Programs",      url: "https://www.ymca.org" },
  { name: "Boys & Girls Clubs of America — Partners",   url: "https://www.bgca.org" },
  { name: "Big Brothers Big Sisters — Mentoring",       url: "https://www.bbbs.org" },
  { name: "Jewish Federations of North America",        url: "https://www.jewishfederations.org" },
  { name: "Catholic Charities USA — National Network",  url: "https://www.catholiccharitiesusa.org" },
  { name: "Lutheran Services in America",               url: "https://lutheranservices.org" },
  { name: "National Urban League — Programs",           url: "https://nul.org" },
  { name: "NAACP — Community Engagement",               url: "https://naacp.org/take-action" },
  { name: "Rotary International — Service Clubs",       url: "https://www.rotary.org/en/get-involved/volunteer-skills" },
  { name: "Lions Clubs International",                  url: "https://www.lionsclubs.org/en/resources-for-members/resource-center/serve-your-community" },
  { name: "Kiwanis International",                      url: "https://www.kiwanis.org/serve/volunteer" },
  { name: "Toastmasters International — Leadership",    url: "https://www.toastmasters.org/leadership-central" },
  { name: "Optimist International — Community Service", url: "https://www.optimist.org" },
  { name: "National 4-H Council",                       url: "https://4-h.org/volunteers" },
  { name: "Girl Scouts USA — Volunteer",                url: "https://www.girlscouts.org/volunteer" },
  { name: "Boy Scouts of America — Volunteer",          url: "https://www.scouting.org/volunteer" },
  { name: "NROC — National Response Operations Ctr.",   url: "https://www.nvoad.org" },
  { name: "VolunteerNation — Federal Volunteer Portal", url: "https://www.volunteer.gov" },
  { name: "CNCS (AmeriCorps Parent Agency)",            url: "https://americorps.gov/about/agency" },
  { name: "Corporation for National & Community Service Evaluation", url: "https://americorps.gov/evidence-exchange" },
  { name: "National Assessment of Educational Progress", url: "https://nces.ed.gov/nationsreportcard" },
  { name: "W.K. Kellogg Foundation — Community Grants", url: "https://www.wkkf.org" },
  { name: "Robert Wood Johnson Foundation — Community", url: "https://www.rwjf.org" },
  { name: "Annie E. Casey Foundation — Community Dev.", url: "https://www.aecf.org" },
  { name: "Lumina Foundation — Higher Ed Access",       url: "https://www.luminafoundation.org" },
  { name: "Ford Foundation — Social Justice Giving",    url: "https://www.fordfoundation.org" },
  { name: "Bill & Melinda Gates Foundation",            url: "https://www.gatesfoundation.org" },
  { name: "Bloomberg Philanthropies",                   url: "https://www.bloomberg.org" },
  { name: "MacArthur Foundation — Grants",              url: "https://www.macfound.org" },
  { name: "Rockefeller Foundation",                     url: "https://www.rockefellerfoundation.org" },
  { name: "Kresge Foundation",                          url: "https://kresge.org" },
  { name: "Open Society Foundations",                   url: "https://www.opensocietyfoundations.org" },
  { name: "Conrad N. Hilton Foundation",                url: "https://www.hiltonfoundation.org" },
  { name: "Silicon Valley Community Foundation",        url: "https://www.siliconvalleycf.org/giving" },
  { name: "Fidelity Charitable — Giving Account",       url: "https://www.fidelitycharitable.org" },
  { name: "Vanguard Charitable — Donor Advised Funds",  url: "https://www.vanguardcharitable.org" },
  { name: "Schwab Charitable",                          url: "https://www.schwabcharitable.org" },
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
  { subcat: "Student Aid Disputes" },
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

// ─── US Military Resources ────────────────────────────────────────────────────

const MILITARY_RESOURCES: MaybeSubcat[] = [
  { subcat: "Official Portals & Gateways" },
  { name: "Defense.gov — Official DoD Website", url: "https://www.defense.gov" },
  { name: "Military.com — Benefits, Pay & News", url: "https://www.military.com" },
  { name: "MilConnect — Benefits & Records Portal", url: "https://milconnect.dmdc.osd.mil" },
  { name: "MyPay — DFAS Pay Management", url: "https://mypay.dfas.mil" },
  { name: "USA.gov — Military & Veterans Hub", url: "https://www.usa.gov/military" },
  { name: "Military HUB — Benefits Explorer", url: "https://www.military.com/benefits" },
  { subcat: "Service Branch Websites" },
  { name: "U.S. Army — Army.mil", url: "https://www.army.mil" },
  { name: "U.S. Navy — Navy.mil", url: "https://www.navy.mil" },
  { name: "U.S. Marine Corps — Marines.mil", url: "https://www.marines.mil" },
  { name: "U.S. Air Force — AirForce.mil", url: "https://www.airforce.mil" },
  { name: "U.S. Space Force — SpaceForce.mil", url: "https://www.spaceforce.mil" },
  { name: "U.S. Coast Guard — GoCoastGuard.com", url: "https://www.gocoastguard.com" },
  { name: "National Guard — NationalGuard.mil", url: "https://www.nationalguard.mil" },
  { name: "Army Reserve — usar.army.mil", url: "https://www.usar.army.mil" },
  { name: "Navy Reserve — navyreserve.navy.mil", url: "https://www.navyreserve.navy.mil" },
  { name: "Air Force Reserve Command", url: "https://www.afrc.af.mil" },
  { name: "Marine Forces Reserve", url: "https://www.marforres.marines.mil" },
  { name: "Coast Guard Reserve", url: "https://www.reserve.uscg.mil" },
  { subcat: "Pay, Finance & Retirement" },
  { name: "DFAS — Defense Finance & Accounting Service", url: "https://www.dfas.mil" },
  { name: "Military Pay Charts — DoD", url: "https://militarypay.defense.gov/Pay/Military-Pay-Charts/" },
  { name: "BAH Calculator — Housing Allowance Rates", url: "https://www.defensetravel.dod.mil/site/bahCalc.cfm" },
  { name: "Thrift Savings Plan (TSP)", url: "https://www.tsp.gov" },
  { name: "Blended Retirement System (BRS)", url: "https://militarypay.defense.gov/BlendedRetirement/" },
  { name: "SCRA — Servicemembers Civil Relief Act", url: "https://www.justice.gov/servicemembers/servicemembers-civil-relief-act-scra" },
  { name: "SCRA Benefits Lookup — DMDC", url: "https://scra.dmdc.osd.mil" },
  { name: "MyArmyBenefits — Benefits Calculator", url: "https://www.myarmybenefits.us.army.mil" },
  { subcat: "Education & Training Benefits" },
  { name: "GI Bill Benefits — VA Education", url: "https://www.va.gov/education/gi-bill-benefits" },
  { name: "GoArmyEd — Army Tuition Assistance Portal", url: "https://www.goarmyed.com" },
  { name: "Air Force Virtual Education Center (AFVEC)", url: "https://afvec.us.af.mil" },
  { name: "Navy College Program — Tuition Assistance", url: "https://www.navycollege.navy.mil" },
  { name: "MyCAA — Military Spouse Education Benefits", url: "https://mycaa.militaryonesource.mil" },
  { name: "DANTES — Testing & Certifications", url: "https://www.dantes.mil" },
  { name: "Joint Services Transcript (JST)", url: "https://jst.doded.mil" },
  { name: "COOL — Army Credentialing Opportunities", url: "https://www.cool.osd.mil/army" },
  { name: "COOL — Navy Credentialing Opportunities", url: "https://www.cool.osd.mil/navy" },
  { name: "COOL — Air Force Credentialing Opportunities", url: "https://www.cool.osd.mil/airforce" },
  { name: "SOC — Servicemembers Opportunity Colleges", url: "https://www.soc.aascu.org" },
  { name: "Troops to Teachers Program", url: "https://www.troopstoteachers.net" },
  { name: "TA Decide — Tuition Assistance Comparison", url: "https://www.ta-decide.org" },
  { name: "CollegeRecon — Military-Friendly Colleges", url: "https://www.collegerecon.com" },
  { subcat: "Health Care — TRICARE & MHS" },
  { name: "TRICARE — Military Health Program", url: "https://www.tricare.mil" },
  { name: "Military Health System (MHS)", url: "https://www.health.mil" },
  { name: "Defense Health Agency (DHA)", url: "https://www.health.mil/About-MHS/Defense-Health-Agency" },
  { name: "TRICARE Find a Doctor", url: "https://www.tricare.mil/FindDoctor" },
  { name: "TRICARE Pharmacy Benefit", url: "https://www.tricare.mil/CoveredServices/Pharmacy" },
  { name: "EFMP — Exceptional Family Member Program", url: "https://www.militaryonesource.mil/efmp" },
  { name: "MHS GENESIS — Military Patient Portal", url: "https://mhsgenesis.health.mil" },
  { subcat: "Mental Health & Crisis Resources" },
  { name: "Veterans Crisis Line — Call 988, Press 1", url: "https://www.veteranscrisisline.net" },
  { name: "Real Warriors — Combat Stress Resources", url: "https://www.realwarriors.net" },
  { name: "Military OneSource — Confidential Counseling", url: "https://www.militaryonesource.mil/confidential-help" },
  { name: "PsychArmor — Military Mental Health Training", url: "https://psycharmor.org" },
  { name: "Give an Hour — Free Mental Health Care", url: "https://giveanhour.org" },
  { name: "Mission 22 — Veteran Suicide Prevention", url: "https://mission22.com" },
  { subcat: "Family & Community Support" },
  { name: "Military OneSource — Family Support Hub", url: "https://www.militaryonesource.mil" },
  { name: "Military Family Life Counseling (MFLC)", url: "https://www.militaryonesource.mil/confidential-help/non-medical-counseling/military-family-life-counseling" },
  { name: "DoDEA — Dependent School System", url: "https://www.dodea.edu" },
  { name: "School Liaison Program — DoD", url: "https://www.dodea.edu/Partnership/schoolLiaison.cfm" },
  { name: "Child Care Aware — Military Families", url: "https://www.childcareaware.org/military" },
  { name: "National Military Family Association", url: "https://www.militaryfamily.org" },
  { name: "Blue Star Families", url: "https://bluestarfam.org" },
  { name: "ACS — Army Community Service", url: "https://www.armymwr.com/programs-and-services/personal-assistance/army-community-service" },
  { name: "Fleet & Family Support Centers — Navy", url: "https://www.cnic.navy.mil/ffr/family_readiness" },
  { name: "Military Impacted Schools Association", url: "https://militaryimpactedschoolsassociation.org" },
  { subcat: "Housing & Military Finance" },
  { name: "BAH Rates — Defense Travel Management", url: "https://www.defensetravel.dod.mil/site/bah.cfm" },
  { name: "VA Home Loan Guaranty — Active Duty", url: "https://www.va.gov/housing-assistance/home-loans" },
  { name: "USAA — Military Financial Services", url: "https://www.usaa.com" },
  { name: "Navy Federal Credit Union", url: "https://www.navyfederal.org" },
  { name: "Pentagon Federal Credit Union (PenFed)", url: "https://www.penfed.org" },
  { name: "Armed Forces Bank", url: "https://www.afbank.com" },
  { subcat: "Transition & Employment" },
  { name: "Transition Assistance Program (TAP)", url: "https://www.tapevents.mil" },
  { name: "SkillBridge — DoD Industry Apprenticeships", url: "https://skillbridge.osd.mil" },
  { name: "Hiring Our Heroes", url: "https://www.hiringourheroes.org" },
  { name: "Hire Heroes USA", url: "https://www.hireheroesusa.org" },
  { name: "USAJobs — Federal Government Careers", url: "https://www.usajobs.gov" },
  { name: "RecruitMilitary — Veteran Job Fairs", url: "https://recruitmilitary.com" },
  { name: "American Corporate Partners (ACP) Mentoring", url: "https://www.acp-usa.org" },
  { name: "Helmets to Hardhats — Construction Careers", url: "https://helmetstohardhats.org" },
  { name: "O*NET Military Occupational Crosswalk", url: "https://www.onetonline.org/crosswalk/MOC" },
  { name: "SBA — Boots to Business Entrepreneurship", url: "https://sbavets.force.com/s" },
  { subcat: "Legal Assistance" },
  { name: "JAG Legal Assistance Office Locator", url: "https://legalassistance.law.af.mil" },
  { name: "SCRA Benefits Certification — DMDC", url: "https://scra.dmdc.osd.mil" },
  { name: "National Veterans Legal Services Program", url: "https://www.nvlsp.org" },
  { name: "State Approving Agencies — GI Bill Oversight", url: "https://www.nasaa-vetseducation.com" },
  { name: "Military Legal Resources — Military.com", url: "https://www.military.com/benefits/legal-matters" },
  { subcat: "Survivor & Casualty Benefits" },
  { name: "Survivor Benefit Plan (SBP) — DFAS", url: "https://www.dfas.mil/Retired-Military/manage/allotments/sbp" },
  { name: "Tragedy Assistance Program (TAPS)", url: "https://www.taps.org" },
  { name: "National Military Family Association — Survivors", url: "https://www.militaryfamily.org" },
  { name: "Death Gratuity & Survivor Benefits Guide", url: "https://www.military.com/benefits/survivor-benefits" },
  { subcat: "Military Organizations & Advocacy" },
  { name: "MOAA — Military Officers Association of America", url: "https://www.moaa.org" },
  { name: "NGAUS — National Guard Association", url: "https://www.ngaus.org" },
  { name: "Reserve Officers Association (ROA)", url: "https://www.roa.org" },
  { name: "Air Force Association (AFA)", url: "https://www.afa.org" },
  { name: "Association of the U.S. Army (AUSA)", url: "https://www.ausa.org" },
  { name: "Fleet Reserve Association (FRA)", url: "https://www.fra.org" },
  { name: "American Legion — Active Duty Resources", url: "https://www.legion.org" },
  { subcat: "Records & Identity" },
  { name: "DEERS — Benefits Enrollment & ID Cards", url: "https://www.dmdc.osd.mil/appj/dwp/index.faces" },
  { name: "milConnect — Official Records Portal", url: "https://milconnect.dmdc.osd.mil" },
  { name: "National Personnel Records Center (NPRC)", url: "https://www.archives.gov/veterans" },
  { name: "Request DD-214 — Archives.gov", url: "https://www.archives.gov/veterans/military-service-records" },
];

// ─── VA Resources ─────────────────────────────────────────────────────────────

const VA_RESOURCES: MaybeSubcat[] = [
  { subcat: "VA Main Portals & Tools" },
  { name: "VA.gov — Main Veterans Portal", url: "https://www.va.gov" },
  { name: "VA Benefits Overview", url: "https://www.va.gov/benefits" },
  { name: "MyHealtheVet — VA Health Portal", url: "https://www.myhealth.va.gov" },
  { name: "eBenefits — Benefits Management Portal", url: "https://www.ebenefits.va.gov" },
  { name: "ID.me for VA Login & Verification", url: "https://www.id.me" },
  { name: "VA.gov — Sign In & Manage Benefits", url: "https://www.va.gov/sign-in" },
  { subcat: "Disability Compensation" },
  { name: "VA Disability Compensation Overview", url: "https://www.va.gov/disability" },
  { name: "How to File a VA Disability Claim", url: "https://www.va.gov/disability/how-to-file-claim" },
  { name: "VA Disability Rating System", url: "https://www.va.gov/disability/about-disability-ratings" },
  { name: "Combined Ratings Table", url: "https://www.va.gov/disability/about-disability-ratings/combined-ratings-table" },
  { name: "PACT Act — Toxic Exposure Benefits", url: "https://www.va.gov/resources/the-pact-act-and-your-va-benefits" },
  { name: "Burn Pit & Airborne Hazards Registry", url: "https://www.va.gov/disability/eligibility/hazardous-materials-exposure/airborne-hazards-open-air-burn-pits" },
  { name: "Agent Orange Benefits — VA", url: "https://www.va.gov/disability/eligibility/hazardous-materials-exposure/agent-orange" },
  { name: "Military Sexual Trauma (MST) — VA", url: "https://www.mentalhealth.va.gov/mstemplate.asp" },
  { name: "Presumptive Service Connection — VA", url: "https://www.va.gov/disability/eligibility/hazardous-materials-exposure" },
  { subcat: "VA Health Care" },
  { name: "VA Health Care Eligibility", url: "https://www.va.gov/health-care/eligibility" },
  { name: "Apply for VA Health Care", url: "https://www.va.gov/health-care/apply/application/introduction" },
  { name: "VA Community Care — Outside VA Network", url: "https://www.va.gov/communitycare" },
  { name: "CHAMPVA — Dependent Health Coverage", url: "https://www.va.gov/health-care/family-caregiver-benefits/champva" },
  { name: "VA Pharmacy & Prescription Refills", url: "https://www.va.gov/health-care/refill-track-prescriptions" },
  { name: "VA Telehealth Services", url: "https://telehealth.va.gov" },
  { name: "VA Caregiver Support Program", url: "https://www.caregiver.va.gov" },
  { name: "Program of Comprehensive Caregiver Assistance", url: "https://www.caregiver.va.gov/Care_Caregivers.asp" },
  { name: "VA Prosthetics & Sensory Aids", url: "https://www.prosthetics.va.gov" },
  { subcat: "Mental Health" },
  { name: "Veterans Crisis Line — 988, Press 1", url: "https://www.veteranscrisisline.net" },
  { name: "VA Mental Health Services Overview", url: "https://www.va.gov/health-care/health-needs-conditions/mental-health" },
  { name: "PTSD National Center for Veterans", url: "https://www.ptsd.va.gov" },
  { name: "VA Suicide Prevention Program", url: "https://www.mentalhealth.va.gov/suicide_prevention" },
  { name: "Make the Connection — VA Mental Health", url: "https://maketheconnection.net" },
  { name: "VA Substance Use Disorder Treatment", url: "https://www.va.gov/health-care/health-needs-conditions/mental-health/substance-use-problems" },
  { name: "VA Whole Health Program", url: "https://www.va.gov/wholehealth" },
  { name: "VA Adaptive Sports Program", url: "https://www.va.gov/adaptive-sports" },
  { subcat: "Education & GI Bill" },
  { name: "GI Bill Benefits — VA Education", url: "https://www.va.gov/education/gi-bill-benefits" },
  { name: "Post-9/11 GI Bill (Chapter 33)", url: "https://www.va.gov/education/about-gi-bill-benefits/post-9-11" },
  { name: "Montgomery GI Bill — Active Duty (Ch. 30)", url: "https://www.va.gov/education/about-gi-bill-benefits/montgomery-active-duty" },
  { name: "GI Bill Comparison Tool", url: "https://www.va.gov/gi-bill-comparison-tool" },
  { name: "Yellow Ribbon Program", url: "https://www.va.gov/education/about-gi-bill-benefits/post-9-11/yellow-ribbon-program" },
  { name: "Transfer of Entitlement — Dependents GI Bill", url: "https://www.va.gov/education/transfer-post-9-11-gi-bill-to-dependents" },
  { name: "Fry Scholarship — Gold Star Family Education", url: "https://www.va.gov/education/survivor-dependent-benefits/fry-scholarship" },
  { name: "VA Education Work-Study Program", url: "https://www.va.gov/education/work-learn/workstudy" },
  { name: "WEAMS — VA Approved School Search", url: "https://inquiry.vba.va.gov/weamspub/buildSearchInstitutionCriteria.do" },
  { subcat: "Vocational Rehabilitation & Employment" },
  { name: "VA Vocational Rehabilitation & Employment (VR&E)", url: "https://www.va.gov/careers-employment/vocational-rehabilitation" },
  { name: "VA for Vets — Federal Employment", url: "https://vaforvets.va.gov" },
  { name: "Hire Vets Medallion — DOL Program", url: "https://www.hirevets.gov" },
  { name: "Veterans' Preference — Federal Jobs", url: "https://www.fedshirevets.gov" },
  { name: "American Job Centers — Veteran Services", url: "https://www.careeronestop.org/Veterans/default.aspx" },
  { name: "SkillBridge — Industry Training (DoD)", url: "https://skillbridge.osd.mil" },
  { name: "O*NET Military Crosswalk", url: "https://www.onetonline.org/crosswalk/MOC" },
  { subcat: "Housing & Home Loans" },
  { name: "VA Home Loan Guaranty Program", url: "https://www.va.gov/housing-assistance/home-loans" },
  { name: "VA Loan Certificate of Eligibility (COE)", url: "https://www.va.gov/housing-assistance/home-loans/how-to-apply" },
  { name: "VA Home Loan Funding Fee Info", url: "https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs" },
  { name: "VA Specially Adapted Housing (SAH)", url: "https://www.va.gov/housing-assistance/adaptive-sports-and-special-home-adaptations" },
  { name: "HUD-VASH — Homeless Veteran Housing", url: "https://www.va.gov/homeless/hud-vash.asp" },
  { name: "VA Homeless Veterans Programs", url: "https://www.va.gov/homeless" },
  { subcat: "Pension & Financial Assistance" },
  { name: "VA Pension Benefits", url: "https://www.va.gov/pension" },
  { name: "VA Aid & Attendance (A&A) Pension", url: "https://www.va.gov/pension/aid-attendance-housebound" },
  { name: "VA Survivors Pension", url: "https://www.va.gov/pension/survivors-pension" },
  { name: "VA Financial Hardship Assistance", url: "https://www.va.gov/health-care/pay-copay-debt/financial-hardship" },
  { name: "National Veterans Foundation Helpline", url: "https://nvf.org" },
  { subcat: "Survivor & Dependent Benefits" },
  { name: "VA Dependency & Indemnity Compensation (DIC)", url: "https://www.va.gov/disability/dependency-indemnity-compensation" },
  { name: "CHAMPVA — Spouse & Dependent Health", url: "https://www.va.gov/health-care/family-caregiver-benefits/champva" },
  { name: "VA Burial Benefits & National Cemeteries", url: "https://www.va.gov/burials-memorials" },
  { name: "National Cemetery Administration", url: "https://www.cem.va.gov" },
  { name: "Pre-Need Burial Eligibility — VA", url: "https://www.va.gov/burials-memorials/pre-need-eligibility" },
  { subcat: "Life Insurance" },
  { name: "Servicemembers Group Life Insurance (SGLI)", url: "https://www.va.gov/life-insurance/options-eligibility/sgli" },
  { name: "Veterans Group Life Insurance (VGLI)", url: "https://www.va.gov/life-insurance/options-eligibility/vgli" },
  { name: "Family SGLI (FSGLI) Coverage", url: "https://www.va.gov/life-insurance/options-eligibility/fsgli" },
  { name: "Traumatic Injury Protection (TSGLI)", url: "https://www.va.gov/life-insurance/options-eligibility/tsgli" },
  { name: "VA Life Insurance Overview", url: "https://www.va.gov/life-insurance" },
  { subcat: "Appeals & Decision Reviews" },
  { name: "VA Appeals Process Overview", url: "https://www.va.gov/decision-reviews" },
  { name: "Supplemental Claim", url: "https://www.va.gov/decision-reviews/supplemental-claim" },
  { name: "Higher-Level Review", url: "https://www.va.gov/decision-reviews/higher-level-review" },
  { name: "Board Appeal — Notice of Disagreement", url: "https://www.va.gov/decision-reviews/board-appeal" },
  { name: "Board of Veterans Appeals (BVA)", url: "https://www.bva.va.gov" },
  { name: "Veterans Benefits Administration (VBA)", url: "https://www.benefits.va.gov/benefits" },
  { name: "Court of Appeals for Veterans Claims (CAVC)", url: "https://www.uscourts.cavc.gov" },
  { subcat: "Veterans Service Organizations (VSOs)" },
  { name: "DAV — Disabled American Veterans", url: "https://www.dav.org" },
  { name: "American Legion", url: "https://www.legion.org" },
  { name: "VFW — Veterans of Foreign Wars", url: "https://www.vfw.org" },
  { name: "Paralyzed Veterans of America (PVA)", url: "https://pva.org" },
  { name: "AMVETS", url: "https://amvets.org" },
  { name: "Iraq and Afghanistan Veterans (IAVA)", url: "https://iava.org" },
  { name: "Team Red White & Blue (RWB)", url: "https://www.teamrwb.org" },
  { name: "Student Veterans of America (SVA)", url: "https://studentveterans.org" },
  { name: "Military Order of the Purple Heart", url: "https://www.purpleheart.org" },
  { subcat: "Special Veteran Programs" },
  { name: "Women Veterans — VA Programs", url: "https://www.womenshealth.va.gov" },
  { name: "VA Center for Minority Veterans", url: "https://www.va.gov/centerforminorityveterans" },
  { name: "VA Rural Health Programs", url: "https://www.ruralhealth.va.gov" },
  { name: "LGBTQ+ Veterans — VA Care", url: "https://www.va.gov/health-care/health-needs-conditions/lgbtq-veteran-care" },
  { name: "VA Fiduciary Program", url: "https://www.va.gov/fiduciary" },
  { name: "VA Research — National Veteran Studies", url: "https://www.research.va.gov" },
];

// ─── Volunteer & Community Service ────────────────────────────────────────────

const VOLUNTEER_RESOURCES: MaybeSubcat[] = [
  { subcat: "National Platforms" },
  { name: "VolunteerMatch — Find Local Opportunities", url: "https://www.volunteermatch.org" },
  { name: "Idealist — Volunteer & Nonprofit Jobs", url: "https://www.idealist.org" },
  { name: "All for Good — Volunteer Search", url: "https://www.allforgood.org" },
  { name: "JustServe — Community Service Platform", url: "https://www.justserve.org" },
  { name: "Points of Light — Civic Engagement Hub", url: "https://www.pointsoflight.org" },
  { name: "AmeriCorps — National Service Programs", url: "https://www.americorps.gov" },
  { name: "AmeriCorps VISTA — Anti-Poverty Service", url: "https://americorps.gov/serve/americorps/americorps-vista" },
  { name: "AmeriCorps NCCC — Team-Based Service", url: "https://americorps.gov/serve/americorps/americorps-nccc" },
  { name: "SeniorCorps — Volunteer Programs 55+", url: "https://americorps.gov/serve/senior-corps" },
  { name: "Peace Corps — International Service", url: "https://www.peacecorps.gov" },
  { subcat: "Student & Campus Service" },
  { name: "Campus Compact — Civic Engagement Network", url: "https://compact.org" },
  { name: "Break Away — Alternative Spring Break", url: "https://www.alternativebreaks.org" },
  { name: "Habitat for Humanity — Campus Chapters", url: "https://www.habitat.org/volunteer/near-you/campus-chapters-and-clubs" },
  { name: "Do Something — Youth Activism & Service", url: "https://www.dosomething.org" },
  { name: "Youth Service America — Service-Learning", url: "https://ysa.org" },
  { name: "National Youth Leadership Council (NYLC)", url: "https://www.nylc.org" },
  { name: "Key Club International (HS/College)", url: "https://www.keyclub.org" },
  { name: "Circle K International — College Service", url: "https://www.circlek.org" },
  { subcat: "Disaster Relief & Emergency" },
  { name: "Red Cross — Disaster Relief Volunteering", url: "https://www.redcross.org/volunteer" },
  { name: "FEMA Voluntary Agency Liaisons", url: "https://www.fema.gov/voluntary-agency-liaisons" },
  { name: "National VOAD — Disaster Organizations", url: "https://www.nvoad.org" },
  { name: "Team Rubicon — Veteran-Led Disaster Relief", url: "https://teamrubiconusa.org/volunteer" },
  { name: "Direct Relief — Humanitarian Aid", url: "https://www.directrelief.org/volunteer" },
  { subcat: "Food & Housing Security" },
  { name: "Feeding America — Food Bank Network", url: "https://www.feedingamerica.org/take-action/volunteer" },
  { name: "Food Bank Council — Find Local Food Banks", url: "https://www.feedingamerica.org/find-your-local-foodbank" },
  { name: "Meals on Wheels — Senior Nutrition", url: "https://www.mealsonwheelsamerica.org/volunteer" },
  { name: "Habitat for Humanity — Home Building", url: "https://www.habitat.org/volunteer" },
  { name: "National Alliance to End Homelessness", url: "https://endhomelessness.org" },
  { subcat: "Environment & Conservation" },
  { name: "Sierra Club — Environmental Volunteering", url: "https://www.sierraclub.org/volunteer" },
  { name: "National Park Service — Volunteers-in-Parks", url: "https://www.nps.gov/getinvolved/volunteer.htm" },
  { name: "Conservation Volunteers International", url: "https://www.conservationvip.org" },
  { name: "Ocean Conservancy — Beach Cleanups", url: "https://oceanconservancy.org/trash-free-seas/international-coastal-cleanup" },
  { name: "Trees for the Future — Agroforestry", url: "https://trees.org/volunteer" },
  { subcat: "Education & Mentoring" },
  { name: "America Reads & Counts — Literacy Tutoring", url: "https://www2.ed.gov/inits/americareads" },
  { name: "MENTOR — National Mentoring Partnership", url: "https://www.mentoring.org/get-involved/volunteer" },
  { name: "Reading Partners — K–12 Literacy", url: "https://readingpartners.org/volunteer" },
  { name: "826 National — Student Writing Support", url: "https://826national.org/volunteer" },
  { name: "Literacy Volunteers of America", url: "https://literacyvolunteers.org" },
  { subcat: "Health & Wellness" },
  { name: "Remote Area Medical (RAM) — Free Clinics", url: "https://www.ramusa.org/volunteer" },
  { name: "Special Olympics — Athlete Support", url: "https://www.specialolympics.org/get-involved/volunteer" },
  { name: "Crisis Text Line — Counselor Training", url: "https://www.crisistextline.org/volunteer" },
  { name: "American Cancer Society — Community", url: "https://www.cancer.org/about-us/local/volunteer.html" },
  { name: "Alzheimer's Association — Support Volunteer", url: "https://www.alz.org/get-involved-now/volunteer" },
  { subcat: "International & Global Service" },
  { name: "United Nations Volunteers (UNV)", url: "https://www.unv.org" },
  { name: "Engineers Without Borders USA", url: "https://www.ewb-usa.org/get-involved/volunteer" },
  { name: "Doctors Without Borders — Field Support", url: "https://www.doctorswithoutborders.org/get-involved" },
  { name: "Global Volunteers — Community Development", url: "https://globalvolunteers.org" },
  { name: "Cross-Cultural Solutions — Cultural Immersion", url: "https://www.crossculturalsolutions.org" },
  { subcat: "Skills-Based Volunteering" },
  { name: "Catchafire — Pro Bono Skills Matching", url: "https://www.catchafire.org" },
  { name: "Taproot Foundation — Skills-Based Volunteering", url: "https://taprootfoundation.org" },
  { name: "Common Impact — Pro Bono Consulting", url: "https://commonimpact.org" },
  { name: "Skilled Volunteers for Nonprofits", url: "https://www.skilledvolunteers.org" },
  { name: "Encore.org — Experience Corps", url: "https://encore.org/programs/experience-corps" },
  { name: "Service Year Alliance — Full-Time Service", url: "https://serviceyear.org" },
  { name: "Americorps State and National — Apply", url: "https://americorps.gov/serve/fit-finder/americorps-state-national" },
  { name: "City Year — Urban Education Service", url: "https://www.cityyear.org/become-a-volunteer" },
  { name: "Teach For America — Apply", url: "https://www.teachforamerica.org/join-tfa" },
  { name: "New Teacher Center", url: "https://newteachercenter.org" },
  { name: "College Advising Corps — Volunteer Advisors", url: "https://www.advisingcorps.org" },
  { name: "National Civilian Community Corps (NCCC)", url: "https://americorps.gov/serve/americorps/americorps-nccc" },
  { subcat: "International Service Programs" },
  { name: "Peace Corps — Apply", url: "https://www.peacecorps.gov/volunteer/apply" },
  { name: "WorldTeach — Teaching Abroad", url: "https://www.worldteach.org" },
  { name: "Voluntary Service Overseas (VSO)", url: "https://www.vsointernational.org" },
  { name: "Habitat for Humanity Global Village", url: "https://www.habitat.org/volunteer/travel-and-build/global-village" },
  { name: "International Volunteer HQ", url: "https://www.volunteerhq.org" },
  { name: "GoOverseas — Volunteer Programs Abroad", url: "https://www.gooverseas.com/volunteer-abroad" },
  { name: "Go Abroad — International Volunteer Search", url: "https://www.goabroad.com/volunteer-abroad" },
  { name: "Projects Abroad", url: "https://www.projects-abroad.org" },
  { name: "Globe Aware — Short-Term Service Trips", url: "https://www.globeaware.org" },
  { name: "Kaya Responsible Travel — Volunteering", url: "https://www.kayavolunteer.com" },
  { name: "WWOOF — Organic Farm Volunteering", url: "https://wwoof.net" },
  { name: "Workaway — Skills Exchange Hosting", url: "https://www.workaway.info" },
  { name: "HelpX — Work Exchange Volunteer", url: "https://www.helpx.net" },
  { subcat: "Animal & Wildlife" },
  { name: "Humane Society — Volunteer", url: "https://www.humanesociety.org/take-action/volunteer" },
  { name: "ASPCA — Volunteer Programs", url: "https://www.aspca.org/take-action/volunteer" },
  { name: "Wildlife Conservation Society — Volunteer", url: "https://www.wcs.org/get-involved/volunteer" },
  { name: "National Wildlife Federation — Habitat Gardening", url: "https://www.nwf.org/garden-for-wildlife" },
  { name: "World Wildlife Fund — Action Center", url: "https://www.worldwildlife.org/how-to-help/get-involved" },
  { name: "Best Friends Animal Society", url: "https://bestfriends.org/volunteer" },
  { name: "Petfinder — Rescue Volunteering", url: "https://www.petfinder.com/animal-shelters-and-rescues/volunteering-at-a-shelter" },
  { subcat: "Arts & Culture" },
  { name: "Americans for the Arts — Volunteer", url: "https://www.americansforthearts.org" },
  { name: "Volunteer Lawyers for the Arts", url: "https://www.vlany.org" },
  { name: "Museum Volunteer Programs — Smithsonian", url: "https://www.si.edu/volunteer" },
  { name: "Public Library Volunteer Programs", url: "https://www.ala.org/advocacy/volunteer" },
  { name: "History Colorado — Volunteer", url: "https://www.historycolorado.org/get-involved/volunteer" },
  { subcat: "Civic & Democracy" },
  { name: "TurboVote — Voter Registration", url: "https://turbovote.org" },
  { name: "Vote.org — Civic Action", url: "https://www.vote.org" },
  { name: "Democracy Works", url: "https://www.democracy.works" },
  { name: "League of Women Voters — Volunteer", url: "https://www.lwv.org/get-involved/volunteer" },
  { name: "Rock the Vote — Youth Civic Engagement", url: "https://www.rockthevote.org" },
  { name: "Common Cause — Democracy Reform", url: "https://www.commoncause.org/take-action" },
  { name: "Amnesty International — Activism", url: "https://www.amnesty.org/en/get-involved/take-action" },
  { name: "Human Rights Campaign — Volunteer", url: "https://www.hrc.org/get-involved/volunteer" },
  { name: "ACLU — Volunteer Programs", url: "https://www.aclu.org/about/volunteer" },
  { name: "NAACP — Local Chapter Volunteering", url: "https://www.naacp.org/find-local-chapter" },
  { subcat: "Virtual & Remote Volunteering" },
  { name: "UN Online Volunteering Platform", url: "https://www.onlinevolunteering.org" },
  { name: "VolunteerMatch — Virtual Opportunities", url: "https://www.volunteermatch.org/search/virtual-volunteer-opportunities.jsp" },
  { name: "Crisis Text Line — Remote Volunteer", url: "https://www.crisistextline.org/volunteer" },
  { name: "Translators Without Borders", url: "https://www.translatorswithoutborders.org/get-involved/volunteer" },
  { name: "Library of Congress — Digital Transcription", url: "https://www.loc.gov/conservation/heritage-volunteers" },
  { name: "Zooniverse — Citizen Science Projects", url: "https://www.zooniverse.org/get-involved" },
  { name: "SciStarter — Citizen Science Finder", url: "https://scistarter.org" },
  { name: "Wikipedia — Free Knowledge Volunteering", url: "https://en.wikipedia.org/wiki/Wikipedia:Volunteering" },
  { name: "Open Source Contributions — GitHub", url: "https://github.com/explore" },
  { name: "Code for America — Civic Tech Volunteering", url: "https://codeforamerica.org/programs/volunteer-brigade" },
  { name: "Code.org — CS Education Volunteer", url: "https://code.org/volunteer" },
  { name: "Girls Who Code — Volunteer Educator", url: "https://girlswhocode.com/volunteer" },
  { name: "Black Girls Code — Mentor", url: "https://wearebgc.org/volunteer" },
  { name: "Khan Academy — Content Volunteer", url: "https://www.khanacademy.org/volunteering" },
];

// ─── Research & Journals ──────────────────────────────────────────────────────

const RESEARCH_JOURNALS: MaybeSubcat[] = [
  { subcat: "Open Access Journals" },
  { name: "DOAJ — Directory of Open Access Journals", url: "https://doaj.org" },
  { name: "PubMed Central (PMC) — NIH Full Text", url: "https://pmc.ncbi.nlm.nih.gov" },
  { name: "PubMed — Biomedical Citations & Abstracts", url: "https://pubmed.ncbi.nlm.nih.gov" },
  { name: "BioMed Central — Life Sciences Journals", url: "https://www.biomedcentral.com" },
  { name: "PLOS ONE — Peer-Reviewed Open Access", url: "https://journals.plos.org/plosone" },
  { name: "Europe PMC — Biomedical Literature", url: "https://europepmc.org" },
  { subcat: "Preprint & Paper Repositories" },
  { name: "arXiv — Physics, Math, CS, Econ", url: "https://arxiv.org" },
  { name: "SSRN — Social Science Research Network", url: "https://www.ssrn.com" },
  { name: "Zenodo — All-Disciplines Repository", url: "https://zenodo.org" },
  { name: "CORE — Open Access Paper Aggregator", url: "https://core.ac.uk" },
  { name: "SocArXiv — Social Sciences Preprints", url: "https://osf.io/preprints/socarxiv" },
  { name: "FigShare — Research Data & Figures", url: "https://figshare.com" },
  { name: "Research Square — Preprint Platform", url: "https://www.researchsquare.com" },
  { subcat: "Academic Search Engines" },
  { name: "Google Scholar", url: "https://scholar.google.com" },
  { name: "Semantic Scholar — AI-Powered Search", url: "https://www.semanticscholar.org" },
  { name: "OpenAlex — Open Research Index (250M+)", url: "https://openalex.org" },
  { name: "BASE — Bielefeld Academic Search Engine", url: "https://www.base-search.net" },
  { name: "Unpaywall — Legal Free Paper Access", url: "https://unpaywall.org" },
  { subcat: "Health & Evidence-Based Medicine" },
  { name: "Cochrane Library — Gold Standard Systematic Reviews", url: "https://www.cochranelibrary.com" },
  { name: "Science Based Medicine — Critical Analysis", url: "https://sciencebasedmedicine.org" },
  { name: "ScienceDaily — Research News Digest", url: "https://www.sciencedaily.com" },
  { name: "TRIP Database — Evidence-Based Practice", url: "https://www.tripdatabase.com" },
  { subcat: "AI-Assisted Research Tools" },
  { name: "Elicit — AI Research Assistant", url: "https://elicit.com" },
  { name: "Consensus — AI Citation Search", url: "https://consensus.app" },
  { name: "Connected Papers — Research Graph", url: "https://www.connectedpapers.com" },
  { name: "Litmaps — Citation Network Visualization", url: "https://www.litmaps.com" },
  { subcat: "Academic News & Publishing" },
  { name: "The Conversation — US (Academics Write for Public)", url: "https://theconversation.com/us" },
  { name: "The Conversation — Global Edition", url: "https://theconversation.com/global" },
  { name: "Science News — Research Coverage", url: "https://www.sciencenews.org" },
  { name: "Nature News & Comment", url: "https://www.nature.com/news" },
  { name: "Science Magazine News", url: "https://www.science.org/news" },
];

const RESEARCH_JOURNALS_ADMIN: MaybeSubcat[] = [
  { subcat: "Policy & Regulatory Research" },
  { name: "Brookings Institution — Policy Research", url: "https://www.brookings.edu" },
  { name: "CSIS — Center for Strategic & International Studies", url: "https://www.csis.org" },
  { name: "International Crisis Group", url: "https://www.crisisgroup.org" },
  { name: "Lawfare Media — National Security & Law", url: "https://www.lawfaremedia.org" },
  { name: "SSRN — Law, Finance & Economics Papers", url: "https://www.ssrn.com" },
  { name: "GovInfo — U.S. Government Publications", url: "https://www.govinfo.gov" },
  { name: "ERIC — Education Research (Dept. of Education)", url: "https://eric.ed.gov" },
  { subcat: "Open Access Journals" },
  { name: "DOAJ — Directory of Open Access Journals", url: "https://doaj.org" },
  { name: "PubMed Central (PMC)", url: "https://pmc.ncbi.nlm.nih.gov" },
  { name: "CORE — Open Access Aggregator", url: "https://core.ac.uk" },
  { name: "OpenAlex — Comprehensive Research Index", url: "https://openalex.org" },
  { name: "The Conversation — US (Expert Analysis)", url: "https://theconversation.com/us" },
  { name: "The Conversation — Global", url: "https://theconversation.com/global" },
  { subcat: "Academic Search Tools" },
  { name: "Google Scholar", url: "https://scholar.google.com" },
  { name: "Semantic Scholar — AI-Powered Discovery", url: "https://www.semanticscholar.org" },
  { name: "BASE — Bielefeld Academic Search Engine", url: "https://www.base-search.net" },
  { name: "Zenodo — Research Data Repository", url: "https://zenodo.org" },
  { subcat: "Health & Evidence" },
  { name: "Cochrane Library — Systematic Reviews", url: "https://www.cochranelibrary.com" },
  { name: "Science Based Medicine", url: "https://sciencebasedmedicine.org" },
  { name: "PubMed — Biomedical Literature", url: "https://pubmed.ncbi.nlm.nih.gov" },
];

// ─── Validated Independent Resources ──────────────────────────────────────────

const INDEPENDENT_RESOURCES_STUDENT: MaybeSubcat[] = [
  { subcat: "Investigative Journalism" },
  { name: "ProPublica — Nonprofit Investigative Journalism", url: "https://www.propublica.org" },
  { name: "ICIJ — International Consortium of Investigative Journalists", url: "https://www.icij.org" },
  { name: "Reveal — Center for Investigative Reporting", url: "https://www.revealnews.org" },
  { name: "The Markup — Tech Accountability Reporting", url: "https://themarkup.org" },
  { subcat: "Policy & Strategic Analysis" },
  { name: "Brookings Institution — Independent Policy Research", url: "https://www.brookings.edu" },
  { name: "Lawfare Media — National Security Law & Policy", url: "https://www.lawfaremedia.org" },
  { name: "CSIS — Center for Strategic & International Studies", url: "https://www.csis.org" },
  { name: "International Crisis Group — Conflict Analysis", url: "https://www.crisisgroup.org" },
  { name: "OpenSecrets — Money in Politics (CRP)", url: "https://www.opensecrets.org" },
  { subcat: "Fact-Checking" },
  { name: "FactCheck.org — Annenberg Public Policy Center", url: "https://www.factcheck.org" },
  { name: "PolitiFact — Pulitzer Prize-Winning Fact-Checker", url: "https://www.politifact.com" },
  { name: "Snopes — Fact-Checking Since 1994", url: "https://www.snopes.com" },
  { name: "AP Fact Check", url: "https://apnews.com/hub/ap-fact-check" },
  { name: "Reuters Fact Check", url: "https://www.reuters.com/fact-check" },
  { subcat: "Science & Health (Evidence-Based)" },
  { name: "Science Based Medicine — Critical Analysis", url: "https://sciencebasedmedicine.org" },
  { name: "The Conversation — US (Academic Writers)", url: "https://theconversation.com/us" },
  { name: "The Conversation — Global Edition", url: "https://theconversation.com/global" },
  { name: "Cochrane Library — Medical Evidence Reviews", url: "https://www.cochranelibrary.com" },
  { name: "ScienceDaily — University Research News", url: "https://www.sciencedaily.com" },
  { name: "Science News — Research Journalism", url: "https://www.sciencenews.org" },
  { subcat: "Transparency & Accountability" },
  { name: "GovTrack — Congress Tracking", url: "https://www.govtrack.us" },
  { name: "PACER — Federal Court Records", url: "https://pacer.uscourts.gov" },
  { name: "FOIA.gov — Freedom of Information Requests", url: "https://www.foia.gov" },
  { name: "MuckRock — FOIA Requests & Documents", url: "https://www.muckrock.com" },
];

const INDEPENDENT_RESOURCES_ADMIN: MaybeSubcat[] = [
  { subcat: "Investigative & Accountability Journalism" },
  { name: "ProPublica — Nonprofit Investigative Journalism", url: "https://www.propublica.org" },
  { name: "ICIJ — International Investigative Journalism", url: "https://www.icij.org" },
  { name: "Reveal — Center for Investigative Reporting", url: "https://www.revealnews.org" },
  { name: "The Markup — Technology Accountability", url: "https://themarkup.org" },
  { subcat: "Policy, Law & Strategic Research" },
  { name: "Lawfare Media — National Security Law & Policy", url: "https://www.lawfaremedia.org" },
  { name: "Brookings Institution — Independent Policy Research", url: "https://www.brookings.edu" },
  { name: "CSIS — Center for Strategic & International Studies", url: "https://www.csis.org" },
  { name: "International Crisis Group — Conflict Prevention", url: "https://www.crisisgroup.org" },
  { name: "OpenSecrets — Money in U.S. Politics", url: "https://www.opensecrets.org" },
  { subcat: "Fact-Checking & Verification" },
  { name: "FactCheck.org — Annenberg/UPenn", url: "https://www.factcheck.org" },
  { name: "PolitiFact — Truth-O-Meter", url: "https://www.politifact.com" },
  { name: "Snopes — Claims Verification", url: "https://www.snopes.com" },
  { name: "AP Fact Check", url: "https://apnews.com/hub/ap-fact-check" },
  { name: "Reuters Fact Check", url: "https://www.reuters.com/fact-check" },
  { subcat: "Science, Health & Evidence" },
  { name: "Science Based Medicine", url: "https://sciencebasedmedicine.org" },
  { name: "The Conversation — US (Expert Commentary)", url: "https://theconversation.com/us" },
  { name: "The Conversation — Global", url: "https://theconversation.com/global" },
  { name: "Cochrane Library — Systematic Evidence Reviews", url: "https://www.cochranelibrary.com" },
  { subcat: "Government Transparency" },
  { name: "GovTrack — U.S. Congress Tracker", url: "https://www.govtrack.us" },
  { name: "FOIA.gov — Federal FOIA Portal", url: "https://www.foia.gov" },
  { name: "MuckRock — FOIA Requests & Public Records", url: "https://www.muckrock.com" },
  { name: "USASpending.gov — Federal Spending Transparency", url: "https://www.usaspending.gov" },
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
      { text: "Get a personalized educational and career plan built around your goals, major, and life situation.", prompt: "Help me build a personalized educational and career plan. Ask me about my current academic level, major or field of interest, career goals, timeline, financial situation, and anything else that matters. Then create a step-by-step plan covering course selection, certifications, internships, and career milestones." },
      { text: "Build a professional resume tailored to your experience, education, and target jobs.", prompt: "Help me build a strong, professional resume. Ask me about my education, work experience, skills, extracurriculars, and the types of positions or scholarships I am targeting. Then help me structure it professionally, write compelling bullet points, and tailor it to stand out." },
      { text: "Brainstorm ideas, outlines, and thesis angles for your next paper, essay, or report.", prompt: "Help me brainstorm for a paper, essay, or report. Ask me about the topic, assignment requirements, and any ideas I already have. Then help me develop a strong thesis, suggest angles I may not have considered, and build an outline I can work from." },
      { text: "Create a personalized academic calendar to stay on top of deadlines, exams, and goals.", prompt: "Help me create an academic calendar. Ask me about my current courses, assignment deadlines, exam dates, work schedule, and personal commitments. Then build me a structured semester calendar with study blocks, key deadlines, and reminders that keep me on track." },
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
      { text: "Share your child's grades, interests, and background so I can build a personalized career and educational plan just for them.", prompt: "I want you to help me build a personalized career and educational plan for my child. Please ask me everything you need — their grades, GPA, report card highlights, interests, hobbies, clubs, sports, subjects they enjoy or struggle with, learning style, personal strengths, any challenges, and any other background details. Then use everything I share to create an estimated career and educational plan tailored specifically to my child." },
      { text: "Get a detailed educational roadmap for your child from high school through college graduation.", prompt: "Help me create a detailed educational plan for my child starting from high school through college graduation. Include recommended course paths by grade level, extracurricular activities that build college readiness, a FAFSA preparation timeline, college selection criteria, and a year-by-year action plan with milestones." },
      { text: "Discover which careers may best fit your child based on their strengths, interests, and personality.", prompt: "Based on what I share about my child — grades, interests, strengths, personality, and background — help me identify careers that may be the best fit for them. Explain why each career aligns with their profile and what educational path leads there." },
      { text: "Develop a step-by-step career plan for your child from today through their first professional role.", prompt: "Help me develop a full career plan for my child. Include short-term goals for high school, mid-term goals for college and internships, and long-term goals for their first job and career advancement. Factor in their interests, academic strengths, and the student aid resources available to help fund the path." },
      { text: "Learn what to do if your child's financial aid offer is lower than expected — and how to appeal.", prompt: "My child received a financial aid offer that seems lower than expected. What are the steps to appeal the award, what documentation should we gather, and what language is most effective in a professional judgment appeal?" },
      { text: "Understand the impact of untaxed income, assets, and trusts on your child's aid eligibility.", prompt: "How do untaxed income, retirement assets, business equity, and trust funds affect my child's financial aid eligibility on the FAFSA and CSS Profile?" },
      { text: "Build a college cost comparison table for every school your child is considering.", prompt: "Help me compare the total cost of attendance across all schools my child is considering. Ask me for each school's tuition, room and board, fees, and financial aid awards, then build a clear comparison showing net price and estimated 4-year total for each." },
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
      { text: "Get clear answers to a specific student aid concern, case scenario, or compliance situation.", prompt: "I have a student aid concern or situation I need help with. Please ask me for all the details — the student's circumstances, type of aid involved, institutional policies, and any relevant background. Then help me determine the appropriate course of action, cite the relevant regulation, and explain my options." },
      { text: "Build an Excel spreadsheet for student aid tracking, reporting, or analysis.", prompt: "Help me build an Excel-compatible spreadsheet for student aid administration. Ask me what I need it for — R2T4 tracking, SAP monitoring, award reconciliation, disbursement reporting, verification status, or another use case. Then generate a fully structured spreadsheet with column headers, sample formulas, and data rows I can paste directly into Excel." },
      { text: "Draft a professional email for any student aid or office communication.", prompt: "Help me draft a professional email for my student aid office. Ask me: Who is the recipient — student, parent, Department of Education, accreditor, or colleague? What is the purpose — award notification, appeal decision, compliance notice, meeting request, or policy clarification? Any key details or tone preferences? Then draft a clear, professional email I can use or adapt." },
      { text: "Walk through the professional judgment process for dependency overrides and special circumstances.", prompt: "Walk me through the professional judgment process for dependency overrides and special circumstances — what documentation is required, what the regulatory basis is, and how to document the decision file correctly." },
      { text: "Understand the aggregate and annual loan limits for every aid year and student classification.", prompt: "What are the current annual and aggregate Stafford loan limits for dependent and independent students at every classification level, and how do they change for graduate students and PLUS borrowers?" },
      { text: "Review the verification process from trigger to resolution — required documents and tolerances.", prompt: "Walk me through the complete verification process — what triggers selection, what documents are required for each tracking group, what tolerances apply, and how corrections are submitted to FAFSA." },
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
      { text: "Build an Excel spreadsheet for student aid leadership reporting, budgeting, or program analysis.", prompt: "Help me build an Excel spreadsheet for student aid leadership. Ask me what type of report I need — executive dashboard, CDR trend analysis, Pell disbursement tracking, R2T4 returns, SAP evaluation rates, net tuition revenue, or something else. Then generate a complete Excel-compatible spreadsheet with formulas, headers, and sample data." },
      { text: "Navigate a student aid concern or interpersonal situation in your FA office.", prompt: "I am dealing with a student aid concern or a situation involving my FA office team. Please ask me for the details — what happened, who is involved, what policies apply, and what outcome I am hoping for. Then help me determine the best course of action as a leader, including communication strategies and any regulatory considerations." },
      { text: "Develop a work environment that drives motivation, efficiency, and productivity in your FA office.", prompt: "Help me develop a work environment in my student aid office that fosters motivation, efficiency, and productivity. Ask me about my current team size, culture challenges, workflow bottlenecks, and goals. Then provide a practical framework with leadership strategies, team-building approaches, and process improvements tailored to a student aid office." },
      { text: "Draft a professional leadership email for staff, administration, or external stakeholders.", prompt: "Help me draft a professional leadership email. Ask me: Who is the audience — staff, executive team, Department of Education, accreditor, board member, or community partner? What is the message — policy update, performance feedback, compliance notice, strategic initiative, or meeting agenda? Any tone or detail considerations? Then draft a polished email I can send or adapt." },
      { text: "Get clear guidance on an audit concern, finding, or compliance risk facing your institution.", prompt: "I have an audit concern or compliance risk I need guidance on. Please ask me for the details — the finding or potential issue, the program area involved such as R2T4, verification, SAP, 90/10, or gainful employment, any ED or OIG involvement, and the institutional context. Then help me understand the regulatory basis, the risk level, and the recommended corrective steps." },
    ],
  },
  {
    role: "Compliance/Auditor",
    icon: ShieldCheck,
    gradient: "from-rose-500 to-pink-600",
    accent: "bg-rose-500/15 ring-rose-500/25",
    tips: [
      { text: "Generate GAGAS-format finding documentation templates for any Title IV program area.", prompt: "Generate a GAGAS-format finding documentation template for an R2T4 compliance finding with criteria, condition, cause, effect, and recommendation." },
      { text: "Get detailed testing attribute checklists for R2T4, verification, and Pell accuracy.", prompt: "Give me a complete testing attribute checklist for auditing R2T4 calculations including all key items to verify." },
      { text: "Review common OIG audit findings and root cause patterns by program area.", prompt: "What are the most frequent OIG audit findings in financial aid and what root causes are typically identified?" },
      { text: "Look up the exact 34 CFR citations relevant to a specific compliance issue.", prompt: "What are the specific 34 CFR regulatory citations I should reference when auditing Return to Title IV compliance?" },
      { text: "Build a program review preparation checklist aligned to the ED program review guide.", prompt: "Create a comprehensive program review preparation checklist aligned to the Department of Education's program review procedures." },
      { text: "Get a plain-English explanation of any federal student aid rule or regulation.", prompt: "Help me understand a specific federal student aid rule or regulation. Ask me which rule, section, or 34 CFR citation I need clarified. Then explain it in plain English — what it requires, who it applies to, what compliance looks like, and what common violations occur." },
      { text: "Get step-by-step guidance on how to handle a specific audit situation or finding.", prompt: "I am working through an audit situation and need guidance. Ask me for the details — the program area, what was found, the population tested, the error rate, and what evidence exists. Then help me determine the appropriate audit approach, the applicable GAGAS standards, the relevant regulatory citations, and the recommended finding format or corrective action steps." },
      { text: "Understand exactly why a situation violated a federal rule and build a clear, defensible explanation.", prompt: "Help me explain why a specific situation violated a federal rule or regulation. Ask me to describe the situation, what the institution did or failed to do, and the regulatory area involved. Then give me a clear, well-reasoned explanation — including the specific 34 CFR citation, the element of the rule that was violated, and language I can use in a formal finding or written report." },
      { text: "Draft a professional audit email — to an institution, ED, or internal stakeholder.", prompt: "Help me draft a professional audit-related email. Ask me: Who is the recipient — auditee institution, Department of Education, OIG, internal team, or legal counsel? What is the purpose — exit conference notice, draft finding transmittal, document request, follow-up on corrective action, or management response feedback? Any specific tone or regulatory context? Then draft a clear, professional email appropriate for the audit setting." },
    ],
  },
];

const ROLE_OPTIONS = [
  { label: "Student",       icon: GraduationCap,  color: "text-sky-400",    ring: "ring-sky-500/40",    bg: "bg-sky-500/15"    },
  { label: "Parent",        icon: Users,          color: "text-blue-400",   ring: "ring-blue-500/40",   bg: "bg-blue-500/15"   },
  { label: "Administrator", icon: ClipboardList,  color: "text-emerald-400",ring: "ring-emerald-500/40",bg: "bg-emerald-500/15"},
  { label: "Leader",        icon: Landmark,       color: "text-violet-400", ring: "ring-violet-500/40", bg: "bg-violet-500/15" },
  { label: "Compliance/Auditor", icon: ShieldCheck, color: "text-rose-400",   ring: "ring-rose-500/40",   bg: "bg-rose-500/15"   },
];


// ─── Background ───────────────────────────────────────────────────────────────

function EducationalBackground({ isDark = true, guidanceActive = false }: { isDark?: boolean; guidanceActive?: boolean }) {
  // Make html/body transparent so the fixed -z-10 background is visible
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = "transparent";
    body.style.background = "transparent";
    return () => {
      html.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, []);

  const darkParticles = [
    { top: "15%", left: "22%", size: 4, dur: "3.2s", delay: "0s" },
    { top: "68%", left: "8%",  size: 3, dur: "4.1s", delay: "0.7s" },
    { top: "42%", left: "78%", size: 5, dur: "3.7s", delay: "1.4s" },
    { top: "82%", left: "55%", size: 3, dur: "2.9s", delay: "0.3s" },
    { top: "28%", left: "91%", size: 4, dur: "4.5s", delay: "1.9s" },
    { top: "55%", left: "44%", size: 3, dur: "3.5s", delay: "0.9s" },
  ];

  if (!isDark) {
    // Bright mode — polished premium beige
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {/* Warm beige base */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #f5f0e8 0%, #faf6ef 30%, #f0ead8 60%, #e8e0cc 100%)" }} />
        {/* Warm sheen at top — gives depth like fine linen */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,252,240,0.65) 0%, transparent 60%)" }} />
        {/* Subtle warm shadow at bottom-right */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 85% 100%, rgba(200,185,155,0.30) 0%, transparent 60%)" }} />
      </div>
    );
  }

  // Rich background images — desktop / mobile
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <img src="/images/desktop-bg.jpg" alt="" className="hidden md:block w-full h-full object-cover object-center" />
      <img src="/images/mobile-bg.jpg"  alt="" className="block md:hidden w-full h-full object-cover object-center" />
      {/* Unified dark veil for text legibility across all overlaid cards */}
      <div className="absolute inset-0" style={{ background: "rgba(5,2,14,0.48)" }} />
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

// ─── Voice picker — prefers warm, natural female voices ──────────────────────

const PREFERRED_VOICES = [
  // Microsoft Neural Online (Edge/Windows) — closest to natural human speech
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Michelle Online (Natural) - English (United States)",
  "Microsoft Monica Online (Natural) - English (United States)",
  "Microsoft Sonia Online (Natural) - English (United Kingdom)",
  "Microsoft Libby Online (Natural) - English (United Kingdom)",
  // Google Neural (Chrome)
  "Google US English",
  // macOS / iOS
  "Samantha",
  "Karen",
  "Victoria",
  "Moira",
];

// Cache resolved voice — avoids re-scanning the voice list on every speak call.
// `undefined` = not yet resolved; `null` = resolved but no match found.
let _cachedVoice: SpeechSynthesisVoice | null | undefined = undefined;

async function pickCalmFemaleVoice(): Promise<SpeechSynthesisVoice | null> {
  if (_cachedVoice !== undefined) return _cachedVoice;
  if (typeof window === "undefined" || !window.speechSynthesis) { return null; }
  let voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    await new Promise<void>((resolve) => {
      const handler = () => resolve();
      window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
      setTimeout(resolve, 2000);
    });
    voices = window.speechSynthesis.getVoices();
  }
  // 1. Exact preferred name match
  for (const name of PREFERRED_VOICES) {
    const v = voices.find((v) => v.name === name);
    if (v) { _cachedVoice = v; return v; }
  }
  // 2. Any Microsoft Online/Natural English voice (avoid Desktop which is robotic)
  const msOnline = voices.find(
    (v) => v.name.includes("Microsoft") && (v.name.includes("Online") || v.name.includes("Natural")) && v.lang.startsWith("en")
  );
  if (msOnline) { _cachedVoice = msOnline; return msOnline; }
  // 3. Any Google English voice
  const googleEn = voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en"));
  if (googleEn) { _cachedVoice = googleEn; return googleEn; }
  // 4. Any non-Desktop en-US voice (Desktop voices are robotic; skip them)
  const nonDesktop = voices.find((v) => v.lang === "en-US" && !v.name.includes("Desktop"));
  if (nonDesktop) { _cachedVoice = nonDesktop; return nonDesktop; }
  // 5. Any en-US voice as last resort — do NOT cache null so we retry on next call
  const any = voices.find((v) => v.lang.startsWith("en")) ?? null;
  if (any) { _cachedVoice = any; }
  // Don't cache null — retry next time voices may be loaded
  return any;
}

// ─── Streaming text renderer ──────────────────────────────────────────────────

function StreamingContent({
  content,
  msgId,
  streamingMsgId,
  isStreaming,
  className,
}: {
  content: string;
  msgId: string;
  streamingMsgId: string | null;
  isStreaming: boolean;
  className: string;
}) {
  const [chunks, setChunks] = useState<{ id: number; text: string }[]>([]);
  const prevLenRef = useRef(0);
  const chunkIdRef = useRef(0);
  const activelyStreaming = isStreaming && msgId === streamingMsgId;

  useEffect(() => {
    if (!activelyStreaming) return;
    const newText = content.slice(prevLenRef.current);
    if (!newText) return;
    prevLenRef.current = content.length;
    setChunks(prev => [...prev, { id: chunkIdRef.current++, text: newText }]);
  }, [content, activelyStreaming]);

  useEffect(() => {
    if (!activelyStreaming) {
      setChunks([]);
      prevLenRef.current = 0;
    }
  }, [activelyStreaming]);

  if (!activelyStreaming) {
    return <MarkdownRenderer content={content} className={className} />;
  }

  return (
    <div className={`text-sm leading-relaxed whitespace-pre-wrap text-white/85`}>
      {chunks.map(chunk => (
        <span key={chunk.id} className="stream-chunk">{chunk.text}</span>
      ))}
    </div>
  );
}

// ─── Pre-computed constants (evaluated once at module load) ───────────────────

const QA_STUDENTS_ITEMS  = QUICK_ACTIONS_BY_ROLE.find(x => x.role === "Students")?.items ?? [];
const QA_PARENTS_ITEMS   = QUICK_ACTIONS_BY_ROLE.find(x => x.role === "Parents")?.items ?? [];
const QA_ADMINS_ITEMS    = QUICK_ACTIONS_BY_ROLE.find(x => x.role === "Administrators")?.items ?? [];
const QA_LEADERS_ITEMS   = QUICK_ACTIONS_BY_ROLE.find(x => x.role === "Leaders")?.items ?? [];
const QA_AUDITORS_ITEMS  = QUICK_ACTIONS_BY_ROLE.find(x => x.role === "Auditors")?.items ?? [];

const RESUME_LINKS_TOP8 = ([...RESUME_ASSISTANCE, ...RESUME_ASSISTANCE_MORE] as MaybeSubcat[])
  .filter((i): i is LinkItem => !isSubcat(i)).slice(0, 8);
const SCHOLARSHIP_LINKS_TOP8 = ([...SCHOLARSHIP_ENGINES, ...SCHOLARSHIP_ENGINES_MORE] as MaybeSubcat[])
  .filter((i): i is LinkItem => !isSubcat(i)).slice(0, 8);
const MENTAL_HEALTH_ADMIN_TOP8  = MENTAL_HEALTH_ADMIN.slice(0, 8);
const VOLUNTEER_ADMIN_TOP8      = VOLUNTEER_ADMIN.slice(0, 8);

const ROLE_COLOR_MAP: Record<string, { active: string; inactive: string }> = {
  Student:       { active: "bg-indigo-600/70 text-white ring-indigo-400/50 shadow-indigo-900/30",      inactive: "text-indigo-300/55 hover:text-indigo-200 hover:bg-indigo-500/[0.10] ring-[#D4AF37]/[0.12]" },
  Parent:        { active: "bg-blue-600/70 text-white ring-blue-400/50 shadow-blue-900/30",           inactive: "text-blue-300/55 hover:text-blue-200 hover:bg-blue-500/[0.10] ring-[#D4AF37]/[0.12]" },
  Administrator: { active: "bg-emerald-600/70 text-white ring-emerald-400/50 shadow-emerald-900/30",  inactive: "text-emerald-300/55 hover:text-emerald-200 hover:bg-emerald-500/[0.10] ring-[#D4AF37]/[0.12]" },
  Leader:        { active: "bg-violet-600/70 text-white ring-violet-400/50 shadow-violet-900/30",     inactive: "text-violet-300/55 hover:text-violet-200 hover:bg-violet-500/[0.10] ring-[#D4AF37]/[0.12]" },
  "Compliance/Auditor": { active: "bg-rose-600/70 text-white ring-rose-400/50 shadow-rose-900/30", inactive: "text-rose-300/55 hover:text-rose-200 hover:bg-rose-500/[0.10] ring-[#D4AF37]/[0.12]" },
};
const ROLE_COLOR_FALLBACK = { active: "bg-cyan-600/80 text-white ring-[#D4AF37]/45 shadow-black/30", inactive: "bg-white/[0.05] text-cyan-200/45 hover:text-cyan-100/80 hover:bg-cyan-500/[0.08] ring-[#D4AF37]/[0.15]" };

// ─── Site tile helpers (crisp icon tiles, no blurry favicons) ────────────────

function getSiteIcon(url: string) {
  const h = url.toLowerCase();
  if (/\.gov|studentaid|fafsa|govinfo|whitehouse|congress\.gov/.test(h)) return Landmark;
  if (/irs\.gov|tax|receipt/.test(h)) return Receipt;
  if (/scholar|pubmed|arxiv|doaj|cochrane|semantic|zenodo|figshare|core\.ac|ssrn|socarxiv|openalex|base-search|europepmc|plos|biomedcentral|researchsquare|litmaps|connectedpapers|elicit|consensus/.test(h)) return BookOpen;
  if (/linkedin|indeed|monster|glassdoor|career|internship|ziprecruiter|handshake|simplyhired|zippia|lever|greenhouse/.test(h)) return Briefcase;
  if (/scholarship|fastweb|niche|petersons|bold\.org|scholarships\.com|collegeboard|unigo/.test(h)) return Award;
  if (/health|mental|crisis|wellbeing|nami|samhsa|nimh|jed|active.minds|talkspace|betterhelp|headspace|calm\.com|crisistextline/.test(h)) return Sparkles;
  if (/openai|anthropic|hugging|deeplearn|kaggle|elementsofai|fast\.ai|nvidia|cohere|perplexity|notebooklm|alignmentforum|lesswrong|aisafety/.test(h)) return Zap;
  if (/law|legal|court|pacer|uscourts|lawfare|findlaw|justia|gavel|aclu|naacp/.test(h)) return Scale;
  if (/propublica|icij|reveal|markup|factcheck|politifact|snopes|reuters|apnews|brookings|csis|crisisgroup|sciencebasedmedicine|theconversation|sciencenews|sciencedaily|nature\.com|science\.org/.test(h)) return FileText;
  if (/volunteer|americorps|redcross|habitat|idealist|volunteermatch|peacecorps|catchafire/.test(h)) return Users;
  if (/va\.gov|veteran|military|ebenefits|myhealth\.va/.test(h)) return ShieldCheck;
  if (/sallie|sofi|earnest|college.ave|navient|discover|credible|lendkey|ascent/.test(h)) return PiggyBank;
  if (/investopedia|khanacademy|cfpb|consumer|nfcc|bettermoneyhabits|mint\.intuit|nerdwallet/.test(h)) return TrendingUp;
  if (/foia|muckrock|govtrack|usaspending|opensecrets|pacer/.test(h)) return Search;
  return ExternalLink;
}

const _SITE_GRADIENTS: [string, string][] = [
  ["#3730a3", "#4f46e5"], // indigo
  ["#0369a1", "#0891b2"], // sky→cyan
  ["#047857", "#0d9488"], // emerald→teal
  ["#6d28d9", "#7c3aed"], // violet
  ["#0f766e", "#0891b2"], // teal→cyan
  ["#1d4ed8", "#2563eb"], // blue
  ["#065f46", "#047857"], // dark emerald
  ["#1e3a5f", "#1d4ed8"], // navy→blue
];

function getSiteGradient(hostname: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) hash = ((hash << 5) - hash) + hostname.charCodeAt(i);
  return _SITE_GRADIENTS[Math.abs(hash) % _SITE_GRADIENTS.length];
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
  const desktopChatScrollRef = useRef<HTMLDivElement>(null);
  const desktopBottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const [orbDriftX, setOrbDriftX] = useState(0);
  const [orbScrollY, setOrbScrollY] = useState(0);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const ttsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showMobileLeft, setShowMobileLeft] = useState(false);
  const [showMobileRight, setShowMobileRight] = useState(false);
  const leftPanelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightPanelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [orbGlowing, setOrbGlowing] = useState(false);
  const [mobileOrbExpanded, setMobileOrbExpanded] = useState(false);
  const [mobileOrbRoaming, setMobileOrbRoaming] = useState(false);
  const [isDesktopOrb, setIsDesktopOrb] = useState(false);
  const [orbCelebrating, setOrbCelebrating] = useState(false);
  const orbGlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipsRef = useRef<HTMLDivElement>(null);
  const pcOrbRef = useRef<HTMLDivElement>(null);
  const [howItWorksActive, setHowItWorksActive] = useState<"role" | "chatbox" | "panels" | "guidance" | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useState(true);
  const GENIE_WELCOME = "Hi! Which role best describes you today? I can help with FAFSA questions, award letters, R2T4 calculations, and more.";
  const [welcomeTyped, setWelcomeTyped] = useState("");
  const [heroMuted, setHeroMuted] = useState(false);
  const heroVideoDesktopRef = useRef<HTMLVideoElement>(null);
  const heroVideoMobileRef = useRef<HTMLVideoElement>(null);
  // Daily rotation offset — shifts which tips appear first, updates each day
  const tipsRotationOffset = useMemo(() => Math.floor(Date.now() / 86400000), []);

  // Per-role color scheme for quick-action icon tiles
  const ROLE_TILE_COLORS: Record<string, { outerHover: string; focusRing: string; iconRing: string; hoverRing: string; iconBg: string; iconShadow: string; iconClass: string; dropShadow: string; hoverGlow: string }> = {
    Students:       { outerHover: "hover:bg-blue-500/[0.12]",    focusRing: "focus-visible:ring-blue-400",    iconRing: "ring-blue-400/[0.45]",    hoverRing: "group-hover:ring-blue-300/70",    iconBg: "linear-gradient(145deg, rgba(59,130,246,0.28) 0%, rgba(59,130,246,0.12) 100%)",    iconShadow: "0 2px 16px rgba(59,130,246,0.22), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.20)",    iconClass: "text-blue-300",    dropShadow: "drop-shadow-[0_0_8px_rgba(59,130,246,0.85)]",    hoverGlow: "group-hover:drop-shadow-[0_0_12px_rgba(96,165,250,1)]"    },
    Parents:        { outerHover: "hover:bg-orange-500/[0.12]",  focusRing: "focus-visible:ring-orange-400",  iconRing: "ring-orange-400/[0.45]",  hoverRing: "group-hover:ring-orange-300/70",  iconBg: "linear-gradient(145deg, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.12) 100%)",  iconShadow: "0 2px 16px rgba(249,115,22,0.22), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.20)",  iconClass: "text-orange-300",  dropShadow: "drop-shadow-[0_0_8px_rgba(249,115,22,0.85)]",  hoverGlow: "group-hover:drop-shadow-[0_0_12px_rgba(251,146,60,1)]"  },
    Administrators: { outerHover: "hover:bg-emerald-500/[0.12]", focusRing: "focus-visible:ring-emerald-400", iconRing: "ring-emerald-400/[0.45]", hoverRing: "group-hover:ring-emerald-300/70", iconBg: "linear-gradient(145deg, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0.12) 100%)", iconShadow: "0 2px 16px rgba(16,185,129,0.22), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.20)", iconClass: "text-emerald-300", dropShadow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.85)]", hoverGlow: "group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,1)]" },
    Leaders:        { outerHover: "hover:bg-violet-500/[0.12]",  focusRing: "focus-visible:ring-violet-400",  iconRing: "ring-violet-400/[0.45]",  hoverRing: "group-hover:ring-violet-300/70",  iconBg: "linear-gradient(145deg, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0.12) 100%)",  iconShadow: "0 2px 16px rgba(139,92,246,0.22), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.20)",  iconClass: "text-violet-300",  dropShadow: "drop-shadow-[0_0_8px_rgba(139,92,246,0.85)]",  hoverGlow: "group-hover:drop-shadow-[0_0_12px_rgba(167,139,250,1)]"  },
    Auditors:       { outerHover: "hover:bg-rose-500/[0.12]",    focusRing: "focus-visible:ring-rose-400",    iconRing: "ring-rose-400/[0.45]",    hoverRing: "group-hover:ring-rose-300/70",    iconBg: "linear-gradient(145deg, rgba(244,63,94,0.28) 0%, rgba(244,63,94,0.12) 100%)",    iconShadow: "0 2px 16px rgba(244,63,94,0.22), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.20)",    iconClass: "text-rose-300",    dropShadow: "drop-shadow-[0_0_8px_rgba(244,63,94,0.85)]",    hoverGlow: "group-hover:drop-shadow-[0_0_12px_rgba(251,113,133,1)]"    },
  };

  // Memoized state-dependent data slices
  const activeActionItems = useMemo(
    () => QUICK_ACTIONS_BY_ROLE.filter(r => r.role === activeActionRole),
    [activeActionRole]
  );
  const activeTipData = useMemo(
    () => ROLE_TIPS.find(r => r.role === activeRole) ?? null,
    [activeRole]
  );
  const rotatedTips = useMemo(() => {
    if (!activeTipData) return [];
    const { tips } = activeTipData;
    const offset = tipsRotationOffset % tips.length;
    return [...tips.slice(offset), ...tips.slice(0, offset)];
  }, [activeTipData, tipsRotationOffset]);
  const [showAppModal, setShowAppModal] = useState(false);
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
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});
  const [overlaySection, setOverlaySection] = useState<string | null>(null);
  const { upgradeState, openUpgrade, closeUpgrade } = useUpgradeModal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"signin" | "signup">("signin");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "bookmarked" | "pdfs">("all");
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [historyDeleteMode, setHistoryDeleteMode] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedPdfs, setSavedPdfs] = useState<SavedPdfEntry[]>([]);
  const roleSwipeX = useRef<number | null>(null);
  const todayKey = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const [introVisible, setIntroVisible] = useState(() => {
    try { return localStorage.getItem("genie-intro-date") !== todayKey(); } catch { return true; }
  });
  const [introFading, setIntroFading] = useState(false);

  const showIntro = useCallback(() => {
    setIntroFading(false);
    setIntroVisible(true);
  }, []);

  const dismissIntro = useCallback(() => {
    setIntroFading(true);
    try { localStorage.setItem("genie-intro-date", todayKey()); } catch {}
    setTimeout(() => { setIntroVisible(false); setIntroFading(false); }, 700);
  }, []);

  // Intro splash — auto-dismiss after 3.8s, or on keypress
  useEffect(() => {
    if (!introVisible) return;
    const timer = setTimeout(dismissIntro, 3800);
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Tab") dismissIntro(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(timer); window.removeEventListener("keydown", onKey); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introVisible]);

  // Typewriter animation for the Genie welcome message on page load
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setWelcomeTyped(GENIE_WELCOME.slice(0, i));
      if (i >= GENIE_WELCOME.length) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-load TTS voice so speakMessage can be called synchronously (required for
  // Safari / mobile browsers that block speechSynthesis outside a user gesture).
  useEffect(() => {
    pickCalmFemaleVoice().then(v => { voiceRef.current = v; });
  }, []);

  useEffect(() => {
    setHistory(loadHistory());
    setSavedPdfs(loadSavedPdfs());
    if (!localStorage.getItem("genie-terms-accepted")) setShowDisclaimer(true);
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

  const resetLeftTimer = () => {
    if (leftPanelTimerRef.current) clearTimeout(leftPanelTimerRef.current);
  };

  const resetRightTimer = () => {
    if (rightPanelTimerRef.current) clearTimeout(rightPanelTimerRef.current);
  };

  const triggerOrbGold = () => {
    setOrbGlowing(false);
    requestAnimationFrame(() => setOrbGlowing(true));
    if (orbGlowTimerRef.current) clearTimeout(orbGlowTimerRef.current);
    orbGlowTimerRef.current = setTimeout(() => setOrbGlowing(false), 1900);
  };

  useEffect(() => {
    return () => {
      if (leftPanelTimerRef.current) clearTimeout(leftPanelTimerRef.current);
      if (rightPanelTimerRef.current) clearTimeout(rightPanelTimerRef.current);
      if (orbGlowTimerRef.current) clearTimeout(orbGlowTimerRef.current);
    };
  }, []);

  // Track desktop vs mobile for orb
  useEffect(() => {
    const check = () => setIsDesktopOrb(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Start mobile orb roaming on first user interaction (desktop only)
  useEffect(() => {
    const startRoam = () => {
      if (window.innerWidth < 1024) return;
      setMobileOrbRoaming(true);
      window.removeEventListener("touchstart", startRoam, { capture: true });
      window.removeEventListener("click", startRoam, { capture: true });
      window.removeEventListener("keydown", startRoam, { capture: true });
      window.removeEventListener("scroll", startRoam, { capture: true });
    };
    window.addEventListener("touchstart", startRoam, { capture: true, passive: true });
    window.addEventListener("click", startRoam, { capture: true });
    window.addEventListener("keydown", startRoam, { capture: true });
    window.addEventListener("scroll", startRoam, { capture: true, passive: true });
    return () => {
      window.removeEventListener("touchstart", startRoam, { capture: true });
      window.removeEventListener("click", startRoam, { capture: true });
      window.removeEventListener("keydown", startRoam, { capture: true });
      window.removeEventListener("scroll", startRoam, { capture: true });
    };
  }, []);

  // PC orb: celebration dance → lazy mouse-follow
  useEffect(() => {
    if (!mobileOrbRoaming) return;
    const el = pcOrbRef.current;
    if (!el) return;

    // Capture current DOM position, switch from right→left coordinates
    const rect = el.getBoundingClientRect();
    const px = { v: rect.left };
    const py = { v: rect.top };
    // Target starts exactly at orb's position — no snap on first move
    const tx = { v: rect.left };
    const ty = { v: rect.top };

    el.style.right = "auto";
    el.style.transition = "none";
    el.style.left = px.v + "px";
    el.style.top  = py.v + "px";

    // Fire celebration
    setOrbCelebrating(true);
    const DANCE_MS = 1750;
    const celebTimer = setTimeout(() => setOrbCelebrating(false), DANCE_MS);

    let rafId = 0;
    let t = 0;
    const start = performance.now();

    const onMouse = (e: MouseEvent) => {
      tx.v = e.clientX - 88;
      ty.v = e.clientY - 88;
    };
    window.addEventListener("mousemove", onMouse);

    const loop = () => {
      const elapsed = performance.now() - start;
      if (elapsed < DANCE_MS) {
        // Hold position during dance; CSS class handles visuals
        el.style.left = px.v + "px";
        el.style.top  = py.v + "px";
      } else {
        t += 0.016;
        // Ease in: ramp lerp up over 1s so launch feels intentional, not jarring
        const easeIn = Math.min((elapsed - DANCE_MS) / 1000, 1);
        const lerp = 0.034 * easeIn;
        px.v += (tx.v - px.v) * lerp;
        py.v += (ty.v - py.v) * lerp;
        const sx = Math.sin(t * 0.62) * 11;
        const sy = Math.cos(t * 0.44) * 8;
        el.style.left = (px.v + sx) + "px";
        el.style.top  = (py.v + sy) + "px";
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(celebTimer);
      window.removeEventListener("mousemove", onMouse);
      cancelAnimationFrame(rafId);
    };
  }, [mobileOrbRoaming]);

  // Smart scroll: follow bottom only when user hasn't scrolled up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        userScrolledUpRef.current = distFromBottom > 80;
        // Orb scroll-companion: Y-follow + X-sway as user scrolls welcome state
        const scrollY = el.scrollTop;
        const maxOrbY = Math.min(scrollY * 0.75, el.scrollHeight - el.clientHeight - 20);
        setOrbScrollY(Math.max(0, maxOrbY));
        // X: blend drift-toward-scrollbar with a sinusoidal sway
        const driftProgress = Math.min(scrollY / 320, 1);
        const swayX = Math.sin(scrollY / 180) * 16;
        setOrbDriftX(driftProgress * 56 + swayX);
        rafId = 0;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    // Controlled scroll: 2 lines (64 px) per wheel notch
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollBy({ top: e.deltaY > 0 ? 64 : -64, behavior: "smooth" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      desktopBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Also scroll during streaming (new chunks arrive)
  useEffect(() => {
    if (isStreaming && !userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      desktopBottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isStreaming]);

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

  // Auto-dismiss How It Works highlight after 2.2 s
  useEffect(() => {
    if (!howItWorksActive) return;
    const t = setTimeout(() => setHowItWorksActive(null), 2800);
    return () => clearTimeout(t);
  }, [howItWorksActive]);

  // Shared role sync helper — keeps chatbox pill, "I am a…" grid, and Tips by Role in sync
  // chatboxLabel uses singular (Student/Parent/Administrator/Leader/Auditor)
  // actionRole uses plural (Students/…); tipsRole uses singular (same as chatboxLabel)
  const syncRoles = useCallback((chatboxLabel: string | null) => {
    setSelectedRole(chatboxLabel);
    if (chatboxLabel) {
      setActiveRole(chatboxLabel);
      setActiveActionRole((chatboxLabel + "s") as "Students" | "Parents" | "Administrators" | "Leaders" | "Auditors");
      // Open Quick Prompts accordion without scrolling
      setOpenAccordions(prev => { const n = new Set(prev); n.add("iam"); return n; });
    }
  }, []);

  const triggerBurst = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("button, a, [role='button']")) return;
    const id = Date.now() + Math.random();
    setBursts(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 700);
  }, []);

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
    showIntro();
    // If this tab was opened from another window (e.g. dashboard), close it
    // so the user returns to the original window automatically.
    if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
      window.close();
    }
  }, [showIntro]);

  const stopStreaming = () => {
    readerRef.current?.cancel();
    readerRef.current = null;
    setIsStreaming(false);
    setIsLoading(false);
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

    // ── Cache check: if same question answered within last 24 h, serve locally ──
    if (trimmed) {
      const normalized = trimmed.toLowerCase().replace(/\s+/g, " ").trim();
      const cached = history.find(h =>
        h.prompt.toLowerCase().replace(/\s+/g, " ").trim() === normalized &&
        Date.now() - h.ts < 24 * 60 * 60 * 1000
      );
      if (cached) {
        const age = Math.round((Date.now() - cached.ts) / 60000);
        const ageLabel = age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`;
        setIsLoading(false);
        setMessages(prev => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: `> 💾 *Cached answer from ${ageLabel} — no API call used. Open **History** to manage saved answers, or rephrase your question for a fresh response.*\n\n${cached.response}`,
          },
        ]);
        setDailyUsage(prev => prev ? { ...prev } : null); // no increment
        return;
      }
    }

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
      // Save Q&A to 30-day history
      if (trimmed && accumulatedContent && !accumulatedContent.startsWith("Sorry")) {
        const entry: HistoryEntry = { id: assistantId, ts: Date.now(), prompt: trimmed, response: accumulatedContent, role: selectedRole ?? undefined };
        setHistory(prev => {
          const updated = [entry, ...prev.slice(0, 499)];
          saveHistory(updated);
          return updated;
        });
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
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMsgId(null);
      readerRef.current = null;
    }
  };

  // Accordion shortcut: send message then scroll chat window into view
  const sendFromAccordion = (msg: string) => {
    sendMessage(msg);
    setTimeout(() => tipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
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
    triggerOrbGold();
  };

  const stopSpeaking = useCallback(() => {
    if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }
    ttsAbortRef.current?.abort(); ttsAbortRef.current = null;
    audioRef.current?.pause();
    if (audioRef.current) { URL.revokeObjectURL(audioRef.current.src); audioRef.current.src = ""; }
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
  }, []);

  const speakMessage = async (msgId: string, text: string) => {
    if (speakingMsgId === msgId) { stopSpeaking(); return; }
    stopSpeaking();
    setSpeakingMsgId(msgId);

    // Strip markdown/emojis for plain text (used by both Azure and fallback)
    const plain = text
      .replace(/```[\s\S]*?```/g, "code block omitted")
      .replace(/`[^`]*`/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/[*_~>|]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\p{Emoji_Presentation}/gu, "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();
    if (!plain) { setSpeakingMsgId(null); return; }

    // ── Azure Neural TTS ──────────────────────────────────────────────────────
    try {
      const abort = new AbortController();
      ttsAbortRef.current = abort;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain }),
        signal: abort.signal,
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        const done = () => { URL.revokeObjectURL(url); setSpeakingMsgId(null); };
        audio.onended = done;
        audio.onerror = done;
        await audio.play();
        return;
      }
      // 503 = key not configured → fall through to Web Speech
      if (res.status !== 503) console.warn(`[TTS] Azure returned ${res.status}`);
    } catch (e: any) {
      if (e?.name !== "AbortError") console.warn("[TTS] Azure fetch failed:", e);
    }

    // ── Web Speech API fallback ───────────────────────────────────────────────
    if (typeof window === "undefined" || !window.speechSynthesis) { setSpeakingMsgId(null); return; }
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang  = ttsLang;
    utterance.rate  = 1.05;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    if (voiceRef.current) utterance.voice = voiceRef.current;
    const cleanup = () => {
      if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }
      setSpeakingMsgId(null);
    };
    utterance.onend   = cleanup;
    utterance.onerror = cleanup;
    ttsTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
      else { clearInterval(ttsTimerRef.current!); ttsTimerRef.current = null; }
    }, 10000);
    window.speechSynthesis.speak(utterance);
  };

  const printMessage = (content: string, promptSnippet?: string) => {
    // Save a PDF record for the PDFs tab
    if (promptSnippet) {
      setSavedPdfs(prev => {
        const entry: SavedPdfEntry = { id: `pdf-${Date.now()}`, ts: Date.now(), prompt: promptSnippet, role: selectedRole ?? undefined };
        const updated = [entry, ...prev];
        savePdfs(updated);
        return updated;
      });
    }
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

  const bookmarkEntry = (msgId: string, content: string) => {
    setHistory(prev => {
      const updated = prev.map(e => e.id === msgId ? { ...e, bookmarked: true } : e);
      saveHistory(updated);
      return updated;
    });
    printMessage(content);
    setShowBookmarkToast(true);
    setTimeout(() => setShowBookmarkToast(false), 3500);
  };

  const deleteHistoryEntry = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveHistory(updated);
      return updated;
    });
    if (expandedHistoryId === id) setExpandedHistoryId(null);
  };

  const clearAllHistory = () => {
    setHistory([]);
    saveHistory([]);
    setExpandedHistoryId(null);
    setHistoryDeleteMode(false);
    setShowClearConfirm(false);
  };

  const isBusy = isLoading || isStreaming;

  // Shared message bubble list — rendered in both mobile inline view and desktop overlay
  const messageBubbles = messages.map((msg) => (
    <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {msg.role === "assistant" && (
        <div className="shrink-0 mt-1">
          <div className="p-1.5 rounded-xl" style={{ background: "rgba(212,175,55,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 0 14px rgba(212,175,55,0.40), 0 0 0 1px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
            <GenieBottle className="h-4 w-4 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 6px rgba(212,175,55,0.75))" }} />
          </div>
        </div>
      )}
      <div
        className={`relative ${msg.role === "user" ? "max-w-[72%] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed" : "max-w-[82%] px-5 py-4 rounded-2xl rounded-tl-sm"}`}
        style={msg.role === "user" ? {
          background: "rgba(99,102,241,0.28)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(139,92,246,0.40)",
          boxShadow: "0 4px 24px rgba(99,102,241,0.22), 0 1px 0 rgba(255,255,255,0.18) inset",
        } : {
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 4px 28px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.12) inset",
        }}
      >
        {msg.role === "user" ? (
          <div>
            {msg.senderRole && (() => { const opt = ROLE_OPTIONS.find(r => r.label === msg.senderRole); return (<span className={`inline-block text-[10px] font-bold uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded-md ring-1 ${opt?.color ?? "text-white/50"} ${opt?.bg ?? "bg-white/10"} ${opt?.ring ?? "ring-white/20"}`}>{msg.senderRole}</span>); })()}
            {msg.attachedFileName && (<div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-white/50"><Paperclip className="h-3 w-3 shrink-0" /><span className="truncate">{msg.attachedFileName}</span></div>)}
            <p>{msg.content}</p>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2" aria-label="AI-generated response">
              <Sparkles className="h-3 w-3 text-indigo-300/80" aria-hidden="true" />
              <span className="text-[10px] font-medium text-white/55 tracking-wide">AI-generated · Always verify with official sources</span>
            </div>
            <StreamingContent content={msg.content} msgId={msg.id} streamingMsgId={streamingMsgId} isStreaming={isStreaming} className="prose-invert text-sm text-white leading-relaxed" />
            {msg.id === streamingMsgId && isStreaming && (<span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom rounded-full" />)}
            {msg.content && !isStreaming && (
              <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/[0.06]">
                <button onClick={() => speakMessage(msg.id, msg.content)} title={speakingMsgId === msg.id ? "Stop reading" : "Read aloud"} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${speakingMsgId === msg.id ? "bg-cyan-500/[0.18] text-cyan-300 ring-1 ring-cyan-500/40" : "text-white/30 hover:text-cyan-300 hover:bg-cyan-500/[0.08]"}`}>
                  {speakingMsgId === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  {speakingMsgId === msg.id ? "Stop" : "Play"}
                </button>
                {(() => { const isBookmarked = history.some(e => e.id === msg.id && e.bookmarked); return (<button onClick={() => { if (!isBookmarked) bookmarkEntry(msg.id, msg.content); }} title={isBookmarked ? "Bookmarked — saved as PDF" : "Bookmark & save as PDF"} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${isBookmarked ? "text-amber-400 bg-amber-500/[0.10] ring-1 ring-amber-500/30 cursor-default" : "text-white/30 hover:text-amber-300 hover:bg-amber-500/[0.08]"}`}>{isBookmarked ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}{isBookmarked ? "Bookmarked" : "Bookmark"}</button>); })()}
                <button onClick={() => printMessage(msg.content)} title="Print / Save as PDF" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/30 hover:text-cyan-300 hover:bg-cyan-500/[0.08] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
                  <Printer className="h-3 w-3" />Print/View
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ));

  const typingIndicator = isLoading ? (
    <div className="flex gap-3 justify-start genie-fade-in-up">
      <div className="shrink-0 mt-1 p-1.5 rounded-xl" style={{ background: "rgba(212,175,55,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 0 14px rgba(212,175,55,0.40), 0 0 0 1px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
        <GenieBottle className="h-4 w-4 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 6px rgba(212,175,55,0.75))" }} />
      </div>
      <div className="px-5 py-4 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 4px 28px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.12) inset" }}>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (<span key={i} className="genie-typing-dot" />))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @keyframes intro-fade-in { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
        @keyframes intro-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes intro-pulse-dot { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        .genie-intro { animation: intro-fade-in 0.9s ease-out forwards; }
        .genie-intro-text { animation: intro-slide-up 0.8s 0.4s ease-out both; }
        .genie-intro-cta { animation: intro-slide-up 0.8s 0.9s ease-out both; }
        .genie-intro-dot1 { animation: intro-pulse-dot 1.4s 1.5s ease-in-out infinite; }
        .genie-intro-dot2 { animation: intro-pulse-dot 1.4s 1.7s ease-in-out infinite; }
        .genie-intro-dot3 { animation: intro-pulse-dot 1.4s 1.9s ease-in-out infinite; }
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
        .hw-icon-glow { filter: drop-shadow(0 0 7px rgba(255,255,255,0.65)); }
        .hw-gold-glow { filter: drop-shadow(0 0 10px rgba(255,215,0,0.70)); }
        .hw-footer-glow { text-shadow: 0 0 9px rgba(255,255,255,0.55); }

        /* Bright mode — override white text to readable dark tones */
        .bright-mode .text-white { color: #111827 !important; }
        .bright-mode .text-white\\/95,.bright-mode .text-white\\/90,.bright-mode .text-white\\/85,.bright-mode .text-white\\/80,.bright-mode .text-white\\/75,.bright-mode .text-white\\/70,.bright-mode .text-white\\/65,.bright-mode .text-white\\/60,.bright-mode .text-white\\/55,.bright-mode .text-white\\/50,.bright-mode .text-white\\/45,.bright-mode .text-white\\/40,.bright-mode .text-white\\/30,.bright-mode .text-white\\/22,.bright-mode .text-white\\/15,.bright-mode .text-white\\/10 { color: #111827 !important; }
        .bright-mode .hover\\:text-white:hover { color: #111827 !important; }
        .bright-mode .hw-footer-glow { color: #111827 !important; text-shadow: none; }
        .bright-mode .hw-icon-glow { filter: drop-shadow(0 0 5px rgba(0,0,0,0.25)); }
        /* Panels — keep white text even in bright mode */
        .bright-mode .panel-white .text-white,
        .bright-mode .panel-white .text-white\\/95,.bright-mode .panel-white .text-white\\/90,.bright-mode .panel-white .text-white\\/85,.bright-mode .panel-white .text-white\\/80,.bright-mode .panel-white .text-white\\/75,.bright-mode .panel-white .text-white\\/70,.bright-mode .panel-white .text-white\\/65,.bright-mode .panel-white .text-white\\/60,.bright-mode .panel-white .text-white\\/55,.bright-mode .panel-white .text-white\\/50,.bright-mode .panel-white .text-white\\/45,.bright-mode .panel-white .text-white\\/40,.bright-mode .panel-white .text-white\\/30,.bright-mode .panel-white .text-white\\/22,.bright-mode .panel-white .text-white\\/15,.bright-mode .panel-white .text-white\\/10 { color: white !important; }
        .bright-mode .panel-white .hover\\:text-white:hover { color: white !important; }
        .bright-mode .panel-white .hw-footer-glow { color: white !important; text-shadow: 0 0 9px rgba(255,255,255,0.55); }
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
                <Link href="/legal" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                  Terms of Service &amp; Privacy Policy
                </Link>
                . Powered by Claude AI (Anthropic) in compliance with Anthropic's usage policies.
              </p>
            </div>

            {/* Actions */}
            <div className="px-7 pb-6">
              <button
                onClick={handleAccept}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00D1C9]"
                style={{ background: "linear-gradient(135deg, #00B8C8 0%, #00D1C9 50%, #007FA8 100%)", boxShadow: "0 2px 18px rgba(0,209,201,0.35), inset 0 1px 0 rgba(255,255,255,0.12)" }}
              >
                I Accept — Continue to Genie
              </button>
            </div>
          </div>
        </div>
      )}

      <EducationalBackground isDark={isDark} guidanceActive={howItWorksActive === "guidance"} />

      {/* Mobile panel backdrop */}
      {(showMobileLeft || showMobileRight) && (
        <div
          className="fixed inset-0 z-[55] bg-black/70"
          onClick={() => { setShowMobileLeft(false); setShowMobileRight(false); }}
        />
      )}

      {/* Click-burst particles — fixed overlay */}
      {bursts.map(b => (
        <div key={b.id} className="orb-burst-container" style={{ left: b.x, top: b.y }}>
          <div className="orb-burst-ring" />
          <div className="orb-burst-ring-2" />
          <div className="orb-burst-core" />
        </div>
      ))}

      {/* ── Intro Splash ── */}
      {introVisible && (
        <div
          className="genie-intro fixed inset-0 z-[300] flex flex-col items-center justify-end cursor-pointer select-none overflow-hidden"
          style={{
            transition: introFading ? "opacity 0.7s ease, transform 0.7s ease" : undefined,
            opacity: introFading ? 0 : 1,
            transform: introFading ? "scale(1.03)" : "scale(1)",
          }}
          onClick={dismissIntro}
        >

          {/* ── DESKTOP: SuperHERO intro splash ── */}
          <div className="hidden md:block absolute inset-0">
            <video
              ref={heroVideoDesktopRef}
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover object-center"
            >
              <source src="/videos/superhero-genie.mp4" type="video/mp4" />
              <img src="/images/desktop-bg.jpg" alt="" className="w-full h-full object-cover object-center" />
            </video>
            {/* Deep purple-tinted scrim — lets video richness show through */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(8,3,20,0.58) 0%, rgba(5,2,14,0.42) 40%, rgba(7,2,18,0.52) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 110% 100% at 50% 50%, transparent 45%, rgba(6,2,16,0.55) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(to top, rgba(5,2,14,0.97) 0%, transparent 100%)" }} />
          </div>

          {/* ── MOBILE: SuperHERO intro splash ── */}
          <div className="block md:hidden absolute inset-0">
            <video
              ref={heroVideoMobileRef}
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover object-center"
            >
              <source src="/videos/superhero-genie.mp4" type="video/mp4" />
              <img src="/images/mobile-bg.jpg" alt="" className="w-full h-full object-cover object-center" />
            </video>
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,3,20,0.40) 0%, rgba(5,2,14,0.18) 35%, rgba(7,2,18,0.40) 70%, rgba(5,2,14,0.96) 100%)" }} />
          </div>

          {/* ── Audio toggle button (both desktop + mobile) ── */}
          <button
            type="button"
            onClick={() => {
              const next = !heroMuted;
              setHeroMuted(next);
              if (heroVideoDesktopRef.current) heroVideoDesktopRef.current.muted = next;
              if (heroVideoMobileRef.current) heroVideoMobileRef.current.muted = next;
            }}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/70 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {heroMuted ? (
              <><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>Unmute</>
            ) : (
              <><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>Mute</>
            )}
          </button>

          {/* ── DESKTOP: centre content (CSS text — always crisp) ── */}
          <div className="hidden md:flex absolute inset-0 flex-col items-center justify-center gap-7" style={{ paddingBottom: "6vh" }}>
            {/* Logo mark */}
            <div className="flex flex-col items-center gap-5">
              <div className="relative flex items-center justify-center">
                <div className="absolute" style={{ width: 96, height: 96, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(212,175,55,0.22) 0%, transparent 70%)", filter: "blur(14px)" }} />
                <GenieBottle className="relative h-14 w-14 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 18px rgba(212,175,55,0.70)) drop-shadow(0 0 40px rgba(212,175,55,0.35))" }} />
              </div>
              {/* Brand name */}
              <div className="flex flex-col items-center gap-2">
                <h1 className="font-black tracking-[-0.03em] leading-none" style={{
                  fontSize: "clamp(3.5rem, 7vw, 6rem)",
                  background: "linear-gradient(135deg, #FFFFFF 0%, #F0E0FF 25%, #FFFFFF 50%, #E8D0FF 75%, #FFFFFF 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "genie-white-shimmer 5s linear infinite",
                  filter: "drop-shadow(0 0 30px rgba(212,175,55,0.20))",
                }}>askGenie</h1>
                <div className="flex items-center gap-3">
                  <div className="h-px w-16" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.60))" }} />
                  <span className="text-xs font-bold tracking-[0.35em] uppercase" style={{ color: "rgba(212,175,55,0.85)" }}>Student Aid Hub</span>
                  <div className="h-px w-16" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.60), transparent)" }} />
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="flex flex-col items-center gap-2 max-w-lg text-center px-8">
              <p className="font-semibold leading-snug" style={{ fontSize: "clamp(1.05rem, 2vw, 1.35rem)", color: "rgba(255,255,255,0.88)" }}>
                Student Aid, Made Clear.
              </p>
              <p style={{ fontSize: "clamp(0.8rem, 1.3vw, 1rem)", color: "rgba(203,213,225,0.95)", lineHeight: 1.6 }}>
                Connecting families with financial aid offices — quickly and reliably.
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4">
              {[
                { label: "34 CFR Coverage" },
                { label: "Updated Weekly" },
                { label: "Students · Parents · Offices" },
              ].map(({ label }) => (
                <div key={label} className="px-3 py-1.5 rounded-full" style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.28)", color: "rgba(212,175,55,0.75)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── MOBILE: centre branding ── */}
          <div className="flex md:hidden absolute inset-0 flex-col items-center justify-center gap-5 px-6" style={{ paddingBottom: "12vh" }}>
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute" style={{ width: 72, height: 72, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(212,175,55,0.25) 0%, transparent 70%)", filter: "blur(12px)" }} />
                <GenieBottle className="relative h-11 w-11 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 14px rgba(212,175,55,0.70)) drop-shadow(0 0 30px rgba(212,175,55,0.35))" }} />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <h1 className="font-black tracking-[-0.03em] leading-none" style={{
                  fontSize: "clamp(2.6rem, 11vw, 3.8rem)",
                  background: "linear-gradient(135deg, #FFFFFF 0%, #F0E0FF 25%, #FFFFFF 50%, #E8D0FF 75%, #FFFFFF 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "genie-white-shimmer 5s linear infinite",
                  filter: "drop-shadow(0 0 20px rgba(212,175,55,0.18))",
                }}>askGenie</h1>
                <div className="flex items-center gap-2.5">
                  <div className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.60))" }} />
                  <span className="text-[10px] font-bold tracking-[0.32em] uppercase" style={{ color: "rgba(212,175,55,0.85)" }}>Student Aid Hub</span>
                  <div className="h-px w-10" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.60), transparent)" }} />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="font-semibold" style={{ fontSize: "clamp(1rem, 4.5vw, 1.2rem)", color: "rgba(255,255,255,0.90)" }}>Student Aid, Made Clear.</p>
              <p style={{ fontSize: "clamp(0.78rem, 3.2vw, 0.92rem)", color: "rgba(203,213,225,0.95)", lineHeight: 1.55 }}>
                Connecting families with financial aid offices — quickly and reliably.
              </p>
            </div>
          </div>

          {/* CTA — shared */}
          <div className="genie-intro-cta relative z-10 flex flex-col items-center gap-3 mb-10">
            <p className="text-white/45 text-xs font-semibold tracking-[0.22em] uppercase">Tap anywhere to enter</p>
            <div className="flex items-center gap-1.5">
              <span className="genie-intro-dot1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="genie-intro-dot2 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="genie-intro-dot3 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            </div>
          </div>
        </div>
      )}

      <div className={`h-screen flex overflow-hidden${!isDark ? " bright-mode" : ""}`} style={{ height: "100dvh" }} onClick={triggerBurst}>

        {/* ── Left Dropdown — Students & Parents ── */}
        <aside
          className={`panel-white ${showMobileLeft ? "flex" : "hidden"} fixed z-[60] flex-col rounded-2xl overflow-hidden backdrop-blur-2xl`}
          style={{ top: "84px", left: "8px", width: "min(620px, calc(100vw - 16px))", maxHeight: "calc(100dvh - 96px)", background: "rgba(10,4,22,0.28)", border: "1px solid rgba(212,175,55,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.10)" }}
        >
          {howItWorksActive === "panels" && <div className="hiw-scan-overlay" aria-hidden="true" />}

          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.08]" style={{ background: "rgba(12,5,28,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(212,175,55,0.18)", boxShadow: "0 0 12px rgba(212,175,55,0.45), 0 0 0 1px rgba(212,175,55,0.30)" }}>
                <GenieBottle className="h-4 w-4 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 5px rgba(212,175,55,0.80))" }} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Student Aid Hub</p>
                <p className="text-lg font-black tracking-tight leading-none whitespace-nowrap select-none" style={{ background: "linear-gradient(90deg, #FFFFFF 0%, #D8EEFF 20%, #FFFFFF 40%, #EAF5FF 60%, #FFFFFF 80%, #D0E8FF 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "genie-white-shimmer 4s linear infinite" }}>Students &amp; Parents</p>
              </div>
            </div>
            <button onClick={() => setShowMobileLeft(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto genie-scroll p-4">
            <div className="flex flex-col gap-2.5">

              {/* Section icon grid */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "lc-s-qa",     label: "Students",        img: "/images/sec-students.jpg",        pos: "object-[50%_15%]" },
                  { key: "lc-p-qa",     label: "Parents",          img: "/images/sec-parents.jpg",         pos: "object-[50%_18%]" },
                  { key: "lc-fed-sp",   label: "Federal Aid",      img: "/images/sec-fed-aid.jpg",         pos: "object-[50%_18%]", Icon: Landmark },
                  { key: "lc-resume",   label: "Resume",            img: "/images/sec-resume.jpg",          pos: "object-[50%_15%]", Icon: FileText },
                  { key: "lc-schol",    label: "Scholarships",      img: "/images/sec-scholarship.jpg",     pos: "object-[50%_12%]", Icon: Award },
                  { key: "lc-intern",   label: "Internships",       img: "/images/sec-internship.jpg",      pos: "object-[50%_14%]", Icon: Briefcase },
                  { key: "lc-jobs",     label: "Student Jobs",      img: "/images/sec-jobs.jpg",            pos: "object-[50%_12%]", Icon: Briefcase },
                  { key: "lc-finlit",   label: "Financial Literacy", img: "/images/sec-fin-literacy.jpg",   pos: "object-[50%_22%]", Icon: TrendingUp },
                  { key: "lc-loans",    label: "Private Loans",     img: "/images/sec-priv-loans.jpg",      pos: "object-[50%_18%]", Icon: PiggyBank },
                  { key: "lc-consumer", label: "Consumer Rights",   img: "/images/sec-consumer.jpg",        pos: "object-[50%_45%]", Icon: Scale },
                  { key: "lc-mental",   label: "Mental Health",     img: "/images/mental.jpg",              pos: "object-[50%_14%]", Icon: Sparkles },
                  { key: "lc-ai",       label: "AI Literacy",       img: "/images/sec-ai-literacy.jpg",     pos: "object-[50%_14%]", Icon: Lightbulb },
                  { key: "lc-faith",    label: "Faith & Spirit",    img: "/images/sec-faith-student.jpg",   pos: "object-[50%_22%]", Icon: Star },
                  { key: "lc-vol",      label: "Volunteer",         img: "/images/sec-volunteer.jpg",       pos: "object-[50%_16%]", Icon: Users },
                  { key: "lc-va",       label: "VA Resources",      img: "/images/sec-va.jpg",              pos: "object-[50%_18%]", Icon: ShieldCheck },
                  { key: "lc-research", label: "Research & Journals", img: "/images/sec-research-student.jpg", pos: "object-[50%_20%]", Icon: BookOpen },
                  { key: "lc-indep",    label: "Independent Resources", img: "/images/sec-indep-student.jpg",   pos: "object-[50%_25%]", Icon: Gavel },
                ]).map(({ key, label, img, pos, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setOverlaySection(key)}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/60 shadow-md shadow-black/40 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
                    style={{ aspectRatio: "1.6 / 1" }}
                  >
                    <img src={img} alt="" className={`w-full h-full object-cover ${pos}`} style={{ filter: "saturate(1.18) contrast(1.04) brightness(1.10)", opacity: 0.38 }} onError={(e) => { e.currentTarget.style.display = "none"; const fb = e.currentTarget.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = "flex"; }} />
                    <div style={{ display: "none" }} className="absolute inset-0 items-center justify-center bg-gradient-to-br from-indigo-900/80 via-slate-900/90 to-[#04091A]">
                      {Icon && <Icon className="h-9 w-9 text-indigo-300/60" />}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04091A]/65 via-[#04091A]/20 to-transparent group-hover:from-[#04091A]/50 transition-all duration-200" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-[#00D4FF]/40 transition-all duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                      <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">{label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Contact Leaders (collapsible) */}
              {(() => {
                const ck = "lc-contact-leaders";
                const expanded = expandedSections.has(ck);
                const contacts = [
                  { label: "Find My Rep",      sub: "U.S. House",        href: "https://www.house.gov/representatives/find-your-representative", Icon: Landmark },
                  { label: "Find My Senator",  sub: "U.S. Senate",       href: "https://www.senate.gov/senators/senators-contact.htm",          Icon: Users },
                  { label: "White House",       sub: "Contact President", href: "https://www.whitehouse.gov/contact",                            Icon: Star },
                  { label: "Congress.gov",      sub: "Bills & Laws",      href: "https://congress.gov",                                          Icon: BookOpen },
                  { label: "Elected Officials", sub: "USA.gov",           href: "https://www.usa.gov/elected-officials",                         Icon: ShieldCheck },
                  { label: "State Lawmakers",   sub: "NCSL Directory",    href: "https://www.ncsl.org/state-legislatures",                       Icon: MapPin },
                ];
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setExpandedSections(p => { const n = new Set(p); n.has(ck) ? n.delete(ck) : n.add(ck); return n; })}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/[0.18]" />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#091222] ring-1 ring-[#D4AF37]/[0.22]">
                        <Landmark className="h-2.5 w-2.5 text-[#D4AF37]/80" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">Contact Leaders</span>
                        <ChevronDown className={`h-2.5 w-2.5 text-white/30 transition-transform duration-200${expanded ? " rotate-180" : ""}`} />
                      </div>
                      <div className="h-px w-3 bg-[#D4AF37]/[0.18]" />
                    </div>
                    {expanded && (
                      <div className="grid grid-cols-2 gap-2">
                        {contacts.map(({ label, sub, href, Icon }) => (
                          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl ring-1 ring-white/[0.08] hover:ring-[#D4AF37]/40 transition-all duration-150 group"
                            style={{ background: "rgba(10,20,44,0.55)" }}>
                            <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(212,175,55,0.12)" }}>
                              <Icon className="h-3.5 w-3.5 text-[#D4AF37]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-white/85 group-hover:text-white truncate leading-tight transition-colors">{label}</p>
                              <p className="text-[9px] text-white/35 truncate leading-tight">{sub}</p>
                            </div>
                            <ExternalLink className="h-2.5 w-2.5 text-white/20 group-hover:text-[#D4AF37]/60 shrink-0 transition-colors" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Videos (collapsible) */}
              {(() => {
                const ck = "lc-fafsa-vid";
                const expanded = expandedSections.has(ck);
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setExpandedSections(p => { const n = new Set(p); n.has(ck) ? n.delete(ck) : n.add(ck); return n; })}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-500/[0.14]" />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#091222] ring-1 ring-red-500/[0.18]">
                        <Library className="h-2.5 w-2.5 text-red-400/80" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">Featured Videos</span>
                        <ChevronDown className={`h-2.5 w-2.5 text-white/30 transition-transform duration-200${expanded ? " rotate-180" : ""}`} />
                      </div>
                      <div className="h-px w-3 bg-red-500/[0.14]" />
                    </div>
                    {expanded && <div className="grid grid-cols-2 gap-2">
                      {[{ id: "RtDYpEfAa5U", title: "How to Fill Out the FAFSA" }, { id: "NmEP38x-1Z8", title: "FAFSA Tips & Common Mistakes" }, { id: "rhgwIhB58PA", title: "Student Aid Overview" }, { id: "C5OJJD3Eytk", title: "Understanding Aid Offers" }].map(({ id, title }) => (
                        <div key={id} className="relative rounded-xl overflow-hidden ring-1 ring-white/[0.08] shadow-sm shadow-black/30" style={{ aspectRatio: "16/9" }}>
                          {expandedSections.has(`vid-${id}`) ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
                              title={title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0"
                            />
                          ) : (
                            <button type="button" onClick={() => setExpandedSections(p => { const n = new Set(p); n.add(`vid-${id}`); return n; })} className="w-full h-full group">
                              <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt={title} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"/>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-red-600 transition-colors shadow-lg">
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                                <p className="text-[11px] text-white/85 truncate leading-tight">{title}</p>
                              </div>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2.5 border-t border-[#1E2A4A]">
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2">
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300/70 leading-relaxed">General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.</p>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main
          className={`flex flex-1 flex-col min-w-0 min-h-0 transition-all duration-300 ${howItWorksActive === "guidance" ? "ring-1 ring-inset ring-emerald-500/25 shadow-[inset_0_0_40px_rgba(16,185,129,0.07)]" : ""}`}
          style={{ background: "transparent" }}
          aria-label="Genie AI Assistant"
        >

          {/* ── Header ── */}
          <header className="sticky top-0 z-50 shrink-0" style={{ background: "rgba(8,3,18,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
            <div className="relative px-3 py-1.5 flex items-center justify-between gap-2">

              {/* Left — left panel toggle + Genie branding (always visible) */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => { const next = !showMobileLeft; setShowMobileLeft(next); if (next) { resetLeftTimer(); triggerOrbGold(); } }}
                  title="Students & Parents panel"
                  className={`shrink-0 p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/[0.12] hover:shadow-[0_0_10px_rgba(212,175,55,0.25)] ${howItWorksActive === "panels" ? "text-[#D4AF37] bg-[#D4AF37]/[0.15] shadow-[0_0_18px_rgba(212,175,55,0.55)] ring-1 ring-[#D4AF37]/50" : "text-[#FFD700] hw-gold-glow"}`}
                >
                  {showMobileLeft ? <X className="h-5 w-5" /> : <GenieBottle className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  title="Return to home"
                  className="text-2xl font-black tracking-tight leading-none whitespace-nowrap px-2 py-0.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-all duration-150"
                  style={{
                    color: "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  AskGenie
                </button>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Right — Home + theme + auth + right panel toggle + new chat */}
              <div className="flex items-center gap-1">
                <button
                  onClick={goHome}
                  title="Home"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white hover:text-white hover:bg-white/[0.10] transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 text-xs font-medium hw-icon-glow"
                >
                  <Home className="h-5 w-5" />
                </button>
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    title={userEmail ?? "Your account"}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.10] ring-1 ring-white/[0.25] text-white hover:bg-white/[0.18] hover:text-white transition-colors text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <UserCircle className="h-5 w-5 shrink-0" />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => { setAuthDialogMode("signin"); setAuthDialogOpen(true); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shadow-sm shadow-cyan-900/40"
                    >
                      <LogIn className="h-5 w-5 shrink-0" />
                    </button>
                    <Link
                      href="/account"
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.08] ring-1 ring-white/[0.18] text-white hover:text-white hover:bg-white/[0.14] transition-all duration-150 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                    >
                      <UserCircle className="h-5 w-5 shrink-0" />
                    </Link>
                  </>
                )}
                <button
                  onClick={() => setShowHistory(h => !h)}
                  title="View history"
                  className="p-1.5 rounded-lg text-white hover:text-white hover:bg-white/[0.10] transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 hw-icon-glow"
                >
                  <Clock className="h-5 w-5" />
                </button>
                <button
                  onClick={() => { const next = !showMobileRight; setShowMobileRight(next); if (next) { resetRightTimer(); triggerOrbGold(); } }}
                  title="Admins & Compliance/Auditors panel"
                  className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/[0.12] hover:shadow-[0_0_10px_rgba(212,175,55,0.25)] ${howItWorksActive === "panels" ? "text-[#D4AF37] bg-[#D4AF37]/[0.15] shadow-[0_0_18px_rgba(212,175,55,0.55)] ring-1 ring-[#D4AF37]/50" : "text-[#FFD700] hw-gold-glow"}`}
                >
                  {showMobileRight ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </button>
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    title="New chat"
                    className="p-1.5 rounded-lg text-white hover:text-white hover:bg-white/[0.10] transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 hw-icon-glow"
                  >
                    <SquarePen className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

          </header>

          {/* ── White Light Orb Mascot ── */}
          <div
            ref={pcOrbRef}
            aria-hidden="true"
            className="flex flex-col items-center pointer-events-none select-none"
            style={!isDesktopOrb ? {
              position: "fixed",
              left: "50%",
              top: "36%",
              transform: "translateX(-50%)",
              zIndex: 4,
              opacity: 0.18,
              pointerEvents: "none",
            } : {
              position: "fixed",
              right: mobileOrbRoaming ? undefined : "max(20px, calc(50vw - 530px))",
              top: mobileOrbRoaming ? undefined : "92px",
              zIndex: 1,
              opacity: mobileOrbRoaming ? 0.50 : 0.92,
              transition: mobileOrbRoaming ? undefined : "opacity 0.6s ease",
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ width: "clamp(72px, 13vw, 172px)", height: "clamp(72px, 13vw, 172px)", animation: "genie-orb-float 6s ease-in-out infinite" }}
            >
              {/* Wide outer ambient glow — warm white */}
              <div className="absolute rounded-full pointer-events-none" style={{
                inset: -60, background: "radial-gradient(circle, rgba(255,252,240,0.32) 0%, rgba(230,225,255,0.14) 45%, transparent 70%)",
                filter: "blur(28px)", animation: "genie-orb-pulse 5.5s ease-in-out infinite",
              }} />
              {/* Gold premium halo */}
              <div className="absolute rounded-full pointer-events-none" style={{
                inset: -40, background: "radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(255,200,50,0.08) 55%, transparent 72%)",
                filter: "blur(18px)", animation: "genie-orb-pulse 7.5s ease-in-out infinite 2s",
              }} />
              {/* Primary expanding halo — white */}
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%)",
                animation: "genie-halo-expand 4s ease-out infinite",
              }} />
              {/* Secondary halo — soft silver-blue */}
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                background: "radial-gradient(circle, rgba(210,220,255,0.30) 0%, transparent 65%)",
                animation: "genie-halo-expand-2 4s ease-out infinite 2s",
              }} />
              {/* Tertiary halo — warm gold whisper */}
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 60%)",
                animation: "genie-halo-expand-3 5s ease-out infinite 1.2s",
              }} />
              {/* Orb sphere — pure white light */}
              <div className={`relative z-10 rounded-full overflow-hidden${orbGlowing ? " genie-orb-gold" : ""}${orbCelebrating ? " genie-orb-celebrate" : ""}`} style={{
                width: "clamp(48px, 10vw, 118px)", height: "clamp(48px, 10vw, 118px)",
                background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 8%, rgba(248,250,255,1) 18%, rgba(232,238,255,1) 30%, rgba(210,220,252,1) 44%, rgba(180,196,242,1) 58%, rgba(140,160,222,1) 72%, rgba(92,115,195,1) 84%, rgba(40,62,155,1) 93%, rgba(12,22,70,1) 100%)",
                animation: (orbGlowing || orbCelebrating) ? undefined : "genie-orb-glow-pulse 4.5s ease-in-out infinite",
                willChange: "box-shadow, filter, transform",
                filter: "contrast(1.12) saturate(0.85) brightness(1.08)",
                boxShadow: "0 0 0 1.5px rgba(255,255,255,0.90), 0 0 0 4px rgba(220,228,255,0.35), 0 0 38px 14px rgba(255,255,255,0.55), 0 0 80px 28px rgba(200,215,255,0.28), inset 0 2px 0 rgba(255,255,255,0.90), 0 18px 60px rgba(0,0,0,0.80)",
              }}>
                {/* Rotating light bands */}
                <div style={{
                  position: "absolute", top: 0, left: 0, width: "200%", height: "100%",
                  background: "repeating-linear-gradient(90deg,transparent 0%,transparent 7%,rgba(255,255,255,0.18) 7%,rgba(255,255,255,0.18) 8.5%,transparent 8.5%,transparent 20%,rgba(230,235,255,0.14) 20%,rgba(230,235,255,0.14) 23%,transparent 23%,transparent 50%)",
                  animation: "genie-orb-bands 20s linear infinite",
                }} />
                {/* Primary specular highlight — pure brilliant white */}
                <div style={{
                  position: "absolute", top: "4%", left: "11%", width: "46%", height: "38%",
                  background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 30%, transparent 100%)",
                  borderRadius: "50%", filter: "blur(1.5px)",
                }} />
                {/* Secondary gleam */}
                <div style={{
                  position: "absolute", top: "52%", right: "9%", width: "20%", height: "18%",
                  background: "radial-gradient(circle, rgba(220,230,255,0.85) 0%, transparent 100%)",
                  borderRadius: "50%", filter: "blur(1.5px)",
                }} />
                {/* Soft inner glow at center */}
                <div style={{
                  position: "absolute", bottom: "12%", left: "20%", width: "30%", height: "22%",
                  background: "radial-gradient(circle, rgba(200,212,255,0.40) 0%, transparent 100%)",
                  borderRadius: "50%", filter: "blur(3px)",
                }} />
              </div>
            </div>
            {/* Mascot label */}
            <p className="mt-1 text-[9px] font-bold tracking-[0.20em] uppercase pointer-events-none" style={{ color: "rgba(220,228,255,0.80)", textShadow: "0 0 10px rgba(255,255,255,0.60), 0 0 22px rgba(200,215,255,0.40)" }}>✦ Genie</p>
          </div>

          {/* Messages / Welcome */}
          <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto min-h-0 genie-scroll-main transition-all duration-300 ${howItWorksActive === "guidance" ? "hiw-active-panel" : ""}`} role="log" aria-live="polite" aria-label="Conversation" style={{ position: "relative", zIndex: 3 }}>
            {/* ── Dashboard — always visible on all screen sizes ── */}
            <div>

              {/* ── Welcome state ── */}
              <div className="relative flex flex-col items-center px-1 py-4 sm:px-2 sm:py-6 genie-fade-in-up">


                <div className="relative w-full flex flex-col items-center">

                {/* ── Two-column console ── */}
                <div className="w-full max-w-[1280px] flex flex-col md:flex-row gap-3 md:gap-5 items-stretch md:items-start px-1 sm:px-2">

                  {/* ══ LEFT — Slide 1: Hero & How It Works ══ */}
                  <div className="w-full md:w-[46%] flex flex-col">

                    {/* Headline */}
                    {/* ── Hero Headline ── */}
                    <div className="mb-3 text-center md:text-left">
                      <h2
                        className={`font-black tracking-[0.06em] leading-tight mb-2 transition-all duration-300 ${howItWorksActive === "guidance" ? "hiw-guidance-headline" : ""}`}
                        style={howItWorksActive === "guidance" ? { fontSize: "clamp(2rem, 5vw, 3.2rem)" } : { fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "#FFFFFF" }}
                      >
                        STUDENT AID HUB
                      </h2>
                    </div>

                    {/* Trust strip */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-3">
                      {[
                        { icon: BookOpen,    text: "34 CFR Full Coverage"  },
                        { icon: ShieldCheck, text: "Updated Weekly"        },
                        { icon: Users,       text: "Students · Parents · Offices" },
                      ].map(({ icon: Icon, text }) => (
                        <span key={text} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 ring-[#D4AF37]/[0.35] transition-all duration-150 cursor-default" style={{ backdropFilter: "blur(8px)", background: "linear-gradient(145deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)", boxShadow: "0 2px 14px rgba(212,175,55,0.10), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
                          <Icon className="h-3 w-3 shrink-0" style={{ color: "#D4AF37" }} aria-hidden="true" />
                          <span className="text-[11px] text-white/80 font-semibold">{text}</span>
                        </span>
                      ))}
                    </div>

                    {/* How It Works — accordion, open by default */}
                    <div className="w-full flex flex-col mb-3 rounded-2xl overflow-hidden ring-1 ring-white/[0.10]"
                      style={{ background: "rgba(12,5,28,0.48)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}>
                      <button
                        type="button"
                        onClick={() => setOpenAccordions(prev => { const n = new Set(prev); n.has("hiw") ? n.delete("hiw") : n.add("hiw"); return n; })}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-px w-8 ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                          <span className={`text-xs font-bold uppercase tracking-[0.16em] ${isDark ? "text-white/70" : "text-gray-800"}`}>How it works</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-white/35 transition-transform duration-200 shrink-0 ${openAccordions.has("hiw") ? "rotate-180" : ""}`} />
                      </button>
                      {openAccordions.has("hiw") && (
                        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                          {([
                            { icon: Sparkles,    step: "1", title: "Choose Your Role",  body: "Select Student, Parent, Admin, Leader, or Compliance/Auditor for role-specific prompts, resources, and tailored guidance.",      color: "text-purple-200",  iconBg: "bg-purple-600/[0.38]",  cardRing: "ring-purple-400/[0.55]",   glowColor: "rgba(120,60,210,0.40)",  cardBg: "linear-gradient(145deg, rgba(88,28,135,0.42) 0%, rgba(40,10,80,0.30) 100%)",   idleGlow: "0 4px 24px rgba(88,28,135,0.28), 0 1px 0 rgba(255,255,255,0.12) inset",  activeKey: "role"     as const },
                            { icon: Send,        step: "2", title: "Ask Anything",       body: "Type any student aid question in plain English. Upload documents, letters, or forms for instant AI analysis.",                   color: "text-indigo-200",  iconBg: "bg-indigo-600/[0.38]",  cardRing: "ring-indigo-400/[0.55]",   glowColor: "rgba(99,80,210,0.40)",   cardBg: "linear-gradient(145deg, rgba(67,40,180,0.42) 0%, rgba(30,15,110,0.30) 100%)",  idleGlow: "0 4px 24px rgba(67,40,180,0.28), 0 1px 0 rgba(255,255,255,0.12) inset",  activeKey: "chatbox"  as const },
                            { icon: Library,     step: "3", title: "Explore the Hub",    body: "Access 500+ curated resources — scholarships, VA benefits, loan tools, federal aid portals, and institutional guides.",          color: "text-amber-200",   iconBg: "bg-[#D4AF37]/[0.28]",   cardRing: "ring-[#D4AF37]/[0.55]",    glowColor: "rgba(212,175,55,0.35)",  cardBg: "linear-gradient(145deg, rgba(212,175,55,0.22) 0%, rgba(150,110,20,0.14) 100%)", idleGlow: "0 4px 24px rgba(212,175,55,0.20), 0 1px 0 rgba(255,255,255,0.12) inset",  activeKey: "panels"   as const },
                            { icon: CheckCircle, step: "4", title: "Get Clear Guidance", body: "Receive plain-English answers grounded in 34 CFR, FSA Handbook, and HEA Title IV. Free, always — no jargon.",                 color: "text-violet-200",  iconBg: "bg-violet-600/[0.38]",  cardRing: "ring-violet-400/[0.55]",   glowColor: "rgba(150,100,240,0.40)", cardBg: "linear-gradient(145deg, rgba(110,50,200,0.42) 0%, rgba(55,18,120,0.30) 100%)",  idleGlow: "0 4px 24px rgba(110,50,200,0.28), 0 1px 0 rgba(255,255,255,0.12) inset",  activeKey: "guidance" as const },
                          ] as const).map(({ icon: Icon, step, title, body, color, iconBg, cardRing, glowColor, cardBg, idleGlow, activeKey }) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => { setHowItWorksActive(activeKey); triggerOrbGold(); }}
                              className={`flex flex-col gap-2 p-4 rounded-2xl ring-1 ${cardRing} text-left transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${howItWorksActive === activeKey ? "hiw-active-ring brightness-125" : ""}`}
                              style={{
                                background: cardBg,
                                backdropFilter: "blur(14px)",
                                WebkitBackdropFilter: "blur(14px)",
                                boxShadow: howItWorksActive === activeKey
                                  ? `0 0 0 1px rgba(212,175,55,0.55), 0 6px 24px ${glowColor}, 0 0 48px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.10)`
                                  : idleGlow,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-xl ${iconBg} ring-1 ${cardRing} shadow-sm`}>
                                  <Icon className={`h-4 w-4 ${color} ${howItWorksActive === activeKey ? "animate-pulse" : ""}`} aria-hidden="true" />
                                </div>
                                <span className="text-xl font-black text-white/50 tabular-nums leading-none" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.80)" }}>{step}</span>
                              </div>
                              <p className="text-sm font-bold text-white leading-tight" style={{ textShadow: "0 1px 5px rgba(0,0,0,0.80)" }}>{title}</p>
                              <p className="text-xs text-white/80 leading-snug" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.70)" }}>{body}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── Desktop-only: accordions below How It Works ── */}
                    <div className="hidden md:flex flex-col gap-3 mt-0">
                      {/* Quick Prompts by Role */}
                      <div className="rounded-2xl overflow-hidden ring-1 ring-white/[0.10]" style={{ background: "rgba(12,5,28,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                        <button type="button" onClick={() => setOpenAccordions(prev => { const n = new Set(prev); n.has("iam") ? n.delete("iam") : n.add("iam"); return n; })} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-lg" style={{ background: "rgba(212,175,55,0.14)" }}><Users className="h-3.5 w-3.5 text-amber-400/80" /></div>
                            <span className={`text-xs font-bold tracking-[0.08em] uppercase ${isDark ? "text-white/65" : "text-gray-700"}`}>Quick Prompts by Role</span>
                            <span className="text-[9px] text-white/25 font-medium">{openAccordions.has("iam") ? "" : "· tap to expand"}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-white/35 transition-transform duration-200 shrink-0 ${openAccordions.has("iam") ? "rotate-180" : ""}`} />
                        </button>
                        {openAccordions.has("iam") && (
                          <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                            {activeActionItems.map(({ role, items, more }) => {
                              const tc = ROLE_TILE_COLORS[role] ?? ROLE_TILE_COLORS.Students;
                              return (
                                <div key={role} className="grid grid-cols-4 gap-2">
                                  {[...items, ...more].map(({ icon: Icon, label, q }) => (
                                    <button key={`${role}-${label}`} onClick={() => sendFromAccordion(q)} className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl ${tc.outerHover} transition-all duration-200 group ${tc.focusRing} focus-visible:outline-none focus-visible:ring-2 hover:scale-[1.06] active:scale-95`}>
                                      <div className={`w-12 h-12 rounded-[16px] ring-1 ${tc.iconRing} flex items-center justify-center transition-all ${tc.hoverRing} group-hover:scale-[1.06]`} style={{ background: tc.iconBg, boxShadow: tc.iconShadow }}>
                                        <Icon className={`h-5 w-5 ${tc.iconClass} ${tc.dropShadow} group-hover:text-white ${tc.hoverGlow} transition-all`} />
                                      </div>
                                      <span className="text-[10px] font-semibold text-white/80 group-hover:text-white text-center leading-tight transition-colors line-clamp-2 w-full px-0.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.80)" }}>{label}</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Tips by Role */}
                      <div className="rounded-2xl overflow-hidden ring-1 ring-white/[0.10]" style={{ background: "rgba(12,5,28,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                        <button type="button" onClick={() => setOpenAccordions(prev => { const n = new Set(prev); n.has("tips") ? n.delete("tips") : n.add("tips"); return n; })} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-lg" style={{ background: "rgba(251,191,36,0.14)" }}><Lightbulb className="h-3.5 w-3.5 text-amber-400" /></div>
                            <span className={`text-xs font-bold tracking-[0.08em] uppercase ${isDark ? "text-white/65" : "text-gray-700"}`}>Tips by Role</span>
                            <span className="text-[9px] text-white/25 font-medium">{openAccordions.has("tips") ? "" : "· tap to expand"}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-white/35 transition-transform duration-200 shrink-0 ${openAccordions.has("tips") ? "rotate-180" : ""}`} />
                        </button>
                        {openAccordions.has("tips") && (
                          <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                            {activeTipData && (
                              <div key={activeTipData.role} className="rounded-2xl overflow-hidden ring-1 ring-[#D4AF37]/[0.22] shadow-lg shadow-black/30">
                                <div className={`bg-gradient-to-r ${activeTipData.gradient} px-4 py-3 flex items-center gap-3`}>
                                  <div className="p-2 rounded-xl bg-white/20 shrink-0"><activeTipData.icon className="h-5 w-5 text-white" /></div>
                                  <div>
                                    <p className="text-sm font-semibold text-white leading-tight">As a {activeTipData.role}</p>
                                    <p className="text-xs text-white/60 leading-tight mt-0.5">Tap any tip to send to Genie</p>
                                  </div>
                                </div>
                                <div className="divide-y divide-white/[0.05]" style={{ background: "rgba(13,26,50,0.50)", maxHeight: "min(400px, 50dvh)", overflowY: "auto" }}>
                                  {rotatedTips.map(({ text, prompt }, i) => (
                                    <button key={i} onClick={() => sendFromAccordion(prompt)} className="w-full flex items-start gap-3 px-4 py-3 text-left group hover:bg-white/[0.05] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400">
                                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ring-1 ${activeTipData.accent} group-hover:scale-125 transition-transform`} />
                                      <p className="text-xs text-[#94A3B8] group-hover:text-white/90 leading-snug transition-colors flex-1">{text}</p>
                                      <ChevronRight className="h-3.5 w-3.5 text-white/15 group-hover:text-cyan-400 shrink-0 mt-0.5 transition-all group-hover:translate-x-0.5" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* What Genie Covers */}
                      <div className="rounded-2xl overflow-hidden ring-1 ring-white/[0.10]" style={{ background: "rgba(12,5,28,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                        <button type="button" onClick={() => setOpenAccordions(prev => { const n = new Set(prev); n.has("covers") ? n.delete("covers") : n.add("covers"); return n; })} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-lg shrink-0" style={{ background: "rgba(212,175,55,0.14)" }}><Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /></div>
                            <span className={`text-xs font-bold tracking-[0.08em] uppercase ${isDark ? "text-white/65" : "text-gray-700"}`}>What Genie Covers</span>
                            <span className="text-[9px] text-white/25 font-medium">{openAccordions.has("covers") ? "" : "· 28 topic areas"}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-white/35 transition-transform duration-200 shrink-0 ${openAccordions.has("covers") ? "rotate-180" : ""}`} />
                        </button>
                        {openAccordions.has("covers") && (
                          <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                            <div className="mb-2.5 mt-2 px-3.5 py-2.5 rounded-xl ring-1 ring-[#D4AF37]/[0.18] flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.03) 100%)" }}>
                              <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(212,175,55,0.12)" }}><BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" /></div>
                              <p className="text-[11px] text-[#94A3B8]/80 leading-snug"><span className="text-white/90 font-semibold">28 topic areas</span> · Federal regs, state aid, audits, litigation &amp; more. Click to ask Genie.</p>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 overflow-y-auto" style={{ maxHeight: "min(260px, 30dvh)" }}>
                              {[
                                { topic: "34 CFR Parts 600–690",        icon: Scale,         bg: "bg-sky-500/[0.08]",     ring: "ring-sky-400/[0.22]"     },
                                { topic: "HEA Title IV",                 icon: Award,         bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                                { topic: "FA Offer Letters",             icon: FileText,      bg: "bg-emerald-500/[0.08]", ring: "ring-emerald-400/[0.22]" },
                                { topic: "R2T4 Calculator",              icon: Calculator,    bg: "bg-amber-500/[0.08]",   ring: "ring-amber-400/[0.22]"   },
                                { topic: "FSA Compliance Audits",        icon: ShieldCheck,   bg: "bg-rose-500/[0.08]",    ring: "ring-rose-400/[0.22]"    },
                                { topic: "ED Program Reviews",           icon: ClipboardList, bg: "bg-cyan-500/[0.08]",    ring: "ring-cyan-400/[0.22]"    },
                                { topic: "OIG Audits & Investigations",  icon: Search,        bg: "bg-orange-500/[0.08]",  ring: "ring-orange-400/[0.22]"  },
                                { topic: "FAFSA Simplification Act",     icon: Sparkles,      bg: "bg-indigo-500/[0.08]",  ring: "ring-indigo-400/[0.22]"  },
                                { topic: "One Big Beautiful Bill",       icon: TrendingUp,    bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                                { topic: "SAVE Plan & Litigation",       icon: Gavel,         bg: "bg-red-500/[0.08]",     ring: "ring-red-400/[0.22]"     },
                                { topic: "IRS Education Tax Credits",    icon: DollarSign,    bg: "bg-green-500/[0.08]",   ring: "ring-green-400/[0.22]"   },
                                { topic: "State Aid (50 states)",        icon: MapPin,        bg: "bg-teal-500/[0.08]",    ring: "ring-teal-400/[0.22]"    },
                                { topic: "SAP Policies",                 icon: BookOpen,      bg: "bg-sky-500/[0.08]",     ring: "ring-sky-400/[0.22]"     },
                                { topic: "Loan Repayment & Forgiveness", icon: RefreshCcw,    bg: "bg-emerald-500/[0.08]", ring: "ring-emerald-400/[0.22]" },
                                { topic: "529 Plans & Tax Strategy",     icon: PiggyBank,     bg: "bg-amber-500/[0.08]",   ring: "ring-amber-400/[0.22]"   },
                                { topic: "Gainful Employment Rule",      icon: Briefcase,     bg: "bg-rose-500/[0.08]",    ring: "ring-rose-400/[0.22]"    },
                                { topic: "Verification Requirements",    icon: CheckCircle,   bg: "bg-emerald-500/[0.08]", ring: "ring-emerald-400/[0.22]" },
                                { topic: "Professional Judgment",        icon: Scale,         bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                                { topic: "Cost of Attendance",           icon: DollarSign,    bg: "bg-green-500/[0.08]",   ring: "ring-green-400/[0.22]"   },
                                { topic: "Dependency Status Rules",      icon: Users,         bg: "bg-blue-500/[0.08]",    ring: "ring-blue-400/[0.22]"    },
                                { topic: "Work-Study Programs",          icon: Briefcase,     bg: "bg-cyan-500/[0.08]",    ring: "ring-cyan-400/[0.22]"    },
                                { topic: "TEACH Grant & Perkins",        icon: Award,         bg: "bg-amber-500/[0.08]",   ring: "ring-amber-400/[0.22]"   },
                                { topic: "Veterans & GI Bill Aid",       icon: ShieldCheck,   bg: "bg-orange-500/[0.08]",  ring: "ring-orange-400/[0.22]"  },
                                { topic: "Cohort Default Rates",         icon: TrendingUp,    bg: "bg-rose-500/[0.08]",    ring: "ring-rose-400/[0.22]"    },
                                { topic: "Loan Consolidation",           icon: RefreshCcw,    bg: "bg-sky-500/[0.08]",     ring: "ring-sky-400/[0.22]"     },
                                { topic: "Consortium Agreements",        icon: Landmark,      bg: "bg-teal-500/[0.08]",    ring: "ring-teal-400/[0.22]"    },
                                { topic: "Study Abroad Aid Rules",       icon: MapPin,        bg: "bg-indigo-500/[0.08]",  ring: "ring-indigo-400/[0.22]"  },
                                { topic: "Accreditation & Eligibility",  icon: BookOpen,      bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                              ].map(({ topic, icon: TopicIcon, bg, ring }) => (
                                <button key={topic} type="button" onClick={() => sendFromAccordion(COVERAGE_TOPIC_PROMPTS[topic] ?? `Tell me about ${topic}.`)} className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-[#D4AF37]/[0.08] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] hover:scale-[1.06] active:scale-95">
                                  <div className={`w-10 h-10 rounded-[12px] ${bg} ring-1 ${ring} flex items-center justify-center shadow-md group-hover:shadow-[0_0_14px_rgba(212,175,55,0.20)] transition-all`}><TopicIcon className="h-4 w-4 text-white" /></div>
                                  <span className="text-[8px] font-semibold text-white/80 group-hover:text-white text-center leading-tight transition-colors line-clamp-2 w-full px-0.5">{topic}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>{/* end desktop-only accordions */}

                  </div>{/* end left column */}

                  {/* ══ RIGHT — Unified askGenie unit ══ */}
                  <div ref={tipsRef} className="w-full md:w-[54%] flex flex-col gap-3 px-1 pb-2 md:sticky md:top-[8px] md:self-start">

                    {/* ── Embedded Chat Window — all screen sizes ── */}
                    <div className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                      style={{
                        height: "min(74vh, 720px)",
                        background: "rgba(10,4,22,0.28)",
                        backdropFilter: "blur(32px)",
                        WebkitBackdropFilter: "blur(32px)",
                        border: "1px solid rgba(212,175,55,0.18)",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.10)",
                      }}>

                      {/* Panel header */}
                      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.10]" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg" style={{ background: "rgba(212,175,55,0.18)", boxShadow: "0 0 12px rgba(212,175,55,0.45), 0 0 0 1px rgba(212,175,55,0.30)" }}>
                            <GenieBottle className="h-3.5 w-3.5 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 5px rgba(212,175,55,0.80))" }} />
                          </div>
                          <span className="text-sm font-bold text-white tracking-tight">Genie</span>
                        </div>
                        </div>

                      {/* Messages area — welcome typewriter when idle, real messages when chatting */}
                      {messages.length > 0 ? (
                        <div ref={desktopChatScrollRef} className="flex-1 overflow-y-auto min-h-0 genie-scroll-main px-5 py-5 space-y-5">
                          {messageBubbles}
                          {typingIndicator}
                          <div ref={desktopBottomRef} />
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto min-h-0 genie-scroll-main px-5 py-5">
                          <div className="flex items-start gap-2.5">
                            <div className="shrink-0 p-1.5 rounded-xl mt-0.5" style={{ background: "rgba(212,175,55,0.18)", boxShadow: "0 0 12px rgba(212,175,55,0.45), 0 0 0 1px rgba(212,175,55,0.30)" }}>
                              <GenieBottle className="h-3.5 w-3.5 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 5px rgba(212,175,55,0.80))" }} />
                            </div>
                            <div className="flex-1 px-3.5 py-2.5 rounded-2xl rounded-tl-sm ring-1 ring-white/[0.10]"
                              style={{ background: "rgba(255,255,255,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.30)" }}>
                              <p className="text-sm text-white/90 leading-relaxed">
                                {welcomeTyped}
                                {welcomeTyped.length < GENIE_WELCOME.length && (
                                  <span className="inline-block w-[2px] h-[1em] bg-cyan-300/80 ml-0.5 align-middle animate-pulse" />
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Role pills — compact row above input */}
                      <div className={`shrink-0 px-4 py-2 border-t border-white/[0.08] transition-all duration-300 ${howItWorksActive === "role" ? "hiw-active-shimmer" : ""}`}
                        style={{ background: "rgba(255,255,255,0.025)" }}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold tracking-wide mr-0.5 shrink-0 ${isDark ? "text-white/55" : "text-gray-700"}`}>I am a:</span>
                          {ROLE_OPTIONS.map(({ label, icon: RoleIcon, color, ring, bg }) => (
                            <button key={label} type="button" aria-pressed={selectedRole === label}
                              onClick={() => { syncRoles(selectedRole === label ? null : label); }}
                              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ring-1 ${
                                selectedRole === label
                                  ? `${color} ${bg} ${ring}`
                                  : isDark ? "text-white/75 bg-transparent ring-white/[0.18] hover:text-white hover:bg-white/[0.10] hover:ring-white/45" : "text-gray-800 bg-transparent ring-black/[0.18] hover:text-gray-900 hover:bg-black/[0.06] hover:ring-black/30"
                              }`}>
                              <RoleIcon className="h-2.5 w-2.5 shrink-0" />{label}
                            </button>
                          ))}
                          {selectedRole && (<button type="button" onClick={() => syncRoles(null)} className="text-[10px] text-white/40 hover:text-white/70 transition-colors ml-0.5">✕ clear</button>)}
                        </div>
                      </div>

                      {/* Attached file preview */}
                      {attachedFile && (
                        <div className="shrink-0 px-4 pt-2">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
                            {attachedFile.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-indigo-300 shrink-0" /> : attachedFile.type === "audio" ? <Mic className="h-3.5 w-3.5 text-rose-300 shrink-0" /> : <Paperclip className="h-3.5 w-3.5 text-indigo-300 shrink-0" />}
                            <span className="text-xs text-white/80 flex-1 truncate">{attachedFile.name}</span>
                            <button type="button" onClick={() => setAttachedFile(null)} className="text-white/35 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      )}

                      {/* Input form */}
                      <div className="shrink-0 px-4 pt-2.5 pb-3.5">
                        <div className={`rounded-2xl ring-1 focus-within:ring-white/70 transition-all duration-200 ${howItWorksActive === "guidance" ? "hiw-guidance-chatbox" : howItWorksActive === "chatbox" ? "hiw-active-ring" : (!input && !attachedFile ? "ring-white/40" : "ring-white/65")}`}
                          style={{ background: "rgba(255,255,255,0.09)", boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 4px 28px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.10) inset" }}>
                          <form onSubmit={handleSubmit} className="flex gap-2 items-end px-3 py-2.5">
                            <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                              <button type="button" title={canAccessFeature("document_upload", userTier) ? "Upload document" : "Pro — upload documents"} onClick={() => canAccessFeature("document_upload", userTier) ? fileInputRef.current?.click() : openUpgrade("document_upload")} className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${canAccessFeature("document_upload", userTier) ? "text-white hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.25)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}><Paperclip className="h-4 w-4" /></button>
                              <button type="button" title={canAccessFeature("document_upload", userTier) ? "Upload photo" : "Pro — upload photos"} onClick={() => canAccessFeature("document_upload", userTier) ? cameraInputRef.current?.click() : openUpgrade("document_upload")} className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${canAccessFeature("document_upload", userTier) ? "text-white hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.25)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}><Camera className="h-4 w-4" /></button>
                              <button type="button" title={!canAccessFeature("document_upload", userTier) ? "Pro — voice messages" : isRecording ? "Stop recording" : "Record voice message"} onClick={!canAccessFeature("document_upload", userTier) ? () => openUpgrade("document_upload") : isRecording ? stopVoiceRecording : startVoiceRecording} className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${isRecording ? "text-rose-400 bg-rose-500/20 ring-1 ring-rose-500/40 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.45)]" : canAccessFeature("document_upload", userTier) ? "text-white hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.25)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}>{isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
                            </div>
                            <div className="flex-1 relative">
                              {isRecording && voiceTranscript && (<p className="absolute top-0 left-2 right-2 text-xs text-rose-300/80 italic pointer-events-none truncate">🎙 {voiceTranscript}</p>)}
                              <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                aria-label="Ask Genie a financial aid question"
                                placeholder={isRecording ? "🎙 Listening… speak your question…" : "Type here and send it!"}
                                rows={1}
                                className="w-full resize-none px-2 py-1.5 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none leading-relaxed"
                                style={{ minHeight: "40px", maxHeight: "160px" }}
                              />
                            </div>
                            {isStreaming ? (
                              <button type="button" onClick={stopStreaming} title="Stop generating" className="shrink-0 mb-0.5 flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-300 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400" style={{ background: "rgba(244,63,94,0.14)", boxShadow: "0 0 0 1px rgba(244,63,94,0.30), 0 2px 10px rgba(244,63,94,0.20)" }}>
                                <Square className="h-3.5 w-3.5 fill-current" />Stop
                              </button>
                            ) : (
                              <button type="submit" disabled={(!input.trim() && !attachedFile) || isLoading} onClick={triggerOrbGold} className="shrink-0 mb-0.5 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold tracking-wide active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400" style={{ background: "linear-gradient(135deg, #00B8C8 0%, #00D1C9 50%, #0099B8 100%)", boxShadow: "0 0 0 1px rgba(0,209,201,0.50), 0 2px 16px rgba(0,209,201,0.40), 0 0 32px rgba(0,229,192,0.20), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                                <GenieBottle className="h-4 w-4 text-amber-200 genie-send-icon" />Send
                              </button>
                            )}
                          </form>
                        </div>
                        <p className="mt-1 text-[9px] text-cyan-400/25 text-center leading-snug">Enter ↵ to send · Shift+Enter new line · Unofficial guidance — verify with FSA Handbook</p>
                      </div>
                    </div>{/* end embedded chat window */}

                    {/* ── Accordions — mobile only (desktop moved to left column) ── */}
                    <div className="flex md:hidden flex-col gap-3">

                    {/* ── I am a… accordion (tips) ── */}
                    <div className="rounded-2xl overflow-hidden ring-1 ring-white/[0.10]"
                      style={{
                        background: "rgba(12,5,28,0.55)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                      }}>

                      <button
                        type="button"
                        onClick={() => setOpenAccordions(prev => { const n = new Set(prev); n.has("iam") ? n.delete("iam") : n.add("iam"); return n; })}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-lg" style={{ background: "rgba(212,175,55,0.14)" }}>
                            <Users className="h-3.5 w-3.5 text-amber-400/80" />
                          </div>
                          <span className={`text-xs font-bold tracking-[0.08em] uppercase ${isDark ? "text-white/65" : "text-gray-700"}`}>Quick Prompts by Role</span>
                          <span className="text-[9px] text-white/25 font-medium">{openAccordions.has("iam") ? "" : "· tap to expand"}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-white/35 transition-transform duration-200 shrink-0 ${openAccordions.has("iam") ? "rotate-180" : ""}`} />
                      </button>

                      {openAccordions.has("iam") && (
                        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">

                          {/* Quick action tiles */}
                          {activeActionItems.map(({ role, items, more }) => {
                            const tc = ROLE_TILE_COLORS[role] ?? ROLE_TILE_COLORS.Students;
                            return (
                              <div key={role} className="grid grid-cols-4 gap-2">
                                {[...items, ...more].map(({ icon: Icon, label, q }) => (
                                  <button
                                    key={`${role}-${label}`}
                                    onClick={() => sendFromAccordion(q)}
                                    className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl ${tc.outerHover} transition-all duration-200 group ${tc.focusRing} focus-visible:outline-none focus-visible:ring-2 hover:scale-[1.06] active:scale-95`}
                                  >
                                    <div
                                      className={`w-12 h-12 rounded-[16px] ring-1 ${tc.iconRing} flex items-center justify-center transition-all ${tc.hoverRing} group-hover:scale-[1.06]`}
                                      style={{ background: tc.iconBg, boxShadow: tc.iconShadow }}
                                    >
                                      <Icon className={`h-5 w-5 ${tc.iconClass} ${tc.dropShadow} group-hover:text-white ${tc.hoverGlow} transition-all`} />
                                    </div>
                                    <span className="text-[10px] font-semibold text-white/80 group-hover:text-white text-center leading-tight transition-colors line-clamp-2 w-full px-0.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.80)" }}>{label}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })}

                        </div>
                      )}{/* end accordion content */}
                    </div>{/* end Quick Tips & Prompts accordion */}

                    {/* ── Tips by Role accordion ── */}
                    <div className="rounded-2xl overflow-hidden ring-1 ring-white/[0.10]"
                      style={{
                        background: "rgba(12,5,28,0.55)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                      }}>

                      <button
                        type="button"
                        onClick={() => setOpenAccordions(prev => { const n = new Set(prev); n.has("tips") ? n.delete("tips") : n.add("tips"); return n; })}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-lg" style={{ background: "rgba(251,191,36,0.14)" }}>
                            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                          <span className={`text-xs font-bold tracking-[0.08em] uppercase ${isDark ? "text-white/65" : "text-gray-700"}`}>Tips by Role</span>
                          <span className="text-[9px] text-white/25 font-medium">{openAccordions.has("tips") ? "" : "· tap to expand"}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-white/35 transition-transform duration-200 shrink-0 ${openAccordions.has("tips") ? "rotate-180" : ""}`} />
                      </button>

                      {openAccordions.has("tips") && (
                        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                          {activeTipData && (
                            <div key={activeTipData.role} className="rounded-2xl overflow-hidden ring-1 ring-[#D4AF37]/[0.22] shadow-lg shadow-black/30">
                              <div className={`bg-gradient-to-r ${activeTipData.gradient} px-4 py-3 flex items-center gap-3`}>
                                <div className="p-2 rounded-xl bg-white/20 shrink-0">
                                  <activeTipData.icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white leading-tight">As a {activeTipData.role}</p>
                                  <p className="text-xs text-white/60 leading-tight mt-0.5">Tap any tip to send to Genie</p>
                                </div>
                              </div>
                              <div className="divide-y divide-white/[0.05]" style={{ background: "rgba(13,26,50,0.50)", maxHeight: "min(400px, 50dvh)", overflowY: "auto" }}>
                                {rotatedTips.map(({ text, prompt }, i) => (
                                  <button
                                    key={i}
                                    onClick={() => sendFromAccordion(prompt)}
                                    className="w-full flex items-start gap-3 px-4 py-3 text-left group hover:bg-white/[0.05] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                                  >
                                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ring-1 ${activeTipData.accent} group-hover:scale-125 transition-transform`} />
                                    <p className="text-xs text-[#94A3B8] group-hover:text-white/90 leading-snug transition-colors flex-1">{text}</p>
                                    <ChevronRight className="h-3.5 w-3.5 text-white/15 group-hover:text-cyan-400 shrink-0 mt-0.5 transition-all group-hover:translate-x-0.5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}{/* end tips accordion content */}
                    </div>{/* end Tips by Role accordion */}

                    {/* ── What Genie Covers accordion ── */}
                    <div className="rounded-2xl overflow-hidden ring-1 ring-white/[0.10]"
                      style={{
                        background: "rgba(12,5,28,0.55)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                      }}>
                      <button
                        type="button"
                        onClick={() => setOpenAccordions(prev => { const n = new Set(prev); n.has("covers") ? n.delete("covers") : n.add("covers"); return n; })}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-lg shrink-0" style={{ background: "rgba(212,175,55,0.14)" }}>
                            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                          </div>
                          <span className={`text-xs font-bold tracking-[0.08em] uppercase ${isDark ? "text-white/65" : "text-gray-700"}`}>What Genie Covers</span>
                          <span className="text-[9px] text-white/25 font-medium">{openAccordions.has("covers") ? "" : "· 28 topic areas"}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-white/35 transition-transform duration-200 shrink-0 ${openAccordions.has("covers") ? "rotate-180" : ""}`} />
                      </button>

                      {openAccordions.has("covers") && (
                        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                          <div className="mb-2.5 mt-2 px-3.5 py-2.5 rounded-xl ring-1 ring-[#D4AF37]/[0.18] flex items-center gap-3"
                            style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.03) 100%)" }}>
                            <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(212,175,55,0.12)" }}>
                              <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
                            </div>
                            <p className="text-[11px] text-[#94A3B8]/80 leading-snug">
                              <span className="text-white/90 font-semibold">28 topic areas</span> · Federal regs, state aid, audits, litigation &amp; more. Click to ask Genie.
                            </p>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 overflow-y-auto" style={{ maxHeight: "min(260px, 30dvh)" }}>
                            {[
                              { topic: "34 CFR Parts 600–690",        icon: Scale,         bg: "bg-sky-500/[0.08]",     ring: "ring-sky-400/[0.22]"     },
                              { topic: "HEA Title IV",                 icon: Award,         bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                              { topic: "FA Offer Letters",             icon: FileText,      bg: "bg-emerald-500/[0.08]", ring: "ring-emerald-400/[0.22]" },
                              { topic: "R2T4 Calculator",              icon: Calculator,    bg: "bg-amber-500/[0.08]",   ring: "ring-amber-400/[0.22]"   },
                              { topic: "FSA Compliance Audits",        icon: ShieldCheck,   bg: "bg-rose-500/[0.08]",    ring: "ring-rose-400/[0.22]"    },
                              { topic: "ED Program Reviews",           icon: ClipboardList, bg: "bg-cyan-500/[0.08]",    ring: "ring-cyan-400/[0.22]"    },
                              { topic: "OIG Audits & Investigations",  icon: Search,        bg: "bg-orange-500/[0.08]",  ring: "ring-orange-400/[0.22]"  },
                              { topic: "FAFSA Simplification Act",     icon: Sparkles,      bg: "bg-indigo-500/[0.08]",  ring: "ring-indigo-400/[0.22]"  },
                              { topic: "One Big Beautiful Bill",       icon: TrendingUp,    bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                              { topic: "SAVE Plan & Litigation",       icon: Gavel,         bg: "bg-red-500/[0.08]",     ring: "ring-red-400/[0.22]"     },
                              { topic: "IRS Education Tax Credits",    icon: DollarSign,    bg: "bg-green-500/[0.08]",   ring: "ring-green-400/[0.22]"   },
                              { topic: "State Aid (50 states)",        icon: MapPin,        bg: "bg-teal-500/[0.08]",    ring: "ring-teal-400/[0.22]"    },
                              { topic: "SAP Policies",                 icon: BookOpen,      bg: "bg-sky-500/[0.08]",     ring: "ring-sky-400/[0.22]"     },
                              { topic: "Loan Repayment & Forgiveness", icon: RefreshCcw,    bg: "bg-emerald-500/[0.08]", ring: "ring-emerald-400/[0.22]" },
                              { topic: "529 Plans & Tax Strategy",     icon: PiggyBank,     bg: "bg-amber-500/[0.08]",   ring: "ring-amber-400/[0.22]"   },
                              { topic: "Gainful Employment Rule",      icon: Briefcase,     bg: "bg-rose-500/[0.08]",    ring: "ring-rose-400/[0.22]"    },
                              { topic: "Verification Requirements",    icon: CheckCircle,   bg: "bg-emerald-500/[0.08]", ring: "ring-emerald-400/[0.22]" },
                              { topic: "Professional Judgment",        icon: Scale,         bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                              { topic: "Cost of Attendance",           icon: DollarSign,    bg: "bg-green-500/[0.08]",   ring: "ring-green-400/[0.22]"   },
                              { topic: "Dependency Status Rules",      icon: Users,         bg: "bg-blue-500/[0.08]",    ring: "ring-blue-400/[0.22]"    },
                              { topic: "Work-Study Programs",          icon: Briefcase,     bg: "bg-cyan-500/[0.08]",    ring: "ring-cyan-400/[0.22]"    },
                              { topic: "TEACH Grant & Perkins",        icon: Award,         bg: "bg-amber-500/[0.08]",   ring: "ring-amber-400/[0.22]"   },
                              { topic: "Veterans & GI Bill Aid",       icon: ShieldCheck,   bg: "bg-orange-500/[0.08]",  ring: "ring-orange-400/[0.22]"  },
                              { topic: "Cohort Default Rates",         icon: TrendingUp,    bg: "bg-rose-500/[0.08]",    ring: "ring-rose-400/[0.22]"    },
                              { topic: "Loan Consolidation",           icon: RefreshCcw,    bg: "bg-sky-500/[0.08]",     ring: "ring-sky-400/[0.22]"     },
                              { topic: "Consortium Agreements",        icon: Landmark,      bg: "bg-teal-500/[0.08]",    ring: "ring-teal-400/[0.22]"    },
                              { topic: "Study Abroad Aid Rules",       icon: MapPin,        bg: "bg-indigo-500/[0.08]",  ring: "ring-indigo-400/[0.22]"  },
                              { topic: "Accreditation & Eligibility",  icon: BookOpen,      bg: "bg-violet-500/[0.08]",  ring: "ring-violet-400/[0.22]"  },
                            ].map(({ topic, icon: TopicIcon, bg, ring }) => (
                              <button
                                key={topic}
                                type="button"
                                onClick={() => sendFromAccordion(COVERAGE_TOPIC_PROMPTS[topic] ?? `Tell me about ${topic}.`)}
                                className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-[#D4AF37]/[0.08] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] hover:scale-[1.06] active:scale-95"
                              >
                                <div className={`w-10 h-10 rounded-[12px] ${bg} ring-1 ${ring} flex items-center justify-center shadow-md group-hover:shadow-[0_0_14px_rgba(212,175,55,0.20)] transition-all`}>
                                  <TopicIcon className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-[8px] font-semibold text-white/80 group-hover:text-white text-center leading-tight transition-colors line-clamp-2 w-full px-0.5">{topic}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}{/* end covers accordion content */}
                    </div>{/* end What Genie Covers accordion */}

                    </div>{/* end accordions */}

                  </div>{/* end right column */}

                </div>{/* end two-column console */}

                </div>{/* end z-[2] wrapper */}
              </div>

            </div>{/* end dashboard wrapper */}

            {/* ── Mobile chat messages — disabled; chat now embedded in right column ── */}
            {messages.length > 0 && false && (
              <div className="hidden px-4 py-6 space-y-5 max-w-4xl mx-auto w-full">
                {messageBubbles}
                {typingIndicator}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── Desktop Chat Overlay — disabled; chat is now embedded in right column ── */}
          {messages.length > 0 && false && (
            <div className="hidden md:flex fixed inset-0 z-[72] items-center justify-center pointer-events-none">
              {/* Backdrop — click to close */}
              <div
                className="absolute inset-0 pointer-events-auto"
                style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)" }}
                onClick={goHome}
              />
              {/* Floating panel */}
              <div
                className="relative pointer-events-auto flex flex-col rounded-2xl overflow-hidden"
                style={{
                  width: "min(740px, calc(100vw - 80px))",
                  height: "78vh",
                  background: "rgba(8,16,36,0.18)",
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                {/* Panel header */}
                <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.10]" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md shadow-cyan-500/25">
                      <GenieBottle className="h-3.5 w-3.5 text-white genie-icon-shimmer" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">askGenie</span>
                    <span className="text-xs text-white/30 font-medium">— Student Aid Hub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goHome}
                      title="New chat"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/30 hover:text-cyan-300 hover:bg-cyan-500/[0.10] transition-all duration-150"
                    >
                      <Home className="h-3.5 w-3.5" />
                      Home
                    </button>
                    <button
                      onClick={goHome}
                      title="Close chat"
                      className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/[0.10] transition-all duration-150"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages scroll area */}
                <div ref={desktopChatScrollRef} className="flex-1 overflow-y-auto min-h-0 genie-scroll-main px-5 py-5 space-y-5">
                  {messageBubbles}
                  {typingIndicator}
                  <div ref={desktopBottomRef} />
                </div>

                {/* Input — desktop overlay version (textareaRef lives here) */}
                <div className="shrink-0 relative px-4 pt-3 pb-3">
                        <div className="relative w-full max-w-xl mx-auto">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <GenieBottle className="h-3.5 w-3.5 text-amber-400 shrink-0 genie-icon-shimmer" />
                      <span className="text-sm font-semibold tracking-wide">
                        <span style={{ background: "linear-gradient(90deg, #FFFFFF 0%, #D8EEFF 20%, #FFFFFF 40%, #EAF5FF 60%, #FFFFFF 80%, #D0E8FF 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "genie-white-shimmer 4s linear infinite" }}>askGenie</span>
                      </span>
                      <div className={`h-px flex-1 ${isDark ? "bg-white/[0.06]" : "bg-black/[0.12]"}`} />
                    </div>
                    <div className={`flex items-center gap-1.5 flex-wrap mb-2.5 px-1 rounded-xl transition-all duration-300 ${howItWorksActive === "role" ? "hiw-active-shimmer py-1.5 -mx-1" : ""}`}>
                      <span className={`text-[10px] font-semibold tracking-wide mr-0.5 shrink-0 ${isDark ? "text-white" : "text-gray-900"}`}>I am a:</span>
                      {ROLE_OPTIONS.map(({ label, icon: RoleIcon, color, ring, bg }) => (
                        <button key={label} type="button" aria-pressed={selectedRole === label}
                          onClick={() => { syncRoles(selectedRole === label ? null : label); if (selectedRole !== label) setSlideIndex(1); }}
                          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ring-1 ${selectedRole === label ? `${color} ${bg} ${ring}` : isDark ? "text-white/80 bg-transparent ring-white/[0.22] hover:text-white hover:bg-white/[0.10] hover:ring-white/50" : "text-gray-800 bg-transparent ring-black/[0.18] hover:text-gray-900 hover:bg-black/[0.06] hover:ring-black/30"}`}>
                          <RoleIcon className="h-2.5 w-2.5 shrink-0" />{label}
                        </button>
                      ))}
                      {selectedRole && (<button type="button" onClick={() => syncRoles(null)} className="text-[10px] text-white/50 hover:text-white/80 transition-colors ml-0.5">✕ clear</button>)}
                    </div>
                    {attachedFile && (
                      <div className="flex items-center gap-2 px-3 py-2 mb-1.5 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
                        {attachedFile!.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-indigo-300 shrink-0" /> : attachedFile!.type === "audio" ? <Mic className="h-3.5 w-3.5 text-rose-300 shrink-0" /> : <Paperclip className="h-3.5 w-3.5 text-indigo-300 shrink-0" />}
                        <span className="text-xs text-white/80 flex-1 truncate">{attachedFile!.name}</span>
                        <button type="button" onClick={() => setAttachedFile(null)} className="text-white/35 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                    <div className={`rounded-2xl ring-1 focus-within:ring-white/70 transition-all duration-200 ${howItWorksActive === "guidance" ? "hiw-guidance-chatbox" : howItWorksActive === "chatbox" ? "hiw-active-ring" : (!input && !attachedFile ? "ring-white/40" : "ring-white/65")}`} style={{ background: "rgba(255,255,255,0.09)", boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 4px 28px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.10) inset" }}>
                      <form onSubmit={handleSubmit} className="flex gap-2 items-end px-3 py-2.5">
                        <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                          <button type="button" title={canAccessFeature("document_upload", userTier) ? "Upload document" : "Pro — upload documents"} onClick={() => canAccessFeature("document_upload", userTier) ? fileInputRef.current?.click() : openUpgrade("document_upload")} className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${canAccessFeature("document_upload", userTier) ? "text-white hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.25)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}><Paperclip className="h-4 w-4" /></button>
                          <button type="button" title={canAccessFeature("document_upload", userTier) ? "Upload photo" : "Pro — upload photos"} onClick={() => canAccessFeature("document_upload", userTier) ? cameraInputRef.current?.click() : openUpgrade("document_upload")} className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${canAccessFeature("document_upload", userTier) ? "text-white hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.25)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}><Camera className="h-4 w-4" /></button>
                          <button type="button" title={!canAccessFeature("document_upload", userTier) ? "Pro — voice messages" : isRecording ? "Stop recording" : "Record voice message"} onClick={!canAccessFeature("document_upload", userTier) ? () => openUpgrade("document_upload") : isRecording ? stopVoiceRecording : startVoiceRecording} className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${isRecording ? "text-rose-400 bg-rose-500/20 ring-1 ring-rose-500/40 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.45)]" : canAccessFeature("document_upload", userTier) ? "text-white hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.25)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}>{isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
                        </div>
                        <div className="flex-1 relative">
                          {isRecording && voiceTranscript && (<p className="absolute top-0 left-2 right-2 text-xs text-rose-300/80 italic pointer-events-none truncate">🎙 {voiceTranscript}</p>)}
                          <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            aria-label="Ask Genie a financial aid question"
                            placeholder={isRecording ? "🎙 Listening… speak your question…" : "Type here and send it!"}
                            rows={1}
                            className="w-full resize-none px-2 py-1.5 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none leading-relaxed"
                            style={{ minHeight: "40px", maxHeight: "160px" }}
                          />
                        </div>
                        {isStreaming ? (
                          <button type="button" onClick={stopStreaming} title="Stop generating" className="shrink-0 mb-0.5 flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-300 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400" style={{ background: "rgba(244,63,94,0.14)", boxShadow: "0 0 0 1px rgba(244,63,94,0.30), 0 2px 10px rgba(244,63,94,0.20)" }}>
                            <Square className="h-3.5 w-3.5 fill-current" />Stop
                          </button>
                        ) : (
                          <button type="submit" disabled={(!input.trim() && !attachedFile) || isLoading} onClick={triggerOrbGold} className="shrink-0 mb-0.5 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold tracking-wide active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400" style={{ background: "linear-gradient(135deg, #00B8C8 0%, #00D1C9 50%, #0099B8 100%)", boxShadow: "0 0 0 1px rgba(0,209,201,0.50), 0 2px 16px rgba(0,209,201,0.40), 0 0 32px rgba(0,229,192,0.20), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                            <GenieBottle className="h-4 w-4 text-amber-200 genie-send-icon" />Send
                          </button>
                        )}
                      </form>
                    </div>
                    <p className="mt-1 text-[9px] text-cyan-400/25 text-center leading-snug">Enter ↵ to send · Shift+Enter new line · Unofficial guidance — verify with FSA Handbook</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input area — disabled; all sizes use embedded chat in right column */}
          <div className="shrink-0 relative hidden px-3 pt-1.5 pb-1.5" style={{ zIndex: 3 }}>
            {/* Ambient glow bloom behind chatbox */}

            <div className="relative w-full max-w-xl mx-auto">
              {/* Prompt label row — hidden (desktop uses right column card) */}
              <div className="hidden items-center gap-2 mb-2 px-1">
                <GenieBottle className="h-3.5 w-3.5 text-amber-400 shrink-0 genie-icon-shimmer" />
                <span className="text-sm font-semibold tracking-wide">
                  <span style={{ background: "linear-gradient(90deg, #FFFFFF 0%, #D8EEFF 20%, #FFFFFF 40%, #EAF5FF 60%, #FFFFFF 80%, #D0E8FF 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "genie-white-shimmer 4s linear infinite" }}>askGenie</span>
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
                {messages.length > 0 && (
                  <button
                    onClick={goHome}
                    title="Back to Home"
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium text-white/30 hover:text-cyan-300 hover:bg-cyan-500/[0.08] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shrink-0"
                  >
                    <Home className="h-3 w-3" />
                    Home
                  </button>
                )}
              </div>
              {/* Role selector — mobile: icon-only row; desktop: full pill row */}
              <div className={`flex md:hidden items-center gap-0.5 mb-1.5 px-1 rounded-xl transition-all duration-300 ${howItWorksActive === "role" ? "hiw-active-shimmer py-1 -mx-1" : ""}`}>
                <span className="text-[10px] font-semibold text-white/45 tracking-wide mr-1 shrink-0">Role:</span>
                {ROLE_OPTIONS.map(({ label, icon: RoleIcon, color, ring, bg }) => (
                  <button
                    key={label}
                    type="button"
                    title={label}
                    aria-pressed={selectedRole === label}
                    onClick={() => { syncRoles(selectedRole === label ? null : label); if (selectedRole !== label) setSlideIndex(1); }}
                    className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${selectedRole === label ? `${color} ${bg} ring-1 ${ring}` : "text-white/35 hover:text-white/65"}`}
                  >
                    <RoleIcon className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ))}
                {selectedRole && (
                  <button type="button" onClick={() => syncRoles(null)} className="text-[9px] text-white/25 hover:text-white/55 transition-colors ml-0.5">✕</button>
                )}
              </div>
              <div className={`hidden md:flex items-center gap-1.5 flex-wrap md:mb-2.5 px-1 rounded-xl transition-all duration-300 ${howItWorksActive === "role" ? "hiw-active-shimmer py-1.5 -mx-1" : ""}`}>
                <span className={`text-[10px] font-semibold tracking-wide mr-0.5 shrink-0 ${isDark ? "text-white" : "text-gray-900"}`}>I am a:</span>
                {ROLE_OPTIONS.map(({ label, icon: RoleIcon, color, ring, bg }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selectedRole === label}
                    onClick={() => { syncRoles(selectedRole === label ? null : label); if (selectedRole !== label) setSlideIndex(1); }}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ring-1 ${
                      selectedRole === label
                        ? `${color} ${bg} ${ring}`
                        : isDark ? "text-white/80 bg-transparent ring-white/[0.22] hover:text-white hover:bg-white/[0.10] hover:ring-white/50" : "text-gray-800 bg-transparent ring-black/[0.18] hover:text-gray-900 hover:bg-black/[0.06] hover:ring-black/30"
                    }`}
                    style={selectedRole === label ? {} : undefined}
                  >
                    <RoleIcon className="h-2.5 w-2.5 shrink-0" />
                    {label}
                  </button>
                ))}
                {selectedRole && (
                  <button
                    type="button"
                    onClick={() => syncRoles(null)}
                    className="text-[10px] text-white/50 hover:text-white/80 transition-colors ml-0.5"
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
                accept="image/*"
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
              <div
                className={`rounded-2xl ring-1 focus-within:ring-white/70 transition-all duration-200 ${howItWorksActive === "guidance" ? "hiw-guidance-chatbox" : howItWorksActive === "chatbox" ? "hiw-active-ring" : (!input && !attachedFile ? "ring-white/40" : "ring-white/65")}`}
                style={{
                  background: "rgba(255,255,255,0.09)",
                  boxShadow: howItWorksActive === "chatbox"
                    ? "0 0 0 2px rgba(255,255,255,0.60), 0 0 40px rgba(255,255,255,0.18), 0 0 80px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.12) inset"
                    : "0 0 0 1px rgba(255,255,255,0.10), 0 4px 28px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.10) inset",
                }}
              >
                <form
                  onSubmit={handleSubmit}
                  className="flex gap-2 items-end px-3 py-2.5"
                >
                  {/* Upload + mic buttons — teal on mobile, white on desktop */}
                  <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                    <button type="button" title={canAccessFeature("document_upload", userTier) ? "Upload document (.pdf, .txt, .doc, .csv)" : "Pro — upload documents"}
                      onClick={() => canAccessFeature("document_upload", userTier) ? fileInputRef.current?.click() : openUpgrade("document_upload")}
                      className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${canAccessFeature("document_upload", userTier) ? "text-white/70 hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.20)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}>
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button type="button" title={canAccessFeature("document_upload", userTier) ? "Attach photo or screenshot" : "Pro — attach photos & screenshots"}
                      onClick={() => canAccessFeature("document_upload", userTier) ? cameraInputRef.current?.click() : openUpgrade("document_upload")}
                      className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${canAccessFeature("document_upload", userTier) ? "text-white/70 hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.20)]" : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"}`}>
                      <Camera className="h-4 w-4" />
                    </button>
                    <button type="button"
                      title={!canAccessFeature("document_upload", userTier) ? "Pro — voice messages" : isRecording ? "Stop recording" : "Record voice message"}
                      onClick={!canAccessFeature("document_upload", userTier) ? () => openUpgrade("document_upload") : isRecording ? stopVoiceRecording : startVoiceRecording}
                      className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        isRecording
                          ? "text-rose-400 bg-rose-500/20 ring-1 ring-rose-500/40 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.45)]"
                          : canAccessFeature("document_upload", userTier)
                          ? "text-white/70 hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_8px_rgba(255,255,255,0.20)]"
                          : "text-white/22 hover:text-violet-400 hover:bg-violet-500/15"
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
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      aria-label="Ask Genie a financial aid question"
                      placeholder={isRecording ? "🎙 Listening… speak your question…" : "Type here and send it!"}
                      rows={1}
                      className="w-full resize-none px-2 py-1.5 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none leading-relaxed"
                      style={{ minHeight: "40px", maxHeight: "160px" }}
                    />
                  </div>
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stopStreaming}
                      title="Stop generating"
                      className="shrink-0 mb-0.5 flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-300 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      style={{
                        background: "rgba(244,63,94,0.14)",
                        boxShadow: "0 0 0 1px rgba(244,63,94,0.30), 0 2px 10px rgba(244,63,94,0.20)",
                      }}
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      Stop
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={(!input.trim() && !attachedFile) || isLoading}
                      onClick={triggerOrbGold}
                      className="shrink-0 mb-0.5 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold tracking-wide active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400"
                      style={{
                        background: "linear-gradient(135deg, #00B8C8 0%, #00D1C9 50%, #0099B8 100%)",
                        boxShadow: "0 0 0 1px rgba(0,209,201,0.50), 0 2px 16px rgba(0,209,201,0.40), 0 0 32px rgba(0,229,192,0.20), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      <GenieBottle className="h-4 w-4 text-amber-200 genie-send-icon" />
                      Send
                    </button>
                  )}
                </form>
              </div>


              <p className="hidden md:block mt-1 text-[9px] text-cyan-400/65 text-center leading-snug">
                Enter ↵ to send · Shift+Enter new line · Unofficial guidance — verify with FSA Handbook
              </p>
            </div>
          </div>

          {/* ── Site Footer Bar ── */}
          <div className="shrink-0 px-3 py-1 md:px-4 md:py-2" style={{ zIndex: 3 }}>
            <div className="flex flex-wrap justify-center items-center gap-x-0 gap-y-0.5 mb-0.5">
              {[
                { label: "Plans & Pricing",     href: "/pricing",      cls: "font-semibold text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "Get the App",         href: "#install",      cls: "font-semibold text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "FAQ",                 href: "/pricing#faq",  cls: "font-medium text-white hover:text-white hover:bg-white/[0.06]" },
                { label: "Support Dev",         href: "/support",      cls: "font-medium text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "@one27__",            href: "https://x.com/one27__", cls: "font-semibold text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "Terms & Privacy",     href: "/legal",        cls: "font-medium text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "School DPA",          href: "/dpa",          cls: "font-medium text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "About",               href: "/about",        cls: "font-medium text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "For Schools",         href: "/institutions", cls: "font-semibold text-white hover:text-white hover:bg-white/[0.08]" },
                { label: "Do Not Sell My Info", href: "/legal#ccpa",   cls: "font-medium text-white hover:text-white hover:bg-white/[0.06]" },
              ].map(({ label, href, cls }, i, arr) => (
                <span key={label} className="contents">
                  {href === "#install"
                    ? <button type="button" onClick={() => setShowAppModal(true)} className={`px-1 py-px rounded-full text-[7px] md:text-[9px] md:px-1.5 transition-all duration-150 hw-footer-glow ${cls}`}>{label}</button>
                    : <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`px-1 py-px rounded-full text-[7px] md:text-[9px] md:px-1.5 transition-all duration-150 hw-footer-glow ${cls}`}>{label}</a>
                  }
                  {i < arr.length - 1 && <span className="text-white/10 text-[7px] md:text-[9px] select-none px-0.5">·</span>}
                </span>
              ))}
            </div>
            <p className="text-[8px] text-center text-cyan-400/70">
              © 2026 Genie Student Aid Hub | Developed by One27 | All Rights Reserved · Not affiliated with U.S. Dept. of Education
            </p>
          </div>

        </main>

        {/* ── Right Dropdown — Administrators, Leaders & Auditors ── */}
        <aside
          className={`panel-white ${showMobileRight ? "flex" : "hidden"} fixed z-[60] flex-col rounded-2xl overflow-hidden backdrop-blur-2xl`}
          style={{ top: "84px", right: "8px", width: "min(620px, calc(100vw - 16px))", maxHeight: "calc(100dvh - 96px)", background: "rgba(10,4,22,0.28)", border: "1px solid rgba(212,175,55,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.10)" }}
        >
          {howItWorksActive === "panels" && <div className="hiw-scan-overlay" aria-hidden="true" />}

          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.08]" style={{ background: "rgba(12,5,28,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(212,175,55,0.18)", boxShadow: "0 0 12px rgba(212,175,55,0.45), 0 0 0 1px rgba(212,175,55,0.30)" }}>
                <GenieBottle className="h-4 w-4 genie-icon-shimmer" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 5px rgba(212,175,55,0.80))" }} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Student Aid Hub</p>
                <p className="font-black tracking-tight leading-none select-none" style={{ fontSize: "clamp(0.95rem, 3.5vw, 1.125rem)", background: "linear-gradient(90deg, #FFFFFF 0%, #D8EEFF 20%, #FFFFFF 40%, #EAF5FF 60%, #FFFFFF 80%, #D0E8FF 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "genie-white-shimmer 4s linear infinite" }}>Admin, Leaders &amp; Compliance</p>
              </div>
            </div>
            <button onClick={() => setShowMobileRight(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto genie-scroll p-4">
            <div className="flex flex-col gap-2.5">

              {/* Section icon grid */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "rc-adm-qa",       label: "Admin Actions",    img: "/images/sec-admin.jpg",              pos: "object-[50%_14%]", Icon: ClipboardList },
                  { key: "rc-lea-qa",       label: "Leader Actions",   img: "/images/sec-leaders.jpg",            pos: "object-[50%_18%]", Icon: Users },
                  { key: "rc-aud-qa",       label: "Compliance QA",    img: "/images/sec-compliance.jpg",         pos: "object-[50%_45%]", Icon: ShieldCheck },
                  { key: "rc-fa-adm",       label: "Admin Resources",  img: "/images/sec-admin-advisors.jpg",     pos: "object-[50%_22%]", Icon: BookOpen },
                  { key: "rc-lac",          label: "Compliance",       img: "/images/sec-leaders-compliance.jpg", pos: "object-[50%_18%]", Icon: Scale },
                  { key: "rc-loan-portals", label: "Loan Portals",     img: "/images/sec-loan-portals.jpg",       pos: "object-[50%_20%]", Icon: DollarSign },
                  { key: "rc-hw",           label: "Health & Wellness", img: "/images/sec-wellness.jpg",          pos: "object-[50%_12%]", Icon: Sparkles },
                  { key: "rc-va",           label: "VA Resources",     img: "/images/sec-va-right.jpg",           pos: "object-[50%_18%]", Icon: ShieldCheck },
                  { key: "rc-mh-admin",     label: "Mental Health",    img: "/images/mental.jpg",                 pos: "object-[50%_14%]", Icon: Sparkles },
                  { key: "rc-vol-admin",    label: "Volunteer",        img: "/images/sec-volunteer-right.jpg",    pos: "object-[50%_18%]", Icon: Users },
                  { key: "rc-faith",        label: "Faith & Spirit",   img: "/images/sec-faith-admin.jpg",         pos: "object-[50%_30%]", Icon: Star },
                  { key: "rc-research",     label: "Research & Policy", img: "/images/sec-research-admin.jpg",      pos: "object-[50%_22%]", Icon: BookOpen },
                  { key: "rc-indep",        label: "Independent Resources", img: "/images/sec-indep-admin.jpg",    pos: "object-[50%_30%]", Icon: Gavel },
                ]).map(({ key, label, img, pos, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setOverlaySection(key)}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/60 shadow-md shadow-black/40 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
                    style={{ aspectRatio: "1.6 / 1" }}
                  >
                    <img src={img} alt="" className={`w-full h-full object-cover ${pos}`} style={{ filter: "saturate(1.18) contrast(1.04) brightness(1.10)", opacity: 0.38 }} onError={(e) => { e.currentTarget.style.display = "none"; const fb = e.currentTarget.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = "flex"; }} />
                    <div style={{ display: "none" }} className="absolute inset-0 items-center justify-center bg-gradient-to-br from-indigo-900/80 via-slate-900/90 to-[#04091A]">
                      {Icon && <Icon className="h-9 w-9 text-indigo-300/60" />}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04091A]/65 via-[#04091A]/20 to-transparent group-hover:from-[#04091A]/50 transition-all duration-200" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-[#00D4FF]/40 transition-all duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                      <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">{label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Contact Leaders (collapsible) */}
              {(() => {
                const ck = "rc-contact-leaders";
                const expanded = expandedSections.has(ck);
                const contacts = [
                  { label: "Find My Rep",      sub: "U.S. House",        href: "https://www.house.gov/representatives/find-your-representative", Icon: Landmark },
                  { label: "Find My Senator",  sub: "U.S. Senate",       href: "https://www.senate.gov/senators/senators-contact.htm",          Icon: Users },
                  { label: "White House",       sub: "Contact President", href: "https://www.whitehouse.gov/contact",                            Icon: Star },
                  { label: "Congress.gov",      sub: "Bills & Laws",      href: "https://congress.gov",                                          Icon: BookOpen },
                  { label: "Elected Officials", sub: "USA.gov",           href: "https://www.usa.gov/elected-officials",                         Icon: ShieldCheck },
                  { label: "State Lawmakers",   sub: "NCSL Directory",    href: "https://www.ncsl.org/state-legislatures",                       Icon: MapPin },
                ];
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setExpandedSections(p => { const n = new Set(p); n.has(ck) ? n.delete(ck) : n.add(ck); return n; })}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/[0.18]" />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#091222] ring-1 ring-[#D4AF37]/[0.22]">
                        <Landmark className="h-2.5 w-2.5 text-[#D4AF37]/80" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">Contact Leaders</span>
                        <ChevronDown className={`h-2.5 w-2.5 text-white/30 transition-transform duration-200${expanded ? " rotate-180" : ""}`} />
                      </div>
                      <div className="h-px w-3 bg-[#D4AF37]/[0.18]" />
                    </div>
                    {expanded && (
                      <div className="grid grid-cols-2 gap-2">
                        {contacts.map(({ label, sub, href, Icon }) => (
                          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl ring-1 ring-white/[0.08] hover:ring-[#D4AF37]/40 transition-all duration-150 group"
                            style={{ background: "rgba(10,20,44,0.55)" }}>
                            <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(212,175,55,0.12)" }}>
                              <Icon className="h-3.5 w-3.5 text-[#D4AF37]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-white/85 group-hover:text-white truncate leading-tight transition-colors">{label}</p>
                              <p className="text-[9px] text-white/35 truncate leading-tight">{sub}</p>
                            </div>
                            <ExternalLink className="h-2.5 w-2.5 text-white/20 group-hover:text-[#D4AF37]/60 shrink-0 transition-colors" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Admin Videos (collapsible) */}
              {(() => {
                const ck = "rc-admin-vid";
                const expanded = expandedSections.has(ck);
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setExpandedSections(p => { const n = new Set(p); n.has(ck) ? n.delete(ck) : n.add(ck); return n; })}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-500/[0.14]" />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#091222] ring-1 ring-red-500/[0.18]">
                        <Library className="h-2.5 w-2.5 text-red-400/80" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">Featured Videos</span>
                        <ChevronDown className={`h-2.5 w-2.5 text-white/30 transition-transform duration-200${expanded ? " rotate-180" : ""}`} />
                      </div>
                      <div className="h-px w-3 bg-red-500/[0.14]" />
                    </div>
                    {expanded && <div className="grid grid-cols-2 gap-2">
                      {[{ id: "P6FORpg0KVo", title: "Aid Packaging & Verification" }, { id: "HAnw168huqA", title: "Regulatory Compliance" }, { id: "rhgwIhB58PA", title: "Student Aid Overview" }, { id: "kKvK2foOTJM", title: "Financial Aid Administration" }].map(({ id, title }) => (
                        <div key={id} className="relative rounded-xl overflow-hidden ring-1 ring-white/[0.08] shadow-sm shadow-black/30" style={{ aspectRatio: "16/9" }}>
                          {expandedSections.has(`vid-${id}`) ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
                              title={title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0"
                            />
                          ) : (
                            <button type="button" onClick={() => setExpandedSections(p => { const n = new Set(p); n.add(`vid-${id}`); return n; })} className="w-full h-full group">
                              <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt={title} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"/>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-red-600 transition-colors shadow-lg">
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                                <p className="text-[11px] text-white/85 truncate leading-tight">{title}</p>
                              </div>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2.5 border-t border-[#1E2A4A]">
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2">
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300/70 leading-relaxed">General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.</p>
            </div>
          </div>
        </aside>

      </div>

      {/* ── Section Resource Overlay ── */}
      {overlaySection !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setOverlaySection(null)}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
          <div
            className="relative z-[81] w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
            style={{ maxHeight: "calc(100dvh - 64px)", background: "rgba(130,130,140,0.18)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.22)", boxShadow: "0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,200,210,0.12), inset 0 1px 0 rgba(255,255,255,0.18)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Banner header */}
            {(() => {
              const OVERLAY_META: Record<string, { title: string; banner: string; bannerPos: string }> = {
                "lc-s-qa":        { title: "Students Quick Actions",                banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 30%" },
                "lc-p-qa":        { title: "Parents Quick Actions",                 banner: "/images/banner-ov-parent.jpg",        bannerPos: "50% 30%" },
                "lc-fed-sp":      { title: "Federal Student Aid",                   banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 40%" },
                "lc-resume":      { title: "Resume Assistance",                     banner: "/images/banner-ov-editor.jpg",        bannerPos: "50% 25%" },
                "lc-schol":       { title: "Scholarship Search Engines",            banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 20%" },
                "lc-intern":      { title: "Internship / Career Search",            banner: "/images/banner-ov-editor.jpg",        bannerPos: "50% 30%" },
                "lc-jobs":        { title: "Student Job Search",                    banner: "/images/banner-ov-night.jpg",         bannerPos: "50% 35%" },
                "lc-finlit":      { title: "Financial Literacy",                    banner: "/images/banner-ov-parent.jpg",        bannerPos: "50% 25%" },
                "lc-loans":       { title: "Private Student Loans",                 banner: "/images/banner-ov-night.jpg",         bannerPos: "50% 30%" },
                "lc-consumer":    { title: "Bills & Consumer Rights",               banner: "/images/banner-ov-editor.jpg",        bannerPos: "50% 35%" },
                "lc-mental":      { title: "Mental Health Resources",               banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 25%" },
                "lc-ai":          { title: "AI Literacy",                           banner: "/images/banner-ov-night.jpg",         bannerPos: "50% 20%" },
                "lc-faith":       { title: "Religion & Faith",                      banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 30%" },
                "lc-vol":         { title: "Volunteer & Community",                 banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 35%" },
                "lc-va":          { title: "VA Resources",                          banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 28%" },
                "rc-adm-qa":      { title: "Administrators Quick Actions",          banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 25%" },
                "rc-lea-qa":      { title: "Leaders Quick Actions",                 banner: "/images/banner-ov-leader.jpg",        bannerPos: "50% 25%" },
                "rc-aud-qa":      { title: "Compliance/Auditors Quick Actions",     banner: "/images/banner-ov-leader.jpg",        bannerPos: "50% 30%" },
                "rc-fa-adm":      { title: "Administrators & Advisors",             banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 30%" },
                "rc-lac":         { title: "Leaders & Compliance/Auditors",         banner: "/images/banner-ov-leader.jpg",        bannerPos: "50% 28%" },
                "rc-loan-portals":{ title: "Private Loan Administrator Portals",    banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 35%" },
                "rc-hw":          { title: "Health & Wellness Support",             banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 22%" },
                "rc-va":          { title: "VA Resources",                          banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 30%" },
                "rc-mh-admin":    { title: "Mental Health — Professional Wellness", banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 25%" },
                "rc-vol-admin":   { title: "Volunteer & Community Service",         banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 30%" },
                "rc-faith":      { title: "Faith, Spirit & Wellness",              banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 28%" },
                "lc-research":   { title: "Research & Peer-Reviewed Journals",     banner: "/images/banner-ov-night.jpg",         bannerPos: "50% 20%" },
                "lc-indep":      { title: "Validated Independent Resources",       banner: "/images/banner-ov-editor.jpg",        bannerPos: "50% 30%" },
                "rc-research":   { title: "Research, Policy & Journals",           banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 25%" },
                "rc-indep":      { title: "Validated Independent Resources",       banner: "/images/banner-ov-leader.jpg",        bannerPos: "50% 28%" },
              };
              const sec = overlaySection!;
              const meta = OVERLAY_META[sec] ?? { title: sec, banner: "/images/banner-ov-admin.jpg", bannerPos: "50% 30%" };
              return (
                <div className="relative shrink-0 h-24 overflow-hidden">
                  <img src={meta.banner} alt="" className="w-full h-full object-cover" style={{ objectPosition: meta.bannerPos }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.60) 100%)" }} />
                  <div className="absolute inset-0 flex items-end justify-between px-5 pb-3.5">
                    <h2 className="text-sm font-black tracking-tight text-white">
                      {meta.title}
                    </h2>
                    <button onClick={() => setOverlaySection(null)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.12] transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* === Quick Action sections — Android icon grid === */}
              {["lc-s-qa", "lc-p-qa", "rc-adm-qa", "rc-lea-qa", "rc-aud-qa"].includes(overlaySection!) && (() => {
                const cfgMap: Record<string, { role: string; tileHover: string; ringFocus: string; bgHover: string; ringHover: string; iconHover: string; glow: string }> = {
                  "lc-s-qa":   { role: "Students",       tileHover: "hover:bg-sky-500/[0.10]",     ringFocus: "focus-visible:ring-sky-400",     bgHover: "group-hover:bg-sky-500/20",     ringHover: "group-hover:ring-sky-500/40",     iconHover: "group-hover:text-sky-300",     glow: "group-hover:shadow-[0_0_18px_rgba(56,189,248,0.28)]"  },
                  "lc-p-qa":   { role: "Parents",        tileHover: "hover:bg-blue-500/[0.10]",    ringFocus: "focus-visible:ring-blue-400",    bgHover: "group-hover:bg-blue-500/20",    ringHover: "group-hover:ring-blue-500/40",    iconHover: "group-hover:text-blue-300",    glow: "group-hover:shadow-[0_0_18px_rgba(96,165,250,0.28)]"  },
                  "rc-adm-qa": { role: "Administrators", tileHover: "hover:bg-emerald-500/[0.10]", ringFocus: "focus-visible:ring-emerald-400", bgHover: "group-hover:bg-emerald-500/20", ringHover: "group-hover:ring-emerald-500/40", iconHover: "group-hover:text-emerald-300", glow: "group-hover:shadow-[0_0_18px_rgba(16,185,129,0.28)]"  },
                  "rc-lea-qa": { role: "Leaders",        tileHover: "hover:bg-violet-500/[0.10]",  ringFocus: "focus-visible:ring-violet-400",  bgHover: "group-hover:bg-violet-500/20",  ringHover: "group-hover:ring-violet-500/40",  iconHover: "group-hover:text-violet-300",  glow: "group-hover:shadow-[0_0_18px_rgba(139,92,246,0.28)]"  },
                  "rc-aud-qa": { role: "Auditors",       tileHover: "hover:bg-rose-500/[0.10]",    ringFocus: "focus-visible:ring-rose-400",    bgHover: "group-hover:bg-rose-500/20",    ringHover: "group-hover:ring-rose-500/40",    iconHover: "group-hover:text-rose-300",    glow: "group-hover:shadow-[0_0_18px_rgba(244,63,94,0.28)]"   },
                };
                const cfg = cfgMap[overlaySection!];
                const r = QUICK_ACTIONS_BY_ROLE.find(x => x.role === cfg.role);
                const all = r ? [...r.items, ...r.more] : [];
                return (
                  <div className="grid grid-cols-5 gap-2">
                    {all.map(({ icon: Icon, label, q }) => (
                      <button key={label} onClick={() => { sendMessage(q); setOverlaySection(null); setShowMobileLeft(false); setShowMobileRight(false); }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl ${cfg.tileHover} transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 ${cfg.ringFocus} hover:scale-[1.06] active:scale-95`}>
                        <div className={`w-14 h-14 rounded-[16px] bg-white/[0.08] ring-1 ring-white/[0.18] flex items-center justify-center shadow-lg ${cfg.bgHover} ${cfg.ringHover} ${cfg.glow} transition-all`}>
                          <Icon className={`h-6 w-6 text-white/70 ${cfg.iconHover} transition-colors`} />
                        </div>
                        <span className="text-[9px] font-semibold text-white/65 group-hover:text-white text-center leading-tight transition-colors line-clamp-2 w-full px-0.5">{label}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* === Flat link sections — favicon icon grid === */}
              {["lc-fed-sp", "rc-fa-adm", "rc-lac", "rc-loan-portals", "rc-hw", "rc-mh-admin", "rc-vol-admin"].includes(overlaySection!) && (() => {
                const dataMap: Record<string, LinkItem[]> = {
                  "lc-fed-sp":       FEDERAL_RESOURCES.find(g => g.group === "Students & Parents")?.links ?? [],
                  "rc-fa-adm":       (() => { const g = FEDERAL_RESOURCES.find(x => x.group === "Administrators & Advisors"); return [...(g?.links ?? []), ...((g?.more ?? []) as MaybeSubcat[]).filter(i => !isSubcat(i))] as LinkItem[]; })(),
                  "rc-lac":          (() => { const g = FEDERAL_RESOURCES.find(x => x.group === "Leaders, Auditors & Compliance"); return [...(g?.links ?? []), ...((g?.more ?? []) as MaybeSubcat[]).filter(i => !isSubcat(i))] as LinkItem[]; })(),
                  "rc-loan-portals": FEDERAL_RESOURCES.find(g => g.group === "Private Loan Administrator Portals")?.links ?? [],
                  "rc-hw":           (() => { const g = FEDERAL_RESOURCES.find(x => x.group === "Health Wellness Support"); return [...(g?.links ?? []), ...((g?.more ?? []) as MaybeSubcat[]).filter(i => !isSubcat(i))] as LinkItem[]; })(),
                  "rc-mh-admin":     MENTAL_HEALTH_ADMIN,
                  "rc-vol-admin":    VOLUNTEER_ADMIN,
                };
                const links = dataMap[overlaySection!] ?? [];
                return (
                  <div className="grid grid-cols-4 gap-3">
                    {links.map(({ name, url }: LinkItem) => {
                      const hostname = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
                      const iconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=256`;
                      const [g1, g2] = getSiteGradient(hostname);
                      const SiteIco = getSiteIcon(url) as any;
                      return (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-white/[0.07] transition-all duration-200 group hover:scale-[1.06] active:scale-95 group-hover:shadow-[0_0_18px_rgba(0,212,255,0.15)]">
                          <div className="w-16 h-16 rounded-[18px] ring-1 ring-white/[0.10] flex items-center justify-center shadow-md overflow-hidden group-hover:ring-sky-500/40 group-hover:shadow-[0_0_16px_rgba(0,212,255,0.20)] transition-all" style={{ background: "rgba(255,255,255,0.07)" }}>
                            <img src={iconUrl} width="48" height="48" alt="" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = "none"; const fb = e.currentTarget.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = "flex"; }} />
                            <div style={{ display: "none", background: `linear-gradient(135deg, ${g1}, ${g2})` }} className="w-full h-full items-center justify-center shrink-0">
                              <SiteIco className="h-7 w-7 text-white/90" />
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold text-white/65 group-hover:text-white text-center leading-tight transition-colors line-clamp-2 w-full px-0.5">{name}</span>
                          <span className="text-[8px] text-white/40 group-hover:text-sky-400/70 text-center leading-tight transition-colors line-clamp-1 w-full px-0.5">{hostname.replace(/^www\./, "")}</span>
                        </a>
                      );
                    })}
                  </div>
                );
              })()}

              {/* === Subcategorized link sections — banner + favicon icon grid === */}
              {["lc-resume", "lc-schol", "lc-intern", "lc-jobs", "lc-finlit", "lc-loans", "lc-consumer", "lc-mental", "lc-ai", "lc-faith", "rc-faith", "lc-vol", "rc-va", "lc-va", "lc-research", "lc-indep", "rc-research", "rc-indep"].includes(overlaySection!) && (() => {
                const rawMap: Record<string, MaybeSubcat[]> = {
                  "lc-resume": [...RESUME_ASSISTANCE, ...RESUME_ASSISTANCE_MORE],
                  "lc-schol":  ([{ subcat: "All" }, ...SCHOLARSHIP_ENGINES, ...SCHOLARSHIP_ENGINES_MORE] as MaybeSubcat[]),
                  "lc-intern": ([{ subcat: "All" }, ...INTERNSHIP_SEARCH, ...INTERNSHIP_SEARCH_MORE] as MaybeSubcat[]),
                  "lc-jobs":   ([{ subcat: "All" }, ...STUDENT_JOB_SEARCH, ...STUDENT_JOB_SEARCH_MORE] as MaybeSubcat[]),
                  "lc-finlit": [...FINANCIAL_LITERACY, ...FINANCIAL_LITERACY_MORE],
                  "lc-loans":  [...PRIVATE_STUDENT_LOANS, ...PRIVATE_STUDENT_LOANS_MORE],
                  "lc-consumer": [...CONSUMER_RIGHTS, ...CONSUMER_RIGHTS_MORE],
                  "lc-mental": [...MENTAL_HEALTH_STUDENT, ...MENTAL_HEALTH_STUDENT_MORE],
                  "lc-ai":     [...AI_LITERACY, ...AI_LITERACY_MORE],
                  "lc-faith":  [...RELIGION_FAITH_PHILOSOPHY, ...RELIGION_FAITH_PHILOSOPHY_MORE],
                  "rc-faith":  [...RELIGION_FAITH_PHILOSOPHY, ...RELIGION_FAITH_PHILOSOPHY_MORE],
                  "lc-vol":    VOLUNTEER_RESOURCES,
                  "rc-va":     VA_RESOURCES,
                  "lc-va":     VA_RESOURCES,
                  "lc-research": RESEARCH_JOURNALS,
                  "lc-indep":    INDEPENDENT_RESOURCES_STUDENT,
                  "rc-research": RESEARCH_JOURNALS_ADMIN,
                  "rc-indep":    INDEPENDENT_RESOURCES_ADMIN,
                };
                const raw = rawMap[overlaySection!] ?? [];
                const sections = parseSections(raw);
                return (
                  <div className="space-y-5">
                    {sections.map(({ title, links }) => (
                      <div key={title}>
                        {title !== "All" && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-sky-500/[0.15]" />
                            <div className="px-2.5 py-1 rounded-full bg-white/[0.07] ring-1 ring-sky-500/[0.25]">
                              <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/45">{title}</span>
                            </div>
                            <div className="h-px w-4 bg-sky-500/[0.15]" />
                          </div>
                        )}
                        <div className="grid grid-cols-4 gap-3">
                          {links.map(({ name, url }) => {
                            const hostname = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
                            const iconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=256`;
                            const [g1, g2] = getSiteGradient(hostname);
                            const SiteIco = getSiteIcon(url) as any;
                            return (
                              <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-white/[0.07] transition-all duration-200 group hover:scale-[1.06] active:scale-95">
                                <div className="w-16 h-16 rounded-[18px] ring-1 ring-white/[0.10] flex items-center justify-center shadow-md overflow-hidden group-hover:ring-sky-500/40 group-hover:shadow-[0_0_16px_rgba(0,212,255,0.20)] transition-all" style={{ background: "rgba(255,255,255,0.07)" }}>
                                  <img src={iconUrl} width="48" height="48" alt="" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = "none"; const fb = e.currentTarget.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = "flex"; }} />
                                  <div style={{ display: "none", background: `linear-gradient(135deg, ${g1}, ${g2})` }} className="w-full h-full items-center justify-center shrink-0">
                                    <SiteIco className="h-7 w-7 text-white/90" />
                                  </div>
                                </div>
                                <span className="text-[9px] font-semibold text-white/65 group-hover:text-white text-center leading-tight transition-colors line-clamp-2 w-full px-0.5">{name}</span>
                                <span className="text-[8px] text-white/40 group-hover:text-sky-400/70 text-center leading-tight transition-colors line-clamp-1 w-full px-0.5">{hostname.replace(/^www\./, "")}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* Cookie / data notice — first visit */}
      {showCookieNotice && (
        <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
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

      {/* ── History Drawer ── */}
      {showHistory && (
        <div className="fixed inset-0 z-[90] flex" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-[91] ml-auto h-full w-full max-w-sm flex flex-col overflow-hidden"
            style={{ background: "rgba(15,25,60,0.82)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", borderLeft: "1px solid rgba(255,255,255,0.14)", boxShadow: "-20px 0 60px rgba(0,0,0,0.55)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-white/[0.10]" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400/70" />
                <span className="text-sm font-bold text-white tracking-wide">Conversation History</span>
                {history.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">{history.length}</span>}
              </div>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"><X className="h-4 w-4" /></button>
            </div>

            {/* Filter tabs */}
            <div className="shrink-0 flex items-center gap-1 px-4 py-2.5 border-b border-white/[0.05]">
              {(["all", "bookmarked", "pdfs"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setHistoryFilter(tab); setHistoryDeleteMode(false); setShowClearConfirm(false); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                    historyFilter === tab
                      ? tab === "bookmarked" ? "bg-amber-500/[0.18] text-amber-300 ring-1 ring-amber-500/30"
                        : tab === "pdfs" ? "bg-emerald-500/[0.18] text-emerald-300 ring-1 ring-emerald-500/30"
                        : "bg-sky-500/[0.18] text-sky-300 ring-1 ring-sky-500/30"
                      : "text-white/35 hover:text-white/70 hover:bg-white/[0.06]"
                  }`}
                >
                  {tab === "bookmarked" && <Star className="h-3 w-3" />}
                  {tab === "pdfs" && <FileText className="h-3 w-3" />}
                  {tab === "all" ? "All" : tab === "bookmarked" ? "Bookmarked" : "Saved PDFs"}
                  {tab === "bookmarked" && <span className="ml-0.5">{history.filter(e => e.bookmarked).length}</span>}
                  {tab === "pdfs" && savedPdfs.length > 0 && <span className="ml-0.5">{savedPdfs.length}</span>}
                </button>
              ))}
              {historyFilter !== "pdfs" && history.length > 0 && !historyDeleteMode && (
                <button onClick={() => setHistoryDeleteMode(true)} className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                  <Trash2 className="h-3 w-3" />Select
                </button>
              )}
              {historyDeleteMode && !showClearConfirm && (
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => { setHistoryDeleteMode(false); setShowClearConfirm(false); }} className="px-2 py-1 rounded-lg text-[10px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">Cancel</button>
                  <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/[0.10] ring-1 ring-rose-500/25 transition-all">
                    <Trash2 className="h-3 w-3" />Clear all
                  </button>
                </div>
              )}
              {showClearConfirm && (
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-[10px] text-white/50 mr-1">Delete all history?</span>
                  <button onClick={() => setShowClearConfirm(false)} className="px-2 py-1 rounded-lg text-[10px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">No</button>
                  <button onClick={clearAllHistory} className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all">Yes, delete</button>
                </div>
              )}
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto genie-scroll py-2">
              {historyFilter === "pdfs" ? (
                savedPdfs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 h-full px-6 py-16 text-center">
                    <FileText className="h-8 w-8 text-white/15" />
                    <p className="text-sm text-white/30">No saved PDFs yet.<br/>Click <strong className="text-cyan-400/70">PDF</strong> on any response to save it here.</p>
                  </div>
                ) : (
                  <div className="px-2 pt-2 space-y-1">
                    {savedPdfs.map((pdf, i) => (
                      <div key={pdf.id} className="mx-0 mb-1 rounded-xl overflow-hidden ring-1 ring-white/[0.06] hover:ring-white/[0.12] transition-all flex items-start gap-2 px-3.5 py-2.5" style={{ background: "rgba(10,20,44,0.60)" }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <FileText className="h-3 w-3 text-emerald-400/70 shrink-0" />
                            {pdf.role && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(0,180,220,0.15)", color: "rgba(0,212,255,0.85)" }}>{pdf.role}</span>}
                            <span className="text-[9px] text-white/20 ml-auto shrink-0">{new Date(pdf.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                          <p className="text-xs text-white/65 leading-snug line-clamp-2">{pdf.prompt}</p>
                        </div>
                        <button
                          onClick={() => setSavedPdfs(prev => { const updated = prev.filter(p => p.id !== pdf.id); savePdfs(updated); return updated; })}
                          className="shrink-0 p-1 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-all mt-0.5"
                          title="Remove from saved PDFs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (() => {
                const filtered = historyFilter === "bookmarked" ? history.filter(e => e.bookmarked) : history;
                if (filtered.length === 0) return (
                  <div className="flex flex-col items-center justify-center gap-3 h-full px-6 py-16 text-center">
                    {historyFilter === "bookmarked"
                      ? <><Bookmark className="h-8 w-8 text-white/15" /><p className="text-sm text-white/30">No bookmarks yet.<br/>Tap <strong className="text-amber-400/70">Bookmark</strong> on any response.</p></>
                      : <><Clock className="h-8 w-8 text-white/15" /><p className="text-sm text-white/30">No conversations yet.<br/>Ask Genie something!</p></>
                    }
                  </div>
                );
                // Group by date
                const groups: Record<string, HistoryEntry[]> = {};
                filtered.forEach(e => {
                  const d = new Date(e.ts);
                  const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(e);
                });
                return Object.entries(groups).map(([date, entries]) => (
                  <div key={date} className="mb-1">
                    <div className="px-4 py-1.5"><span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{date}</span></div>
                    {entries.map(entry => (
                      <div key={entry.id} className="mx-2 mb-1 rounded-xl overflow-hidden ring-1 ring-white/[0.06] hover:ring-white/[0.12] transition-all" style={{ background: "rgba(10,20,44,0.60)" }}>
                        <button
                          className="w-full text-left px-3.5 py-2.5 flex items-start gap-2 group"
                          onClick={() => setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {entry.bookmarked && <Star className="h-2.5 w-2.5 text-amber-400 shrink-0 fill-amber-400" />}
                              {entry.role && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(0,180,220,0.15)", color: "rgba(0,212,255,0.85)" }}>{entry.role}</span>}
                              <span className="text-[9px] text-white/20 ml-auto shrink-0">{new Date(entry.ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-xs text-white/70 leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">{entry.prompt}</p>
                          </div>
                          <ChevronDown className={`h-3.5 w-3.5 text-white/20 shrink-0 mt-1 transition-transform ${expandedHistoryId === entry.id ? "rotate-180" : ""}`} />
                        </button>
                        {expandedHistoryId === entry.id && (
                          <div className="border-t border-white/[0.06] px-3.5 py-3">
                            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-6">{entry.response.replace(/[*#`]/g, "").slice(0, 500)}{entry.response.length > 500 ? "…" : ""}</p>
                            <div className="flex items-center gap-2 mt-2.5">
                              <button
                                onClick={() => { if (!entry.bookmarked) bookmarkEntry(entry.id, entry.response); }}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${entry.bookmarked ? "text-amber-400/70 cursor-default" : "text-white/30 hover:text-amber-300 hover:bg-amber-500/[0.08]"}`}
                              >
                                {entry.bookmarked ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                                {entry.bookmarked ? "Bookmarked" : "Bookmark"}
                              </button>
                              <button
                                onClick={() => printMessage(entry.response, entry.prompt)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white/30 hover:text-cyan-300 hover:bg-cyan-500/[0.08] transition-all"
                              >
                                <Printer className="h-3 w-3" />PDF
                              </button>
                              <button
                                onClick={() => deleteHistoryEntry(entry.id)}
                                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white/20 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-all"
                              >
                                <Trash2 className="h-3 w-3" />Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>

            {/* Footer info */}
            <div className="shrink-0 px-4 py-3 border-t border-white/[0.05] text-[9px] text-white/20 text-center">
              Conversations auto-expire after 30 days · Bookmarks saved as PDF
            </div>
          </div>
        </div>
      )}

      {/* Bookmark saved toast */}
      {showBookmarkToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl pointer-events-none" style={{ background: "rgba(10,20,44,0.95)", border: "1px solid rgba(212,175,55,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.50), 0 0 20px rgba(212,175,55,0.12)" }}>
          <BookmarkCheck className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-white">Bookmarked &amp; saved as PDF</span>
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
      {/* App install modal — triggered by "Get the App" footer link */}
      <AppInstallModal open={showAppModal} onClose={() => setShowAppModal(false)} />
    </>
  );
}
