"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, Loader2, Lock } from "lucide-react";

type Pack = { id: string; label: string; usd: number; blurb: string };
type Status = { tier: string; hasPro: boolean; balanceUsd: number; lowBalance: boolean; packs: Pack[] };

/**
 * Pro unlocks the agent; prepaid credits pay for the tokens. Shown above the
 * composer so the balance is visible before a question is asked, not after.
 */
export function FantasyCreditsBar({ refreshKey }: { refreshKey: number }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fantasy/credits");
      if (res.status === 401) { setStatus(null); return; }
      if (res.ok) setStatus(await res.json());
    } catch { /* offline — leave the last known state */ }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  const buy = async (packId: string) => {
    setBuying(packId);
    setError(null);
    try {
      const res = await fetch("/api/fantasy/credits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      const map: Record<string, string> = {
        SIGN_IN_REQUIRED: "Please sign in again.",
        PRO_REQUIRED: "Credits need an active Pro subscription.",
        UNKNOWN_PACK: "That pack is no longer available.",
      };
      setError(map[data?.error] ?? data?.detail ?? "Checkout could not be started. Try again.");
    } catch {
      setError("Could not reach checkout. Check your connection.");
    } finally {
      setBuying(null);
    }
  };

  if (!status) return null;

  if (!status.hasPro) {
    return (
      <div className="flex shrink-0 items-center gap-2 border-b border-[#D4AF37]/15 bg-[#D4AF37]/[0.06] px-4 py-2">
        <Lock className="h-3 w-3 shrink-0 text-[#D4AF37]" />
        <span className="min-w-0 flex-1 text-[10px] leading-snug text-white/70">
          The fantasy assistant is a <strong className="text-white">Pro</strong> feature — $5.99/mo unlocks
          it, then usage is billed from prepaid credits.
        </span>
        <a href="/pricing" className="shrink-0 rounded-lg bg-[#D4AF37] px-2.5 py-1 text-[10px] font-bold text-black hover:bg-[#E5C158]">
          Get Pro
        </a>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-[#D4AF37]/15 px-4 py-2">
      <div className="flex items-center gap-2">
        <Coins className={`h-3 w-3 shrink-0 ${status.lowBalance ? "text-amber-300" : "text-[#D4AF37]"}`} />
        <span className="text-[10px] text-white/70">
          Usage credit{" "}
          <strong className={status.lowBalance ? "text-amber-300" : "text-white"}>
            ${status.balanceUsd.toFixed(2)}
          </strong>
        </span>
        {status.lowBalance && (
          <span className="text-[10px] text-amber-300/80">— too low to ask a question</span>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto shrink-0 rounded-lg border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37] hover:bg-[#D4AF37]/[0.12]"
        >
          {open ? "Close" : "Add credit"}
        </button>
      </div>

      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {status.packs.map((p) => (
            <button
              key={p.id}
              onClick={() => void buy(p.id)}
              disabled={buying !== null}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center transition-all hover:border-[#D4AF37]/40 disabled:opacity-40"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-white">
                {buying === p.id && <Loader2 className="h-3 w-3 animate-spin" />}${p.usd}
              </div>
              <div className="text-[8px] text-white/45">{p.blurb}</div>
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">{error}</p>
      )}

      {open && (
        <p className="mt-1.5 text-[9px] leading-snug text-white/35">
          Charged per question at roughly twice the underlying model cost. A typical question runs a
          few cents; long research answers cost more. Credits never expire.
        </p>
      )}
    </div>
  );
}
