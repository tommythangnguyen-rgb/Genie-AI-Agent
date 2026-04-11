"use client";

import { useState } from "react";
import { X, Zap, FileText, Calculator, Download, BookMarked, ArrowRight } from "lucide-react";

// ── Feature meta ──────────────────────────────────────────────────────────────

type Feature =
  | "document_upload"
  | "r2t4_calc"
  | "pdf_export"
  | "advanced_analysis"
  | "chat_history"
  | "limit_reached";

const FEATURE_META: Record<Feature, { icon: React.ElementType; title: string; body: string }> = {
  document_upload: {
    icon: FileText,
    title: "Upload & Analyze Documents",
    body: "Decode your full award letter, compare two offers side-by-side, and get an instant plain-English breakdown — in seconds.",
  },
  r2t4_calc: {
    icon: Calculator,
    title: "R2T4 & Advanced Calculators",
    body: "Run mid-semester withdrawal scenarios, R2T4 calculations, and audit-ready breakdowns without leaving the chat.",
  },
  pdf_export: {
    icon: Download,
    title: "Export to PDF",
    body: "Print or share professional-grade summaries of any Genie response — perfect for meetings with your financial aid office.",
  },
  advanced_analysis: {
    icon: Zap,
    title: "Advanced AI Analysis",
    body: "Go beyond Q&A — get scenario modeling, regulatory deep-dives, and step-by-step compliance walkthroughs.",
  },
  chat_history: {
    icon: BookMarked,
    title: "Save & Search Chat History",
    body: "Pick up where you left off. Every conversation is saved and searchable, so your research is never lost.",
  },
  limit_reached: {
    icon: Zap,
    title: "You've reached your daily limit",
    body: "Free accounts get 10 messages per day. Upgrade to Pro for unlimited conversations — plus document uploads, R2T4 calculators, and more.",
  },
};

// ── Copy variants (A/B test pool) ─────────────────────────────────────────────

const CTA_VARIANTS = [
  "Start your 14-day free trial",
  "Upgrade to Pro — try free for 14 days",
  "Unlock Pro — card required to start trial",
  "Get full access — free for 2 weeks",
];

function pickVariant(): string {
  return CTA_VARIANTS[Math.floor(Math.random() * CTA_VARIANTS.length)];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  feature: Feature;
  onClose: () => void;
  onUpgrade?: () => void;
  onSignIn?: () => void;
}

export function UpgradeModal({ feature, onClose, onUpgrade, onSignIn }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [ctaLabel] = useState(pickVariant);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const meta = FEATURE_META[feature];
  const Icon = meta.icon;

  async function handleUpgrade() {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (onUpgrade) {
        onUpgrade();
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "PRO_MONTHLY" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        if (onSignIn) {
          onClose();
          onSignIn();
        } else {
          setErrorMsg("Please sign in to upgrade to Pro.");
        }
      } else {
        window.location.href = "/pricing";
      }
    } catch {
      window.location.href = "/pricing";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "rgba(10,4,22,0.82)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Gold accent line */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.80), transparent)" }} />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon + badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.15)", boxShadow: "0 0 0 1px rgba(212,175,55,0.28)" }}>
              <Icon className="h-5 w-5" style={{ color: "#D4AF37" }} aria-hidden="true" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.28)", color: "#FFE066" }}>
              <Zap className="h-3 w-3" />
              Pro Feature
            </span>
          </div>

          {/* Copy */}
          <h2 id="upgrade-modal-title" className="text-lg font-bold text-white mb-2 leading-snug">
            {meta.title}
          </h2>
          <p className="text-sm text-white/60 leading-relaxed mb-5">{meta.body}</p>

          {/* Pro highlights */}
          <ul className="space-y-2 mb-6">
            {[
              "Unlimited daily conversations",
              "Document & photo upload + AI analysis",
              "R2T4 & advanced calculators",
              "Full PDF exports & comparisons",
              "Chat history saved forever",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(212,175,55,0.18)" }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#D4AF37" }} />
                </div>
                <span className="text-xs text-white/75">{item}</span>
              </li>
            ))}
          </ul>

          {/* Pricing note */}
          <p className="text-xs text-white/35 text-center mb-4">
            Pro starts at <strong className="text-white/60">$5.99/month</strong> — or $59/year (save 18%).
            14-day free trial. Card required.
          </p>

          {/* Error */}
          {errorMsg && (
            <p className="text-xs text-rose-400 text-center mb-3">{errorMsg}</p>
          )}

          {/* CTAs */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
            style={{ background: "rgba(212,175,55,0.22)", border: "1px solid rgba(212,175,55,0.45)", color: "#FFE066", boxShadow: "0 2px 18px rgba(212,175,55,0.20), inset 0 1px 0 rgba(255,255,255,0.08)" }}
          >
            {loading ? "Redirecting…" : ctaLabel}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-white/40 text-sm hover:text-white/60 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hook for easy use ─────────────────────────────────────────────────────────

export function useUpgradeModal() {
  const [state, setState] = useState<{ open: boolean; feature: Feature }>({
    open: false,
    feature: "limit_reached",
  });

  function openUpgrade(feature: Feature = "limit_reached") {
    setState({ open: true, feature });
  }

  function closeUpgrade() {
    setState((s) => ({ ...s, open: false }));
  }

  return { upgradeState: state, openUpgrade, closeUpgrade };
}
