"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import PredictionForm from "@/components/PredictionForm";

type PredictionSectionProps = {
  matchId: string;
  matchDatetime: string | null;
};

type PredictionScore = {
  home_score_pred: number;
  away_score_pred: number;
  home_score: number | null;
  away_score: number | null;
  points: number | null;
  exact_hit: boolean;
};

export default function PredictionSection({
  matchId,
  matchDatetime,
}: PredictionSectionProps) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [predictionScore, setPredictionScore] = useState<PredictionScore | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPredictionState() {
      const supabase = getSupabaseBrowserClient();

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("[PredictionSection] getUser error:", userError);
        }

        if (!isMounted) return;

        if (!user) {
          setUserId(null);
          setPredictionScore(null);
          return;
        }

        setUserId(user.id);

        const { data: scoreData, error: scoreError } = await supabase
          .from("prediction_scores")
          .select(
            "home_score_pred, away_score_pred, home_score, away_score, points, exact_hit"
          )
          .eq("match_id", matchId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (scoreError) {
          console.error("[PredictionSection] prediction_scores query error:", scoreError);
        }

        if (!isMounted) return;

        setPredictionScore(scoreData ?? null);
      } catch (err) {
        console.error("[PredictionSection] unexpected error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPredictionState();

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  function getScoreMessage(score: PredictionScore | null) {
    if (!score) return null;
    if (score.points === null) return "Resultado pendiente";
    if (score.exact_hit) return "Resultado exacto ✅";
    if (score.points > 0) return "Has sumado puntos";
    return "No sumaste puntos";
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-[1.5rem] bg-white p-6 shadow-lg">
        <p className="text-sm text-gray-500">Cargando predicción...</p>
      </section>
    );
  }

  if (!userId) {
    return (
      <section className="mt-6 rounded-[1.5rem] bg-white p-6 shadow-lg">
        <p className="text-sm text-gray-600">
          Debes iniciar sesión para guardar tu predicción.
        </p>

        <Link
          href="/login"
          className="mt-4 inline-flex rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Ir a login
        </Link>
      </section>
    );
  }

  const hasPrediction = !!predictionScore;
  const hasResolvedResult =
    predictionScore?.home_score !== null &&
    predictionScore?.home_score !== undefined &&
    predictionScore?.away_score !== null &&
    predictionScore?.away_score !== undefined;

  return (
    <>
      {hasPrediction ? (
        <section className="mt-6 rounded-[1.5rem] bg-white p-6 shadow-lg">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Seguimiento de tu predicción
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Comparativa del partido
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Tu predicción
              </p>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">
                {predictionScore.home_score_pred} - {predictionScore.away_score_pred}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Resultado real
              </p>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">
                {hasResolvedResult
                  ? `${predictionScore.home_score} - ${predictionScore.away_score}`
                  : "Pendiente"}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Puntos obtenidos
              </p>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">
                {predictionScore.points ?? "Pendiente"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm font-medium text-gray-700">
              {getScoreMessage(predictionScore)}
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-[1.5rem] bg-white p-6 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Estado
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Aún no has hecho tu predicción
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Introduce tu marcador antes del inicio del partido.
          </p>
        </section>
      )}

      <PredictionForm
        matchId={matchId}
        userId={userId}
        matchDatetime={matchDatetime}
        initialHomeScore={predictionScore?.home_score_pred ?? null}
        initialAwayScore={predictionScore?.away_score_pred ?? null}
      />
    </>
  );
}