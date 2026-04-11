"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface SignInFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function SignInForm({ onSuccess, onForgotPassword }: SignInFormProps) {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await signIn(email, password);
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || "Failed to sign in");
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:opacity-50 transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/70">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-white/70">Password</label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {error && (
        <div className="text-sm text-red-300 rounded-xl px-3 py-2" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ background: "rgba(212,175,55,0.22)", border: "1px solid rgba(212,175,55,0.45)", color: "#FFE066" }}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
