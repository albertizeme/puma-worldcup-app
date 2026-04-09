// lib/get-match-detail-data.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Match } from "@/types/match";
import {
  getOutcome,
  getOutcomeContent,
  getPointsAndBreakdown,
  getPumaTeamsForMatch,
  normalizeMatchStatus,
  PredictionRow,
  TeamMeta,
} from "@/lib/match-detail";

export async function getMatchDetailData({
  supabaseServer,
  matchId,
  userId,
}: {
  supabaseServer: SupabaseClient;
  matchId: string;
  userId: string;
}) {
  const { data: match, error: matchError } = await supabaseServer
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single<Match>();

  if (matchError || !match) return null;

  const { data: teamsData, error: teamsError } = await supabaseServer
    .from("teams")
    .select(
      "id, name, is_puma_team, sponsor_brand, sponsor_campaign_image, sponsor_kit_image, sponsor_card_text, sponsor_card_title"
    );

  if (teamsError) return null;

  const { data: predictionData } = await supabaseServer
    .from("predictions")
    .select("id, user_id, match_id, home_score_pred, away_score_pred, created_at")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .maybeSingle<PredictionRow>();

  const teams = (teamsData ?? []) as TeamMeta[];
  const prediction = predictionData ?? null;

  const { hasPumaTeam, isDualPuma, primaryPumaTeam, pumaTeams } =
    getPumaTeamsForMatch(match, teams);

  const isPumaMatch = Boolean(match.is_puma_match) || hasPumaTeam;
  const matchStatus = normalizeMatchStatus(match);
  const outcome = getOutcome({ matchStatus, match, prediction });
  const { totalPoints, breakdown } = getPointsAndBreakdown(outcome, isPumaMatch);
  const outcomeContent = getOutcomeContent(outcome, totalPoints);

  return {
    match,
    teams,
    prediction,
    hasPumaTeam,
    isDualPuma,
    primaryPumaTeam,
    pumaTeams,
    isPumaMatch,
    matchStatus,
    outcome,
    totalPoints,
    breakdown,
    outcomeContent,
  };
}