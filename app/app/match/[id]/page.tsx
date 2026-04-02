import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { Match } from "@/types/match";
import CountryFlag from "@/components/CountryFlag";
import PredictionSection from "@/components/PredictionSection";
import { buttonStyles } from "@/lib/ui";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatMatchDate(value: string | null | undefined) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "Fecha por confirmar";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            Partido no encontrado
          </div>
        </div>
      </main>
    );
  }

  const match: Match = data;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <Link href="/" className={`${buttonStyles.secondary} mb-5`}>
          ← Volver a partidos
        </Link>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {match.stage && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {match.stage}
              </span>
            )}

            {match.is_puma_match && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                🐆 PUMA Match
              </span>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="text-center md:text-left">
              <div className="mb-3 flex justify-center md:justify-start">
                <CountryFlag
                  code={match.home_flag}
                  teamName={match.home_team}
                  alt={match.home_team}
                  className="h-14 w-14"
                />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-4xl">
                {match.home_team}
              </h1>
            </div>

            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 md:text-sm">
                VS
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="mb-3 flex justify-center md:justify-end">
                <CountryFlag
                  code={match.away_flag}
                  teamName={match.away_team}
                  alt={match.away_team}
                  className="h-14 w-14"
                />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-4xl">
                {match.away_team}
              </h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-sm">
              Fecha del partido
            </p>
            <p className="mt-2 text-base font-medium text-slate-700 md:text-lg">
              {formatMatchDate(match.match_datetime)}
            </p>
          </div>
        </section>

        <PredictionSection
          matchId={match.id}
          matchDatetime={match.match_datetime}
        />
      </div>
    </main>
  );
}