import { NextRequest, NextResponse } from "next/server";
import { resolveUser, listLeagues, getLeagueSnapshot } from "@/lib/fantasy/sleeper";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Sleeper league data for the dashboard panel.
 *
 * Read-only and unauthenticated on Sleeper's side — a public username is the
 * only input, so nothing is stored and no credential ever changes hands.
 *
 *   GET ?username=x            -> resolve user + list their leagues
 *   GET ?userId=x&leagueId=y   -> full snapshot for one league
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const username = q.get("username")?.trim();
  const userId = q.get("userId")?.trim();
  const leagueId = q.get("leagueId")?.trim();

  try {
    if (leagueId && userId) {
      const snapshot = await getLeagueSnapshot(leagueId, userId);
      if (!snapshot) return NextResponse.json({ error: "LEAGUE_NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ snapshot });
    }

    if (username) {
      const user = await resolveUser(username);
      if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
      const { season, leagues } = await listLeagues(user.user_id);
      return NextResponse.json({
        user: { id: user.user_id, name: user.display_name, avatar: user.avatar },
        season,
        leagues: leagues.map((l) => ({
          id: l.league_id,
          name: l.name,
          season: l.season,
          teams: l.total_rosters,
          status: l.status,
        })),
      });
    }

    return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
  } catch (err) {
    console.error("[fantasy/league]", err);
    return NextResponse.json({ error: "SLEEPER_UNAVAILABLE" }, { status: 502 });
  }
}
