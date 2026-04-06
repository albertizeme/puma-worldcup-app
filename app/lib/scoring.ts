export type ScoringMatch = {
  home_score: number | null;
  away_score: number | null;
  is_puma_match?: boolean | null;
  status?: string | null;
};

export type ScoringPrediction = {
  home_score_pred: number | null;
  away_score_pred: number | null;
};

export type PredictionOutcome =
  | "exact"
  | "trend"
  | "miss"
  | "pending"
  | "no_prediction";

export function getPredictionOutcome(
  match: ScoringMatch,
  prediction?: ScoringPrediction | null,
): PredictionOutcome {
  if (!prediction) return "no_prediction";

  const actualHome = match.home_score;
  const actualAway = match.away_score;
  const predictedHome = prediction.home_score_pred;
  const predictedAway = prediction.away_score_pred;

  const isFinished =
    match.status === "finished" ||
    (actualHome !== null && actualAway !== null);

  if (!isFinished) return "pending";

  if (
    actualHome === null ||
    actualAway === null ||
    predictedHome === null ||
    predictedAway === null
  ) {
    return "pending";
  }

  const isExact =
    actualHome === predictedHome && actualAway === predictedAway;

  if (isExact) return "exact";

  const actualDiff = actualHome - actualAway;
  const predictedDiff = predictedHome - predictedAway;

  const sameTrend =
    (actualDiff > 0 && predictedDiff > 0) ||
    (actualDiff < 0 && predictedDiff < 0) ||
    (actualDiff === 0 && predictedDiff === 0);

  return sameTrend ? "trend" : "miss";
}

export function getPredictionScore(
  match: ScoringMatch,
  prediction?: ScoringPrediction | null,
) {
  const outcome = getPredictionOutcome(match, prediction);

  const basePoints = outcome === "exact" ? 3 : outcome === "trend" ? 1 : 0;
  const pumaBonus =
    basePoints > 0 && Boolean(match.is_puma_match) ? 1 : 0;

  return {
    outcome,
    basePoints,
    pumaBonus,
    totalPoints: basePoints + pumaBonus,
    exactHit: outcome === "exact",
    tendencyHit: outcome === "trend",
  };
}