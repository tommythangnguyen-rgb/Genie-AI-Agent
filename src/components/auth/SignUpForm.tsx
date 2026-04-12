"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface SignUpFormProps {
  onSuccess?: () => void;
}

function getPasswordStrength(password: string): {
  level: 0 | 1 | 2 | 3;
  label: string;
  color: string;
} {
  if (password.length === 0) return { level: 0, label: "", color: "" };
  if (password.length < 8) return { level: 1, label: "Too short", color: "bg-red-500" };

  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { level: 2, label: "Fair", color: "bg-amber-400" };
  return { level: 3, label: "Strong", color: "bg-emerald-400" };
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const result = await signUp(email, password);
    if (result.pendingVerification) {
      setPendingEmail(email);
    } else if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || "Failed to sign up");
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || resendLoading) return;
    setResendLoading(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail }),
    }).catch(() => {});
    setResendLoading(false);
    setResendSent(true);
  };

  if (pendingEmail) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">📬</div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">Check your inbox</p>
          <p className="text-xs text-white/55 leading-relaxed">
            We sent a verification link to <strong className="text-white/80">{pendingEmail}</strong>. Click it to activate your account.
          </p>
        </div>
        <p className="text-xs text-white/35 leading-snug">
          The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || resendSent}
          className="text-xs text-amber-400/80 hover:text-amber-300 transition-colors disabled:opacity-50"
        >
          {resendSent ? "Sent! Check your inbox." : resendLoading ? "Sending…" : "Resend verification email"}
        </button>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:opacity-50 transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="text-sm font-medium text-white/70">Email</label>
        <input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium text-white/70">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="new-password"
          className={inputClass}
          style={inputStyle}
        />
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1 h-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${strength.level >= i ? strength.color : "bg-white/[0.10]"}`}
                />
              ))}
            </div>
            <p className={`text-xs ${strength.level === 1 ? "text-red-400" : strength.level === 2 ? "text-amber-400" : "text-emerald-400"}`}>
              {strength.label}
            </p>
          </div>
        )}
        {password.length === 0 && (
          <p className="text-xs text-white/30">At least 8 characters</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-confirm-password" className="text-sm font-medium text-white/70">Confirm Password</label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="new-password"
          className={inputClass}
          style={{
            ...inputStyle,
            border: passwordsMismatch
              ? "1px solid rgba(239,68,68,0.50)"
              : passwordsMatch
              ? "1px solid rgba(52,211,153,0.40)"
              : inputStyle.border,
          }}
        />
        {passwordsMismatch && (
          <p className="text-xs text-red-400">Passwords do not match</p>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-300 rounded-xl px-3 py-2" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || password.length < 8}
        className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ background: "rgba(212,175,55,0.22)", border: "1px solid rgba(212,175,55,0.45)", color: "#FFE066" }}
      >
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
