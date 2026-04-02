"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Home,
  ChevronRight,
  Crown,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";

function GenieBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9.5" y="1" width="5" height="2.5" rx="1.25" />
      <path d="M10.5 3.5L10.5 7.5C8.8 8.3 7 10.8 7 14.5C7 18.5 9.2 22 12 22C14.8 22 17 18.5 17 14.5C17 10.8 15.2 8.3 13.5 7.5L13.5 3.5Z" />
    </svg>
  );
}

interface AccountStatus {
  authenticated: boolean;
  tier: string;
  subscriptionStatus?: string;
  subscriptionPeriodEnd?: string;
  dailyCount: number;
  dailyLimit: number;
  remaining: number;
  unlimited: boolean;
}

interface Member {
  id: string;
  email: string;
  createdAt: string;
}

const TIER_LABELS: Record<string, string> = {
  FREE: "Basic (Free)",
  PRO: "Pro",
  TEAM: "Team",
  MONTHLY: "Monthly",
  MONTHLY_PLUS: "Monthly Plus",
  YEARLY: "Yearly",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/30",
  trialing: "text-sky-400 bg-sky-400/10 ring-sky-400/30",
  past_due: "text-amber-400 bg-amber-400/10 ring-amber-400/30",
  canceled: "text-red-400 bg-red-400/10 ring-red-400/30",
};

function AccountPageInner() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";

  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ email: "", password: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [authDialog, setAuthDialog] = useState<{ open: boolean; mode: "signin" | "signup" }>({ open: false, mode: "signin" });

  useEffect(() => {
    syncAndFetch();
  }, []);

  async function syncAndFetch() {
    setSyncLoading(true);
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json();
      if (data.synced) {
        setSyncMessage(`Synced: ${data.tier} (${data.status})`);
      } else if (data.reason !== "no_customer") {
        setSyncMessage(`Sync issue: ${data.reason}${data.detail ? ` — ${data.detail}` : ""}`);
      }
    } catch {
      setSyncMessage("Sync failed — network error");
    } finally {
      setSyncLoading(false);
      await fetchStatus();
    }
  }

  useEffect(() => {
    if (status?.authenticated && status.tier !== "FREE") {
      fetchMembers();
    }
  }, [status]);

  async function fetchStatus() {
    setLoadingStatus(true);
    const res = await fetch("/api/account/status");
    const data = await res.json();
    setStatus(data);
    setLoadingStatus(false);
  }

  async function fetchMembers() {
    const res = await fetch("/api/account/members");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setPortalLoading(false);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    const res = await fetch("/api/account/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (res.ok) {
      setAddForm({ email: "", password: "" });
      await fetchMembers();
    } else {
      setAddError(data.error ?? "Failed to add member");
    }
    setAddLoading(false);
  }

  async function removeMember(memberId: string) {
    setRemoveLoading(memberId);
    await fetch("/api/account/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    await fetchMembers();
    setRemoveLoading(null);
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(135deg, #0a2e7a 0%, #0e4099 50%, #1252b8 100%)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.10] bg-[#071035]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/aid-agent"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg px-2 py-1"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to askGenie</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <GenieBottle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">askGenie</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/50 text-sm">My Account</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 pb-24">
        {/* Success banner */}
        {showSuccess && (
          <div className="mb-8 flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Subscription activated!</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">
                Your plan is now active. Enjoy your upgraded access.
              </p>
            </div>
          </div>
        )}

        {loadingStatus ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
          </div>
        ) : !status?.authenticated ? (
          /* Not signed in */
          <>
            <AuthDialog
              open={authDialog.open}
              onOpenChange={(open) => setAuthDialog((s) => ({ ...s, open }))}
              defaultMode={authDialog.mode}
            />
            <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.10] px-8 py-10 text-center">
              <AlertCircle className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Sign in to view your account</h2>
              <p className="text-sm text-white/60 mb-6">
                You need to be signed in to manage your subscription.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setAuthDialog({ open: true, mode: "signin" })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthDialog({ open: true, mode: "signup" })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] ring-1 ring-white/[0.15] hover:bg-white/[0.14] text-white text-sm font-semibold transition-colors"
                >
                  Create Account
                </button>
              </div>
              <p className="text-xs text-white/30 mt-4">
                New to askGenie? Create a free account to get started.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Subscription card */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
                  <Crown className="h-5 w-5 text-indigo-300" />
                </div>
                <h2 className="text-lg font-bold text-white">Subscription</h2>
              </div>

              <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.10] px-7 py-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs text-white/50 mb-1">Current plan</p>
                    <p className="text-xl font-bold text-white">
                      {TIER_LABELS[status.tier] ?? status.tier}
                    </p>
                    {status.subscriptionPeriodEnd && (
                      <p className="text-xs text-white/40 mt-1">
                        Renews{" "}
                        {new Date(status.subscriptionPeriodEnd).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  {status.subscriptionStatus && (
                    <span
                      className={`self-start inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                        STATUS_COLORS[status.subscriptionStatus] ??
                        "text-white/60 bg-white/10 ring-white/20"
                      }`}
                    >
                      {status.subscriptionStatus}
                    </span>
                  )}
                </div>

                {/* Usage bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/50">Daily usage</span>
                    <span className="text-xs text-white/70 font-semibold">
                      {status.unlimited
                        ? `${status.dailyCount} / unlimited`
                        : `${status.dailyCount} / ${status.dailyLimit}`}
                    </span>
                  </div>
                  {!status.unlimited && (
                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                        style={{
                          width: `${Math.min(100, (status.dailyCount / status.dailyLimit) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {status.tier !== "FREE" ? (
                    <button
                      onClick={openPortal}
                      disabled={portalLoading}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] ring-1 ring-white/[0.15] text-white text-sm font-semibold hover:bg-white/[0.14] active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {portalLoading ? "Loading..." : "Manage Subscription"}
                    </button>
                  ) : (
                    <Link
                      href="/pricing"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <Crown className="h-4 w-4" />
                      Upgrade Plan
                    </Link>
                  )}
                  <button
                    onClick={syncAndFetch}
                    disabled={syncLoading}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] ring-1 ring-white/[0.10] text-white/60 text-sm font-medium hover:bg-white/[0.10] hover:text-white active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
                    {syncLoading ? "Syncing…" : "Sync with Stripe"}
                  </button>
                </div>

                {syncMessage && (
                  <p className="text-xs text-white/40 mt-3">{syncMessage}</p>
                )}

                {status.tier === "FREE" && !syncMessage && (
                  <p className="text-xs text-white/40 mt-4">
                    Upgrade to get more questions per day and multi-seat access for your team.
                  </p>
                )}
              </div>
            </section>

            {/* Members section — paid only */}
            {status.tier !== "FREE" && (
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-500/30">
                    <Users className="h-5 w-5 text-indigo-300" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Account Members</h2>
                  <span className="text-xs text-white/40">({members.length + 1} / 3 seats)</span>
                </div>

                <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.10] px-7 py-6">
                  {/* Current members */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.04]">
                      <div>
                        <p className="text-sm font-semibold text-white">You (account owner)</p>
                      </div>
                      <span className="text-xs text-indigo-300 font-medium">Owner</span>
                    </div>

                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.04]"
                      >
                        <div>
                          <p className="text-sm text-white">{member.email}</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            Added{" "}
                            {new Date(member.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => removeMember(member.id)}
                          disabled={removeLoading === member.id}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add member form */}
                  {members.length < 2 && (
                    <div>
                      <p className="text-xs font-semibold text-white/50 mb-3">Add a member</p>
                      <form onSubmit={addMember} className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input
                            type="email"
                            required
                            placeholder="Email address"
                            value={addForm.email}
                            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                            className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                          <input
                            type="password"
                            required
                            placeholder="Temporary password"
                            value={addForm.password}
                            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                            className="w-full bg-white/[0.06] ring-1 ring-white/[0.10] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        {addError && (
                          <p className="text-xs text-red-400">{addError}</p>
                        )}
                        <button
                          type="submit"
                          disabled={addLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                        >
                          <Plus className="h-4 w-4" />
                          {addLoading ? "Adding..." : "Add Member"}
                        </button>
                      </form>
                    </div>
                  )}

                  {members.length >= 2 && (
                    <p className="text-xs text-white/40">
                      Maximum seats reached (3 total). Remove a member to add another.
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/25">
              © 2026 askGenie Student Aid Hub | Developed by One27 | All Rights Reserved
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white text-xs font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/aid-agent"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <GenieBottle className="h-3.5 w-3.5" />
              Open askGenie
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center text-white"
          style={{ background: "linear-gradient(135deg, #0a2e7a 0%, #0e4099 50%, #1252b8 100%)" }}
        >
          <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
        </div>
      }
    >
      <AccountPageInner />
    </Suspense>
  );
}
