// app/ranking/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type RankingRow = {
  user_id: string;
  display_name: string | null;
  total_points: number | null;
  exact_hits: number | null;
  tendency_hits: number | null;
};

type RankedRow = RankingRow & {
  position: number;
};

function getDisplayName(row: RankingRow) {
  return row.display_name?.trim() || "Usuario";
}

function getPositionBadgeClass(position: number) {
  if (position === 1) {
    return "bg-yellow-400 text-neutral-950 ring-2 ring-yellow-200";
  }
  if (position === 2) {
    return "bg-slate-300 text-neutral-950 ring-2 ring-slate-200";
  }
  if (position === 3) {
    return "bg-amber-500 text-white ring-2 ring-amber-200";
  }
  return "bg-neutral-100 text-neutral-700";
}

function formatPointsLabel(points: number, compact = false) {
  if (points === 1) {
    return compact ? "1 pt" : "1 punto";
  }

  return compact ? `${points} pts` : `${points} puntos`;
}

function getPodiumCutoffPoints(rows: RankedRow[]) {
  if (rows.length === 0) return null;

  const uniquePointValues = [...new Set(rows.map((row) => row.total_points ?? 0))].sort(
    (a, b) => b - a
  );

  if (uniquePointValues.length < 3) {
    return uniquePointValues[uniquePointValues.length - 1] ?? null;
  }

  return uniquePointValues[2];
}

function getCompetitiveHint(rows: RankedRow[], index: number) {
  const currentRow = rows[index];
  if (!currentRow) return null;

  const currentPoints = currentRow.total_points ?? 0;
  const leader = rows[0];
  const previousRow = index > 0 ? rows[index - 1] : null;
  const nextRow = index < rows.length - 1 ? rows[index + 1] : null;
  const podiumPoints = getPodiumCutoffPoints(rows);

  if (index === 0) {
    if (!nextRow) return "Líder";

    const cushion = currentPoints - (nextRow.total_points ?? 0);

    if (cushion <= 0) return "Líder";
    if (cushion === 1) return "Lidera por 1 pt";
    return `Lidera por ${cushion} pts`;
  }

  if (previousRow) {
    const gapToPrevious = (previousRow.total_points ?? 0) - currentPoints;

    if (gapToPrevious <= 0) {
      return "Empatado con el de arriba";
    }
  }

  if (podiumPoints !== null && currentPoints < podiumPoints) {
    const gapToPodium = Math.max(podiumPoints - currentPoints, 0);

    if (gapToPodium > 0) {
      return `A ${formatPointsLabel(gapToPodium, true)} del podio`;
    }
  }

  if (leader && podiumPoints !== null && currentPoints >= podiumPoints) {
    const gapToLeader = Math.max((leader.total_points ?? 0) - currentPoints, 0);

    if (gapToLeader > 0) {
      return `A ${formatPointsLabel(gapToLeader, true)} del líder`;
    }
  }

  if (previousRow) {
    const gapToPrevious = Math.max((previousRow.total_points ?? 0) - currentPoints, 0);

    if (gapToPrevious > 0) {
      return `A ${formatPointsLabel(gapToPrevious, true)} de alcanzarle`;
    }
  }

  return null;
}

export default async function RankingPage() {
  const supabaseServer = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabaseServer
    .from("prediction_scores")
    .select("user_id, display_name, total_points, exact_hits, tendency_hits");

  if (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
          <h1 className="text-xl font-bold">Ranking</h1>
          <p className="mt-2 text-sm">
            No se pudo cargar el ranking. Revisa la vista{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 text-xs">
              prediction_scores
            </code>
            .
          </p>
          <p className="mt-2 text-sm opacity-80">{error.message}</p>
        </div>
      </main>
    );
  }

  const ranking: RankingRow[] = [...(data ?? [])]
    .map((row) => ({
      user_id: row.user_id,
      display_name: row.display_name,
      total_points: row.total_points ?? 0,
      exact_hits: row.exact_hits ?? 0,
      tendency_hits: row.tendency_hits ?? 0,
    }))
    .sort((a, b) => {
      const pointsDiff = (b.total_points ?? 0) - (a.total_points ?? 0);
      if (pointsDiff !== 0) return pointsDiff;

      const exactDiff = (b.exact_hits ?? 0) - (a.exact_hits ?? 0);
      if (exactDiff !== 0) return exactDiff;

      const tendencyDiff = (b.tendency_hits ?? 0) - (a.tendency_hits ?? 0);
      if (tendencyDiff !== 0) return tendencyDiff;

      return getDisplayName(a).localeCompare(getDisplayName(b), "es");
    });

  const rankedRows: RankedRow[] = ranking.map((row, index, rows) => {
    if (index === 0) {
      return {
        ...row,
        position: 1,
      };
    }

    const previousRow = rows[index - 1];
    const samePoints = (row.total_points ?? 0) === (previousRow.total_points ?? 0);

    return {
      ...row,
      position: samePoints ? index : index + 1,
    };
  });

  const currentUserRow = rankedRows.find((row) => row.user_id === user.id);
  const totalParticipants = rankedRows.length;
  const leader = rankedRows[0];
  const podiumCutoffPoints = getPodiumCutoffPoints(rankedRows);

  const isPodiumRow = (row: RankedRow) => {
    if (podiumCutoffPoints === null) return false;
    return (row.total_points ?? 0) >= podiumCutoffPoints;
  };

  const pointsToPodium =
    currentUserRow && podiumCutoffPoints !== null
      ? Math.max(podiumCutoffPoints - (currentUserRow.total_points ?? 0), 0)
      : null;

  const pointsToLeader =
    currentUserRow && leader
      ? Math.max((leader.total_points ?? 0) - (currentUserRow.total_points ?? 0), 0)
      : null;

  const currentUserSequentialIndex = rankedRows.findIndex((row) => row.user_id === user.id);

  const percentileAhead =
    currentUserRow && totalParticipants > 1 && currentUserSequentialIndex >= 0
      ? Math.round(((totalParticipants - (currentUserSequentialIndex + 1)) / (totalParticipants - 1)) * 100)
      : 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">
            Ranking
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Tu posición actual y la clasificación completa del torneo.
          </p>
        </div>

        <Link
          href="/my-predictions"
          className="inline-flex shrink-0 items-center rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50 sm:px-4 sm:text-sm"
        >
          Mis predicciones
        </Link>
      </div>

      {currentUserRow ? (
        <>
          <section className="mb-3 overflow-hidden rounded-3xl border border-violet-900 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-neutral-950 text-white shadow-xl">
            <div className="px-5 py-5 sm:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                Tu situación
              </p>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-white/75">Vas</p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-4xl font-black leading-none sm:text-5xl">
                      #{currentUserRow.position}
                    </span>
                    <span className="pb-1 text-sm text-white/75">
                      de {totalParticipants}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-wide text-white/70">
                    Tus puntos
                  </p>
                  <p className="text-2xl font-black text-white">
                    {currentUserRow.total_points ?? 0} pts
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-white/80">
                {isPodiumRow(currentUserRow)
                  ? "Ahora mismo estás en posiciones de premio."
                  : `Estás por delante del ${percentileAhead}% de participantes.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-white/95 px-4 py-4 text-neutral-900 sm:px-6 xl:grid-cols-4">
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Podio
                </p>
                <p className="mt-2 text-xl font-black">
                  {isPodiumRow(currentUserRow) ? "Dentro" : `${pointsToPodium ?? 0} pts`}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {isPodiumRow(currentUserRow)
                    ? "Defiende tu plaza en el podio"
                    : "Lo que te falta para entrar en el podio"}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Líder
                </p>
                <p className="mt-2 text-xl font-black">
                  {currentUserRow.position === 1 ? "Eres tú" : `${pointsToLeader ?? 0} pts`}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Distancia respecto al liderato
                </p>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Exactos
                </p>
                <p className="mt-2 text-xl font-black">{currentUserRow.exact_hits ?? 0}</p>
                <p className="mt-1 text-xs text-neutral-500">Marcadores clavados</p>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Tendencias
                </p>
                <p className="mt-2 text-xl font-black">{currentUserRow.tendency_hits ?? 0}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Ganador o empate acertado
                </p>
              </div>
            </div>
          </section>

          <section className="mb-6 overflow-hidden rounded-2xl border border-violet-300 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80">
                  PUMA Challenge
                </p>
                <p className="mt-1 text-sm font-semibold sm:text-base">
                  Los mejores del ranking optarán a premios finales.
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs">
                Forever.Faster.
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <h2 className="text-lg font-bold">Aún no apareces en el ranking</h2>
          <p className="mt-2 text-sm">
            En cuanto registres tus primeras predicciones puntuables, verás aquí tu posición y
            tus estadísticas.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">
            Clasificación completa
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Ordenada por puntos, exactos y tendencias.
          </p>
        </div>

        {rankedRows.length === 0 ? (
          <div className="px-6 py-8 text-sm text-neutral-600">
            Aún no hay datos suficientes para mostrar el ranking.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {rankedRows.map((row, index) => {
              const isCurrentUser = row.user_id === user.id;
              const competitiveHint = getCompetitiveHint(rankedRows, index);
              const isPodium = isPodiumRow(row);

              return (
                <div
                  key={row.user_id}
                  className={`flex items-center justify-between gap-3 px-4 py-4 sm:px-6 ${
                    isCurrentUser
                      ? "bg-violet-50"
                      : isPodium
                      ? "bg-neutral-50"
                      : "bg-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm sm:h-11 sm:w-11 ${getPositionBadgeClass(
                        row.position
                      )}`}
                    >
                      #{row.position}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-neutral-900 sm:text-base">
                          {getDisplayName(row)}
                        </p>

                        {isCurrentUser && (
                          <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Tú
                          </span>
                        )}

                        {isPodium && !isCurrentUser && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                            Top 3
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                        {row.exact_hits ?? 0} exactos · {row.tendency_hits ?? 0} tendencias
                      </p>

                      {competitiveHint && (
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700/85 sm:text-[11px]">
                          {competitiveHint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black text-neutral-900 sm:text-2xl">
                      {row.total_points ?? 0}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
                      puntos
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}