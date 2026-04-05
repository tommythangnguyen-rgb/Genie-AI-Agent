"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone, Monitor, ChevronRight } from "lucide-react";

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iphone|ipod/i.test(ua)) return true;
  if (/ipad/i.test(ua)) return true;
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent);
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block h-3.5 w-3.5 align-text-bottom text-sky-400" aria-hidden="true">
      <path d="M8 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AppInstallModal({ open, onClose }: Props) {
  const [view, setView] = useState<"choose" | "mobile" | "desktop">("choose");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setIos(isIOS());
    // Auto-select view based on device when opening
    if (open) setView(isMobile() ? "mobile" : "choose");
  }, [open]);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setInstalled(true); onClose(); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [onClose]);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl shadow-black/70" style={{ background: "linear-gradient(160deg, rgba(7,16,53,0.99) 0%, rgba(6,14,44,0.99) 100%)", border: "1px solid rgba(6,182,212,0.22)" }}>
        {/* Accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500" />

        <div className="px-5 pt-5 pb-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md shadow-cyan-500/30">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-base font-black text-white leading-tight">Get the Genie App</p>
                <p className="text-xs text-white/45 mt-0.5">Free · No app store required</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {view === "choose" && (
            <div className="space-y-2.5">
              <p className="text-xs text-white/50 mb-3">Choose your device to get install instructions:</p>
              <button
                onClick={() => setView("mobile")}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(20,184,166,0.08) 100%)", border: "1px solid rgba(6,182,212,0.25)" }}
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 ring-1 ring-cyan-500/30 shrink-0">
                  <Smartphone className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Mobile</p>
                  <p className="text-xs text-white/45">iPhone, iPad, Android</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/25" />
              </button>
              <button
                onClick={() => setView("desktop")}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 100%)", border: "1px solid rgba(139,92,246,0.22)" }}
              >
                <div className="p-2 rounded-lg bg-violet-500/20 ring-1 ring-violet-500/30 shrink-0">
                  <Monitor className="h-5 w-5 text-violet-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Desktop</p>
                  <p className="text-xs text-white/45">Chrome, Edge, Safari</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/25" />
              </button>
            </div>
          )}

          {view === "mobile" && (
            <div>
              <button onClick={() => setView("choose")} className="text-xs text-cyan-400/60 hover:text-cyan-300 mb-3 flex items-center gap-1 transition-colors">
                ← Back
              </button>
              {ios ? (
                <div className="rounded-xl ring-1 ring-white/[0.08] overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">3 steps in Safari</p>
                  </div>
                  {[
                    { n: "1", color: "text-sky-400 bg-sky-500/20 ring-sky-500/30", content: <>Tap the <ShareIcon /> <span className="font-semibold text-white/90">Share</span> button at the bottom of Safari</> },
                    { n: "2", color: "text-indigo-400 bg-indigo-500/20 ring-indigo-500/30", content: <>Scroll and tap <span className="font-semibold text-white/90">Add to Home Screen</span></> },
                    { n: "3", color: "text-violet-400 bg-violet-500/20 ring-violet-500/30", content: <>Tap <span className="font-semibold text-white/90">Add</span> — Genie is on your home screen!</> },
                  ].map(({ n, color, content }) => (
                    <div key={n} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.05] last:border-0">
                      <span className={`shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-1 text-[11px] font-bold ${color}`}>{n}</span>
                      <p className="text-sm text-white/70 leading-snug">{content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-white/60 leading-relaxed">On Android Chrome, tap the menu (⋮) and select <span className="font-semibold text-white/90">Add to Home Screen</span>.</p>
                  {deferredPrompt ? (
                    <button
                      onClick={handleAndroidInstall}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #00B8C8 0%, #00D1C9 100%)", boxShadow: "0 0 0 1px rgba(0,209,201,0.40), 0 4px 20px rgba(0,209,201,0.30)" }}
                    >
                      <Download className="h-4 w-4" />
                      Install Genie Now
                    </button>
                  ) : (
                    <div className="px-4 py-3 rounded-xl ring-1 ring-white/[0.08] text-xs text-white/40 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                      Open this page in Chrome or Edge to get the one-tap install button.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {view === "desktop" && (
            <div>
              <button onClick={() => setView("choose")} className="text-xs text-cyan-400/60 hover:text-cyan-300 mb-3 flex items-center gap-1 transition-colors">
                ← Back
              </button>
              <div className="space-y-3">
                {deferredPrompt ? (
                  <button
                    onClick={handleAndroidInstall}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #00B8C8 0%, #00D1C9 100%)", boxShadow: "0 0 0 1px rgba(0,209,201,0.40), 0 4px 20px rgba(0,209,201,0.30)" }}
                  >
                    <Download className="h-4 w-4" />
                    Install Genie App
                  </button>
                ) : null}
                <div className="rounded-xl ring-1 ring-white/[0.08] overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Manual install steps</p>
                  </div>
                  {[
                    { n: "1", color: "text-cyan-400 bg-cyan-500/20 ring-cyan-500/30", text: "Open Genie in Chrome or Edge" },
                    { n: "2", color: "text-teal-400 bg-teal-500/20 ring-teal-500/30", text: 'Click the install icon (⊕) in the address bar, or open the menu and choose "Install Genie"' },
                    { n: "3", color: "text-emerald-400 bg-emerald-500/20 ring-emerald-500/30", text: 'Click "Install" — Genie opens like a native app' },
                  ].map(({ n, color, text }) => (
                    <div key={n} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.05] last:border-0">
                      <span className={`shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-1 text-[11px] font-bold ${color}`}>{n}</span>
                      <p className="text-sm text-white/70 leading-snug">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {installed && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <span className="text-emerald-400 text-base">✓</span>
              <p className="text-sm font-semibold text-emerald-300">Genie installed successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
