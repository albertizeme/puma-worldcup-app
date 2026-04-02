"use client";

import { useRouter } from "next/navigation";
import CountryFlag from "@/components/CountryFlag";
import { Match } from "@/types/match";

type MatchCardProps = {
  match: Match;
};

function formatMatchDate(value: string | null | undefined) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "Fecha por confirmar";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();

  const goToDetail = () => {
    router.push(`/match/${match.id}`);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetail();
        }
      }}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CountryFlag
                code={match.home_flag}
                teamName={match.home_team}
                alt={match.home_team}
              />
              <span className="truncate text-lg font-bold text-slate-900 md:text-xl">
                {match.home_team}
              </span>
            </div>

            <div className="pl-12 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              VS
            </div>

            <div className="flex items-center gap-3">
              <CountryFlag
                code={match.away_flag}
                teamName={match.away_team}
                alt={match.away_team}
              />
              <span className="truncate text-lg font-bold text-slate-900 md:text-xl">
                {match.away_team}
              </span>
            </div>
          </div>

          <p className="mt-4 pl-12 text-sm text-slate-500">
            {formatMatchDate(match.match_datetime)}
          </p>
        </div>

        <div className="shrink-0 md:self-center">
          <span className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-orange-600">
            Ver detalle
          </span>
        </div>
      </div>
    </article>
  );
}