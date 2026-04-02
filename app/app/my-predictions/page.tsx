import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { buttonStyles } from "@/lib/ui";
import CountryFlag from "@/components/CountryFlag";

type MyPredictionRow = {
  prediction_id: string;
  user_id: string;
  match_id: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  created_at: string | null;
  stage: string | null;
  match_datetime: string;
  home_team: string;
  away_team: string;
  is_puma_match: boolean | null;
  home_flag: string | null;
  away_flag: string | null;
  home_score: number | null;
  away_score: number | null;
  points: number | null;
  exact_hit: boolean | null;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function getPredictionStatus(row: MyPredictionRow) {
  const hasResult = row.home_score !== null && row.away_score !== null;
  if (hasResult) return "resuelto";

  const matchTime = new Date(row.match_datetime).getTime();
  const now = Date.now();

  if (now >= matchTime) return "cerrada";
  return "pendiente";
}

function getStatusClasses(status: string) {
  switch (status) {
    case "resuelto":
      return "border-green-200 bg-green-50 text-green-700";
    case "cerrada":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function isTendencyHit(row: MyPredictionRow) {
  if (row.home_score === null || row.away_score === null) return false;
  if (row.home_score_pred === null || row.away_score_pred === null) return false;

  const predDiff = row.home_score_pred - row.away_score_pred;
  const realDiff = row.home_score - row.away_score;

  return (
    (predDiff > 0 && realDiff > 0) ||
    (predDiff < 0 && realDiff < 0) ||
    (predDiff === 0 && realDiff === 0)
  );
}

function getResolutionText(row: MyPredictionRow) {
  const hasResult = row.home_score !== null && row.away_score !== null;
  if (!hasResult) return "Pendiente de resultado";

  if (row.exact_hit) return "Marcador exacto";
  if (isTendencyHit(row)) return "Tendencia acertada";
  return "Sin acierto";
}

function getResolutionClasses(row: MyPredictionRow) {
  const hasResult = row.home_score !== null && row.away_score !== null;
  if (!hasResult) return "border border-amber-200 bg-amber-50 text-amber-700";
  if (row.exact_hit) return "border border-green-200 bg-green-50 text-green-700";
  if (isTendencyHit(row)) return "border border-violet-200 bg-violet-50 text-violet-700";
  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getStatCardClasses(type: "total" | "pending" | "closed" | "points") {
  switch (type) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "closed":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "points":
      return "border-0 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-orange-400 text-white";
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}

function groupByStage(rows: MyPredictionRow[]) {
  return rows.reduce((acc, row) => {
    const key = row.stage ?? "Otros";

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(row);
    return acc;
  }, {} as Record<string, MyPredictionRow[]>);
}

const stageOrder = [
  "Group A",
  "Group B",
  "Group C",
  "Group D",
  "Group E",
  "Group F",
  "Group G",
  "Group H",
  "Group I",
  "Group J",
  "Group K",
  "Group L",
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
  "Otros",
];

function sortStages(a: string, b: string) {
  const indexA = stageOrder.indexOf(a);
  const indexB = stageOrder.indexOf(b);

  const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
  const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

  return safeIndexA - safeIndexB;
}

export default async function MyPredictionsPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("my_predictions_view")
    .select("*")
    .eq("user_id", user.id)
    .order("match_datetime", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Mis predicciones</h1>
            <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-red-700">
              Error al cargar tus predicciones: {error.message}
            </div>
          </section>
        </div>
      </main>
    );
  }

  const rows = (data ?? []) as MyPredictionRow[];

  const total = rows.length;
  const pending = rows.filter((r) => getPredictionStatus(r) === "pendiente").length;
  const closed = rows.filter((r) => getPredictionStatus(r) === "cerrada").length;
  const resolved = rows.filter((r) => getPredictionStatus(r) === "resuelto").length;
  const totalPoints = rows.reduce((acc, row) => acc + (row.points ?? 0), 0);

  const groupedRows = groupByStage(rows);
  const orderedStages = Object.keys(groupedRows).sort(sortStages);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <section className="mb-6 rounded-[1.75rem] bg-white p-6 shadow-lg ring-1 ring-slate-200 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-400 md:text-xs">
                Seguimiento personal
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Mis predicciones
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                Consulta tus pronósticos, revisa resultados y controla los puntos que llevas acumulados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/ranking" className={buttonStyles.secondary}>
                Ver ranking
              </Link>
              <Link href="/" className={buttonStyles.primary}>
                Volver a partidos
              </Link>
            </div>
          </div>
        </section>

        {rows.length > 0 && (
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className={`rounded-2xl border p-4 shadow-sm ${getStatCardClasses("total")}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                Total
              </div>
              <div className="mt-2 text-3xl font-extrabold">{total}</div>
              <div className="mt-1 text-xs opacity-70">Predicciones registradas</div>
            </div>

            <div className={`rounded-2xl border p-4 shadow-sm ${getStatCardClasses("pending")}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                Pendientes
              </div>
              <div className="mt-2 text-3xl font-extrabold">{pending}</div>
              <div className="mt-1 text-xs opacity-70">Aún editables</div>
            </div>

            <div className={`rounded-2xl border p-4 shadow-sm ${getStatCardClasses("closed")}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                Cerradas
              </div>
              <div className="mt-2 text-3xl font-extrabold">{closed}</div>
              <div className="mt-1 text-xs opacity-70">Esperando resultado</div>
            </div>

            <div className={`rounded-2xl p-4 shadow-sm ${getStatCardClasses("points")}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                Puntos
              </div>
              <div className="mt-2 text-3xl font-extrabold text-white">{totalPoints}</div>
              <div className="mt-1 text-xs text-white/80">
                {resolved} partidos resueltos
              </div>
            </div>
          </section>
        )}

        {rows.length === 0 ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Aún no has hecho predicciones
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Ve a la lista de partidos y empieza a jugar.
            </p>
            <Link href="/" className={buttonStyles.primary}>
              Ir a partidos
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            {orderedStages.map((stage, index) => {
              const stageRows = groupedRows[stage];
              const pendingInStage = stageRows.filter(
                (row) => getPredictionStatus(row) === "pendiente"
              ).length;

              return (
                <details
                  key={stage}
                  open={index === 0}
                  className="group rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.5rem] px-5 py-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 md:text-xl">
                        {stage}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {stageRows.length} partido{stageRows.length !== 1 ? "s" : ""}
                        {pendingInStage > 0
                          ? ` · ${pendingInStage} pendiente${pendingInStage !== 1 ? "s" : ""}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {pendingInStage > 0 && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {pendingInStage} pendientes
                        </span>
                      )}

                      <span className="text-sm font-medium text-slate-400 transition duration-200 group-open:rotate-180">
                        ▼
                      </span>
                    </div>
                  </summary>

                  <div className="border-t border-slate-100 px-4 pb-4 pt-4 md:px-5">
                    <div className="space-y-4">
                      {stageRows.map((row) => {
                        const status = getPredictionStatus(row);

                        return (
                          <Link
                            key={row.prediction_id}
                            href={`/match/${row.match_id}`}
                            className="group block rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex flex-wrap items-center gap-3">
  <div className="flex items-center gap-2">
    <CountryFlag
      code={row.home_flag}
      teamName={row.home_team}
      alt={row.home_team}
      className="h-6 w-6"
    />
    <span className="text-lg font-bold text-slate-900 md:text-xl">
      {row.home_team}
    </span>
  </div>

  <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
    VS
  </span>

  <div className="flex items-center gap-2">
    <span className="text-lg font-bold text-slate-900 md:text-xl">
      {row.away_team}
    </span>
    <CountryFlag
      code={row.away_flag}
      teamName={row.away_team}
      alt={row.away_team}
      className="h-6 w-6"
    />
  </div>
</div>

                                  {row.is_puma_match && (
                                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                                      🐆 PUMA Match
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-sm text-slate-500">
                                  {formatDate(row.match_datetime)}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusClasses(
                                    status
                                  )}`}
                                >
                                  {status}
                                </span>

                                {status === "resuelto" && (
                                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                    {row.points ?? 0} pts
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Tu predicción
                                </div>
                                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                                  {row.home_score_pred ?? "-"} - {row.away_score_pred ?? "-"}
                                </div>
                              </div>

                              <div
                                className={`rounded-2xl p-4 text-center ${
                                  row.home_score !== null && row.away_score !== null
                                    ? "bg-slate-100"
                                    : "border border-amber-200 bg-amber-50"
                                }`}
                              >
                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Resultado real
                                </div>
                                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                                  {row.home_score !== null && row.away_score !== null
                                    ? `${row.home_score} - ${row.away_score}`
                                    : "-"}
                                </div>
                              </div>

                              <div
                                className={`rounded-2xl p-4 text-center ${getResolutionClasses(
                                  row
                                )}`}
                              >
                                <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                                  Estado
                                </div>
                                <div className="mt-2 text-sm font-bold">
                                  {getResolutionText(row)}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end text-sm font-medium text-slate-400 transition group-hover:text-slate-700">
                              Ver detalle del partido →
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}