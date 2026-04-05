"use client";

import { useEffect, useState } from "react";
import { Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UsageData {
  used: number;
  limit: number;
  tier: string;
}

interface UsageMeterProps {
  /** Pre-fetched usage — pass from server or let it self-fetch. */
  initialUsage?: UsageData;
  onLimitReached?: () => void;
  className?: string;
}

export function UsageMeter({ initialUsage, onLimitReached, className = "" }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(initialUsage ?? null);

  useEffect(() => {
    if (initialUsage) return;
    fetch("/api/user/usage")
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => {});
  }, [initialUsage]);

  useEffect(() => {
    if (usage && usage.used >= usage.limit && usage.limit < 999999) {
      onLimitReached?.();
    }
  }, [usage, onLimitReached]);

  if (!usage) return null;

  // Unlimited tiers — hide the meter entirely
  if (usage.limit >= 999999) return null;

  // Hide when no messages used yet — no need to surface the counter upfront
  const pct = Math.min((usage.used / usage.limit) * 100, 100);
  const remaining = Math.max(usage.limit - usage.used, 0);
  const isNearLimit = pct >= 80;
  const isAtLimit = remaining === 0;
  if (usage.used === 0 && !isAtLimit) return null;

  const barColor = isAtLimit
    ? "bg-red-500"
    : isNearLimit
    ? "bg-amber-400"
    : "bg-indigo-500";

  const textColor = isAtLimit
    ? "text-red-400"
    : isNearLimit
    ? "text-amber-400"
    : "text-white/50";

  const countLabel = isAtLimit
    ? "None left"
    : `${remaining} left`;

  return (
    <div className={`px-3 py-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] ${className}`}>
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
          Messages today
        </span>
        <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>
          {countLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={usage.used}
          aria-valuemin={0}
          aria-valuemax={usage.limit}
          aria-label={`${usage.used} of ${usage.limit} daily messages used`}
        />
      </div>

      {/* Prompt when near/at limit */}
      {isNearLimit && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-white/35 leading-snug">
            {isAtLimit
              ? "Daily limit reached — resets at midnight."
              : `${remaining} message${remaining === 1 ? "" : "s"} left today.`}
          </p>
          <Link
            href="/pricing"
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30 text-indigo-300 text-[10px] font-semibold hover:bg-indigo-600/30 transition-colors"
          >
            <Zap className="h-2.5 w-2.5" />
            Upgrade
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Inline toast variant (renders a dismissible banner) ───────────────────────

interface LimitToastProps {
  used: number;
  limit: number;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function LimitToast({ used, limit, onUpgrade, onDismiss }: LimitToastProps) {
  const isAtLimit = used >= limit;

  // Copy variants
  const MESSAGES = isAtLimit
    ? [
        "You've used all 10 messages for today. Upgrade to Pro for unlimited access.",
        "Daily limit reached. Pro gives you unlimited conversations — starting at $5.99/month.",
        "That's 10/10 for today. Your questions don't stop — neither should your answers.",
      ]
    : [
        `${limit - used} message${limit - used === 1 ? "" : "s"} left today. Upgrade Pro for unlimited.`,
        `Almost there — ${limit - used} daily message${limit - used === 1 ? "" : "s"} remaining.`,
      ];

  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-[#071035]/95 border border-white/[0.14] shadow-2xl shadow-black/50 backdrop-blur-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="p-1.5 rounded-lg bg-amber-500/20 shrink-0">
        <Zap className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
      </div>
      <p className="text-xs text-white/75 flex-1 leading-snug">{msg}</p>
      <button
        onClick={onUpgrade}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        Upgrade
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-white/30 hover:text-white/60 transition-colors text-xs px-1"
      >
        ✕
      </button>
    </div>
  );
}
