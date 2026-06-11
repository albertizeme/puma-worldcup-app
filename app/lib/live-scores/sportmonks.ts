export type LiveScoreState = "upcoming" | "live" | "finished" | "unknown";

export type LiveScoreFixture = {
  provider: "sportmonks";
  fixtureId: string;
  state: LiveScoreState;
  rawState: string;
  homeScore: number | null;
  awayScore: number | null;
  providerUpdatedAt: string | null;
};

type SportmonksScore = {
  description?: string | null;
  participant?: string | null;
  score?: { goals?: number | null } | null;
};
type SportmonksFixture = {
  id?: number | string | null;
  updated_at?: string | null;
  state?: { state?: string | null; short_name?: string | null; name?: string | null } | null;
  scores?: SportmonksScore[] | null;
};
type SportmonksResponse = { data?: SportmonksFixture[] | null };

const LIVE_STATES = new Set(["LIVE", "INPLAY", "1ST", "HT", "2ND", "ET", "BREAK", "PEN_LIVE"]);
const FINISHED_STATES = new Set(["FT", "AET", "FT_PEN", "FINISHED"]);

function normalizeState(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}
function mapState(rawState: string): LiveScoreState {
  const normalized = normalizeState(rawState);
  if (LIVE_STATES.has(normalized)) return "live";
  if (FINISHED_STATES.has(normalized)) return "finished";
  if (normalized === "NS" || normalized === "TBA" || normalized === "UPCOMING") return "upcoming";
  return "unknown";
}
function readCurrentScore(scores: SportmonksScore[] | null | undefined, participant: "home" | "away") {
  const matches = (scores ?? []).filter((entry) => entry.participant?.toLowerCase() === participant);
  const current = matches.find((entry) => entry.description?.toUpperCase() === "CURRENT") ?? matches.at(-1);
  const goals = current?.score?.goals;
  return typeof goals === "number" && goals >= 0 ? goals : null;
}
export function parseSportmonksFixtures(payload: unknown): LiveScoreFixture[] {
  if (!payload || typeof payload !== "object") return [];
  const response = payload as SportmonksResponse;
  return (response.data ?? []).map((fixture): LiveScoreFixture | null => {
    if (fixture.id === null || fixture.id === undefined) return null;
    const rawState = fixture.state?.short_name ?? fixture.state?.state ?? fixture.state?.name ?? "unknown";
    return {
      provider: "sportmonks",
      fixtureId: String(fixture.id),
      state: mapState(rawState),
      rawState,
      homeScore: readCurrentScore(fixture.scores, "home"),
      awayScore: readCurrentScore(fixture.scores, "away"),
      providerUpdatedAt: fixture.updated_at ?? null,
    };
  }).filter((fixture): fixture is LiveScoreFixture => fixture !== null);
}
export async function fetchSportmonksLiveScores() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  const leagueId = process.env.SPORTMONKS_WORLD_CUP_LEAGUE_ID ?? "732";
  if (!token) throw new Error("Missing SPORTMONKS_API_TOKEN");
  const url = new URL("https://api.sportmonks.com/v3/football/livescores");
  url.searchParams.set("api_token", token);
  url.searchParams.set("filters", `fixtureLeagues:${leagueId}`);
  url.searchParams.set("include", "scores;participants;state");
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Sportmonks request failed (${response.status}): ${detail}`);
  }
  return parseSportmonksFixtures(await response.json());
}
