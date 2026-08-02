"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Send, Search, Loader2, ShieldCheck, ImagePlus, Volume2, Square, Printer, Mic, MicOff, History, Trash2, Download, SquarePen } from "lucide-react";
import { printFantasyConversation } from "@/lib/fantasy/print";
import { speakText, cancelSpeech, stripForSpeech, type SpeakHandle } from "@/lib/tts/speak-client";
import { useSpeechInput } from "@/lib/tts/use-speech-input";
import { SleeperLeaguePanel, loadSleeperLink, type SleeperLink } from "@/components/SleeperLeaguePanel";
import { FantasyCreditsBar } from "@/components/FantasyCreditsBar";

type Attachment = { id: string; name: string; mediaType: string; data: string; preview: string };
type OutFile = { id: string; filename: string; sizeBytes: number };
type Turn = { role: "user" | "agent"; text: string; images?: string[]; files?: OutFile[] };

const SUGGESTIONS = [
  "Start/sit: my WR2 vs a top-5 pass defense this week?",
  "Who are the best waiver adds right now, and at what FAAB?",
  "Grade this trade for me — and tell me if I should counter.",
  "Build me a tiered RB board for a 12-team half-PPR draft.",
];

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export function FantasyFootballAgent({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [league, setLeague] = useState<SleeperLink | null>(null);
  // Bumped after each billed turn so the balance refreshes without a poll.
  const [creditTick, setCreditTick] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  // Owners see their league name; everyone else the product name. Resolved
  // server-side so the mapping never ships to the browser.
  const [agentTitle, setAgentTitle] = useState("NFL Fantasy Football Aid Assistant");
  const [convos, setConvos] = useState<Array<{id:string;sessionId:string|null;title:string;turnCount:number;updatedAt:string}>>([]);
  // Restore after mount so the server render and first client render match.
  useEffect(() => { setLeague(loadSleeperLink()); }, []);
  useEffect(() => {
    void fetch("/api/fantasy/credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.agentTitle) setAgentTitle(d.agentTitle); })
      .catch(() => {});
  }, []);

  // Pick up the most recent conversation on open, so closing the window
  // doesn't lose the thread. History lives on the account, not the tab.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetch("/api/fantasy/history");
        if (!list.ok) return;
        const [latest] = (await list.json()).conversations ?? [];
        if (!latest || cancelled) return;
        const one = await fetch(`/api/fantasy/history?id=${encodeURIComponent(latest.id)}`);
        if (!one.ok || cancelled) return;
        const c = (await one.json()).conversation;
        sessionRef.current = c.sessionId ?? null;
        setTurns((c.turns ?? []).map((t: { role: string; text: string }) => ({ role: t.role as "user" | "agent", text: t.text })));
      } catch { /* offline — start empty rather than block the UI */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const sessionRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const speakRef = useRef<SpeakHandle | null>(null);
  // Mirrors speakingIdx so the async voice-load in speak() can tell whether
  // its request is still the current one without going stale in the closure.
  const speakingIdxRef = useRef<number | null>(null);
  // send() is memoised on [attachments, busy]; read the league through a ref so
  // connecting one mid-conversation takes effect without rebuilding the callback.
  const leagueRef = useRef<SleeperLink | null>(null);
  useEffect(() => { speakingIdxRef.current = speakingIdx; }, [speakingIdx]);
  useEffect(() => { leagueRef.current = league; }, [league]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, activity]);

  const stopSpeaking = useCallback(() => {
    speakRef.current?.cancel();
    speakRef.current = null;
    cancelSpeech();
    setSpeakingIdx(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      abortRef.current?.abort();
      stopSpeaking();
    };
  }, [onClose, stopSpeaking]);

  // Dictation appends to the box rather than replacing it, so a user can
  // type part of a question and speak the rest.
  const mic = useSpeechInput(
    useCallback((phrase: string) => {
      if (!phrase) return;
      setInput((cur) => (cur ? `${cur.replace(/\s+$/, "")} ${phrase}` : phrase));
    }, [])
  );

  const loadHistoryList = useCallback(async () => {
    try {
      const r = await fetch("/api/fantasy/history");
      if (r.ok) setConvos((await r.json()).conversations ?? []);
    } catch { /* offline */ }
  }, []);

  const openConversation = useCallback(async (id: string) => {
    try {
      const r = await fetch("/api/fantasy/history?id=" + encodeURIComponent(id));
      if (!r.ok) return;
      const c = (await r.json()).conversation;
      // Resume the same agent session so the model keeps its own context too.
      sessionRef.current = c.sessionId ?? null;
      setTurns((c.turns ?? []).map((t: {role:string;text:string}) => ({ role: t.role, text: t.text })));
      setShowHistory(false);
    } catch { /* offline */ }
  }, []);

  const removeConversation = useCallback(async (id: string) => {
    await fetch("/api/fantasy/history?id=" + encodeURIComponent(id), { method: "DELETE" }).catch(() => {});
    setConvos((c) => c.filter((x) => x.id !== id));
  }, []);

  /**
   * Drop the current thread and start clean. Clearing sessionRef is the part
   * that matters — the next send then creates a fresh Anthropic session, so
   * the model starts without the previous conversation's context (and without
   * paying to replay it). The old conversation stays saved in History.
   */
  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopSpeaking();
    sessionRef.current = null;
    setTurns([]);
    setInput("");
    setAttachments([]);
    setError(null);
    setActivity(null);
    setBusy(false);
    setShowHistory(false);
  }, [stopSpeaking]);

  const speak = (idx: number, text: string) => {
    if (speakingIdx === idx) { stopSpeaking(); return; }
    stopSpeaking();

    const plain = stripForSpeech(text);
    if (!plain) return;
    setSpeakingIdx(idx);

    void speakText(plain, {
      onEnd: () => setSpeakingIdx((cur) => (cur === idx ? null : cur)),
    }).then((handle) => {
      // A newer Listen may have started while voices were loading.
      if (speakingIdxRef.current !== idx) { handle.cancel(); return; }
      speakRef.current = handle;
    });
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;

    setAttachments((prev) => {
      const room = MAX_IMAGES - prev.length;
      if (room <= 0) { setError(`Up to ${MAX_IMAGES} screenshots per message.`); return prev; }
      const accepted: File[] = [];
      for (const f of incoming.slice(0, room)) {
        if (!ALLOWED.includes(f.type)) { setError(`${f.type} isn't supported — use PNG, JPEG, GIF or WebP.`); continue; }
        if (f.size > MAX_IMAGE_BYTES) { setError(`"${f.name}" is over 4 MB.`); continue; }
        accepted.push(f);
      }
      accepted.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result);
          const data = result.split(",")[1] ?? "";
          setAttachments((cur) =>
            cur.length >= MAX_IMAGES
              ? cur
              : [...cur, { id: `${file.name}-${Date.now()}-${Math.round(performance.now())}`, name: file.name, mediaType: file.type, data, preview: result }]
          );
        };
        reader.readAsDataURL(file);
      });
      return prev;
    });
  }, []);

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    const pending = attachments;
    if ((!question && pending.length === 0) || busy) return;

    setError(null);
    setBusy(true);
    setInput("");
    setAttachments([]);
    setTurns((t) => [
      ...t,
      { role: "user", text: question, images: pending.map((a) => a.preview) },
      { role: "agent", text: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/fantasy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: question,
          sessionId: sessionRef.current,
          sleeper: leagueRef.current ? { userId: leagueRef.current.userId, leagueId: leagueRef.current.leagueId } : null,
          images: pending.map((a) => ({ media_type: a.mediaType, data: a.data })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => ({}));
        const map: Record<string, string> = {
          SIGN_IN_REQUIRED: "Sign in to use the fantasy assistant.",
          PRO_REQUIRED: "The fantasy assistant is a Pro feature — $5.99/mo unlocks it.",
          INSUFFICIENT_CREDITS: "You are out of usage credit. Add credit above to keep asking.",
          RATE_LIMIT: "You've hit your question limit for now.",
          TOO_MANY_IMAGES: `Up to ${MAX_IMAGES} screenshots per message.`,
          IMAGE_TOO_LARGE: "That screenshot is over 4 MB.",
          UNSUPPORTED_IMAGE_TYPE: "Use a PNG, JPEG, GIF or WebP screenshot.",
        };
        setError(map[detail?.error as string] ?? detail?.detail ?? "The assistant is unavailable right now.");
        setTurns((t) => t.slice(0, -1));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
            case "session": sessionRef.current = String(evt.sessionId); break;
            case "delta": preview += String(evt.text ?? ""); paint(); break;
            case "message": finalized += String(evt.text ?? ""); preview = ""; setActivity(null); paint(); break;
            case "activity": setActivity(String(evt.tool ?? "working")); break;
            case "error": setError(String(evt.message ?? "Something went wrong.")); break;
            case "files": {
              const fl = (evt.files ?? []) as OutFile[];
              if (fl.length) setTurns((t) => { const n=[...t]; n[n.length-1]={...n[n.length-1], files: fl}; return n; });
              break;
            }
            case "billing": setCreditTick((t) => t + 1); break;
            case "done": setActivity(null); break;
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setError("Connection lost. Try again.");
    } finally {
      setBusy(false);
      setActivity(null);
      abortRef.current = null;
    }
  }, [attachments, busy]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 backdrop-blur-sm"
      style={{ background: "rgba(4,6,14,0.72)" }}
      role="dialog"
      aria-modal="true"
      aria-label={agentTitle}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl"
        style={{
          height: "min(88dvh, 780px)",
          background: "rgba(10,6,20,0.92)",
          border: `1px solid ${dragOver ? "rgba(212,175,55,0.8)" : "rgba(212,175,55,0.28)"}`,
          boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onPaste={(e) => {
          const imgs = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
          if (imgs.length) { e.preventDefault(); addFiles(imgs); }
        }}
      >
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#D4AF37]/10">
            <span className="rounded-xl bg-black/70 px-4 py-2 text-xs font-bold text-[#FFD700]">
              Drop screenshots to attach
            </span>
          </div>
        )}

        <header className="flex shrink-0 items-center justify-between border-b border-[#D4AF37]/20 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black tracking-tight text-white">
              {agentTitle}
            </h2>
            <p className="mt-0.5 truncate text-[10px] text-cyan-300/70">
              Searches live sources · reads screenshots · flags anything unverified
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={startNewChat}
              disabled={busy}
              title="Start a new conversation"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-white/50 transition-all hover:bg-[#D4AF37]/[0.12] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <SquarePen className="h-3.5 w-3.5" />
              New
            </button>
            <button
              onClick={() => { setShowHistory((v) => !v); if (!showHistory) void loadHistoryList(); }}
              title="Saved conversations"
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all hover:bg-[#D4AF37]/[0.12] hover:text-[#D4AF37] ${
                showHistory ? "text-[#D4AF37]" : "text-white/50"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
            <button
              onClick={() => printFantasyConversation(turns, agentTitle)}
              disabled={turns.length === 0 || busy}
              title="Print or save the whole conversation as a PDF"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-white/50 transition-all hover:bg-[#D4AF37]/[0.12] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Printer className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/50 transition-all hover:bg-white/[0.12] hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {showHistory && (
          <div className="max-h-56 shrink-0 overflow-y-auto border-b border-[#D4AF37]/20 bg-black/30 px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]/80">
                Saved conversations
              </span>
              <button
                onClick={() => { sessionRef.current = null; setTurns([]); setShowHistory(false); }}
                className="rounded-lg border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/70 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
              >
                + New
              </button>
            </div>
            {convos.length === 0 ? (
              <p className="text-[10px] text-white/40">
                Nothing saved yet — every question you ask is logged here automatically.
              </p>
            ) : (
              <div className="space-y-1">
                {convos.map((c) => (
                  <div key={c.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => void openConversation(c.id)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-left transition-all hover:border-[#D4AF37]/40"
                    >
                      <div className="truncate text-[11px] text-white/85">{c.title}</div>
                      <div className="text-[9px] text-white/35">
                        {c.turnCount} {c.turnCount === 1 ? "question" : "questions"} ·{" "}
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => void removeConversation(c.id)}
                      title="Delete"
                      className="shrink-0 rounded p-1 text-white/25 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <FantasyCreditsBar refreshKey={creditTick} />
        <SleeperLeaguePanel link={league} onLink={setLeague} />

        <div ref={scrollRef} className="genie-scroll-main min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {turns.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-white/70">
                Professional-grade fantasy analysis — draft boards, start/sit, waivers, trades, and
                betting-market context. Paste or drop a screenshot of your roster, a trade offer, or
                the waiver wire and it will read it directly.
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
              <div className="max-w-[85%]">
                {turn.images && turn.images.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
                    {turn.images.map((src, n) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={n}
                        src={src}
                        alt={`Attached screenshot ${n + 1}`}
                        className="h-20 w-auto rounded-lg ring-1 ring-white/15"
                      />
                    ))}
                  </div>
                )}
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    turn.role === "user"
                      ? "bg-cyan-600/25 text-white ring-1 ring-cyan-400/25"
                      : "bg-white/[0.06] text-white/90 ring-1 ring-white/10"
                  }`}
                >
                  {turn.text || (busy && i === turns.length - 1 ? "…" : "")}
                </div>
                {turn.files && turn.files.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {turn.files.map((f) => (
                      <a
                        key={f.id}
                        href={`/api/fantasy/files?fileId=${encodeURIComponent(f.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-2.5 py-2 text-[10px] text-white/85 transition-all hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/[0.15]"
                      >
                        <Download className="h-3.5 w-3.5 shrink-0 text-[#FFD700]" />
                        <span className="min-w-0 flex-1 truncate font-semibold">{f.filename}</span>
                        <span className="shrink-0 text-white/40">
                          {f.sizeBytes > 1024 * 1024
                            ? `${(f.sizeBytes / 1024 / 1024).toFixed(1)} MB`
                            : `${Math.max(1, Math.round(f.sizeBytes / 1024))} KB`}
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {turn.role === "agent" && turn.text.length > 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      onClick={() => speak(i, turn.text)}
                      className={`flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                        speakingIdx === i ? "text-[#FFD700]" : "text-white/40 hover:text-[#D4AF37]"
                      }`}
                      aria-label={speakingIdx === i ? "Stop reading aloud" : "Read this answer aloud"}
                    >
                      {speakingIdx === i ? (
                        <><Square className="h-3 w-3 fill-current" /> Stop</>
                      ) : (
                        <><Volume2 className="h-3 w-3" /> Listen</>
                      )}
                    </button>
                    <button
                      // Pair the answer with the question that produced it — a
                      // printed answer alone loses the context that framed it.
                      onClick={() => printFantasyConversation(turns.slice(Math.max(0, i - 1), i + 1), agentTitle)}
                      className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-white/40 transition-colors hover:text-[#D4AF37]"
                      aria-label="Print or save this answer as a PDF"
                    >
                      <Printer className="h-3 w-3" /> PDF
                    </button>
                  </div>
                )}
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

        {attachments.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-white/10 px-3 pt-2">
            {attachments.map((a) => (
              <div key={a.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.preview} alt={a.name} className="h-14 w-auto rounded-lg ring-1 ring-white/20" />
                <button
                  onClick={() => setAttachments((cur) => cur.filter((x) => x.id !== a.id))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-black/85 p-0.5 text-white/70 ring-1 ring-white/25 transition-colors hover:text-white"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(mic.listening || mic.error) && (
          <div className="shrink-0 px-3 pt-2">
            {mic.listening && (
              <p className="text-[10px] text-rose-200/80">
                <span className="font-semibold">Listening…</span>
                {mic.interim ? ` ${mic.interim}` : " speak now"}
              </p>
            )}
            {mic.error && <p className="text-[10px] text-amber-300/80">{mic.error}</p>}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex shrink-0 items-end gap-2 border-t border-[#D4AF37]/20 px-3 py-3"
        >
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED.join(",")}
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />
          {mic.supported && (
            <button
              type="button"
              onClick={mic.toggle}
              title={mic.listening ? "Stop dictating" : "Dictate your question"}
              aria-label={mic.listening ? "Stop dictating" : "Dictate your question"}
              className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border transition-all ${
                mic.listening
                  ? "animate-pulse border-rose-400/60 bg-rose-500/20 text-rose-200"
                  : "border-white/12 bg-black/40 text-white/60 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
              }`}
            >
              {mic.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={attachments.length >= MAX_IMAGES}
            title="Attach a screenshot (or paste / drag one in)"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/12 bg-black/40 text-white/60 transition-all hover:border-[#D4AF37]/50 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            rows={1}
            placeholder="Ask, or paste a screenshot of your roster or a trade offer…"
            className="max-h-32 min-h-[42px] flex-1 resize-y rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-xs text-white placeholder-white/35 outline-none transition-colors focus:border-[#D4AF37]/50"
          />
          <button
            type="submit"
            disabled={busy || (!input.trim() && attachments.length === 0)}
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
