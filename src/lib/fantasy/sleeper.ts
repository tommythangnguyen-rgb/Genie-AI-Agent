import "server-only";

/**
 * Sleeper read-only API client.
 *
 * Sleeper needs no key and no OAuth — a public username is enough — so unlike
 * Yahoo (which 401s without a full OAuth 2.0 flow) this stores no credentials
 * for anyone. That keeps it clear of the School DPA surface entirely.
 *
 * Docs: https://docs.sleeper.app — soft limit is 1000 calls/min per IP.
 */

const BASE = "https://api.sleeper.app/v1";
const TIMEOUT_MS = 12_000;
const PLAYER_TTL_MS = 24 * 60 * 60 * 1000;
const SNAPSHOT_TTL_MS = 60_000;

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type SleeperUser = { user_id: string; display_name: string; avatar: string | null };
export type League = {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
  scoring_settings?: Record<string, number>;
  settings?: Record<string, number>;
  roster_positions?: string[];
};
type Roster = {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  starters: string[] | null;
  settings?: { wins?: number; losses?: number; ties?: number; fpts?: number; waiver_budget_used?: number };
};
type LeagueUser = { user_id: string; display_name: string; metadata?: { team_name?: string } };
type Matchup = { roster_id: number; matchup_id: number | null; points: number; starters: string[] | null };
type Transaction = {
  type: string;
  status: string;
  roster_ids: number[];
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  settings?: { waiver_bid?: number } | null;
  status_updated?: number;
};

type PlayerLite = { name: string; pos: string; team: string | null; status?: string | null };
let playerCache: { at: number; map: Record<string, PlayerLite> } | null = null;
let playerInFlight: Promise<Record<string, PlayerLite>> | null = null;

/**
 * The full player dump is ~5 MB, so it's fetched once and trimmed to the four
 * fields we actually render. Without this every roster lookup would re-pull it.
 */
async function players(): Promise<Record<string, PlayerLite>> {
  if (playerCache && Date.now() - playerCache.at < PLAYER_TTL_MS) return playerCache.map;
  playerInFlight ??= (async () => {
    const raw = await get<Record<string, Record<string, unknown>>>("/players/nfl");
    const map: Record<string, PlayerLite> = {};
    for (const [id, p] of Object.entries(raw ?? {})) {
      const full = (p.full_name as string) ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
      if (!full) continue;
      map[id] = {
        name: full,
        pos: (p.position as string) ?? "?",
        team: (p.team as string) ?? null,
        status: (p.injury_status as string) ?? null,
      };
    }
    playerCache = { at: Date.now(), map };
    playerInFlight = null;
    return map;
  })();
  return playerInFlight;
}

function nameOf(map: Record<string, PlayerLite>, id: string): string {
  const p = map[id];
  if (!p) return id; // defence IDs are team codes, which read fine as-is
  return `${p.name} (${p.pos}${p.team ? ` - ${p.team}` : ""})${p.status ? ` [${p.status}]` : ""}`;
}

export async function resolveUser(username: string): Promise<SleeperUser | null> {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) return null;
  const u = await get<SleeperUser>(`/user/${encodeURIComponent(clean)}`);
  return u?.user_id ? u : null;
}

export async function currentSeason(): Promise<string> {
  const s = await get<{ season?: string }>("/state/nfl");
  return s?.season ?? String(new Date().getUTCFullYear());
}

/**
 * In the preseason the upcoming year often has no leagues yet (verified: a
 * live account returned 0 for 2026 and 1 for 2025 on 2026-08-01), so fall back
 * a season rather than showing the user an empty list.
 */
export async function listLeagues(userId: string): Promise<{ season: string; leagues: League[] }> {
  const season = await currentSeason();
  const now = (await get<League[]>(`/user/${userId}/leagues/nfl/${season}`)) ?? [];
  if (now.length) return { season, leagues: now };
  const prev = String(Number(season) - 1);
  const older = (await get<League[]>(`/user/${userId}/leagues/nfl/${prev}`)) ?? [];
  return { season: prev, leagues: older };
}

export type LeagueSnapshot = {
  league: { id: string; name: string; season: string; status: string; teams: number; scoring: string; waiver: string; positions: string[] };
  me: { teamName: string; record: string; pointsFor: number; faabUsed: number | null; starters: string[]; bench: string[] } | null;
  matchup: { opponent: string; myPoints: number; oppPoints: number } | null;
  standings: Array<{ team: string; record: string; pointsFor: number }>;
  week: number;
};

function scoringLabel(l: League): string {
  const rec = l.scoring_settings?.rec ?? 0;
  if (rec >= 1) return "Full PPR";
  if (rec > 0) return `${rec} PPR`;
  return "Standard";
}

function waiverLabel(l: League): string {
  const t = l.settings?.waiver_type;
  if (t === 2) return "FAAB";
  if (t === 1) return "Rolling waivers";
  if (t === 0) return "Reverse standings";
  return "Unknown";
}

const snapshotCache = new Map<string, { at: number; data: LeagueSnapshot }>();

export async function getLeagueSnapshot(leagueId: string, userId: string): Promise<LeagueSnapshot | null> {
  const key = `${leagueId}:${userId}`;
  const hit = snapshotCache.get(key);
  if (hit && Date.now() - hit.at < SNAPSHOT_TTL_MS) return hit.data;

  const state = await get<{ week?: number; display_week?: number }>("/state/nfl");
  const week = Math.max(1, state?.display_week || state?.week || 1);

  const [league, rosters, lusers, pmap] = await Promise.all([
    get<League>(`/league/${leagueId}`),
    get<Roster[]>(`/league/${leagueId}/rosters`),
    get<LeagueUser[]>(`/league/${leagueId}/users`),
    players(),
  ]);
  if (!league || !rosters) return null;

  const nameByUser = new Map((lusers ?? []).map((u) => [u.user_id, u.metadata?.team_name || u.display_name]));
  const mine = rosters.find((r) => r.owner_id === userId) ?? null;

  const standings = [...rosters]
    .sort((a, b) => (b.settings?.wins ?? 0) - (a.settings?.wins ?? 0) || (b.settings?.fpts ?? 0) - (a.settings?.fpts ?? 0))
    .map((r) => ({
      team: (r.owner_id && nameByUser.get(r.owner_id)) || `Roster ${r.roster_id}`,
      record: `${r.settings?.wins ?? 0}-${r.settings?.losses ?? 0}${r.settings?.ties ? `-${r.settings.ties}` : ""}`,
      pointsFor: Math.round(r.settings?.fpts ?? 0),
    }));

  let matchup: LeagueSnapshot["matchup"] = null;
  if (mine) {
    const ms = await get<Matchup[]>(`/league/${leagueId}/matchups/${week}`);
    const minem = ms?.find((m) => m.roster_id === mine.roster_id);
    if (minem?.matchup_id != null) {
      const opp = ms?.find((m) => m.matchup_id === minem.matchup_id && m.roster_id !== mine.roster_id);
      const oppRoster = rosters.find((r) => r.roster_id === opp?.roster_id);
      matchup = {
        opponent: (oppRoster?.owner_id && nameByUser.get(oppRoster.owner_id)) || "TBD",
        myPoints: Math.round((minem.points ?? 0) * 10) / 10,
        oppPoints: Math.round((opp?.points ?? 0) * 10) / 10,
      };
    }
  }

  const starters = (mine?.starters ?? []).filter((id) => id && id !== "0").map((id) => nameOf(pmap, id));
  const benchIds = (mine?.players ?? []).filter((id) => !(mine?.starters ?? []).includes(id));

  const data: LeagueSnapshot = {
    league: {
      id: leagueId,
      name: league.name,
      season: league.season,
      status: league.status,
      teams: league.total_rosters,
      scoring: scoringLabel(league),
      waiver: waiverLabel(league),
      positions: league.roster_positions ?? [],
    },
    me: mine
      ? {
          teamName: (mine.owner_id && nameByUser.get(mine.owner_id)) || "My team",
          record: `${mine.settings?.wins ?? 0}-${mine.settings?.losses ?? 0}${mine.settings?.ties ? `-${mine.settings.ties}` : ""}`,
          pointsFor: Math.round(mine.settings?.fpts ?? 0),
          faabUsed: mine.settings?.waiver_budget_used ?? null,
          starters,
          bench: benchIds.map((id) => nameOf(pmap, id)),
        }
      : null,
    matchup,
    standings,
    week,
  };

  snapshotCache.set(key, { at: Date.now(), data });
  return data;
}

export async function getWaiverActivity(leagueId: string, week: number, limit = 25): Promise<string[]> {
  const [txns, pmap] = await Promise.all([
    get<Transaction[]>(`/league/${leagueId}/transactions/${week}`),
    players(),
  ]);
  if (!txns?.length) return [];
  return txns
    .filter((t) => t.status === "complete" && (t.adds || t.drops))
    .slice(0, limit)
    .map((t) => {
      const adds = Object.keys(t.adds ?? {}).map((id) => nameOf(pmap, id));
      const drops = Object.keys(t.drops ?? {}).map((id) => nameOf(pmap, id));
      const bid = t.settings?.waiver_bid;
      const parts = [`${t.type}:`];
      if (adds.length) parts.push(`added ${adds.join(", ")}`);
      if (drops.length) parts.push(`dropped ${drops.join(", ")}`);
      if (bid != null) parts.push(`(FAAB $${bid})`);
      return parts.join(" ");
    });
}

export async function getTrending(kind: "add" | "drop" = "add", limit = 15): Promise<string[]> {
  const [list, pmap] = await Promise.all([
    get<Array<{ player_id: string; count: number }>>(`/players/nfl/trending/${kind}?lookback_hours=24&limit=${limit}`),
    players(),
  ]);
  return (list ?? []).map((t) => `${nameOf(pmap, t.player_id)} — ${t.count.toLocaleString()} ${kind}s in 24h`);
}
