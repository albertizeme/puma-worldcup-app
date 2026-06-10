import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type SearchParams = Promise<{ country?: string }>;

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  is_active: boolean;
  country: string | null;
};

type PredictionRow = {
  user_id: string;
};

type PredictionScoreRow = {
  user_id: string;
  display_name: string | null;
  total_points: number | null;
  exact_hits: number | null;
};

type Tone = "default" | "success" | "warning" | "info";
type BarColor = "slate" | "emerald" | "amber" | "sky" | "violet";

type CountryRow = {
  country: string;
  countryCode: string | null;
  users: number;
  activeUsers: number;
  usersWithPredictions: number;
  predictions: number;
  points: number;
  pointsPerActiveUser: number;
  pointsPerParticipant: number;
};

const countryCodeByName: Record<string, string> = {
  argentina: "AR",
  brasil: "BR",
  brazil: "BR",
  chile: "CL",
  colombia: "CO",
  espana: "ES",
  spain: "ES",
  france: "FR",
  francia: "FR",
  germany: "DE",
  alemania: "DE",
  italy: "IT",
  italia: "IT",
  mexico: "MX",
  portugal: "PT",
  uk: "GB",
  unitedkingdom: "GB",
  unitedstates: "US",
  unitedstatesofamerica: "US",
  usa: "US",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeCountryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function getCountryLabel(country: string | null) {
  const value = country?.trim();
  return value || "Sin pais";
}

function getCountryCode(country: string) {
  const trimmed = country.trim();

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return countryCodeByName[normalizeCountryKey(trimmed)] ?? null;
}

function getFlagUrl(countryCode: string | null) {
  if (!countryCode) return null;
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function getFlagSrcSet(countryCode: string | null) {
  if (!countryCode) return undefined;
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`;
}

function safeAverage(total: number, count: number) {
  return count > 0 ? total / count : 0;
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

function CountryFlag({
  country,
  countryCode,
}: {
  country: string;
  countryCode: string | null;
}) {
  const flagUrl = getFlagUrl(countryCode);

  if (!flagUrl) {
    return (
      <span className="inline-flex h-4 w-6 items-center justify-center rounded-sm bg-slate-200 text-[10px] font-bold text-slate-500">
        --
      </span>
    );
  }

  return (
    <img
      src={flagUrl}
      srcSet={getFlagSrcSet(countryCode)}
      alt={`Bandera de ${country}`}
      className="h-4 w-6 rounded-sm object-cover shadow-sm"
      loading="lazy"
    />
  );
}

function CountryLabel({ row }: { row: Pick<CountryRow, "country" | "countryCode"> }) {
  return (
    <span className="flex items-center gap-2">
      <CountryFlag country={row.country} countryCode={row.countryCode} />
      <span>{row.country}</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses(tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function MiniBarChart({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{
    country: string;
    countryCode: string | null;
    value: number;
    secondaryLabel?: string;
    color: BarColor;
  }>;
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No hay datos de pais cargados.
          </p>
        ) : (
          rows.map((row) => {
            const widthPct = (row.value / maxValue) * 100;

            return (
              <div key={row.country}>
                <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-800">
                    <CountryLabel row={row} />
                  </span>
                  <span className="text-slate-500">
                    {formatDecimal(row.value)}
                    {row.secondaryLabel ? ` · ${row.secondaryLabel}` : ""}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-3 rounded-full ${barColorClasses(row.color)}`}
                    style={{ width: `${widthPct}%` }}
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

export default async function AdminCountryKpisPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedCountry = resolvedSearchParams.country ?? "all";
  const supabase = await getSupabaseServerClient();

  const [
    { data: profiles, error: profilesError },
    { data: predictions, error: predictionsError },
    { data: scores, error: scoresError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, display_name, role, is_active, country"),
    supabase.from("predictions").select("user_id"),
    supabase
      .from("prediction_scores")
      .select("user_id, display_name, total_points, exact_hits"),
  ]);

  if (profilesError) {
    throw new Error(`Error cargando profiles: ${profilesError.message}`);
  }

  if (predictionsError) {
    throw new Error(`Error cargando predictions: ${predictionsError.message}`);
  }

  if (scoresError) {
    throw new Error(`Error cargando prediction_scores: ${scoresError.message}`);
  }

  const safeProfiles = (profiles as ProfileRow[] | null) ?? [];
  const safePredictions = (predictions as PredictionRow[] | null) ?? [];
  const safeScores = (scores as PredictionScoreRow[] | null) ?? [];

  const countryOptions = Array.from(
    new Set(safeProfiles.map((profile) => getCountryLabel(profile.country)))
  ).sort((a, b) => a.localeCompare(b, "es-ES"));

  const normalizedSelectedCountry = countryOptions.includes(selectedCountry)
    ? selectedCountry
    : "all";

  const filteredProfiles =
    normalizedSelectedCountry === "all"
      ? safeProfiles
      : safeProfiles.filter(
          (profile) => getCountryLabel(profile.country) === normalizedSelectedCountry
        );

  const filteredProfileIds = new Set(filteredProfiles.map((profile) => profile.id));
  const filteredPredictions = safePredictions.filter((prediction) =>
    filteredProfileIds.has(prediction.user_id)
  );
  const filteredScores = safeScores.filter((score) =>
    filteredProfileIds.has(score.user_id)
  );

  const predictionsByUser = new Map<string, number>();
  for (const prediction of safePredictions) {
    predictionsByUser.set(
      prediction.user_id,
      (predictionsByUser.get(prediction.user_id) ?? 0) + 1
    );
  }

  const scoresByUser = new Map(safeScores.map((score) => [score.user_id, score]));

  const countryRows: CountryRow[] = countryOptions
    .map((country) => {
      const countryProfiles = safeProfiles.filter(
        (profile) => getCountryLabel(profile.country) === country
      );
      const countryProfileIds = new Set(countryProfiles.map((profile) => profile.id));
      const countryPredictions = safePredictions.filter((prediction) =>
        countryProfileIds.has(prediction.user_id)
      );
      const countryScores = safeScores.filter((score) =>
        countryProfileIds.has(score.user_id)
      );
      const usersWithPredictions = new Set(
        countryPredictions.map((prediction) => prediction.user_id)
      ).size;
      const points = countryScores.reduce(
        (acc, score) => acc + (score.total_points ?? 0),
        0
      );
      const activeUsers = countryProfiles.filter((profile) => profile.is_active).length;

      return {
        country,
        countryCode: getCountryCode(country),
        users: countryProfiles.length,
        activeUsers,
        usersWithPredictions,
        predictions: countryPredictions.length,
        points,
        pointsPerActiveUser: safeAverage(points, activeUsers),
        pointsPerParticipant: safeAverage(points, usersWithPredictions),
      };
    })
    .sort((a, b) => {
      if (b.activeUsers !== a.activeUsers) return b.activeUsers - a.activeUsers;
      return b.predictions - a.predictions;
    });

  const activeUsers = filteredProfiles.filter((profile) => profile.is_active).length;
  const usersWithPredictions = new Set(
    filteredPredictions.map((prediction) => prediction.user_id)
  ).size;
  const totalPoints = filteredScores.reduce(
    (acc, score) => acc + (score.total_points ?? 0),
    0
  );
  const exactHits = filteredScores.reduce(
    (acc, score) => acc + (score.exact_hits ?? 0),
    0
  );
  const participationPct =
    activeUsers > 0 ? (usersWithPredictions / activeUsers) * 100 : 0;
  const selectedPointsPerActiveUser = safeAverage(totalPoints, activeUsers);
  const selectedPointsPerParticipant = safeAverage(totalPoints, usersWithPredictions);

  const filteredPredictionsByUser = new Map<string, number>();
  for (const prediction of filteredPredictions) {
    filteredPredictionsByUser.set(
      prediction.user_id,
      (filteredPredictionsByUser.get(prediction.user_id) ?? 0) + 1
    );
  }

  const topPredictionUsers = filteredProfiles
    .map((profile) => {
      const score = scoresByUser.get(profile.id);

      return {
        id: profile.id,
        displayName: score?.display_name || profile.display_name || profile.email || "Usuario",
        predictionsCount: filteredPredictionsByUser.get(profile.id) ?? 0,
      };
    })
    .sort((a, b) => b.predictionsCount - a.predictionsCount)
    .slice(0, 5);

  const topPointUsers = [...filteredScores]
    .sort((a, b) => {
      const pointsDiff = (b.total_points ?? 0) - (a.total_points ?? 0);
      if (pointsDiff !== 0) return pointsDiff;
      return (b.exact_hits ?? 0) - (a.exact_hits ?? 0);
    })
    .slice(0, 5);

  const volumeChartRows = countryRows.slice(0, 8).map((row, index) => ({
    country: row.country,
    countryCode: row.countryCode,
    value: row.activeUsers,
    secondaryLabel: `${formatNumber(row.usersWithPredictions)} con pred.`,
    color:
      index === 0
        ? ("emerald" as BarColor)
        : index === 1
          ? ("sky" as BarColor)
          : ("violet" as BarColor),
  }));

  const efficiencyChartRows = [...countryRows]
    .filter((row) => row.usersWithPredictions > 0)
    .sort((a, b) => b.pointsPerParticipant - a.pointsPerParticipant)
    .slice(0, 8)
    .map((row, index) => ({
      country: row.country,
      countryCode: row.countryCode,
      value: row.pointsPerParticipant,
      secondaryLabel: `${formatNumber(row.points)} pts · ${formatNumber(row.usersWithPredictions)} participantes`,
      color:
        index === 0
          ? ("amber" as BarColor)
          : index === 1
            ? ("emerald" as BarColor)
            : ("sky" as BarColor),
    }));

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              KPIs
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Indicadores por pais
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Segmenta usuarios por pais del perfil para revisar adopcion, actividad y rendimiento.
            </p>
          </div>

          <Link
            href={`/${locale}/admin/kpis`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver a KPIs
          </Link>
        </div>
      </section>

      <section>
        <form method="get" className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[minmax(220px,1fr)_auto_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pais
            </label>
            <select
              name="country"
              defaultValue={normalizedSelectedCountry}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Todos los paises</option>
              {countryOptions.map((country) => {
                const code = getCountryCode(country);
                return (
                  <option key={country} value={country}>
                    {code ? `${code} - ` : ""}
                    {country}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Aplicar
          </button>

          <Link
            href={`/${locale}/admin/kpis/country`}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Limpiar
          </Link>
        </form>
      </section>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Usuarios activos"
            value={formatNumber(activeUsers)}
            hint="Dentro del pais seleccionado"
            tone="success"
          />
          <StatCard
            label="Usuarios con predicciones"
            value={formatNumber(usersWithPredictions)}
            hint={`${formatDecimal(participationPct)}% de activos`}
            tone="info"
          />
          <StatCard
            label="Pts / activo"
            value={formatDecimal(selectedPointsPerActiveUser)}
            hint="Normaliza por usuarios activos"
            tone="warning"
          />
          <StatCard
            label="Pts / participante"
            value={formatDecimal(selectedPointsPerParticipant)}
            hint="Normaliza por usuarios que predijeron"
            tone="warning"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <MiniBarChart
          title="Distribucion por pais"
          subtitle="Volumen: usuarios activos y participantes por pais"
          rows={volumeChartRows}
        />

        <MiniBarChart
          title="Eficiencia por pais"
          subtitle="Ranking por puntos por participante, util para comparar paises de distinto tamano"
          rows={efficiencyChartRows}
        />
      </section>

      <section>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Comparativa de paises
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Totales y medias ponderadas para evitar que el pais con mas usuarios gane siempre por volumen.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Pais</th>
                  <th className="px-3 py-2">Usuarios</th>
                  <th className="px-3 py-2">Activos</th>
                  <th className="px-3 py-2">Con pred.</th>
                  <th className="px-3 py-2">Puntos</th>
                  <th className="px-3 py-2">Pts/activo</th>
                  <th className="px-3 py-2">Pts/part.</th>
                  <th className="px-3 py-2">Accion</th>
                </tr>
              </thead>
              <tbody>
                {countryRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                    >
                      No hay paises informados en los perfiles.
                    </td>
                  </tr>
                ) : (
                  countryRows.map((row) => (
                    <tr key={row.country} className="rounded-2xl bg-slate-50 text-sm">
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        <CountryLabel row={row} />
                      </td>
                      <td className="px-3 py-3 text-slate-800">{formatNumber(row.users)}</td>
                      <td className="px-3 py-3 text-slate-800">{formatNumber(row.activeUsers)}</td>
                      <td className="px-3 py-3 text-slate-800">{formatNumber(row.usersWithPredictions)}</td>
                      <td className="px-3 py-3 text-slate-800">{formatNumber(row.points)}</td>
                      <td className="px-3 py-3 text-slate-800">{formatDecimal(row.pointsPerActiveUser)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{formatDecimal(row.pointsPerParticipant)}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/${locale}/admin/kpis/country?country=${encodeURIComponent(row.country)}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          Filtrar
                        </Link>
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
            Top usuarios por predicciones
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Usuarios mas activos en el filtro seleccionado.
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
                {topPredictionUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                    >
                      Aun no hay predicciones en este filtro.
                    </td>
                  </tr>
                ) : (
                  topPredictionUsers.map((row, index) => (
                    <tr key={row.id} className="rounded-2xl bg-slate-50 text-sm">
                      <td className="px-3 py-3 font-semibold text-slate-900">#{index + 1}</td>
                      <td className="px-3 py-3 text-slate-800">{row.displayName}</td>
                      <td className="px-3 py-3 text-slate-800">{formatNumber(row.predictionsCount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Top usuarios por puntos
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Rendimiento acumulado en el filtro seleccionado.
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
                {topPointUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                    >
                      Aun no hay puntuaciones resueltas en este filtro.
                    </td>
                  </tr>
                ) : (
                  topPointUsers.map((row, index) => (
                    <tr key={row.user_id} className="rounded-2xl bg-slate-50 text-sm">
                      <td className="px-3 py-3 font-semibold text-slate-900">#{index + 1}</td>
                      <td className="px-3 py-3 text-slate-800">{row.display_name || "Usuario"}</td>
                      <td className="px-3 py-3 text-slate-800">{formatNumber(row.total_points ?? 0)}</td>
                      <td className="px-3 py-3 text-slate-800">{formatNumber(row.exact_hits ?? 0)}</td>
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
