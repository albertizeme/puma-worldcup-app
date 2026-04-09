// components/match/MatchHeaderCard.tsx
import CountryFlag from "@/components/CountryFlag";
import { formatMatchDate } from "@/lib/match-detail";

type Props = {
  matchStatusLabel: string;
  isPumaMatch: boolean;
  stage?: string | null;
  matchDatetime?: string | null;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string | null;
  awayFlag?: string | null;
  stadium?: string | null;
  city?: string | null;
  scoreSlot: React.ReactNode;
};

export default function MatchHeaderCard({
  matchStatusLabel,
  isPumaMatch,
  stage,
  matchDatetime,
  homeTeam,
  awayTeam,
  homeFlag,
  awayFlag,
  stadium,
  city,
  scoreSlot,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
            {matchStatusLabel}
          </span>

          {isPumaMatch ? (
            <span className="rounded-full border border-orange-200 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
              PUMA Match
            </span>
          ) : null}

          {stage ? <span>· {stage}</span> : null}
          <span>· {formatMatchDate(matchDatetime)}</span>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center gap-4">
            <CountryFlag
              code={homeFlag}
              teamName={homeTeam}
              alt={`Bandera de ${homeTeam}`}
            />
            <div className="min-w-0">
              <div className="text-lg font-bold text-slate-900 sm:text-2xl">
                {homeTeam}
              </div>
              <div className="text-sm text-slate-500">Local</div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {scoreSlot}
          </div>

          <div className="flex items-center justify-start gap-4 md:justify-end">
            <div className="min-w-0 text-left md:text-right">
              <div className="text-lg font-bold text-slate-900 sm:text-2xl">
                {awayTeam}
              </div>
              <div className="text-sm text-slate-500">Visitante</div>
            </div>
            <CountryFlag
              code={awayFlag}
              teamName={awayTeam}
              alt={`Bandera de ${awayTeam}`}
            />
          </div>
        </div>

        {stadium || city ? (
          <div className="mt-5 text-sm text-slate-500">
            {[stadium, city].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </div>
    </section>
  );
}