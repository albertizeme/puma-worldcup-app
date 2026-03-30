import type { Match } from '../types/match'

type MatchCardProps = {
  match: Match
}

export default function MatchCard({ match }: MatchCardProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-black/45">
        <span>{match.stage}</span>
        <span>{match.match_time || '--:--'}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-base font-bold">
            {match.home_flag || '🏳️'} {match.home_team}
          </p>
          <p className="text-sm text-black/55">
            vs {match.away_flag || '🏳️'} {match.away_team}
          </p>
        </div>

        {match.is_puma_match && (
          <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
            PUMA Match
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
          Predict
        </button>
        <button className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
          Stats
        </button>
      </div>
    </div>
  )
}