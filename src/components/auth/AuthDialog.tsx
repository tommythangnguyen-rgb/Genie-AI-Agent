"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
}

type Mode = "signin" | "signup" | "forgot" | "forgot-sent";

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
}: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, open]);

  const handleSuccess = () => onOpenChange(false);

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setMode("forgot-sent");
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  const titles: Record<Mode, string> = {
    signin: "Welcome back",
    signup: "Create an account",
    forgot: "Reset your password",
    "forgot-sent": "Check your email",
  };

  const descriptions: Record<Mode, string> = {
    signin: "Sign in to your account to continue",
    signup: "Create a free account to get more questions and save your history",
    forgot: "Enter your email and we'll send you a reset link",
    "forgot-sent": `We sent a reset link to ${forgotEmail}. Check your inbox — it expires in 1 hour.`,
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[425px] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="mb-5 pr-8">
            <h2 id="auth-dialog-title" className="text-lg font-bold text-white leading-snug">{titles[mode]}</h2>
            <p className="text-sm text-white/50 mt-1">{descriptions[mode]}</p>
          </div>

          <div>
            {mode === "signin" && (
              <SignInForm
                onSuccess={handleSuccess}
                onForgotPassword={() => { setForgotEmail(""); setForgotError(""); setMode("forgot"); }}
              />
            )}
            {mode === "signup" && <SignUpForm onSuccess={handleSuccess} />}
            {mode === "forgot" && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="text-sm font-medium text-white/70">Email address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={forgotLoading}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
                {forgotError && (
                  <div className="text-sm text-red-300 rounded-xl px-3 py-2" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    {forgotError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "rgba(212,175,55,0.22)", border: "1px solid rgba(212,175,55,0.45)", color: "#FFE066" }}
                >
                  {forgotLoading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            )}
            {mode === "forgot-sent" && (
              <div className="text-center py-2">
                <div className="text-4xl mb-3">📬</div>
                <button
                  className="w-full mt-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                  style={{ background: "rgba(212,175,55,0.22)", border: "1px solid rgba(212,175,55,0.45)", color: "#FFE066" }}
                  onClick={() => setMode("signin")}
                >
                  Back to sign in
                </button>
              </div>
            )}
          </div>

          {(mode === "signin" || mode === "signup") && (
            <div className="mt-5 text-center text-sm text-white/45">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button className="text-amber-400 hover:text-amber-300 font-medium transition-colors" onClick={() => setMode("signup")}>
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button className="text-amber-400 hover:text-amber-300 font-medium transition-colors" onClick={() => setMode("signin")}>
                    Sign in
                  </button>
                </>
              )}
            </div>
          )}
          {mode === "forgot" && (
            <div className="mt-4 text-center text-sm">
              <button className="text-amber-400/70 hover:text-amber-300 transition-colors" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
