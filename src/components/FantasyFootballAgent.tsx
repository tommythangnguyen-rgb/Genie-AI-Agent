"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Send, Search, Loader2, ShieldCheck } from "lucide-react";

type Turn = { role: "user" | "agent"; text: string; id?: string };

const SUGGESTIONS = [
  "Start/sit: my WR2 vs a top-5 pass defense this week?",
  "Who are the best waiver adds right now, and at what FAAB?",
  "Grade this trade for me — and tell me if I should counter.",
  "Build me a tiered RB board for a 12-team half-PPR draft.",
];

export function FantasyFootballAgent({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, activity]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); abortRef.current?.abort(); };
  }, [onClose]);

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;

    setError(null);
    setBusy(true);
    setInput("");
    setTurns((t) => [...t, { role: "user", text: question }, { role: "agent", text: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/fantasy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: question, sessionId: sessionRef.current }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => ({}));
        setError(
          detail?.error === "RATE_LIMIT"
            ? "You've hit your question limit for now."
            : detail?.detail ?? "The strategist is unavailable right now."
        );
        setTurns((t) => t.slice(0, -1));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Track the authoritative text separately from streamed deltas so a
      // buffered agent.message can replace its own preview cleanly.
      let finalized = "";
      let preview = "";

      const paint = () =>
        setTurns((t) => {
          const next = [...t];
          next[next.length - 1] = { role: "agent", text: finalized + preview };
          return next;
        });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;

          let evt: Record<string, unknown>;
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }

          switch (evt.type) {
            case "session":
              sessionRef.current = String(evt.sessionId);
              break;
            case "delta":
              preview += String(evt.text ?? "");
              paint();
              break;
            case "message":
              finalized += String(evt.text ?? "");
              preview = "";
              setActivity(null);
              paint();
              break;
            case "activity":
              setActivity(String(evt.tool ?? "working"));
              break;
            case "error":
              setError(String(evt.message ?? "Something went wrong."));
              break;
            case "done":
              setActivity(null);
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError("Connection lost. Try again.");
      }
    } finally {
      setBusy(false);
      setActivity(null);
      abortRef.current = null;
    }
  }, [busy]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 backdrop-blur-sm"
      style={{ background: "rgba(4,6,14,0.72)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Elite Fantasy Football Strategist"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl"
        style={{
          height: "min(88dvh, 780px)",
          background: "rgba(10,6,20,0.92)",
          border: "1px solid rgba(212,175,55,0.28)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#D4AF37]/20 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black tracking-tight text-white">
              Elite Fantasy Football Strategist
            </h2>
            <p className="mt-0.5 truncate text-[10px] text-cyan-300/70">
              Searches live sources before answering · flags anything unverified
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/50 transition-all hover:bg-white/[0.12] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div ref={scrollRef} className="genie-scroll-main min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {turns.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-white/70">
                Professional-grade fantasy analysis — draft boards, start/sit, waivers, trades, and
                betting-market context. It searches current sources before answering and tells you
                what it could not verify.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-[11px] leading-snug text-white/80 transition-all hover:border-[#D4AF37]/40 hover:bg-white/[0.08] hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="flex items-start gap-1.5 pt-1 text-[10px] leading-snug text-white/40">
                <ShieldCheck className="mt-px h-3 w-3 shrink-0" />
                Analysis only — not wagering advice. Verify injury designations against the official
                team report before lineups lock.
              </p>
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={i} className={`mb-3 flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  turn.role === "user"
                    ? "bg-cyan-600/25 text-white ring-1 ring-cyan-400/25"
                    : "bg-white/[0.06] text-white/90 ring-1 ring-white/10"
                }`}
              >
                {turn.text || (busy && i === turns.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}

          {activity && (
            <div className="flex items-center gap-2 px-1 text-[10px] text-[#D4AF37]/80">
              {activity.includes("search") ? (
                <Search className="h-3 w-3 animate-pulse" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              <span className="font-medium uppercase tracking-wide">{activity.replace(/_/g, " ")}</span>
            </div>
          )}

          {error && (
            <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex shrink-0 items-end gap-2 border-t border-[#D4AF37]/20 px-3 py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            rows={1}
            placeholder="Ask about a start/sit, waiver claim, trade, or draft plan…"
            className="max-h-32 min-h-[42px] flex-1 resize-y rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-xs text-white placeholder-white/35 outline-none transition-colors focus:border-[#D4AF37]/50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 text-xs font-bold text-black transition-all hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
