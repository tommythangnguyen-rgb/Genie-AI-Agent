"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No reset token found. Please request a new password reset link.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (data.ok) {
      setStatus("success");
      setMessage("Password updated. Redirecting to sign in…");
      setTimeout(() => router.push("/aid-agent"), 2500);
    } else {
      setStatus("error");
      setMessage(data.error || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0a2e7a 0%, #0e4099 50%, #1252b8 100%)" }}>
      <div className="w-full max-w-md bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/[0.12] p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
        <p className="text-sm text-white/50 mb-6">Enter your new password below.</p>

        {status === "success" ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-300 text-sm">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={status === "loading" || !token}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                disabled={status === "loading" || !token}
                placeholder="Repeat new password"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {message && status === "error" && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !token}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 hover:opacity-90 text-white font-semibold text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {status === "loading" ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-white/30">
          <Link href="/aid-agent" className="underline hover:text-white/60 transition-colors">
            Back to askGenie
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
