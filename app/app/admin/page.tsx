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
type UserRole = "all" | "user" | "admin";
type UserState = "all" | "active" | "inactive";
type PasswordState = "all" | "pending" | "ok";

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
  userRole?: string;
  userState?: string;
  passwordState?: string;
  success?: string;
  error?: string;
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

function getMatchStatusOptions() {
  return [
    { value: "all", label: "Todos" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
    { value: "finished", label: "Finished" },
  ];
}

function getUserRoleOptions() {
  return [
    { value: "all", label: "Todos" },
    { value: "admin", label: "Admins" },
    { value: "user", label: "Users" },
  ];
}

function getUserStateOptions() {
  return [
    { value: "all", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "inactive", label: "Inactivos" },
  ];
}

function getPasswordStateOptions() {
  return [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Cambio pendiente" },
    { value: "ok", label: "Sin pendiente" },
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

function getRoleBadgeClass(role: "user" | "admin") {
  return role === "admin"
    ? "border border-violet-200 bg-violet-50 text-violet-700"
    : "border border-slate-200 bg-slate-100 text-slate-700";
}

function getActiveBadgeClass(isActive: boolean) {
  return isActive
    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border border-red-200 bg-red-50 text-red-700";
}

function getMustChangePasswordBadgeClass(mustChangePassword: boolean) {
  return mustChangePassword
    ? "border border-amber-200 bg-amber-50 text-amber-800"
    : "border border-slate-200 bg-slate-100 text-slate-600";
}

function getAlertFromQuery(success?: string, error?: string) {
  if (error) {
    switch (error) {
      case "password-reset":
        return {
          type: "error" as const,
          message: "No se pudo resetear la contraseña.",
        };
      case "match-create":
        return {
          type: "error" as const,
          message: "No se pudo crear el partido.",
        };
      case "match-update":
        return {
          type: "error" as const,
          message: "No se pudieron guardar los cambios del partido.",
        };
      case "match-delete":
        return {
          type: "error" as const,
          message: "No se pudo eliminar el partido.",
        };
      default:
        return {
          type: "error" as const,
          message: "Ha ocurrido un error.",
        };
    }
  }

  if (success) {
    switch (success) {
      case "password-reset":
        return {
          type: "success" as const,
          message: "Contraseña temporal generada correctamente.",
        };
      case "match-created":
        return {
          type: "success" as const,
          message: "Partido creado correctamente.",
        };
      case "match-updated":
        return {
          type: "success" as const,
          message: "Partido actualizado correctamente.",
        };
      case "match-deleted":
        return {
          type: "success" as const,
          message: "Partido eliminado correctamente.",
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

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : tone === "danger"
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;

  const selectedStatus = (resolvedSearchParams.status ?? "all") as
    | "all"
    | MatchStatus;

  const selectedUserRole = (resolvedSearchParams.userRole ?? "all") as UserRole;
  const selectedUserState = (resolvedSearchParams.userState ?? "all") as UserState;
  const selectedPasswordState = (resolvedSearchParams.passwordState ??
    "all") as PasswordState;

  const alert = getAlertFromQuery(
    resolvedSearchParams.success,
    resolvedSearchParams.error
  );

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
    .select("id, role, is_active, email, display_name")
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

  let usersQuery = supabase
    .from("profiles")
    .select(
      "id, email, display_name, role, is_active, must_change_password, last_password_reset_at, created_at"
    )
    .order("created_at", { ascending: true });

  if (selectedUserRole !== "all") {
    usersQuery = usersQuery.eq("role", selectedUserRole);
  }

  if (selectedUserState === "active") {
    usersQuery = usersQuery.eq("is_active", true);
  } else if (selectedUserState === "inactive") {
    usersQuery = usersQuery.eq("is_active", false);
  }

  if (selectedPasswordState === "pending") {
    usersQuery = usersQuery.eq("must_change_password", true);
  } else if (selectedPasswordState === "ok") {
    usersQuery = usersQuery.eq("must_change_password", false);
  }

  const { data: users, error: usersError } = await usersQuery;

  if (matchesError) {
    throw new Error(`Error cargando partidos: ${matchesError.message}`);
  }

  if (usersError) {
    throw new Error(`Error cargando usuarios: ${usersError.message}`);
  }

  const safeMatches = (matches as MatchRow[] | null) ?? [];
  const safeUsers = (users as ProfileRow[] | null) ?? [];

  const totalUsers = safeUsers.length;
  const totalAdmins = safeUsers.filter((u) => u.role === "admin").length;
  const activeUsers = safeUsers.filter((u) => u.is_active).length;
  const pendingPasswordChanges = safeUsers.filter(
    (u) => u.must_change_password
  ).length;

  const totalMatches = safeMatches.length;
  const upcomingMatches = safeMatches.filter((m) => m.status === "upcoming").length;
  const liveMatches = safeMatches.filter((m) => m.status === "live").length;
  const finishedMatches = safeMatches.filter((m) => m.status === "finished").length;
  const pumaMatches = safeMatches.filter((m) => Boolean(m.is_puma_match)).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Backend
          </p>

          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Panel de administración
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Gestiona usuarios, accesos, partidos y resultados desde una sola pantalla.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">
                {me.display_name || me.email || "Admin"}
              </div>
              <div className="mt-1">
                Sesión activa como <span className="font-medium">admin</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
            >
              ← Volver a la app
            </Link>
          </div>
        </section>

        {alert && (
          <section
            className={`mt-6 rounded-2xl border p-4 text-sm shadow-sm ${
              alert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {alert.message}
          </section>
        )}

        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Usuarios visibles" value={totalUsers} />
            <StatCard label="Admins visibles" value={totalAdmins} />
            <StatCard label="Activos visibles" value={activeUsers} tone="success" />
            <StatCard
              label="Cambio password pendiente"
              value={pendingPasswordChanges}
              tone={pendingPasswordChanges > 0 ? "warning" : "default"}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Partidos visibles" value={totalMatches} />
            <StatCard label="Upcoming" value={upcomingMatches} />
            <StatCard label="Live" value={liveMatches} tone="success" />
            <StatCard label="Finished" value={finishedMatches} />
            <StatCard label="Partidos PUMA" value={pumaMatches} />
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Usuarios
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Gestión de accesos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Filtra roles, estado y usuarios con cambio de contraseña pendiente.
              </p>
            </div>

            <form method="get" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rol
                </label>
                <select
                  name="userRole"
                  defaultValue={selectedUserRole}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {getUserRoleOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </label>
                <select
                  name="userState"
                  defaultValue={selectedUserState}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {getUserStateOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <select
                  name="passwordState"
                  defaultValue={selectedPasswordState}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {getPasswordStateOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <input type="hidden" name="status" value={selectedStatus} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Filtrar
                </button>
                <Link
                  href={`/admin?status=${selectedStatus}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Limpiar
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Password</th>
                  <th className="px-3 py-2">Último reset</th>
                  <th className="px-3 py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {safeUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                    >
                      No hay usuarios que cumplan los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  safeUsers.map((row) => {
                    const userLabel = row.display_name || row.email || "Usuario";

                    return (
                      <tr key={row.id} className="rounded-2xl bg-slate-50 text-sm">
                        <td className="px-3 py-3 text-slate-800">
                          <div className="font-medium text-slate-900">
                            {row.display_name || "Usuario"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{row.email}</div>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(
                              row.role
                            )}`}
                          >
                            {row.role}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActiveBadgeClass(
                              row.is_active
                            )}`}
                          >
                            {row.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getMustChangePasswordBadgeClass(
                              row.must_change_password
                            )}`}
                          >
                            {row.must_change_password
                              ? "Cambio pendiente"
                              : "Sin pendiente"}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-slate-800">
                          {row.last_password_reset_at
                            ? new Date(row.last_password_reset_at).toLocaleString("es-ES")
                            : "Nunca"}
                        </td>

                        <td className="px-3 py-3">
                          {row.id === me.id ? (
                            <span className="text-xs text-slate-400">Tu usuario</span>
                          ) : (
                            <ResetPasswordButton
                              userId={row.id}
                              userLabel={userLabel}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Partidos
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Crear partido
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Añade un nuevo partido manualmente.
              </p>
            </div>
          </div>

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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Partidos
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Gestión de partidos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Edita resultados, estado, equipos y atributos del partido.
              </p>
            </div>

            <form method="get" className="flex items-end gap-3">
              <input type="hidden" name="userRole" value={selectedUserRole} />
              <input type="hidden" name="userState" value={selectedUserState} />
              <input
                type="hidden"
                name="passwordState"
                value={selectedPasswordState}
              />

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Filtrar por estado
                </label>
                <select
                  name="status"
                  defaultValue={selectedStatus}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {getMatchStatusOptions().map((option) => (
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

              <Link
                href={`/admin?userRole=${selectedUserRole}&userState=${selectedUserState}&passwordState=${selectedPasswordState}`}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Limpiar
              </Link>
            </form>
          </div>

          <div className="mt-6 space-y-4">
            {safeMatches.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No hay partidos que cumplan el filtro seleccionado.
              </div>
            ) : (
              safeMatches.map((match) => (
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
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}