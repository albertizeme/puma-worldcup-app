import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { buttonStyles } from "@/lib/ui";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function getOutcomeText(
  points: number | null,
  hasResult: boolean,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
  if (!hasResult) return t("detail.outcomes.pending");

  if (points === 3) return t("detail.outcomes.exact");
  if (points === 1) return t("detail.outcomes.tendency");
  return t("detail.outcomes.miss");
}

function formatMatchDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    timeZone: "Europe/Madrid",
  });
}

export default async function PredictionDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations("myPredictions");

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: prediction, error } = await supabase
    .from("my_predictions_view")
    .select("*")
    .eq("prediction_id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !prediction) {
    notFound();
  }

  const hasResult =
    prediction.home_score !== null && prediction.away_score !== null;

  const outcomeText = getOutcomeText(prediction.points, hasResult, t);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("detail.title")}</h1>
        <Link
          href={`/${locale}/my-predictions`}
          className={buttonStyles.secondary}
        >
          {t("detail.back")}
        </Link>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("detail.match")}
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {prediction.home_team} vs {prediction.away_team}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {formatMatchDate(prediction.match_datetime, locale)}
            {prediction.stage ? ` · ${prediction.stage}` : ""}
          </p>
        </section>

        <section className="rounded-2xl border bg-slate-50 p-6 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("detail.matchResult")}
          </p>

          {hasResult ? (
            <div className="mt-2 text-4xl font-bold text-slate-900">
              {prediction.home_score} - {prediction.away_score}
            </div>
          ) : (
            <div className="mt-2 text-lg font-medium text-slate-500">
              {t("detail.pendingToPlay")}
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-white p-5 text-center shadow-sm">
            <p className="text-xs uppercase text-slate-500">
              {t("detail.yourPrediction")}
            </p>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {prediction.home_score_pred} - {prediction.away_score_pred}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 text-center shadow-sm">
            <p className="text-xs uppercase text-slate-500">
              {t("detail.points")}
            </p>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {prediction.points ?? "-"}
            </div>
            <p className="mt-1 text-sm text-slate-500">{outcomeText}</p>
          </div>
        </section>
      </div>
    </main>
  );
}