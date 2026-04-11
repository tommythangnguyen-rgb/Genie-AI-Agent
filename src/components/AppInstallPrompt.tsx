"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

const INSTALLED_KEY = "genie-app-installed";
const LAST_SHOWN_KEY = "genie-install-last-shown";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isStandalone() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true)
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iphone|ipod/i.test(ua)) return true;
  if (/ipad/i.test(ua)) return true;
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block h-3.5 w-3.5 align-text-bottom text-amber-400"
      aria-hidden="true"
    >
      <path d="M8 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function AppInstallPrompt() {
  const [show, setShow] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(INSTALLED_KEY) === "true") return;
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    if (lastShown === todayStr()) return;

    const ios = isIOS();
    setIosDevice(ios);

    const timer = setTimeout(() => {
      localStorage.setItem(LAST_SHOWN_KEY, todayStr());
      setShow(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      setInstalled(true);
      setShow(false);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "true");
      }
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleAlreadyHave = () => {
    localStorage.setItem(INSTALLED_KEY, "true");
    setShow(false);
  };

  const handleDismiss = () => setShow(false);

  if (!show || installed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(10,4,22,0.82)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Gold accent bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.80), transparent)" }} />

        <div className="px-4 pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 rounded-xl" style={{ background: "rgba(212,175,55,0.18)", boxShadow: "0 0 12px rgba(212,175,55,0.35)" }}>
              <Smartphone className="h-5 w-5" style={{ color: "#D4AF37" }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                Add askGenie to your home screen
              </p>
              <p className="text-xs text-white/50 mt-0.5 leading-snug">
                {iosDevice
                  ? "Works offline · instant access · no app store"
                  : "Get instant access — works offline, no app store needed."}
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {iosDevice ? (
            <div className="mt-3 rounded-xl ring-1 ring-white/[0.08] px-3 py-2.5 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                3 quick steps in Safari
              </p>
              {[
                { n: "1", content: <>Tap the <ShareIcon /> <span className="font-semibold text-white/90">Share</span> button at the bottom of Safari</> },
                { n: "2", content: <>Scroll down and tap <span className="font-semibold text-white/90">Add to Home Screen</span></> },
                { n: "3", content: <>Tap <span className="font-semibold text-white/90">Add</span> — done!</> },
              ].map(({ n, content }) => (
                <div key={n} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", boxShadow: "0 0 0 1px rgba(212,175,55,0.30)" }}>{n}</span>
                  <p className="text-xs text-white/70 leading-snug">{content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAndroidInstall}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "rgba(212,175,55,0.22)", border: "1px solid rgba(212,175,55,0.45)", color: "#FFE066" }}
              >
                <Download className="h-3.5 w-3.5" />
                Add to Home Screen
              </button>
              <button
                onClick={handleAlreadyHave}
                className="px-3 py-2 rounded-xl text-white/40 hover:text-white/70 text-xs font-medium hover:bg-white/[0.06] transition-colors whitespace-nowrap"
              >
                Already have it
              </button>
            </div>
          )}

          {iosDevice && (
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={handleAlreadyHave}
                className="flex-1 py-1.5 rounded-xl text-white/40 hover:text-white/70 text-xs font-medium hover:bg-white/[0.06] transition-colors"
              >
                Already installed
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 py-1.5 rounded-xl text-white/30 hover:text-white/50 text-xs font-medium hover:bg-white/[0.06] transition-colors"
              >
                Maybe later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
