import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminUsersPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/");
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            No se pudieron cargar los usuarios.
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((row) => (
                <tr key={row.id} className="rounded-2xl bg-slate-50 text-sm text-slate-900">
                  <td className="px-3 py-3">{row.display_name || "Sin nombre"}</td>
                  <td className="px-3 py-3">{row.email}</td>
                  <td className="px-3 py-3">{row.role}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/users/${row.id}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-white"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}