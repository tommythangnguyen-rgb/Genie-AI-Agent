"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, Loader2, RefreshCw, Unlink, Trophy, Users } from "lucide-react";

export type SleeperLink = { userId: string; username: string; leagueId: string; leagueName: string };

type Snapshot = {
  league: { name: string; season: string; status: string; teams: number; scoring: string; waiver: string };
  me: { teamName: string; record: string; pointsFor: number; faabUsed: number | null; starters: string[]; bench: string[] } | null;
  matchup: { opponent: string; myPoints: number; oppPoints: number } | null;
  standings: Array<{ team: string; record: string; pointsFor: number }>;
  week: number;
};

const STORAGE_KEY = "genie-sleeper-link";

export function loadSleeperLink(): SleeperLink | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SleeperLink) : null;
  } catch {
    return null;
  }
}

export function SleeperLeaguePanel({
  link,
  onLink,
}: {
  link: SleeperLink | null;
  onLink: (l: SleeperLink | null) => void;
}) {
  const [username, setUsername] = useState("");
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; season: string; teams: number }> | null>(null);
  const [pendingUser, setPendingUser] = useState<{ id: string; name: string } | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async (l: SleeperLink) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/fantasy/league?userId=${encodeURIComponent(l.userId)}&leagueId=${encodeURIComponent(l.leagueId)}`);
      const data = await res.json();
      if (!res.ok) { setError(data?.error === "LEAGUE_NOT_FOUND" ? "That league is no longer reachable." : "Sleeper is unavailable."); return; }
      setSnapshot(data.snapshot);
    } catch {
      setError("Could not reach Sleeper.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { if (link) void loadSnapshot(link); }, [link, loadSnapshot]);

  const findLeagues = async () => {
    const name = username.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    setLeagues(null);
    try {
      const res = await fetch(`/api/fantasy/league?username=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error === "USER_NOT_FOUND" ? `No Sleeper user called "${name}".` : "Sleeper is unavailable.");
        return;
      }
      setPendingUser({ id: data.user.id, name: data.user.name });
      setLeagues(data.leagues);
      if (data.leagues.length === 0) {
        setError(`No leagues found for ${data.user.name}. Sleeper often has none for the upcoming season until drafts are created.`);
      }
    } catch {
      setError("Could not reach Sleeper.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (id: string, name: string) => {
    if (!pendingUser) return;
    const l: SleeperLink = { userId: pendingUser.id, username: pendingUser.name, leagueId: id, leagueName: name };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)); } catch { /* private mode */ }
    setLeagues(null);
    setPendingUser(null);
    onLink(l);
  };

  const disconnect = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* private mode */ }
    setSnapshot(null);
    setLeagues(null);
    onLink(null);
  };

  if (!link) {
    return (
      <div className="border-b border-[#D4AF37]/15 px-4 py-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]/80">
          <Link2 className="h-3 w-3" /> Connect your league
        </div>
        <p className="mb-2 text-[10px] leading-snug text-white/50">
          Sleeper only needs your public username — no password, no login, nothing stored on our side.
          Once connected the strategist reads your real roster, matchup and waivers.
        </p>
        <div className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void findLeagues(); } }}
            placeholder="Sleeper username"
            className="min-w-0 flex-1 rounded-lg border border-white/12 bg-black/40 px-2.5 py-1.5 text-[11px] text-white placeholder-white/30 outline-none focus:border-[#D4AF37]/50"
          />
          <button
            onClick={() => void findLeagues()}
            disabled={busy || !username.trim()}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-[#D4AF37] px-3 text-[11px] font-bold text-black disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Find
          </button>
        </div>

        {leagues && leagues.length > 0 && (
          <div className="mt-2 space-y-1">
            {leagues.map((l) => (
              <button
                key={l.id}
                onClick={() => choose(l.id, l.name)}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] text-white/80 hover:border-[#D4AF37]/40 hover:text-white"
              >
                <span className="truncate">{l.name}</span>
                <span className="ml-2 shrink-0 text-[9px] text-white/40">{l.season} · {l.teams}-team</span>
              </button>
            ))}
          </div>
        )}
        {error && <p className="mt-2 text-[10px] text-amber-300/80">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border-b border-[#D4AF37]/15 px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Trophy className="h-3 w-3 shrink-0 text-[#FFD700]" />
          <span className="truncate text-[11px] font-bold text-white">{link.leagueName}</span>
          {snapshot && (
            <span className="shrink-0 text-[9px] text-white/40">
              {snapshot.league.scoring} · {snapshot.league.teams}-team · wk {snapshot.week}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => void loadSnapshot(link)} disabled={busy} title="Refresh"
            className="rounded p-1 text-white/40 hover:text-[#D4AF37] disabled:opacity-40">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </button>
          <button onClick={disconnect} title="Disconnect"
            className="rounded p-1 text-white/40 hover:text-rose-300">
            <Unlink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {snapshot?.me && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/60">
          <span className="font-semibold text-white/80">{snapshot.me.teamName}</span>
          <span>{snapshot.me.record}</span>
          <span>{snapshot.me.pointsFor} pts</span>
          {snapshot.me.faabUsed != null && <span>FAAB used ${snapshot.me.faabUsed}</span>}
          {snapshot.matchup && (
            <span className="flex items-center gap-1 text-cyan-300/80">
              <Users className="h-3 w-3" /> vs {snapshot.matchup.opponent} ({snapshot.matchup.myPoints}–{snapshot.matchup.oppPoints})
            </span>
          )}
        </div>
      )}
      {snapshot?.me && snapshot.me.starters.length > 0 && (
        <p className="mt-1 truncate text-[9px] text-white/35" title={snapshot.me.starters.join(", ")}>
          Starters: {snapshot.me.starters.join(" · ")}
        </p>
      )}
      {error && <p className="mt-1 text-[10px] text-amber-300/80">{error}</p>}
    </div>
  );
}
