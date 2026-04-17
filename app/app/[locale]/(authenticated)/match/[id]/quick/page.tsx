import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuthenticatedUser } from "@/lib/auth-guard";
import CloseMatchDetailButton from "@/components/CloseMatchDetailButton";
import MatchHeaderCard from "@/components/match/MatchHeaderCard";
import PumaHighlightCard from "@/components/match/PumaHighlightCard";
import QuickPredictionSection from "@/components/match/QuickPredictionSection";
import { getMatchDetailData } from "@/lib/get-match-detail-data";
import { getPumaCardText, getStatusLabel } from "@/lib/match-detail";

type Props = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function QuickMatchPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations("match");

  const { supabase: supabaseServer, user } = await requireAuthenticatedUser();

  const data = await getMatchDetailData({
    supabaseServer,
    matchId: id,
    userId: user.id,
  });

  if (!data) {
    notFound();
  }

  const {
    match,
    prediction,
    hasPumaTeam,
    isDualPuma,
    primaryPumaTeam,
    pumaTeams,
    isPumaMatch,
    matchStatus,
  } = data;

  if (matchStatus !== "scheduled") {
    redirect(`/${locale}/match/${id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-end">
        <CloseMatchDetailButton />
      </div>

      <MatchHeaderCard
        matchStatusLabel={getStatusLabel(matchStatus)}
        isPumaMatch={isPumaMatch}
        stage={match.stage}
        matchDatetime={match.match_datetime}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        homeFlag={match.home_flag}
        awayFlag={match.away_flag}
        stadium={match.stadium}
        city={match.city}
        scoreSlot={
          <QuickPredictionSection
            matchId={match.id}
            returnTo={`/${locale}`}
            initialPrediction={
              prediction
                ? {
                    id: prediction.id,
                    home_score_pred: prediction.home_score_pred,
                    away_score_pred: prediction.away_score_pred,
                  }
                : null
            }
          />
        }
      />

      {hasPumaTeam ? (
        <PumaHighlightCard
          isDualPuma={isDualPuma}
          pumaTeams={pumaTeams}
          primaryPumaTeam={primaryPumaTeam}
          text={getPumaCardText(pumaTeams, primaryPumaTeam, isDualPuma)}
        />
      ) : null}
    </main>
  );
}