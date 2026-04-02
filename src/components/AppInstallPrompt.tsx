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

export function AppInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (isStandalone()) return;

    // Don't show if user previously marked as installed
    if (localStorage.getItem(INSTALLED_KEY) === "true") return;

    // Only show once per calendar day
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    if (lastShown === todayStr()) return;

    // Delay slightly so it doesn't flash on page load
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

  const handleInstall = async () => {
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

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl bg-[#071035] ring-1 ring-indigo-500/30 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600" />

        <div className="px-4 pt-4 pb-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-indigo-500/30">
              <Smartphone className="h-5 w-5 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                Add askGenie to your home screen
              </p>
              <p className="text-xs text-white/50 mt-0.5 leading-snug">
                Get instant access — works offline, no app store needed.
              </p>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white text-xs font-semibold shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
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
        </div>
      </div>
    </div>
  );
}
