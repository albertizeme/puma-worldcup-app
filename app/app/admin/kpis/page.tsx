import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type ProfileKpiRow = {
  id: string;
  role: "user" | "admin";
  is_active: boolean;
};

type PredictionRow = {
  id: string;
  user_id: string;
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

type TopPredictorRow = {
  id: string;
  display_name: string | null;
  email: string;
  predictions_count: number;
};

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
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

export default async function AdminKpisPage() {
  const supabase = await getSupabaseServerClient();

  const [
    { data: profiles, error: profilesError },
    { data: predictions, error: predictionsError },
    { data: predictionScores, error: predictionScoresError },
  ] = await Promise.all([
    supabase.from("profiles").select("id, role, is_active"),
    supabase.from("predictions").select("id, user_id, created_at"),
    supabase
      .from("prediction_scores")
      .select(
        "user_id, display_name, total_points, exact_hits, tendency_hits, resolved_predictions"
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

  const safeProfiles = (profiles as ProfileKpiRow[] | null) ?? [];
  const safePredictions = (predictions as PredictionRow[] | null) ?? [];
  const safePredictionScores =
    (predictionScores as PredictionScoreRow[] | null) ?? [];

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const totalUsers = safeProfiles.length;
  const activeUsers = safeProfiles.filter((user) => user.is_active).length;
  const adminUsers = safeProfiles.filter((user) => user.role === "admin").length;

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

  const topPredictors: TopPredictorRow[] = safeProfiles
    .map((profile) => ({
      id: profile.id,
      display_name: null,
      email: "",
      predictions_count: predictionsByUser.get(profile.id) ?? 0,
    }))
    .map((base) => {
      const profile = safeProfiles.find((p) => p.id === base.id);
      const scoreRow = safePredictionScores.find((s) => s.user_id === base.id);

      return {
        id: base.id,
        display_name: scoreRow?.display_name ?? profile?.id ?? null,
        email: "",
        predictions_count: base.predictions_count,
      };
    });

  const profileIdentityMap = new Map<string, { displayName: string; email: string }>();

  for (const profile of safeProfiles) {
    const scoreRow = safePredictionScores.find((row) => row.user_id === profile.id);

    profileIdentityMap.set(profile.id, {
      displayName:
        scoreRow?.display_name ||
        `Usuario ${profile.id.slice(0, 8)}`,
      email: "",
    });
  }

  const topPredictorsResolved = safeProfiles
    .map((profile) => {
      const scoreRow = safePredictionScores.find((row) => row.user_id === profile.id);

      return {
        id: profile.id,
        display_name:
          scoreRow?.display_name || `Usuario ${profile.id.slice(0, 8)}`,
        email: "",
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
              Visión rápida sobre adopción, actividad y participación en predicciones.
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
            label="Participación"
            value={`${formatDecimal(participationPct)}%`}
            hint="Usuarios con al menos 1 predicción / usuarios activos"
            tone={participationPct >= 50 ? "success" : "warning"}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Usuarios con predicciones"
            value={formatNumber(usersWithPredictions)}
          />
          <StatCard
            label="Usuarios sin predicciones"
            value={formatNumber(usersWithoutPredictions)}
            tone={usersWithoutPredictions > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Predicciones totales"
            value={formatNumber(safePredictions.length)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Actividad</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Predicciones últimos 7 días"
            value={formatNumber(predictionsLast7d.length)}
          />
          <StatCard
            label="Usuarios activos 7 días"
            value={formatNumber(activePredictorsLast7d)}
            hint="Usuarios con al menos 1 predicción en 7 días"
          />
          <StatCard
            label="Predicciones últimos 30 días"
            value={formatNumber(predictionsLast30d.length)}
          />
          <StatCard
            label="Usuarios activos 30 días"
            value={formatNumber(activePredictorsLast30d)}
            hint="Usuarios con al menos 1 predicción en 30 días"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <StatCard
            label="Promedio por usuario activo"
            value={formatDecimal(avgPredictionsPerActiveUser)}
            hint="Predicciones totales / usuarios activos"
          />
          <StatCard
            label="Promedio por usuario participante"
            value={formatDecimal(avgPredictionsPerParticipatingUser)}
            hint="Predicciones totales / usuarios con al menos 1 predicción"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900">Competición</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Puntos repartidos"
            value={formatNumber(totalPointsAwarded)}
          />
          <StatCard
            label="Exact hits totales"
            value={formatNumber(totalExactHits)}
          />
          <StatCard
            label="Tendency hits totales"
            value={formatNumber(totalTendencyHits)}
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
      </section>
    </div>
  );
}