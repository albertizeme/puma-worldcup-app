import MatchCard from "@/components/MatchCard";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { Match } from "@/types/match";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { buttonStyles } from "@/lib/ui";

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_datetime", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            Error cargando partidos: {error.message}
          </div>
        </div>
      </main>
    );
  }

  const matches: Match[] = data ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <section className="mb-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-6 py-7 text-white shadow-lg md:px-8 md:py-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.35em] text-white/80 md:text-xs">
            PUMA Internal POC
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            World Cup Challenge
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-white/90 md:text-lg">
            Sigue los partidos, identifica los PUMA matches y prepara tus
            predicciones.
          </p>
        </section>

        <section className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Próximos partidos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {matches.length} partidos cargados
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ranking" className={buttonStyles.secondary}>
              Ver ranking
            </Link>

            <Link href="/my-predictions" className={buttonStyles.primary}>
              Mis predicciones
            </Link>

            {user?.email ? <UserAvatar email={user.email} /> : null}

            <AuthButton />
          </div>
        </section>

        <section className="grid gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </section>
      </div>
    </main>
  );
}