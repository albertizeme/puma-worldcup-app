import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import ResetPasswordButton from "@/components/admin/ResetPasswordButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Detalle de usuario</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nombre
            </div>
            <div className="mt-1 text-sm text-slate-900">
              {profile.display_name || "Sin nombre"}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </div>
            <div className="mt-1 text-sm text-slate-900">{profile.email}</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rol
            </div>
            <div className="mt-1 text-sm text-slate-900">{profile.role}</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Alta
            </div>
            <div className="mt-1 text-sm text-slate-900">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleString("es-ES")
                : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ResetPasswordButton userId={profile.id} />
      </div>
    </main>
  );
}