import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  createMatchAction,
  deleteMatchAction,
  updateMatchAction,
} from "../actions";
import DeleteMatchButton from "../DeleteMatchButton";

type MatchStatus = "upcoming" | "live" | "finished";

type MatchRow = {
  id: string;
  stage: string | null;
  match_datetime: string | null;
  home_team: string | null;
  away_team: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  is_puma_match: boolean | null;
  home_flag: string | null;
  away_flag: string | null;
};

type SearchParams = Promise<{
  status?: string;
}>;

function formatDateTime(value: string | null) {
  if (!value) return "";

  try {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");

    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return "";
  }
}

function formatDateTimeDisplay(value: string | null) {
  if (!value) return "Sin fecha";

  try {
    return new Date(value).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function getStatusOptions() {
  return [
    { value: "all", label: "Todos" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
    { value: "finished", label: "Finished" },
  ];
}

function getMatchStatusBadgeClass(status: MatchStatus) {
  switch (status) {
    case "upcoming":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    case "live":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "finished":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedStatus = resolvedSearchParams.status ?? "all";

  const supabase = await getSupabaseServerClient();

  let matchesQuery = supabase
    .from("matches")
    .select(
      "id, stage, match_datetime, home_team, away_team, status, home_score, away_score, is_puma_match, home_flag, away_flag"
    )
    .order("match_datetime", { ascending: true });

  if (selectedStatus !== "all") {
    matchesQuery = matchesQuery.eq("status", selectedStatus);
  }

  const { data: matches, error } = await matchesQuery;

  if (error) {
    throw new Error(`Error cargando partidos: ${error.message}`);
  }

  const safeMatches = (matches as MatchRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Crear partido</h2>
        <p className="mt-1 text-sm text-slate-500">
          Añade un nuevo partido manualmente.
        </p>

        <form action={createMatchAction} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fase
              </label>
              <input
                name="stage"
                placeholder="Ej. Jornada 1"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fecha/hora
              </label>
              <input
                name="match_datetime"
                type="datetime-local"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Equipo local
              </label>
              <input
                name="home_team"
                placeholder="Ej. España"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Equipo visitante
              </label>
              <input
                name="away_team"
                placeholder="Ej. Italia"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flag local
              </label>
              <input
                name="home_flag"
                placeholder="Ej. 🇪🇸"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flag visitante
              </label>
              <input
                name="away_flag"
                placeholder="Ej. 🇮🇹"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado
              </label>
              <select
                name="status"
                defaultValue="upcoming"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="upcoming">upcoming</option>
                <option value="live">live</option>
                <option value="finished">finished</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="is_puma_match"
                  value="true"
                  className="h-4 w-4 rounded border-slate-300"
                />
                Partido PUMA
              </label>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Crear partido
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestión de partidos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Edita resultados, estado, equipos y atributos del partido.
            </p>
          </div>

          <form method="get" className="flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filtrar por estado
              </label>
              <select
                name="status"
                defaultValue={selectedStatus}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {getStatusOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Aplicar
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-4">
          {safeMatches.map((match) => (
            <div
              key={match.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {match.home_flag ? `${match.home_flag} ` : ""}
                      {match.home_team || "Local"} vs{" "}
                      {match.away_flag ? `${match.away_flag} ` : ""}
                      {match.away_team || "Visitante"}
                    </p>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getMatchStatusBadgeClass(
                        match.status
                      )}`}
                    >
                      {match.status}
                    </span>

                    {match.is_puma_match && (
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        PUMA
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {match.stage || "Sin fase"} ·{" "}
                    {formatDateTimeDisplay(match.match_datetime)}
                  </p>

                  {(match.home_score !== null || match.away_score !== null) && (
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Marcador actual: {match.home_score ?? "-"} -{" "}
                      {match.away_score ?? "-"}
                    </p>
                  )}
                </div>

                <form action={deleteMatchAction}>
                  <input type="hidden" name="id" value={match.id} />
                  <DeleteMatchButton
                    label={`${match.home_team || "Local"} vs ${match.away_team || "Visitante"}`}
                  />
                </form>
              </div>

              <form action={updateMatchAction}>
                <input type="hidden" name="id" value={match.id} />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fase
                    </label>
                    <input
                      name="stage"
                      defaultValue={match.stage ?? ""}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fecha/hora
                    </label>
                    <input
                      name="match_datetime"
                      type="datetime-local"
                      defaultValue={formatDateTime(match.match_datetime)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Equipo local
                    </label>
                    <input
                      name="home_team"
                      defaultValue={match.home_team ?? ""}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Equipo visitante
                    </label>
                    <input
                      name="away_team"
                      defaultValue={match.away_team ?? ""}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Flag local
                    </label>
                    <input
                      name="home_flag"
                      defaultValue={match.home_flag ?? ""}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Flag visitante
                    </label>
                    <input
                      name="away_flag"
                      defaultValue={match.away_flag ?? ""}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </label>
                    <select
                      name="status"
                      defaultValue={match.status}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="upcoming">upcoming</option>
                      <option value="live">live</option>
                      <option value="finished">finished</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="is_puma_match"
                        value="true"
                        defaultChecked={Boolean(match.is_puma_match)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Partido PUMA
                    </label>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Goles local
                    </label>
                    <input
                      name="home_score"
                      type="number"
                      defaultValue={match.home_score ?? ""}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Goles visitante
                    </label>
                    <input
                      name="away_score"
                      type="number"
                      defaultValue={match.away_score ?? ""}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}