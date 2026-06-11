import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  fetchSportmonksLiveScores,
  parseSportmonksFixtures,
  type LiveScoreFixture,
} from "@/lib/live-scores/sportmonks";

type SyncedMatch = {
  id: string;
  status: "upcoming" | "live" | "finished";
  external_fixture_id: string;
};

function isAuthorized(request: NextRequest) {
  const secret = process.env.LIVE_SCORE_SYNC_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function synchronize(fixtures: LiveScoreFixture[]) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, status, external_fixture_id")
    .eq("external_provider", "sportmonks")
    .not("external_fixture_id", "is", null);

  if (error) {
    throw new Error(`Could not load mapped matches: ${error.message}`);
  }

  const matches = (data as SyncedMatch[] | null) ?? [];
  const matchesByFixtureId = new Map(
    matches.map((match) => [match.external_fixture_id, match])
  );

  let updated = 0;
  let ignored = 0;
  const failures: Array<{ fixtureId: string; message: string }> = [];

  for (const fixture of fixtures) {
    const match = matchesByFixtureId.get(fixture.fixtureId);

    if (
      !match ||
      match.status === "finished" ||
      fixture.state === "upcoming" ||
      fixture.state === "unknown"
    ) {
      ignored += 1;
      continue;
    }

    const payload: Record<string, unknown> = {
      external_status: fixture.rawState,
      external_updated_at:
        fixture.providerUpdatedAt ?? new Date().toISOString(),
      is_prediction_open: false,
      status: "live",
      awaiting_admin_confirmation: fixture.state === "finished",
    };

    if (fixture.homeScore !== null) {
      payload.home_score = fixture.homeScore;
    }
    if (fixture.awayScore !== null) {
      payload.away_score = fixture.awayScore;
    }

    const { error: updateError } = await supabase
      .from("matches")
      .update(payload)
      .eq("id", match.id)
      .neq("status", "finished");

    if (updateError) {
      failures.push({
        fixtureId: fixture.fixtureId,
        message: updateError.message,
      });
      continue;
    }

    updated += 1;
  }

  return {
    received: fixtures.length,
    mapped: matches.length,
    updated,
    ignored,
    failures,
  };
}

async function handleSync(request: NextRequest, fixtures: LiveScoreFixture[]) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await synchronize(fixtures);
    return NextResponse.json({ ok: result.failures.length === 0, ...result });
  } catch (error) {
    console.error("[live-score-sync]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected sync error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return handleSync(request, await fetchSportmonksLiveScores());
  } catch (error) {
    console.error("[live-score-provider]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unexpected provider error",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.LIVE_SCORE_ALLOW_MOCKS !== "true") {
    return NextResponse.json(
      { error: "Mock live-score sync is disabled" },
      { status: 404 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  return handleSync(request, parseSportmonksFixtures(payload));
}
