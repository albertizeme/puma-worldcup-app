export type SportmonksScheduleFixture = {
  id: string;
  name: string;
  startingAt: string;
  homeTeam: string | null;
  awayTeam: string | null;
  placeholder: boolean;
};

type Participant = {
  name?: string | null;
  meta?: { location?: string | null } | null;
};

type Fixture = {
  id?: number | string | null;
  name?: string | null;
  starting_at?: string | null;
  placeholder?: boolean | null;
  participants?: Participant[] | null;
};

type ResponsePayload = {
  data?: Fixture[] | null;
  pagination?: { has_more?: boolean | null } | null;
};

function participantName(
  participants: Participant[] | null | undefined,
  location: "home" | "away"
) {
  return (
    (participants ?? []).find(
      (participant) => participant.meta?.location?.toLowerCase() === location
    )?.name ?? null
  );
}

function parseFixtures(payload: ResponsePayload) {
  return (payload.data ?? [])
    .map((fixture): SportmonksScheduleFixture | null => {
      if (
        fixture.id === null ||
        fixture.id === undefined ||
        !fixture.starting_at
      ) {
        return null;
      }

      return {
        id: String(fixture.id),
        name: fixture.name ?? "Fixture sin nombre",
        startingAt: fixture.starting_at,
        homeTeam: participantName(fixture.participants, "home"),
        awayTeam: participantName(fixture.participants, "away"),
        placeholder: Boolean(fixture.placeholder),
      };
    })
    .filter(
      (fixture): fixture is SportmonksScheduleFixture => fixture !== null
    );
}

export async function fetchWorldCupFixtures() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  const leagueId = process.env.SPORTMONKS_WORLD_CUP_LEAGUE_ID ?? "732";
  const startDate = process.env.SPORTMONKS_WORLD_CUP_START_DATE ?? "2026-06-11";
  const endDate = process.env.SPORTMONKS_WORLD_CUP_END_DATE ?? "2026-07-19";

  if (!token) {
    throw new Error("Missing SPORTMONKS_API_TOKEN");
  }

  const fixtures: SportmonksScheduleFixture[] = [];

  for (let page = 1; page <= 4; page += 1) {
    const url = new URL(
      `https://api.sportmonks.com/v3/football/fixtures/between/${startDate}/${endDate}`
    );
    url.searchParams.set("api_token", token);
    url.searchParams.set("filters", `fixtureLeagues:${leagueId}`);
    url.searchParams.set("include", "participants");
    url.searchParams.set("per_page", "50");
    url.searchParams.set("page", String(page));
    url.searchParams.set("order", "asc");

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(
        `Sportmonks fixtures request failed (${response.status}): ${detail}`
      );
    }

    const payload = (await response.json()) as ResponsePayload;
    fixtures.push(...parseFixtures(payload));

    if (!payload.pagination?.has_more) break;
  }

  return {
    fixtures,
    leagueId,
    startDate,
    endDate,
  };
}
