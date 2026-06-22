import CountryFlag from "@/components/CountryFlag";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  is_active: boolean;
};

type ChampionPredictionRow = {
  user_id: string;
  predicted_team_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  flag_code: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminChampionVotesPage() {
  const supabase = getSupabaseAdminClient();

  const [
    { data: profiles, error: profilesError },
    { data: predictions, error: predictionsError },
    { data: teams, error: teamsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, is_active"),
    supabase
      .from("champion_predictions")
      .select("user_id, predicted_team_id, created_at, updated_at"),
    supabase.from("teams").select("id, name, flag_code"),
  ]);

  if (profilesError) {
    throw new Error(`No se pudieron cargar los usuarios: ${profilesError.message}`);
  }

  if (predictionsError) {
    throw new Error(
      `No se pudieron cargar los votos de campeón: ${predictionsError.message}`
    );
  }

  if (teamsError) {
    throw new Error(`No se pudieron cargar los equipos: ${teamsError.message}`);
  }

  const profilesById = new Map(
    ((profiles as ProfileRow[] | null) ?? []).map((profile) => [
      profile.id,
      profile,
    ])
  );
  const teamsById = new Map(
    ((teams as TeamRow[] | null) ?? []).map((team) => [team.id, team])
  );

  const rows = ((predictions as ChampionPredictionRow[] | null) ?? [])
    .map((prediction) => ({
      prediction,
      profile: profilesById.get(prediction.user_id),
      team: teamsById.get(prediction.predicted_team_id),
    }))
    .sort((a, b) => {
      const teamCompare = (a.team?.name ?? "").localeCompare(
        b.team?.name ?? "",
        "es-ES"
      );
      if (teamCompare !== 0) return teamCompare;

      const aName = a.profile?.display_name || a.profile?.email || "";
      const bName = b.profile?.display_name || b.profile?.email || "";
      return aName.localeCompare(bName, "es-ES");
    });

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          Votos campeón
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-950">
          Quién votó a cada selección
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Consulta la elección de campeón registrada por cada usuario. Esta
          vista es solo de lectura.
        </p>
        <div className="mt-5 inline-flex rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
          <span className="text-sm font-semibold text-violet-900">
            {rows.length} votos registrados
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Campeón elegido</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Última actualización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan={5}>
                    Todavía no hay votos de campeón.
                  </td>
                </tr>
              )}

              {rows.map(({ prediction, profile, team }) => (
                <tr key={prediction.user_id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {profile?.display_name || "Usuario sin nombre"}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {profile?.email || "Sin email"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CountryFlag
                        code={team?.flag_code ?? null}
                        teamName={team?.name ?? "Equipo desconocido"}
                        alt={`Bandera de ${team?.name ?? "equipo desconocido"}`}
                        className="h-8 w-8"
                      />
                      <span className="font-semibold text-slate-900">
                        {team?.name ?? "Equipo desconocido"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        profile?.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {profile?.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(prediction.updated_at ?? prediction.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
