"use client";

import { useLocale } from "next-intl";
import { CommunityPredictionStats } from "@/lib/community-prediction-stats";
import { useTranslations } from "next-intl";

type Props = {
  stats: CommunityPredictionStats;
  homeTeam: string;
  awayTeam: string;
};

type CommunityPredictionStatsLabels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  totalPredictions: string;
  empty: string;
  mostPopular: string;
  scorelineShare: string;
  exactResult: string;
  exactResultShare: string;
  homeWin: string;
  draw: string;
  awayWin: string;
  scorelineBreakdown: string;
};

const labelsByLocale: Record<string, CommunityPredictionStatsLabels> = {
  en: {
    eyebrow: "Community pulse",
    title: "Community predictions",
    subtitle: "Aggregated predictions are shown only after this match is locked.",
    totalPredictions: "predictions",
    empty: "No predictions have been submitted for this match yet.",
    mostPopular: "Most popular score",
    scorelineShare: "{percentage}% of users - {count} predictions",
    exactResult: "Predicted correctly",
    exactResultShare: "{percentage}% predicted the final score",
    homeWin: "{team} win",
    draw: "Draw",
    awayWin: "{team} win",
    scorelineBreakdown: "Top scorelines",
  },
  es: {
    eyebrow: "Pulso de la comunidad",
    title: "Predicciones de la comunidad",
    subtitle: "Las predicciones agregadas solo se muestran cuando el partido ya esta cerrado.",
    totalPredictions: "predicciones",
    empty: "Aun no hay predicciones registradas para este partido.",
    mostPopular: "Marcador mas popular",
    scorelineShare: "{percentage}% de usuarios - {count} predicciones",
    exactResult: "Acertaron el marcador",
    exactResultShare: "{percentage}% predijo el marcador final",
    homeWin: "Victoria {team}",
    draw: "Empate",
    awayWin: "Victoria {team}",
    scorelineBreakdown: "Marcadores mas elegidos",
  },
  it: {
    eyebrow: "Polso della community",
    title: "Pronostici della community",
    subtitle: "I pronostici aggregati sono mostrati solo quando la partita e bloccata.",
    totalPredictions: "pronostici",
    empty: "Non ci sono ancora pronostici registrati per questa partita.",
    mostPopular: "Punteggio piu scelto",
    scorelineShare: "{percentage}% degli utenti - {count} pronostici",
    exactResult: "Hanno indovinato",
    exactResultShare: "{percentage}% ha previsto il risultato finale",
    homeWin: "Vittoria {team}",
    draw: "Pareggio",
    awayWin: "Vittoria {team}",
    scorelineBreakdown: "Punteggi piu scelti",
  },
  pt: {
    eyebrow: "Pulso da comunidade",
    title: "Previsoes da comunidade",
    subtitle: "As previsoes agregadas so aparecem quando o jogo ja esta fechado.",
    totalPredictions: "previsoes",
    empty: "Ainda nao ha previsoes registadas para este jogo.",
    mostPopular: "Marcador mais popular",
    scorelineShare: "{percentage}% dos utilizadores - {count} previsoes",
    exactResult: "Acertaram no marcador",
    exactResultShare: "{percentage}% previu o marcador final",
    homeWin: "Vitoria {team}",
    draw: "Empate",
    awayWin: "Vitoria {team}",
    scorelineBreakdown: "Marcadores mais escolhidos",
  },
};

function getLabels(locale: string) {
  return labelsByLocale[locale] ?? labelsByLocale.en;
}

function interpolate(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template
  );
}

function formatScoreline(home: number, away: number) {
  return `${home} - ${away}`;
}

function OutcomeBar({
  label,
  count,
  percentage,
}: {
  label: string;
  count: number;
  percentage: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">
          {percentage}% - {count}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-violet-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function CommunityPredictionStatsCard({
  stats,
  homeTeam,
  awayTeam,
}: Props) {
  const t = useTranslations("communityPredictionStats");

  const outcomeLabels = {
    homeWin: t("homeWin", { team: homeTeam }),
    draw: t("draw"),
    awayWin: t("awayWin", { team: awayTeam }),
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left sm:text-right">
          <p className="text-2xl font-black text-slate-900">
            {stats.totalPredictions}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("totalPredictions")}
          </p>
        </div>
      </div>

      {stats.totalPredictions === 0 ? (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.75fr)]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-violet-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  {t("mostPopular")}
                </p>
                <p className="mt-1 text-2xl font-black text-violet-950">
                  {stats.topScoreline
                    ? formatScoreline(
                        stats.topScoreline.home,
                        stats.topScoreline.away
                      )
                    : "-"}
                </p>
                {stats.topScoreline ? (
                  <p className="mt-1 text-sm font-medium text-violet-700">
                    {t("scorelineShare", {
                      count: stats.topScoreline.count,
                      percentage: stats.topScoreline.percentage,
                    })}
                  </p>
                ) : null}
              </div>

              {stats.exactResultHits ? (
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    {t("exactResult")}
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-950">
                    {stats.exactResultHits.count}
                  </p>
                  <p className="mt-1 text-sm font-medium text-emerald-700">
                    {t("exactResultShare", {
                      percentage: stats.exactResultHits.percentage,
                    })}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {stats.outcomes.map((outcome) => (
                <OutcomeBar
                  key={outcome.key}
                  label={outcomeLabels[outcome.key]}
                  count={outcome.count}
                  percentage={outcome.percentage}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t("scorelineBreakdown")}
            </h3>
            <div className="mt-3 space-y-2">
              {stats.scorelines.map((scoreline) => (
                <div
                  key={`${scoreline.home}-${scoreline.away}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-base font-black text-slate-900">
                    {formatScoreline(scoreline.home, scoreline.away)}
                  </span>
                  <span className="text-sm font-bold text-slate-600">
                    {scoreline.percentage}% - {scoreline.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
