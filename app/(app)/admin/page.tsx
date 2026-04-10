import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminHomePage() {
  const supabase = await getSupabaseServerClient();

  const [{ data: users }, { data: matches }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, is_active, must_change_password"),
    supabase
      .from("matches")
      .select("id, status, is_puma_match"),
  ]);

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
          <Card title="Upcoming" value={upcoming} href="/admin/matches" />
          <Card title="Live" value={live} href="/admin/matches" />
          <Card title="Finished" value={finished} href="/admin/matches" />
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
    </div>
  );
}