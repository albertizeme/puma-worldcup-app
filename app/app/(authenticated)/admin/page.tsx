import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { generateRankingSnapshotAction, saveWorldCupChampionAction } from "./actions";
import GenerateSnapshotButton from "./GenerateSnapshotButton";
import SaveChampionButton from "./SaveChampionButton";

type SearchParams = Promise<{
  success?: string;
  error?: string;
}>;

function getAlertFromQuery(success?: string, error?: string) {
  if (error) {
    switch (error) {
      case "snapshot-missing-key":
        return {
          type: "error" as const,
          message: "Debes indicar una clave de snapshot.",
        };
      case "snapshot-generate":
        return {
          type: "error" as const,
          message: "No se pudo generar el snapshot del ranking.",
        };
      case "champion-missing-team":
        return {
          type: "error" as const,
          message: "Debes seleccionar un equipo campeón.",
        };
      case "champion-invalid-team":
        return {
          type: "error" as const,
          message: "El equipo seleccionado no es válido.",
        };
      case "champion-save":
        return {
          type: "error" as const,
          message: "No se pudo guardar el campeón oficial.",
        };
      default:
        return {
          type: "error" as const,
          message: "Ha ocurrido un error en la administración.",
        };
    }
  }

  if (success) {
    switch (success) {
      case "snapshot-generated":
        return {
          type: "success" as const,
          message: "Snapshot del ranking generado correctamente.",
        };
      case "champion-saved":
        return {
          type: "success" as const,
          message: "Campeón oficial guardado correctamente.",
        };
      default:
        return {
          type: "success" as const,
          message: "Operación completada correctamente.",
        };
    }
  }

  return null;
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const alert = getAlertFromQuery(
    resolvedSearchParams.success,
    resolvedSearchParams.error
  );

  const supabase = await getSupabaseServerClient();

  const [
  { data: users },
  { data: matches },
  { data: teams },
  { data: championSetting },
] = await Promise.all([
  supabase
    .from("profiles")
    .select("id, role, is_active, must_change_password"),
  supabase
    .from("matches")
    .select("id, status, is_puma_match"),
  supabase
    .from("teams")
    .select("id, name")
    .order("name", { ascending: true }),
  supabase
    .from("app_settings")
    .select("value")
    .eq("key", "world_cup_winner_team_id")
    .maybeSingle(),
]);

  const safeTeams = teams ?? [];
  const currentChampionTeamId = championSetting?.value ?? null;
  const currentChampionTeam = safeTeams.find((team) => team.id === currentChampionTeamId) ?? null;

  const safeUsers = users ?? [];
  const safeMatches = matches ?? [];

  const totalUsers = safeUsers.length;
  const admins = safeUsers.filter((u) => u.role === "admin").length;
  const activeUsers = safeUsers.filter((u) => u.is_active).length;
  const pendingPassword = safeUsers.filter((u) => u.must_change_password).length;

  const totalMatches = safeMatches.length;
  const upcoming = safeMatches.filter((m) => m.status === "upcoming").length;
  const live = safeMatches.filter((m) => m.status === "live").length;
  const finished = safeMatches.filter((m) => m.status === "finished").length;
  const pumaMatches = safeMatches.filter((m) => m.is_puma_match).length;

  function Card({
    title,
    value,
    href,
  }: {
    title: string;
    value: number;
    href?: string;
  }) {
    const content = (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </p>
        <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-slate-900">Resumen</h2>
        <p className="mt-1 text-sm text-slate-500">
          Acceso rápido al estado general del backend.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Usuarios" value={totalUsers} href="/admin/users" />
          <Card title="Admins" value={admins} href="/admin/users" />
          <Card title="Usuarios activos" value={activeUsers} href="/admin/users" />
          <Card
            title="Cambio password pendiente"
            value={pendingPassword}
            href="/admin/users"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card title="Partidos" value={totalMatches} href="/admin/matches" />
          <Card title="Upcoming" value={upcoming} href="/admin/matches?status=upcoming" />
          <Card title="Live" value={live} href="/admin/matches?status=live" />
          <Card title="Finished" value={finished} href="/admin/matches?status=finished" />
          <Card title="Partidos PUMA" value={pumaMatches} href="/admin/matches" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/users"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:bg-slate-50"
        >
          <h3 className="text-lg font-bold text-slate-900">Gestión de usuarios</h3>
          <p className="mt-2 text-sm text-slate-600">
            Accesos, roles, activación, reseteo de contraseña y estado de cuentas.
          </p>
        </Link>

        <Link
          href="/admin/matches"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:bg-slate-50"
        >
          <h3 className="text-lg font-bold text-slate-900">Gestión de partidos</h3>
          <p className="mt-2 text-sm text-slate-600">
            Alta de partidos, actualización de resultados, estados y partidos PUMA.
          </p>
        </Link>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Snapshots del ranking</h2>
        <p className="mt-1 text-sm text-slate-500">
          Genera una foto del ranking para conservar la clasificación en un momento concreto del torneo.
        </p>

        {alert && (
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm ${
              alert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {alert.message}
          </div>
        )}

        <form action={generateRankingSnapshotAction} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Clave del snapshot
              </label>
              <select
                name="snapshot_key"
                defaultValue="group_md1"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="group_md1">group_md1</option>
                <option value="group_md2">group_md2</option>
                <option value="group_md3">group_md3</option>
                <option value="round_32">Dieciseisavos de final</option>
                <option value="round_16">Octavos de final</option>
                <option value="quarterfinals">Cuartos de final</option>
                <option value="semifinals">Semifinales</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Etiqueta visible
              </label>
              <input
                name="snapshot_label"
                defaultValue="Fase de grupos · Jornada 1"
                placeholder="Ej. Fase de grupos · Jornada 1"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <GenerateSnapshotButton />
          </div>
        </form>
      </section>
      
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
  <h2 className="text-xl font-bold text-slate-900">Pronóstico de campeón</h2>
  <p className="mt-1 text-sm text-slate-500">
    Selecciona el campeón oficial del Mundial para aplicar automáticamente los
    puntos extra en el ranking.
  </p>

  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
    El bonus configurado es de <span className="font-bold">20 puntos</span>.
  </div>

  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
    {currentChampionTeam ? (
      <>
        Campeón oficial actual:{" "}
        <span className="font-bold text-slate-900">{currentChampionTeam.name}</span>
      </>
    ) : (
      <>Todavía no hay campeón oficial configurado.</>
    )}
  </div>

  <form action={saveWorldCupChampionAction} className="mt-6">
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Equipo campeón
        </label>

        <select
          name="champion_team_id"
          defaultValue={currentChampionTeamId ?? ""}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Selecciona un equipo</option>
          {safeTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="mt-4">
      <SaveChampionButton />
    </div>
  </form>
</section>

    </div>
  );
}