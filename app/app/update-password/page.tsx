import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import UpdatePasswordForm from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, must_change_password, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
        <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Seguridad
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Actualiza tu contraseña
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Tu cuenta requiere cambiar la contraseña antes de continuar.
          </p>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Usuario: <span className="font-semibold">{profile.email}</span>
          </div>

          <div className="mt-6">
            <UpdatePasswordForm mustChangePassword={profile.must_change_password} />
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}