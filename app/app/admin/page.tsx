import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  createMatchAction,
  deleteMatchAction,
  updateMatchAction,
} from "./actions";
import DeleteMatchButton from "./DeleteMatchButton";
import ResetPasswordButton from "./ResetPasswordButton";

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

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin";
  is_active: boolean;
  must_change_password: boolean;
  last_password_reset_at: string | null;
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedStatus = resolvedSearchParams.status ?? "all";

  const supabase = await getSupabaseServerClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (meError) {
    throw new Error(`Error comprobando permisos admin: ${meError.message}`);
  }

  if (!me || me.role !== "admin" || !me.is_active) {
    redirect("/");
  }

  let matchesQuery = supabase
    .from("matches")
    .select(
      "id, stage, match_datetime, home_team, away_team, status, home_score, away_score, is_puma_match, home_flag, away_flag"
    )
    .order("match_datetime", { ascending: true });

  if (selectedStatus !== "all") {
    matchesQuery = matchesQuery.eq("status", selectedStatus);
  }

  const { data: matches, error: matchesError } = await matchesQuery;

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, role, is_active, must_change_password, last_password_reset_at"
    )
    .order("created_at", { ascending: true });

  if (matchesError) {
    throw new Error(`Error cargando partidos: ${matchesError.message}`);
  }

  if (usersError) {
    throw new Error(`Error cargando usuarios: ${usersError.message}`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Backend
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Panel de administración
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Gestiona partidos, resultados y usuarios desde una única pantalla.
          </p>

          <div className="mt-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
            >
              ← Volver a la app
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
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

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Partidos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Edita todos los campos del partido, resultados y estado.
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
            {(matches as MatchRow[] | null)?.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {match.home_team || "Local"} vs {match.away_team || "Visitante"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {match.stage || "Sin fase"} ·{" "}
                      {formatDateTimeDisplay(match.match_datetime)}
                    </p>
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

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Usuarios</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisión rápida de accesos, rol y reseteo de contraseña.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Activo</th>
                  <th className="px-3 py-2">Cambio pass</th>
                  <th className="px-3 py-2">Último reset</th>
                  <th className="px-3 py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {(users as ProfileRow[] | null)?.map((row) => {
                  const userLabel = row.display_name || row.email || "Usuario";

                  return (
                    <tr key={row.id} className="rounded-xl bg-slate-50 text-sm">
                      <td className="px-3 py-3 text-slate-800">{row.email}</td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.display_name || "Usuario"}
                      </td>
                      <td className="px-3 py-3 text-slate-800">{row.role}</td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.is_active ? "Sí" : "No"}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.must_change_password ? "Sí" : "No"}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.last_password_reset_at
                          ? new Date(row.last_password_reset_at).toLocaleString("es-ES")
                          : "Nunca"}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.id === me.id ? (
                          <span className="text-xs text-slate-400">
                            Tu usuario
                          </span>
                        ) : (
                          <ResetPasswordButton
                            userId={row.id}
                            userLabel={userLabel}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}