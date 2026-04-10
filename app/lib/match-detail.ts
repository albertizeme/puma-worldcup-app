// lib/match-detail.ts
import { Match } from "@/types/match";

export type PredictionOutcome =
  | "exact"
  | "trend"
  | "miss"
  | "pending"
  | "no_prediction";

export type MatchStatus = "scheduled" | "live" | "finished";

export type BreakdownItem = {
  label: string;
  points: number;
  highlight?: boolean;
};

export type TeamMeta = {
  id: string;
  name: string;
  is_puma_team: boolean | null;
  sponsor_brand: string | null;
  sponsor_campaign_image: string | null;
  sponsor_kit_image: string | null;
  sponsor_card_text: string | null;
  sponsor_card_title: string | null;
};

export type PredictionRow = {
  id: string;
  user_id: string;
  match_id: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  created_at: string | null;
};

export type PredictionSectionRow = {
  id?: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  points?: number | null;
  exact_hit?: boolean | null;
};

export function formatMatchDate(value: string | null | undefined) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha por confirmar";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function parseScore(
  value: string | number | null | undefined,
): number | null {
  if (value == null) return null;

  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "-") return null;

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function normalizeMatchStatus(match: Match): MatchStatus {
  const homeScore = parseScore(match.home_score);
  const awayScore = parseScore(match.away_score);

  if (homeScore !== null && awayScore !== null) {
    return "finished";
  }

  const kickoff = new Date(match.match_datetime ?? "");
  if (Number.isNaN(kickoff.getTime())) {
    return "scheduled";
  }

  return kickoff.getTime() > Date.now() ? "scheduled" : "live";
}

export function getOutcome(params: {
  matchStatus: MatchStatus;
  match: Match;
  prediction: PredictionRow | null;
}): PredictionOutcome {
  const { matchStatus, match, prediction } = params;

  if (!prediction) {
    return matchStatus === "finished" ? "no_prediction" : "pending";
  }

  if (matchStatus !== "finished") {
    return "pending";
  }

  const actualHome = parseScore(match.home_score);
  const actualAway = parseScore(match.away_score);
  const predictedHome = prediction.home_score_pred;
  const predictedAway = prediction.away_score_pred;

  if (
    actualHome == null ||
    actualAway == null ||
    predictedHome == null ||
    predictedAway == null
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

export function getPointsAndBreakdown(
  outcome: PredictionOutcome,
  isPumaMatch: boolean,
): {
  totalPoints: number;
  breakdown: BreakdownItem[];
} {
  switch (outcome) {
    case "exact":
      return {
        totalPoints: isPumaMatch ? 4 : 3,
        breakdown: [
          { label: "Marcador exacto", points: 3 },
          ...(isPumaMatch
            ? [{ label: "Bonus PUMA Match", points: 1, highlight: true }]
            : []),
        ],
      };
    case "trend":
      return {
        totalPoints: isPumaMatch ? 2 : 1,
        breakdown: [
          { label: "Tendencia acertada", points: 1 },
          ...(isPumaMatch
            ? [{ label: "Bonus PUMA Match", points: 1, highlight: true }]
            : []),
        ],
      };
    case "miss":
      return {
        totalPoints: 0,
        breakdown: [{ label: "Sin puntuación", points: 0 }],
      };
    case "no_prediction":
      return {
        totalPoints: 0,
        breakdown: [{ label: "Sin predicción enviada", points: 0 }],
      };
    case "pending":
    default:
      return {
        totalPoints: 0,
        breakdown: [],
      };
  }
}

export function getOutcomeContent(
  outcome: PredictionOutcome,
  points: number,
) {
  switch (outcome) {
    case "exact":
      return {
        badge: "Predicción exacta",
        title: "✅ Predicción exacta",
        subtitle: `Has ganado ${points} puntos`,
        description: "Acertaste el marcador final de este partido.",
        containerClass:
          "border-emerald-200 bg-emerald-50 text-emerald-900",
        badgeClass:
          "bg-emerald-100 text-emerald-800 border border-emerald-200",
      };
    case "trend":
      return {
        badge: "Tendencia acertada",
        title: "🟡 Has acertado el ganador",
        subtitle: `Has ganado ${points} punto${points === 1 ? "" : "s"}`,
        description:
          "No acertaste el marcador exacto, pero sí el resultado del partido.",
        containerClass:
          "border-amber-200 bg-amber-50 text-amber-900",
        badgeClass:
          "bg-amber-100 text-amber-800 border border-amber-200",
      };
    case "miss":
      return {
        badge: "Sin acierto",
        title: "❌ Predicción no acertada",
        subtitle: "Has ganado 0 puntos",
        description: "Tu predicción no coincide con el resultado final.",
        containerClass: "border-rose-200 bg-rose-50 text-rose-900",
        badgeClass:
          "bg-rose-100 text-rose-800 border border-rose-200",
      };
    case "no_prediction":
      return {
        badge: "Sin predicción",
        title: "⚪ No enviaste predicción",
        subtitle: "No has sumado puntos en este partido",
        description:
          "El partido ya finalizó y no había una predicción registrada.",
        containerClass: "border-slate-200 bg-slate-50 text-slate-900",
        badgeClass:
          "bg-slate-100 text-slate-700 border border-slate-200",
      };
    case "pending":
    default:
      return {
        badge: "Pendiente",
        title: "🕒 Partido pendiente",
        subtitle: "La puntuación se calculará al finalizar",
        description:
          "Si ya enviaste tu predicción, quedará bloqueada al empezar el partido.",
        containerClass: "border-sky-200 bg-sky-50 text-sky-900",
        badgeClass:
          "bg-sky-100 text-sky-800 border border-sky-200",
      };
  }
}

export function getStatusLabel(status: MatchStatus) {
  switch (status) {
    case "finished":
      return "Finalizado";
    case "live":
      return "En juego";
    case "scheduled":
    default:
      return "Próximamente";
  }
}

export function normalizeTeamName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function getTeamByMatchName(
  teamName: string | null | undefined,
  teams: TeamMeta[],
) {
  const normalized = normalizeTeamName(teamName);
  return teams.find((team) => normalizeTeamName(team.name) === normalized) ?? null;
}

export function getPumaTeamsForMatch(match: Match, teams: TeamMeta[]) {
  const homeTeamData = getTeamByMatchName(match.home_team, teams);
  const awayTeamData = getTeamByMatchName(match.away_team, teams);

  const pumaTeams = [homeTeamData, awayTeamData].filter(
    (team): team is TeamMeta => Boolean(team?.is_puma_team),
  );

  return {
    homeTeamData,
    awayTeamData,
    hasPumaTeam: pumaTeams.length > 0,
    isDualPuma: pumaTeams.length === 2,
    primaryPumaTeam: pumaTeams[0] ?? null,
    pumaTeams,
  };
}

export function getPumaImage(team: TeamMeta | null | undefined) {
  if (!team) return null;
  return team.sponsor_campaign_image || team.sponsor_kit_image || null;
}

export function getPumaCardText(
  pumaTeams: TeamMeta[],
  primaryPumaTeam: TeamMeta | null,
  isDualPuma: boolean,
) {
  if (isDualPuma && pumaTeams.length === 2) {
    const firstText = pumaTeams[0].sponsor_card_text?.trim();
    const secondText = pumaTeams[1].sponsor_card_text?.trim();
/*
    if (firstText && secondText) {
      return `${pumaTeams[0].name} y ${pumaTeams[1].name} protagonizan este duelo entre selecciones PUMA. ${firstText} ${secondText}`;
    }

    if (firstText) {
      return `${pumaTeams[0].name} y ${pumaTeams[1].name} protagonizan este duelo entre selecciones PUMA. ${firstText}`;
    }

    if (secondText) {
      return `${pumaTeams[0].name} y ${pumaTeams[1].name} protagonizan este duelo entre selecciones PUMA. ${secondText}`;
    }
*/
    return `Wherever you play, play For the Love of the Shirt ❤👕`;
  }

  if (primaryPumaTeam?.sponsor_card_text?.trim()) {
    return primaryPumaTeam.sponsor_card_text.trim();
  }

  if (primaryPumaTeam) {
    return `Descubre el contenido destacado de PUMA para ${primaryPumaTeam.name}.`;
  }

  return null;
}