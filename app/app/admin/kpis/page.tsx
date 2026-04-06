import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type ProfileKpiRow = {
  id: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string | null;
  last_seen_at: string | null;
  last_prediction_at: string | null;
};

type PredictionRow = {
  id: string;
  user_id: string;
  match_id: string;
  created_at: string;
};

type PredictionScoreRow = {
  user_id: string;
  display_name: string;
  total_points: number | null;
  exact_hits: number | null;
  tendency_hits: number | null;
  resolved_predictions: number | null;
};

type MatchRow = {
  id: string;
  stage: string | null;
  match_datetime: string | null;
  home_team: string | null;
  away_team: string | null;
  is_puma_match: boolean | null;
  status: "upcoming" | "live" | "finished";
};

type MatchPredictionSummary = {
  id: string;
  label: string;
  status: "upcoming" | "live" | "finished";
  isPuma: boolean;
  predictionsCount: number;
};

type Tone = "default" | "success" | "warning" | "danger" | "info";
type BarColor = "slate" | "emerald" | "amber" | "sky" | "violet" | "rose";

function toneClasses(tone: Tone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "danger":
      return "border-red-200 bg-red-50";
    case "info":
      return "border-sky-200 bg-sky-50";
    default:
      return "border-slate-200 bg-white";
  }
}

function barColorClasses(color: BarColor) {
  switch (color) {
    case "emerald":
      return "bg-emerald-500";
    case "amber":
      return "bg-amber-500";
    case "sky":
      return "bg-sky-500";
    case "violet":
      return "bg-violet-500";
    case "rose":
      return "bg-rose-500";
    default:
      return "bg-slate-900";
  }
}

function badgeClasses(tone: Tone) {
  switch (tone) {
    case "success":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-800";
    case "danger":
      return "border border-red-200 bg-red-50 text-red-700";
    case "info":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses(tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SegmentCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  tone: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses(tone)}`}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses(tone)}`}>
          {formatNumber(value)}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getMatchLabel(match: MatchRow) {
  const home = match.home_team || "Local";
  const away = match.away_team || "Visitante";
  return `${home} vs ${away}`;
}

function MiniBarChart({
  title,
  subtitle,
  rows,
  valueLabel,
}: {
  title: string;
  subtitle?: string;
  rows: Array<{ label: string; value: number; secondaryValue?: number; color?: BarColor }>;
  valueLabel?: string;
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}

      <div className="mt-6 space-y-4">
        {rows.map((row) => {
          const widthPct = (row.value / maxValue) * 100;

          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-800">{row.label}</span>
                <span className="text-slate-500">
                  {formatNumber(row.value)}
                  {valueLabel ? ` ${valueLabel}` : ""}
                  {typeof row.secondaryValue === "number"
                    ? ` · ${formatNumber(row.secondaryValue)} usuarios`
                    : ""}
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${barColorClasses(row.color ?? "slate")}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function AdminKpisPage() {
  const supabase = await getSupabaseServerClient();

  const [
    { data: profiles, error: profilesError },
    { data: predictions, error: predictionsError },
    { data: predictionScores, error: predictionScoresError },
    { data: matches, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, role, is_active, created_at, last_seen_at, last_prediction_at"
      ),
    supabase.from("predictions").select("id, user_id, match_id, created_at"),
    supabase
      .from("prediction_scores")
      .select(
        "user_id, display_name, total_points, exact_hits, tendency_hits, resolved_predictions"
      ),
    supabase
      .from("matches")
      .select(
        "id, stage, match_datetime, home_team, away_team, is_puma_match, status"
      ),
  ]);

  if (profilesError) {
    throw new Error(`Error cargando profiles: ${profilesError.message}`);
  }

  if (predictionsError) {
    throw new Error(`Error cargando predictions: ${predictionsError.message}`);
  }

  if (predictionScoresError) {
    throw new Error(
      `Error cargando prediction_scores: ${predictionScoresError.message}`
    );
  }

  if (matchesError) {
    throw new Error(`Error cargando matches: ${matchesError.message}`);
  }

  const safeProfiles = (profiles as ProfileKpiRow[] | null) ?? [];
  const safePredictions = (predictions as PredictionRow[] | null) ?? [];
  const safePredictionScores =
    (predictionScores as PredictionScoreRow[] | null) ?? [];
  const safeMatches = (matches as MatchRow[] | null) ?? [];

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const totalUsers = safeProfiles.length;
  const activeUsers = safeProfiles.filter((user) => user.is_active).length;
  const adminUsers = safeProfiles.filter((user) => user.role === "admin").length;

  const newUsersLast7d = safeProfiles.filter(
    (user) =>
      user.created_at && new Date(user.created_at).getTime() >= sevenDaysAgo
  ).length;

  const newUsersLast30d = safeProfiles.filter(
    (user) =>
      user.created_at && new Date(user.created_at).getTime() >= thirtyDaysAgo
  ).length;

  const seenUsersLast7d = safeProfiles.filter(
    (user) =>
      user.last_seen_at && new Date(user.last_seen_at).getTime() >= sevenDaysAgo
  ).length;

  const seenUsersLast30d = safeProfiles.filter(
    (user) =>
      user.last_seen_at &&
      new Date(user.last_seen_at).getTime() >= thirtyDaysAgo
  ).length;

  const dormantUsers = safeProfiles.filter(
    (user) =>
      !user.last_seen_at || new Date(user.last_seen_at).getTime() < thirtyDaysAgo
  ).length;

  const predictedUsersLast7d = safeProfiles.filter(
    (user) =>
      user.last_prediction_at &&
      new Date(user.last_prediction_at).getTime() >= sevenDaysAgo
  ).length;

  const predictedUsersLast30d = safeProfiles.filter(
    (user) =>
      user.last_prediction_at &&
      new Date(user.last_prediction_at).getTime() >= thirtyDaysAgo
  ).length;

  const seenButNotPredictedLast7d = safeProfiles.filter((user) => {
    const seenRecently =
      user.last_seen_at && new Date(user.last_seen_at).getTime() >= sevenDaysAgo;

    const predictedRecently =
      user.last_prediction_at &&
      new Date(user.last_prediction_at).getTime() >= sevenDaysAgo;

    return Boolean(seenRecently) && !predictedRecently;
  }).length;

  const seenButNotPredictedLast30d = safeProfiles.filter((user) => {
    const seenRecently =
      user.last_seen_at &&
      new Date(user.last_seen_at).getTime() >= thirtyDaysAgo;

    const predictedRecently =
      user.last_prediction_at &&
      new Date(user.last_prediction_at).getTime() >= thirtyDaysAgo;

    return Boolean(seenRecently) && !predictedRecently;
  }).length;

  const predictionConversion7d =
    seenUsersLast7d > 0 ? (predictedUsersLast7d / seenUsersLast7d) * 100 : 0;

  const predictionConversion30d =
    seenUsersLast30d > 0 ? (predictedUsersLast30d / seenUsersLast30d) * 100 : 0;

  const usersWithPredictionsSet = new Set(safePredictions.map((p) => p.user_id));
  const usersWithPredictions = usersWithPredictionsSet.size;
  const usersWithoutPredictions = safeProfiles.filter(
    (profile) => !usersWithPredictionsSet.has(profile.id)
  ).length;

  const participationPct =
    activeUsers > 0 ? (usersWithPredictions / activeUsers) * 100 : 0;

  const predictionsLast7d = safePredictions.filter(
    (prediction) => new Date(prediction.created_at).getTime() >= sevenDaysAgo
  );

  const predictionsLast30d = safePredictions.filter(
    (prediction) => new Date(prediction.created_at).getTime() >= thirtyDaysAgo
  );

  const activePredictorsLast7d = new Set(
    predictionsLast7d.map((prediction) => prediction.user_id)
  ).size;

  const activePredictorsLast30d = new Set(
    predictionsLast30d.map((prediction) => prediction.user_id)
  ).size;

  const avgPredictionsPerActiveUser =
    activeUsers > 0 ? safePredictions.length / activeUsers : 0;

  const avgPredictionsPerParticipatingUser =
    usersWithPredictions > 0 ? safePredictions.length / usersWithPredictions : 0;

  const totalPointsAwarded = safePredictionScores.reduce(
    (acc, row) => acc + (row.total_points ?? 0),
    0
  );

  const totalExactHits = safePredictionScores.reduce(
    (acc, row) => acc + (row.exact_hits ?? 0),
    0
  );

  const totalTendencyHits = safePredictionScores.reduce(
    (acc, row) => acc + (row.tendency_hits ?? 0),
    0
  );

  const avgPointsPerScoredUser =
    safePredictionScores.length > 0
      ? totalPointsAwarded / safePredictionScores.length
      : 0;

  const avgResolvedPredictionsPerUser =
    safePredictionScores.length > 0
      ? safePredictionScores.reduce(
          (acc, row) => acc + (row.resolved_predictions ?? 0),
          0
        ) / safePredictionScores.length
      : 0;

  const predictionsByUser = new Map<string, number>();
  for (const prediction of safePredictions) {
    predictionsByUser.set(
      prediction.user_id,
      (predictionsByUser.get(prediction.user_id) ?? 0) + 1
    );
  }

  const usersWithMoreThan5Predictions = [...predictionsByUser.values()].filter(
    (count) => count > 5
  ).length;

  const topPredictorsResolved = safeProfiles
    .map((profile) => {
      const scoreRow = safePredictionScores.find((row) => row.user_id === profile.id);

      return {
        id: profile.id,
        display_name:
          scoreRow?.display_name || `Usuario ${profile.id.slice(0, 8)}`,
        predictions_count: predictionsByUser.get(profile.id) ?? 0,
      };
    })
    .sort((a, b) => b.predictions_count - a.predictions_count)
    .slice(0, 5);

  const topScoredUsers = [...safePredictionScores]
    .sort((a, b) => {
      const pointsDiff = (b.total_points ?? 0) - (a.total_points ?? 0);
      if (pointsDiff !== 0) return pointsDiff;
      return (b.exact_hits ?? 0) - (a.exact_hits ?? 0);
    })
    .slice(0, 5);

  const predictionsByMatch = new Map<string, number>();
  for (const prediction of safePredictions) {
    predictionsByMatch.set(
      prediction.match_id,
      (predictionsByMatch.get(prediction.match_id) ?? 0) + 1
    );
  }

  const matchSummaries: MatchPredictionSummary[] = safeMatches.map((match) => ({
    id: match.id,
    label: getMatchLabel(match),
    status: match.status,
    isPuma: Boolean(match.is_puma_match),
    predictionsCount: predictionsByMatch.get(match.id) ?? 0,
  }));

  const totalMatches = safeMatches.length;
  const upcomingMatches = safeMatches.filter((m) => m.status === "upcoming").length;
  const liveMatches = safeMatches.filter((m) => m.status === "live").length;
  const finishedMatches = safeMatches.filter((m) => m.status === "finished").length;
  const pumaMatches = safeMatches.filter((m) => Boolean(m.is_puma_match)).length;

  const matchesWithoutPredictions = matchSummaries.filter(
    (match) => match.predictionsCount === 0
  ).length;

  const avgPredictionsPerMatch =
    totalMatches > 0 ? safePredictions.length / totalMatches : 0;

  const pumaMatchSummaries = matchSummaries.filter((match) => match.isPuma);
  const nonPumaMatchSummaries = matchSummaries.filter((match) => !match.isPuma);

  const avgPredictionsPerPumaMatch =
    pumaMatchSummaries.length > 0
      ? pumaMatchSummaries.reduce((acc, row) => acc + row.predictionsCount, 0) /
        pumaMatchSummaries.length
      : 0;

  const avgPredictionsPerNonPumaMatch =
    nonPumaMatchSummaries.length > 0
      ? nonPumaMatchSummaries.reduce((acc, row) => acc + row.predictionsCount, 0) /
        nonPumaMatchSummaries.length
      : 0;

  const topMatchesByPredictions = [...matchSummaries]
    .sort((a, b) => b.predictionsCount - a.predictionsCount)
    .slice(0, 5);

  const last7DaysSeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayPredictions = safePredictions.filter((prediction) => {
      const predictionDate = new Date(prediction.created_at).getTime();
      return (
        predictionDate >= date.getTime() && predictionDate < nextDate.getTime()
      );
    });

    return {
      label: formatShortDate(date),
      value: dayPredictions.length,
      secondaryValue: new Set(dayPredictions.map((prediction) => prediction.user_id))
        .size,
      color: "sky" as BarColor,
    };
  });

  const accessVsPredictionRows = [
    {
      label: "Acceso 7 días",
      value: seenUsersLast7d,
      color: "emerald" as BarColor,
    },
    {
      label: "Predicción 7 días",
      value: predictedUsersLast7d,
      color: "violet" as BarColor,
    },
    {
      label: "Acceso 30 días",
      value: seenUsersLast30d,
      color: "sky" as BarColor,
    },
    {
      label: "Predicción 30 días",
      value: predictedUsersLast30d,
      color: "amber" as BarColor,
    },
  ];

  const engagedUsers = safeProfiles.filter((user) => {
    const seenRecently =
      user.last_seen_at && new Date(user.last_seen_at).getTime() >= sevenDaysAgo;
    const predictedRecently =
      user.last_prediction_at &&
      new Date(user.last_prediction_at).getTime() >= sevenDaysAgo;

    return Boolean(seenRecently) && Boolean(predictedRecently);
  }).length;

  const watchersUsers = safeProfiles.filter((user) => {
    const seenRecently =
      user.last_seen_at && new Date(user.last_seen_at).getTime() >= sevenDaysAgo;
    const predictedRecently =
      user.last_prediction_at &&
      new Date(user.last_prediction_at).getTime() >= sevenDaysAgo;

    return Boolean(seenRecently) && !predictedRecently;
  }).length;

  const coldUsers = safeProfiles.filter((user) => !user.last_prediction_at).length;

  const segmentRows = [
    {
      label: "Engaged",
      value: engagedUsers,
      color: "emerald" as BarColor,
    },
    {
      label: "Watchers",
      value: watchersUsers,
      color: "amber" as BarColor,
    },
    {
      label: "Dormant",
      value: dormantUsers,
      color: "rose" as BarColor,
    },
    {
      label: "Cold",
      value: coldUsers,
      color: "slate" as BarColor,
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              KPIs
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Indicadores de uso
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Visión rápida sobre acceso real, adopción, actividad, partidos y participación.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Volver al resumen
          </Link>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Segmentos de usuarios</h3>
        <p className="mt-1 text-sm text-slate-500">
          Clasificación rápida para entender quién participa, quién observa y quién se está perdiendo.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SegmentCard
            title="Engaged"
            value={engagedUsers}
            description="Han accedido y también han predicho en los últimos 7 días."
            tone="success"
          />
          <SegmentCard
            title="Watchers"
            value={watchersUsers}
            description="Han accedido recientemente, pero no han participado con predicciones."
            tone="warning"
          />
          <SegmentCard
            title="Dormant"
            value={dormantUsers}
            description="No acceden desde hace 30 días o nunca han sido vistos."
            tone="danger"
          />
          <SegmentCard
            title="Cold"
            value={coldUsers}
            description="Usuarios que todavía no han hecho ninguna predicción histórica."
            tone="default"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Acceso y conversión</h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Usuarios vistos 7 días"
            value={formatNumber(seenUsersLast7d)}
            tone="success"
          />
          <StatCard
            label="Usuarios con predicción 7 días"
            value={formatNumber(predictedUsersLast7d)}
            tone="info"
          />
          <StatCard
            label="Conversión 7 días"
            value={`${formatDecimal(predictionConversion7d)}%`}
            hint="Usuarios con predicción / usuarios vistos"
            tone={predictionConversion7d >= 50 ? "success" : "warning"}
          />
          <StatCard
            label="Vistos sin predecir 7 días"
            value={formatNumber(seenButNotPredictedLast7d)}
            hint="Han entrado, pero no participaron"
            tone={seenButNotPredictedLast7d > 0 ? "warning" : "default"}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Usuarios vistos 30 días"
            value={formatNumber(seenUsersLast30d)}
            tone="info"
          />
          <StatCard
            label="Usuarios con predicción 30 días"
            value={formatNumber(predictedUsersLast30d)}
            tone="info"
          />
          <StatCard
            label="Conversión 30 días"
            value={`${formatDecimal(predictionConversion30d)}%`}
            hint="Usuarios con predicción / usuarios vistos"
            tone={predictionConversion30d >= 50 ? "success" : "warning"}
          />
          <StatCard
            label="Usuarios dormidos"
            value={formatNumber(dormantUsers)}
            hint="Sin acceso en 30 días o nunca vistos"
            tone={dormantUsers > 0 ? "danger" : "default"}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <StatCard
            label="Vistos sin predecir 30 días"
            value={formatNumber(seenButNotPredictedLast30d)}
            hint="Usuarios que entran pero no participan"
            tone={seenButNotPredictedLast30d > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Nuevos usuarios 30 días"
            value={formatNumber(newUsersLast30d)}
            tone="info"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Adopción</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Usuarios totales" value={formatNumber(totalUsers)} />
          <StatCard
            label="Usuarios activos"
            value={formatNumber(activeUsers)}
            tone="success"
          />
          <StatCard label="Admins" value={formatNumber(adminUsers)} />
          <StatCard
            label="Participación histórica"
            value={`${formatDecimal(participationPct)}%`}
            hint="Usuarios con al menos 1 predicción / usuarios activos"
            tone={participationPct >= 50 ? "success" : "warning"}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Nuevos usuarios 7 días"
            value={formatNumber(newUsersLast7d)}
            tone="info"
          />
          <StatCard
            label="Usuarios con predicciones"
            value={formatNumber(usersWithPredictions)}
            tone="info"
          />
          <StatCard
            label="Usuarios sin predicciones"
            value={formatNumber(usersWithoutPredictions)}
            tone={usersWithoutPredictions > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Usuarios con +5 predicciones"
            value={formatNumber(usersWithMoreThan5Predictions)}
            tone="success"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Actividad</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Predicciones totales"
            value={formatNumber(safePredictions.length)}
            tone="info"
          />
          <StatCard
            label="Predicciones 7 días"
            value={formatNumber(predictionsLast7d.length)}
            tone="info"
          />
          <StatCard
            label="Predicciones 30 días"
            value={formatNumber(predictionsLast30d.length)}
            tone="info"
          />
          <StatCard
            label="Predictores 7 días"
            value={formatNumber(activePredictorsLast7d)}
            hint="Basado en predicciones creadas"
            tone="success"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Predictores 30 días"
            value={formatNumber(activePredictorsLast30d)}
            hint="Basado en predicciones creadas"
            tone="info"
          />
          <StatCard
            label="Promedio por usuario activo"
            value={formatDecimal(avgPredictionsPerActiveUser)}
            hint="Predicciones totales / usuarios activos"
          />
          <StatCard
            label="Promedio por participante"
            value={formatDecimal(avgPredictionsPerParticipatingUser)}
            hint="Predicciones totales / usuarios con predicciones"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Partidos</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Partidos totales" value={formatNumber(totalMatches)} />
          <StatCard label="Upcoming" value={formatNumber(upcomingMatches)} tone="info" />
          <StatCard label="Live" value={formatNumber(liveMatches)} tone="success" />
          <StatCard label="Finished" value={formatNumber(finishedMatches)} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Partidos PUMA" value={formatNumber(pumaMatches)} tone="info" />
          <StatCard
            label="Partidos sin predicciones"
            value={formatNumber(matchesWithoutPredictions)}
            tone={matchesWithoutPredictions > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Promedio por partido"
            value={formatDecimal(avgPredictionsPerMatch)}
          />
          <StatCard
            label="Media en partidos PUMA"
            value={formatDecimal(avgPredictionsPerPumaMatch)}
            hint={`No PUMA: ${formatDecimal(avgPredictionsPerNonPumaMatch)}`}
            tone="info"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Competición</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Puntos repartidos"
            value={formatNumber(totalPointsAwarded)}
            tone="info"
          />
          <StatCard
            label="Exact hits totales"
            value={formatNumber(totalExactHits)}
            tone="success"
          />
          <StatCard
            label="Tendency hits totales"
            value={formatNumber(totalTendencyHits)}
            tone="warning"
          />
          <StatCard
            label="Media puntos por usuario"
            value={formatDecimal(avgPointsPerScoredUser)}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-1 xl:grid-cols-1">
          <StatCard
            label="Media de predicciones resueltas"
            value={formatDecimal(avgResolvedPredictionsPerUser)}
            hint="Promedio sobre usuarios presentes en prediction_scores"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <MiniBarChart
          title="Actividad diaria últimos 7 días"
          subtitle="Predicciones por día y usuarios únicos"
          rows={last7DaysSeries}
          valueLabel="pred."
        />

        <MiniBarChart
          title="Acceso vs predicción"
          subtitle="Comparativa de usuarios vistos y usuarios que participaron"
          rows={accessVsPredictionRows}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <MiniBarChart
          title="Distribución por segmento"
          subtitle="Mapa rápido del estado de la base de usuarios"
          rows={segmentRows}
        />

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Top 5 usuarios por predicciones
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Quién está participando más activamente.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Pos.</th>
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Predicciones</th>
                </tr>
              </thead>
              <tbody>
                {topPredictorsResolved.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                    >
                      Aún no hay datos de predicciones.
                    </td>
                  </tr>
                ) : (
                  topPredictorsResolved.map((row, index) => (
                    <tr key={row.id} className="rounded-2xl bg-slate-50 text-sm">
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        #{index + 1}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.display_name || "Usuario"}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {formatNumber(row.predictions_count)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Top 5 usuarios por puntos
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Clasificación resumida por rendimiento acumulado.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Pos.</th>
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Puntos</th>
                  <th className="px-3 py-2">Exact</th>
                </tr>
              </thead>
              <tbody>
                {topScoredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                    >
                      Aún no hay puntuaciones resueltas.
                    </td>
                  </tr>
                ) : (
                  topScoredUsers.map((row, index) => (
                    <tr key={row.user_id} className="rounded-2xl bg-slate-50 text-sm">
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        #{index + 1}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.display_name || "Usuario"}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {formatNumber(row.total_points ?? 0)}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {formatNumber(row.exact_hits ?? 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <MiniBarChart
          title="Top partidos por interés"
          subtitle="Comparativa visual de predicciones por partido"
          rows={topMatchesByPredictions.map((row, index) => ({
            label: row.label,
            value: row.predictionsCount,
            color: index === 0 ? "emerald" : index === 1 ? "sky" : "violet",
          }))}
          valueLabel="pred."
        />
      </section>

      <section>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Top 5 partidos por predicciones
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Qué partidos están generando más interés.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Pos.</th>
                  <th className="px-3 py-2">Partido</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Predicciones</th>
                </tr>
              </thead>
              <tbody>
                {topMatchesByPredictions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                    >
                      Aún no hay partidos cargados.
                    </td>
                  </tr>
                ) : (
                  topMatchesByPredictions.map((row, index) => (
                    <tr key={row.id} className="rounded-2xl bg-slate-50 text-sm">
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        #{index + 1}
                      </td>
                      <td className="px-3 py-3 text-slate-800">{row.label}</td>
                      <td className="px-3 py-3 text-slate-800">{row.status}</td>
                      <td className="px-3 py-3 text-slate-800">
                        {formatNumber(row.predictionsCount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}