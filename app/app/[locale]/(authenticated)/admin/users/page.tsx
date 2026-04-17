import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import ResetPasswordButton from "../ResetPasswordButton";
import ToggleUserActiveButton from "../ToggleUserActiveButton";
import CreateUserForm from "./CreateUserForm";

type UserRole = "all" | "user" | "admin";
type UserState = "all" | "active" | "inactive";
type PasswordState = "all" | "pending" | "ok";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin";
  is_active: boolean;
  must_change_password: boolean;
  last_password_reset_at: string | null;
  created_at: string | null;
};

type SearchParams = Promise<{
  userRole?: string;
  userState?: string;
  passwordState?: string;
  success?: string;
  error?: string;
}>;

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
      case "user-toggle":
        return {
          type: "error" as const,
          message: "No se pudo actualizar el estado del usuario.",
        };
      case "user-toggle-self":
        return {
          type: "error" as const,
          message: "No puedes desactivar tu propio usuario.",
        };
      default:
        return {
          type: "error" as const,
          message: "Ha ocurrido un error en la gestión de usuarios.",
        };
    }
  }

  if (success) {
    switch (success) {
      case "user-activated":
        return {
          type: "success" as const,
          message: "Usuario activado correctamente.",
        };
      case "user-deactivated":
        return {
          type: "success" as const,
          message: "Usuario desactivado correctamente.",
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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;

  const selectedUserRole = (resolvedSearchParams.userRole ?? "all") as UserRole;
  const selectedUserState = (resolvedSearchParams.userState ?? "all") as UserState;
  const selectedPasswordState = (resolvedSearchParams.passwordState ??
    "all") as PasswordState;

  const alert = getAlertFromQuery(
    resolvedSearchParams.success,
    resolvedSearchParams.error
  );

  const supabase = await getSupabaseServerClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const currentUserId = claimsData?.claims?.sub;

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

  const { data: users, error } = await usersQuery;

  if (error) {
    throw new Error(`Error cargando usuarios: ${error.message}`);
  }

  const safeUsers = (users as ProfileRow[] | null) ?? [];

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Usuarios
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Gestión de accesos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Administra roles, acceso y contraseñas.
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
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Filtrar
            </button>
            <Link
              href="/admin/users"
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Limpiar
            </Link>
          </div>
        </form>
      </div>

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
      <div className="mt-6">
        <CreateUserForm />
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
                      {row.id === currentUserId ? (
                        <span className="text-xs text-slate-400">Tu usuario</span>
                      ) : (
                        <div className="flex flex-wrap items-start gap-2">
                          <ResetPasswordButton
                            userId={row.id}
                            userLabel={userLabel}
                          />
                          <ToggleUserActiveButton
                            userId={row.id}
                            isActive={row.is_active}
                            userLabel={userLabel}
                          />
                        </div>
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
  );
}