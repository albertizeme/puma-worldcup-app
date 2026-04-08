import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import UserMenu from "@/components/UserMenu";
import { buttonStyles } from "@/lib/ui";
import { Match } from "@/types/match";
import { requireAuthenticatedUser } from "@/lib/auth-guard";

type TeamMeta = {
  id: string;
  name: string;
  is_puma_team: boolean | null;
};

type MatchWithMeta = Match & {
  matchday?: string | number | null;
  round?: string | null;
  group_name?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  is_puma_match?: boolean | null;
  match_number?: number | null;
  is_prediction_open?: boolean | null;
  is_visible?: boolean | null;
};

type PredictionRow = {
  match_id: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  created_at: string;
};

type GroupState = "active" | "upcoming" | "finished";

const DEADLINE_BUFFER_HOURS = 1;
const SOON_THRESHOLD_HOURS = 6;

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha pendiente";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha pendiente";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPredictionDeadline(value: string | null | undefined) {
  if (!value) return null;

  const matchDate = new Date(value);

  if (Number.isNaN(matchDate.getTime())) return null;

  return new Date(
    matchDate.getTime() - DEADLINE_BUFFER_HOURS * 60 * 60 * 1000,
  );
}

function getHoursUntilDeadline(value: string | null | undefined) {
  const deadline = getPredictionDeadline(value);

  if (!deadline) return null;

  const now = new Date();
  return (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function getMatchStatus(value: string | null | undefined) {
  const hoursLeft = getHoursUntilDeadline(value);

  if (hoursLeft === null) {
    return {
      label: "Fecha pendiente",
      tone: "slate" as const,
      isEditable: false,
    };
  }

  if (hoursLeft <= 0) {
    return {
      label: "Cerrado",
      tone: "red" as const,
      isEditable: false,
    };
  }

  if (hoursLeft <= SOON_THRESHOLD_HOURS) {
    return {
      label: "Cierra pronto",
      tone: "amber" as const,
      isEditable: true,
    };
  }

  return {
    label: "Editable",
    tone: "green" as const,
    isEditable: true,
  };
}

function getTimeLeftLabel(value: string | null | undefined) {
  const hoursLeft = getHoursUntilDeadline(value);

  if (hoursLeft === null || hoursLeft <= 0) return null;

  if (hoursLeft < 1) {
    const minutes = Math.max(1, Math.floor(hoursLeft * 60));
    return `Cierra en ${minutes} min`;
  }

  if (hoursLeft < 24) {
    const roundedHours = Math.floor(hoursLeft);
    return `Cierra en ${roundedHours} h`;
  }

  const days = Math.floor(hoursLeft / 24);
  const hours = Math.floor(hoursLeft % 24);

  if (hours === 0) {
    return `Cierra en ${days} d`;
  }

  return `Cierra en ${days} d ${hours} h`;
}

function getStatusClasses(tone: "green" | "amber" | "red" | "slate") {
  switch (tone) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getMatchdayLabel(match: MatchWithMeta) {
  if (match.stage) {
    return formatStageLabel(match.stage);
  }

  if (
    match.matchday !== undefined &&
    match.matchday !== null &&
    match.matchday !== ""
  ) {
    return `Jornada ${match.matchday}`;
  }

  if (match.round) {
    return match.round;
  }

  if (match.group_name) {
    return `Grupo ${match.group_name}`;
  }

  return formatDateLabel(match.match_datetime);
}

function formatStageLabel(stage: string | null | undefined) {
  if (!stage) return "Fecha pendiente";

  const trimmed = stage.trim();

  if (/^Group\s+[A-Z]$/i.test(trimmed)) {
    return trimmed.replace(/^Group\s+/i, "Grupo ");
  }

  return trimmed;
}

function getDateKey(value: string | null | undefined) {
  if (!value) return "sin-fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "sin-fecha";

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isSameMadridDay(dateA: Date, dateB: Date) {
  const a = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateA);

  const b = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateB);

  return a === b;
}

function normalizeTeamName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function buildPumaTeamNameSet(teams: TeamMeta[]) {
  return new Set(
    teams
      .filter((team) => team.is_puma_team)
      .map((team) => normalizeTeamName(team.name)),
  );
}

function enrichMatchesWithPumaFlag(
  matches: MatchWithMeta[],
  pumaTeamNames: Set<string>,
): MatchWithMeta[] {
  return matches.map((match) => {
    const isPumaMatch =
      pumaTeamNames.has(normalizeTeamName(match.home_team)) ||
      pumaTeamNames.has(normalizeTeamName(match.away_team));

    return {
      ...match,
      is_puma_match: isPumaMatch,
    };
  });
}

export default async function HomePage() {
  const {
    supabase: supabaseServer,
    user,
  } = await requireAuthenticatedUser();

  const { data: profile } = await supabaseServer
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

  const isAdmin = profile?.role === "admin";

  const { data: matchesData, error: matchesError } = await supabaseServer
    .from("matches")
    .select("*")
    .eq("is_visible", true)
    .order("match_datetime", { ascending: true });

  const { data: teamsData, error: teamsError } = await supabaseServer
    .from("teams")
    .select("id, name, is_puma_team");

  if (matchesError || teamsError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            Error cargando datos: {matchesError?.message ?? teamsError?.message}
          </div>
        </div>
      </main>
    );
  }

  const rawMatches: MatchWithMeta[] = (matchesData ?? []) as MatchWithMeta[];
  const teams: TeamMeta[] = (teamsData ?? []) as TeamMeta[];

  const pumaTeamNames = buildPumaTeamNameSet(teams);
  const visibleRawMatches = rawMatches.filter(
    (match) => match.is_visible !== false,
  );
  const matches = enrichMatchesWithPumaFlag(rawMatches, pumaTeamNames);

  let predictionsByMatch = new Map<string, PredictionRow>();

  const { data: predictions } = await supabaseServer
    .from("predictions")
    .select("match_id, home_score_pred, away_score_pred, created_at")
    .eq("user_id", user.id);

  predictionsByMatch = new Map(
    ((predictions ?? []) as PredictionRow[]).map((prediction) => [
      prediction.match_id,
      prediction,
    ]),
  );

  const now = new Date();

  const editableMatches = matches.filter(
  (match) =>
    match.is_prediction_open !== false &&
    getMatchStatus(match.match_datetime).isEditable,
);

  const pendingEditableMatches = editableMatches.filter(
    (match) => !predictionsByMatch.has(match.id),
  );

  const closingTodayCount = editableMatches.filter((match) => {
    const deadline = getPredictionDeadline(match.match_datetime);
    return deadline ? isSameMadridDay(deadline, now) : false;
  }).length;

  const groupedMap = new Map<
    string,
    {
      label: string;
      matches: MatchWithMeta[];
      firstDate: string | null | undefined;
    }
  >();

  for (const match of matches) {
    const label = getMatchdayLabel(match);
    const key = `${label}__${getDateKey(match.match_datetime)}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        label,
        matches: [],
        firstDate: match.match_datetime,
      });
    }

    groupedMap.get(key)?.matches.push(match);
  }

  const groups = Array.from(groupedMap.values()).sort((a, b) => {
    const aTime = a.firstDate
      ? new Date(a.firstDate).getTime()
      : Number.MAX_SAFE_INTEGER;
    const bTime = b.firstDate
      ? new Date(b.firstDate).getTime()
      : Number.MAX_SAFE_INTEGER;

    return aTime - bTime;
  });

  const visibleGroups = groups
    .map((group) => {
      const editableCount = group.matches.filter((match) =>
        getMatchStatus(match.match_datetime).isEditable,
      ).length;

      const closedCount = group.matches.filter(
        (match) => !getMatchStatus(match.match_datetime).isEditable,
      ).length;

      let state: GroupState = "upcoming";

      if (editableCount > 0) {
        state = "active";
      } else if (closedCount === group.matches.length) {
        state = "finished";
      }

      return {
        ...group,
        state,
      };
    })
    .filter((group) => group.state !== "finished");

  const activeGroupIndex = visibleGroups.findIndex(
    (group) => group.state === "active",
  );

  const normalizedActiveGroupIndex =
    activeGroupIndex >= 0 ? activeGroupIndex : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center">
            <UserMenu />
            {isAdmin ? (
      <Link href="/admin" className={buttonStyles.nav}>
        Admin
      </Link>
    ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link href="/ranking" className={buttonStyles.nav}>
              Ranking
            </Link>

            <Link href="/my-predictions" className={buttonStyles.nav}>
              Mis predicciones
            </Link>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-6 py-7 text-white shadow-lg md:px-8 md:py-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.35em] text-white/80 md:text-xs">
            PUMA Internal POC
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            World Cup Challenge
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-white/90 md:text-lg">
            Completa tus predicciones antes del cierre y sigue los PUMA matches
            más importantes.
          </p>
        </section>

        <section className="mb-6 rounded-[1.5rem] border border-orange-100 bg-white p-5 shadow-sm md:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange-500">
              Jornada activa
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              {visibleGroups[normalizedActiveGroupIndex]?.label ??
                "Próximos partidos"}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Te faltan{" "}
              <span className="font-bold text-slate-900">
                {pendingEditableMatches.length}
              </span>{" "}
              predicciones por completar y{" "}
              <span className="font-bold text-slate-900">
                {closingTodayCount}
              </span>{" "}
              {closingTodayCount === 1
                ? "partido cierra hoy"
                : "partidos cierran hoy"}
              .
            </p>
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Próximos partidos
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {visibleGroups.reduce(
                  (total, group) => total + group.matches.length,
                  0,
                )}{" "}
                partidos visibles
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {visibleGroups.map((group, index) => {
            const prioritizedMatches = [...group.matches].sort((a, b) => {
              const aPuma = a.is_puma_match ? 1 : 0;
              const bPuma = b.is_puma_match ? 1 : 0;

              if (aPuma !== bPuma) return bPuma - aPuma;

              const aTime = a.match_datetime
                ? new Date(a.match_datetime).getTime()
                : 0;
              const bTime = b.match_datetime
                ? new Date(b.match_datetime).getTime()
                : 0;

              return aTime - bTime;
            });

            const groupPredictedCount = prioritizedMatches.filter((match) =>
              predictionsByMatch.has(match.id),
            ).length;

            return (
              <div
                key={`${group.label}-${index}`}
                className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold tracking-tight text-slate-900">
                          {group.label}
                        </h4>

                        {group.state === "active" ? (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-700">
                            Activa
                          </span>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Próximamente
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {prioritizedMatches.length} partidos ·{" "}
                        {groupPredictedCount}{" "}
                        {groupPredictedCount === 1
                          ? "predicción guardada"
                          : "predicciones guardadas"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:p-6">
                  {prioritizedMatches.map((match) => {
                    const status = getMatchStatus(match.match_datetime);
                    const timeLeftLabel = getTimeLeftLabel(match.match_datetime);
                    const savedPrediction = predictionsByMatch.get(match.id);

                    return (
                      <div
                        key={match.id}
                        className="rounded-[1.25rem] border border-slate-100 bg-slate-50/70 p-3 md:p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${getStatusClasses(
                              status.tone,
                            )}`}
                          >
                            {status.label}
                          </span>
                          
                          {timeLeftLabel ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              {timeLeftLabel}
                            </span>
                          ) : null}

                          {savedPrediction ? (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                              Tu pronóstico:{" "}
                              {savedPrediction.home_score_pred ?? "-"}-
                              {savedPrediction.away_score_pred ?? "-"}
                            </span>
                          ) : status.isEditable ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              Pendiente
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                              Sin predicción
                            </span>
                          )}

                          {match.match_datetime ? (
                            <span className="text-xs font-medium text-slate-500">
                              {formatDateTime(match.match_datetime)}
                            </span>
                          ) : null}
                        </div>

                        <MatchCard match={match} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}