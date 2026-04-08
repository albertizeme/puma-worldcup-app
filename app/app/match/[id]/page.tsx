// app/match/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth-guard";
import CountryFlag from "@/components/CountryFlag";
import PredictionSection from "@/components/PredictionSection";
import { Match } from "@/types/match";
import CloseMatchDetailButton from "@/components/CloseMatchDetailButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type PredictionRow = {
  id: string;
  user_id: string;
  match_id: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  created_at: string | null;
};

type PredictionSectionRow = {
  id?: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  points?: number | null;
  exact_hit?: boolean | null;
};

type PredictionOutcome =
  | "exact"
  | "trend"
  | "miss"
  | "pending"
  | "no_prediction";

type MatchStatus = "scheduled" | "live" | "finished";

type BreakdownItem = {
  label: string;
  points: number;
  highlight?: boolean;
};

type TeamMeta = {
  id: string;
  name: string;
  is_puma_team: boolean | null;
  sponsor_brand: string | null;
  sponsor_campaign_image: string | null;
  sponsor_kit_image: string | null;
  sponsor_card_text: string | null;
  sponsor_card_title: string | null;
};

function formatMatchDate(value: string | null | undefined) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "Fecha por confirmar";

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

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function parseScore(value: string | number | null | undefined): number | null {
  if (value == null) return null;

  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "-") return null;

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeMatchStatus(match: Match): MatchStatus {
  const homeScore = parseScore(match.home_score);
  const awayScore = parseScore(match.away_score);

  if (homeScore !== null && awayScore !== null) {
    return "finished";
  }

  const kickoff = new Date(match.match_datetime ?? "");
  if (isNaN(kickoff.getTime())) {
    return "scheduled";
  }

  return kickoff.getTime() > Date.now() ? "scheduled" : "live";
}

function getOutcome(params: {
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

function getPointsAndBreakdown(
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

function getOutcomeContent(outcome: PredictionOutcome, points: number) {
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

function getStatusLabel(status: MatchStatus) {
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

function normalizeTeamName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getTeamByMatchName(
  teamName: string | null | undefined,
  teams: TeamMeta[],
) {
  const normalized = normalizeTeamName(teamName);
  return teams.find((team) => normalizeTeamName(team.name) === normalized) ?? null;
}

function getPumaTeamsForMatch(match: Match, teams: TeamMeta[]) {
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

function getPumaImage(team: TeamMeta | null | undefined) {
  if (!team) return null;

  return team.sponsor_campaign_image || team.sponsor_kit_image || null;
}

function getPumaCardText(
  pumaTeams: TeamMeta[],
  primaryPumaTeam: TeamMeta | null,
  isDualPuma: boolean,
) {
  if (isDualPuma && pumaTeams.length === 2) {
    const firstText = pumaTeams[0].sponsor_card_text?.trim();
    const secondText = pumaTeams[1].sponsor_card_text?.trim();

    if (firstText && secondText) {
      return `${pumaTeams[0].name} y ${pumaTeams[1].name} protagonizan este duelo entre selecciones PUMA. ${firstText} ${secondText}`;
    }

    if (firstText) {
      return `${pumaTeams[0].name} y ${pumaTeams[1].name} protagonizan este duelo entre selecciones PUMA. ${firstText}`;
    }

    if (secondText) {
      return `${pumaTeams[0].name} y ${pumaTeams[1].name} protagonizan este duelo entre selecciones PUMA. ${secondText}`;
    }

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

function ScoreBox({
  value,
}: {
  value: string | number | null | undefined;
}) {
  const displayValue =
    value == null || String(value).trim() === "" ? "-" : String(value);

  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-[84px] sm:w-[84px]">
      <span className="text-3xl font-extrabold text-slate-900">
        {displayValue}
      </span>
    </div>
  );
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;

  const {
    supabase: supabaseServer,
    user,
  } = await requireAuthenticatedUser();

  const { data: match, error: matchError } = await supabaseServer
    .from("matches")
    .select("*")
    .eq("id", id)
    .single<Match>();

  if (matchError || !match) {
    notFound();
  }

  const { data: teamsData, error: teamsError } = await supabaseServer
    .from("teams")
    .select(
      "id, name, is_puma_team, sponsor_brand, sponsor_campaign_image, sponsor_kit_image, sponsor_card_text, sponsor_card_title"
    );

  if (teamsError) {
    notFound();
  }

  const teams: TeamMeta[] = (teamsData ?? []) as TeamMeta[];

  const { hasPumaTeam, isDualPuma, primaryPumaTeam, pumaTeams } =
    getPumaTeamsForMatch(match, teams);

  const isPumaMatch = Boolean(match.is_puma_match) || hasPumaTeam;

  const { data: predictionData } = await supabaseServer
    .from("predictions")
    .select(
      "id, user_id, match_id, home_score_pred, away_score_pred, created_at"
    )
    .eq("match_id", id)
    .eq("user_id", user.id)
    .maybeSingle<PredictionRow>();

  const prediction: PredictionRow | null = predictionData ?? null;

  const matchStatus = normalizeMatchStatus(match);
  const outcome = getOutcome({
    matchStatus,
    match,
    prediction,
  });

  const { totalPoints, breakdown } = getPointsAndBreakdown(outcome, isPumaMatch);
  const outcomeContent = getOutcomeContent(outcome, totalPoints);

  const predictionForSection: PredictionSectionRow | null = prediction
    ? {
        id: prediction.id,
        home_score_pred: prediction.home_score_pred,
        away_score_pred: prediction.away_score_pred,
        points: matchStatus === "finished" ? totalPoints : null,
        exact_hit: outcome === "exact",
      }
    : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-end">
        <CloseMatchDetailButton />
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
              {getStatusLabel(matchStatus)}
            </span>

            {isPumaMatch ? (
              <span className="rounded-full border border-orange-200 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                PUMA Match
              </span>
            ) : null}

            {match.stage ? <span>· {match.stage}</span> : null}
            <span>· {formatMatchDate(match.match_datetime)}</span>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="flex items-center gap-4">
              <CountryFlag
                code={match.home_flag}
                teamName={match.home_team}
                alt={`Bandera de ${match.home_team}`}
              />
              <div className="min-w-0">
                <div className="text-lg font-bold text-slate-900 sm:text-2xl">
                  {match.home_team}
                </div>
                <div className="text-sm text-slate-500">Local</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <ScoreBox value={match.home_score} />
              <div className="text-xl font-bold text-slate-400">-</div>
              <ScoreBox value={match.away_score} />
            </div>

            <div className="flex items-center justify-start gap-4 md:justify-end">
              <div className="min-w-0 text-left md:text-right">
                <div className="text-lg font-bold text-slate-900 sm:text-2xl">
                  {match.away_team}
                </div>
                <div className="text-sm text-slate-500">Visitante</div>
              </div>
              <CountryFlag
                code={match.away_flag}
                teamName={match.away_team}
                alt={`Bandera de ${match.away_team}`}
              />
            </div>
          </div>

          {match.stadium || match.city ? (
            <div className="mt-5 text-sm text-slate-500">
              {[match.stadium, match.city].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </div>
      </section>

      {hasPumaTeam && pumaTeams.length > 0 ? (
        <section className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 sm:p-6">
              <div className="mb-3">
                <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
                  PUMA Highlight
                </span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {isDualPuma
                  ? `${pumaTeams[0].name} vs ${pumaTeams[1].name}`
                  : primaryPumaTeam?.sponsor_card_title ||
                    `PUMA x ${primaryPumaTeam?.name}`}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                {getPumaCardText(pumaTeams, primaryPumaTeam, isDualPuma)}
              </p>

            </div>

            {isDualPuma ? (
              <div className="grid min-h-[220px] grid-cols-2 divide-x divide-white/20 bg-slate-100">
                {pumaTeams.map((team) => {
                  const teamImage = getPumaImage(team);

                  return teamImage ? (
                    <div key={team.id} className="relative min-h-[220px]">
                      <img
                        src={teamImage}
                        alt={`Imagen PUMA de ${team.name}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                        <div className="text-sm font-bold text-white">
                          {team.name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={team.id}
                      className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-orange-100 via-white to-red-100 p-6"
                    >
                      <div className="text-center">
                        <div className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
                          PUMA
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-700">
                          {team.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="min-h-[220px] bg-slate-100">
                {getPumaImage(primaryPumaTeam) ? (
                  <img
                    src={getPumaImage(primaryPumaTeam) ?? ""}
                    alt={`Imagen PUMA de ${primaryPumaTeam?.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-orange-100 via-white to-red-100 p-6">
                    <div className="text-center">
                      <div className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
                        PUMA
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-700">
                        {primaryPumaTeam?.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section
        className={`rounded-3xl border px-5 py-5 shadow-sm sm:px-6 ${outcomeContent.containerClass}`}
      >
        <div className="mb-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${outcomeContent.badgeClass}`}
          >
            {outcomeContent.badge}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {outcomeContent.title}
          </h1>
          <p className="text-lg font-semibold">{outcomeContent.subtitle}</p>
          <p className="text-sm opacity-90">{outcomeContent.description}</p>
        </div>
      </section>

      <PredictionSection
        matchId={match.id}
        matchDatetime={match.match_datetime}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        homeScore={parseScore(match.home_score)}
        awayScore={parseScore(match.away_score)}
        userId={user.id}
        prediction={predictionForSection}
      />

      {matchStatus === "finished" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Cómo se calculó
          </h2>

          <div className="mt-4 space-y-3">
            {breakdown.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                  item.highlight
                    ? "border border-orange-200 bg-orange-50"
                    : "bg-slate-50"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    item.highlight ? "text-orange-700" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`text-sm font-bold ${
                    item.highlight ? "text-orange-700" : "text-slate-900"
                  }`}
                >
                  {item.points > 0 ? `+${item.points}` : item.points}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-base font-semibold text-slate-900">
                Total
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                {totalPoints} pts
              </span>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}