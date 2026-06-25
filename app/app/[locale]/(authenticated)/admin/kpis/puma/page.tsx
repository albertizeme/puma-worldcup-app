import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

type MatchRow = {
  id: string;
  home_team: string | null;
  away_team: string | null;
  status: "upcoming" | "live" | "finished";
  is_puma_match: boolean | null;
  home_score: number | null;
  away_score: number | null;
};

type PredictionWithMatchRow = {
  id: string;
  user_id: string;
  match_id: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  matches: MatchRow | MatchRow[] | null;
};

type UserPumaKpiRow = {
  userId: string;
  name: string;
  email: string | null;
  isActive: boolean;
  pumaPredictions: number;
  resolvedPumaPredictions: number;
  tendencyHits: number;
  exactHits: number;
  totalHits: number;
  hitRate: number;
  shareOfAllPumaPredictions: number;
};

type Tone = "default" | "success" | "warning" | "info";
type BarColor = "slate" | "emerald" | "amber" | "sky" | "violet";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number) {
  return `${formatDecimal(value)}%`;
}

function toneClasses(tone: Tone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
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
    default:
      return "bg-slate-900";
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

function MiniBarChart({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: Array<{ label: string; value: number; detail: string; color?: BarColor }>;
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Todavía no hay suficientes PUMA matches resueltos.
          </div>
        ) : (
          rows.map((row) => {
            const widthPct = (row.value / maxValue) * 100;

            return (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                  <span className="min-w-0 truncate font-medium text-slate-800">
                    {row.label}
                  </span>
                  <span className="shrink-0 text-slate-500">{row.detail}</span>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-3 rounded-full ${barColorClasses(row.color ?? "violet")}`}
                    style={{ width: `${Math.max(widthPct, row.value > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getResultSign(home: number, away: number) {
  return Math.sign(home - away);
}

function getDisplayName(userId: string, profile?: ProfileRow) {
  return profile?.display_name || profile?.email || `Usuario ${userId.slice(0, 8)}`;
}

function normalizeJoinedMatch(value: MatchRow | MatchRow[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AdminPumaMatchKpisPage() {
  const supabase = getSupabaseAdminClient();

  const [
    { data: profiles, error: profilesError },
    { data: pumaPredictionsData, error: pumaPredictionsError },
    { data: pumaMatchesData, error: pumaMatchesError },
    { count: allPredictionsCount, error: allPredictionsCountError },
    { count: allMatchesCount, error: allMatchesCountError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, role, is_active"),
    supabase
      .from("predictions")
      .select(
        `
          id,
          user_id,
          match_id,
          home_score_pred,
          away_score_pred,
          matches!inner (
            id,
            home_team,
            away_team,
            status,
            is_puma_match,
            home_score,
            away_score
          )
        `
      )
      .filter("matches.is_puma_match", "is", "true"),
    supabase
      .from("matches")
      .select("id, home_team, away_team, status, is_puma_match, home_score, away_score")
      .is("is_puma_match", true),
    supabase
      .from("predictions")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true }),
  ]);

  if (profilesError) {
    throw new Error(`Error cargando usuarios: ${profilesError.message}`);
  }

  if (pumaPredictionsError) {
    throw new Error(`Error cargando predicciones PUMA: ${pumaPredictionsError.message}`);
  }

  if (pumaMatchesError) {
    throw new Error(`Error cargando partidos PUMA: ${pumaMatchesError.message}`);
  }

  if (allPredictionsCountError) {
    throw new Error(
      `Error contando predicciones: ${allPredictionsCountError.message}`
    );
  }

  if (allMatchesCountError) {
    throw new Error(`Error contando partidos: ${allMatchesCountError.message}`);
  }

  const safeProfiles = (profiles as ProfileRow[] | null) ?? [];
  const pumaPredictions =
    (pumaPredictionsData as PredictionWithMatchRow[] | null) ?? [];
  const explicitPumaMatches = (pumaMatchesData as MatchRow[] | null) ?? [];

  const profilesById = new Map(safeProfiles.map((profile) => [profile.id, profile]));
  const activeUsers = safeProfiles.filter(
    (profile) => profile.role !== "admin" && profile.is_active !== false
  ).length;

  const pumaMatchesById = new Map(explicitPumaMatches.map((match) => [match.id, match]));
  for (const prediction of pumaPredictions) {
    const match = normalizeJoinedMatch(prediction.matches);
    if (match && !pumaMatchesById.has(match.id)) {
      pumaMatchesById.set(match.id, match);
    }
  }

  const pumaMatches = Array.from(pumaMatchesById.values());
  const resolvedPumaMatches = pumaMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
  );

  const rowsByUser = new Map<string, UserPumaKpiRow>();

  for (const prediction of pumaPredictions) {
    const match = normalizeJoinedMatch(prediction.matches);
    if (!match) continue;

    const profile = profilesById.get(prediction.user_id);
    const current = rowsByUser.get(prediction.user_id) ?? {
      userId: prediction.user_id,
      name: getDisplayName(prediction.user_id, profile),
      email: profile?.email ?? null,
      isActive: profile?.is_active !== false,
      pumaPredictions: 0,
      resolvedPumaPredictions: 0,
      tendencyHits: 0,
      exactHits: 0,
      totalHits: 0,
      hitRate: 0,
      shareOfAllPumaPredictions: 0,
    };

    current.pumaPredictions += 1;

    const predictedHome = prediction.home_score_pred;
    const predictedAway = prediction.away_score_pred;
    const actualHome = match.home_score;
    const actualAway = match.away_score;
    const hasPrediction = predictedHome !== null && predictedAway !== null;
    const isResolved =
      match.status === "finished" && actualHome !== null && actualAway !== null;

    if (hasPrediction && isResolved) {
      current.resolvedPumaPredictions += 1;

      const isExact = predictedHome === actualHome && predictedAway === actualAway;
      const isTendency =
        !isExact &&
        getResultSign(predictedHome, predictedAway) ===
          getResultSign(actualHome, actualAway);

      if (isExact) current.exactHits += 1;
      if (isTendency) current.tendencyHits += 1;
    }

    rowsByUser.set(prediction.user_id, current);
  }

  const userRows = Array.from(rowsByUser.values())
    .map((row) => {
      const totalHits = row.exactHits + row.tendencyHits;
      const resolved = row.resolvedPumaPredictions;

      return {
        ...row,
        totalHits,
        hitRate: resolved > 0 ? (totalHits / resolved) * 100 : 0,
        shareOfAllPumaPredictions:
          pumaPredictions.length > 0
            ? (row.pumaPredictions / pumaPredictions.length) * 100
            : 0,
      };
    })
    .sort((a, b) => {
      const resolvedDiff = b.resolvedPumaPredictions - a.resolvedPumaPredictions;
      if (resolvedDiff !== 0) return resolvedDiff;

      const hitRateDiff = b.hitRate - a.hitRate;
      if (hitRateDiff !== 0) return hitRateDiff;

      const volumeDiff = b.pumaPredictions - a.pumaPredictions;
      if (volumeDiff !== 0) return volumeDiff;

      return a.name.localeCompare(b.name, "es-ES");
    });

  const usersWithPumaPredictions = userRows.length;
  const usersWithResolvedPumaPredictions = userRows.filter(
    (row) => row.resolvedPumaPredictions > 0
  ).length;
  const totalResolvedPumaPredictions = userRows.reduce(
    (acc, row) => acc + row.resolvedPumaPredictions,
    0
  );
  const totalExactHits = userRows.reduce((acc, row) => acc + row.exactHits, 0);
  const totalTendencyHits = userRows.reduce(
    (acc, row) => acc + row.tendencyHits,
    0
  );
  const totalHits = totalExactHits + totalTendencyHits;
  const pumaPredictionsWithoutProfile = pumaPredictions.filter(
    (prediction) => !profilesById.has(prediction.user_id)
  ).length;

  const pumaParticipationPct =
    activeUsers > 0 ? (usersWithPumaPredictions / activeUsers) * 100 : 0;
  const pumaResolvedParticipationPct =
    activeUsers > 0 ? (usersWithResolvedPumaPredictions / activeUsers) * 100 : 0;
  const overallExactRate =
    totalResolvedPumaPredictions > 0
      ? (totalExactHits / totalResolvedPumaPredictions) * 100
      : 0;
  const overallTendencyRate =
    totalResolvedPumaPredictions > 0
      ? (totalTendencyHits / totalResolvedPumaPredictions) * 100
      : 0;
  const overallHitRate =
    totalResolvedPumaPredictions > 0
      ? (totalHits / totalResolvedPumaPredictions) * 100
      : 0;

  const topAccuracyRows = userRows
    .filter((row) => row.resolvedPumaPredictions > 0)
    .sort((a, b) => {
      const hitRateDiff = b.hitRate - a.hitRate;
      if (hitRateDiff !== 0) return hitRateDiff;
      const exactDiff = b.exactHits - a.exactHits;
      if (exactDiff !== 0) return exactDiff;
      return b.resolvedPumaPredictions - a.resolvedPumaPredictions;
    })
    .slice(0, 8);

  const topVolumeRows = [...userRows]
    .sort((a, b) => b.pumaPredictions - a.pumaPredictions)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          KPIs PUMA
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-950">
              Calidad en PUMA matches
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Mide cómo están prediciendo los usuarios en partidos marcados como
              PUMA. Las tasas de acierto solo usan PUMA matches finalizados con
              marcador informado.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
            {formatNumber(resolvedPumaMatches.length)} de {formatNumber(pumaMatches.length)} PUMA matches resueltos
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Usuarios con PUMA predicción"
          value={formatPercent(pumaParticipationPct)}
          hint={`${formatNumber(usersWithPumaPredictions)} usuarios · base activa: ${formatNumber(activeUsers)}`}
          tone="info"
        />
        <StatCard
          label="Usuarios evaluables"
          value={formatPercent(pumaResolvedParticipationPct)}
          hint={`${formatNumber(usersWithResolvedPumaPredictions)} usuarios con PUMA matches resueltos`}
          tone="info"
        />
        <StatCard
          label="Acierto total"
          value={formatPercent(overallHitRate)}
          hint={`${formatNumber(totalHits)} hits sobre ${formatNumber(totalResolvedPumaPredictions)} predicciones resueltas`}
          tone={overallHitRate >= 50 ? "success" : "warning"}
        />
        <StatCard
          label="Exact result"
          value={formatPercent(overallExactRate)}
          hint={`${formatNumber(totalExactHits)} exactos`}
          tone="success"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="PUMA matches"
          value={formatNumber(pumaMatches.length)}
          hint={`${formatNumber(resolvedPumaMatches.length)} finalizados con resultado`}
        />
        <StatCard
          label="PUMA predicciones"
          value={formatNumber(pumaPredictions.length)}
          hint="Predicciones totales en partidos PUMA"
          tone="info"
        />
        <StatCard
          label="PUMA predicciones resueltas"
          value={formatNumber(totalResolvedPumaPredictions)}
          hint="Base usada para las tasas de acierto"
          tone="info"
        />
        <StatCard
          label="Tendencies"
          value={formatPercent(overallTendencyRate)}
          hint={`${formatNumber(totalTendencyHits)} tendencias sin exacto`}
          tone="warning"
        />
      </section>

      <section className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Diagnóstico: {formatNumber(allPredictionsCount ?? 0)} predicciones totales · {formatNumber(allMatchesCount ?? 0)} partidos totales · {formatNumber(explicitPumaMatches.length)} partidos con is_puma_match = true · {formatNumber(pumaPredictions.length)} predicciones unidas a PUMA matches · {formatNumber(pumaPredictionsWithoutProfile)} PUMA predicciones sin perfil asociado.
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <MiniBarChart
          title="Top acierto PUMA"
          subtitle="Usuarios ordenados por % de hits en PUMA matches resueltos"
          rows={topAccuracyRows.map((row, index) => ({
            label: row.name,
            value: row.hitRate,
            detail: `${formatPercent(row.hitRate)} · ${formatNumber(row.exactHits)} exact · ${formatNumber(row.tendencyHits)} tend.`,
            color: index === 0 ? "emerald" : index === 1 ? "sky" : "violet",
          }))}
        />

        <MiniBarChart
          title="Top volumen PUMA"
          subtitle="Usuarios con más predicciones en PUMA matches"
          rows={topVolumeRows.map((row, index) => ({
            label: row.name,
            value: row.pumaPredictions,
            detail: `${formatNumber(row.pumaPredictions)} pred. · ${formatPercent(row.shareOfAllPumaPredictions)}`,
            color: index === 0 ? "emerald" : index === 1 ? "sky" : "amber",
          }))}
        />
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Ranking de precisión
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-950">
              Usuarios vs PUMA matches
            </h3>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {formatNumber(userRows.length)} usuarios con PUMA predicciones
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-right">PUMA pred.</th>
                <th className="px-4 py-3 text-right">Resueltas</th>
                <th className="px-4 py-3 text-right">Tendencies</th>
                <th className="px-4 py-3 text-right">Exact</th>
                <th className="px-4 py-3 text-right">Hit rate</th>
                <th className="px-4 py-3 text-right">% total pred.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {userRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan={7}>
                    Todavía no hay predicciones en PUMA matches. Revisa el diagnóstico superior para confirmar si hay partidos con is_puma_match = true.
                  </td>
                </tr>
              ) : (
                userRows.map((row) => (
                  <tr key={row.userId}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {row.name}
                          {!row.isActive ? " (inactivo)" : ""}
                        </p>
                        {row.email && (
                          <p className="text-xs text-slate-500">{row.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatNumber(row.pumaPredictions)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatNumber(row.resolvedPumaPredictions)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700">
                      {formatNumber(row.tendencyHits)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700">
                      {formatNumber(row.exactHits)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-700">
                      {row.resolvedPumaPredictions > 0 ? formatPercent(row.hitRate) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatPercent(row.shareOfAllPumaPredictions)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
