import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { updateMatchAction } from "./actions";

type MatchRow = {
  id: string;
  stage: string | null;
  match_datetime: string | null;
  home_team: string | null;
  away_team: string | null;
  status: "upcoming" | "live" | "finished";
  home_score: number | null;
  away_score: number | null;
  is_puma_match: boolean | null;
};

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
};

function formatDateTime(value: string | null) {
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

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: me, error: meError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (meError) {
    throw new Error(`Error comprobando permisos admin: ${meError.message}`);
  }

  if (!me?.is_admin) {
    redirect("/");
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, stage, match_datetime, home_team, away_team, status, home_score, away_score, is_puma_match"
    )
    .order("match_datetime", { ascending: true });

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, display_name, is_admin")
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
            Desde aquí podrás gestionar partidos, resultados y revisar usuarios.
          </p>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Partidos</h2>
              <p className="text-sm text-slate-500">
                Edita estados y marcadores manualmente.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {(matches as MatchRow[] | null)?.map((match) => (
              <form
                key={match.id}
                action={updateMatchAction}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <input type="hidden" name="id" value={match.id} />

                <div className="grid gap-4 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {match.home_team} vs {match.away_team}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {match.stage || "Sin fase"} ·{" "}
                      {formatDateTime(match.match_datetime)}
                    </p>
                    {match.is_puma_match ? (
                      <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Partido PUMA
                      </p>
                    ) : null}
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

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Usuarios</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisión rápida de accesos y admins.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Admin</th>
                </tr>
              </thead>
              <tbody>
                {(users as UserRow[] | null)?.map((row) => (
                  <tr key={row.id} className="rounded-xl bg-slate-50 text-sm">
                    <td className="px-3 py-3 text-slate-800">{row.email}</td>
                    <td className="px-3 py-3 text-slate-800">
                      {row.display_name || "Usuario"}
                    </td>
                    <td className="px-3 py-3 text-slate-800">
                      {row.is_admin ? "Sí" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}