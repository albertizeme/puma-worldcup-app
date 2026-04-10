// components/match/QuickPredictionSection.tsx
"use client";

import { useFormStatus } from "react-dom";
import { saveQuickPredictionAction } from "@/app/(authenticated)/match/[id]/quick/actions";

type Props = {
  matchId: string;
  returnTo?: string;
  initialPrediction?: {
    id?: string;
    home_score_pred: number | null;
    away_score_pred: number | null;
  } | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Guardar predicción"}
    </button>
  );
}

function ScoreInput({
  name,
  defaultValue,
  ariaLabel,
}: {
  name: string;
  defaultValue?: number | null;
  ariaLabel: string;
}) {
  return (
    <input
      type="number"
      name={name}
      min={0}
      inputMode="numeric"
      aria-label={ariaLabel}
      defaultValue={defaultValue ?? ""}
      className="h-[64px] w-[64px] rounded-2xl border border-slate-200 bg-white text-center text-2xl font-extrabold text-slate-900 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200 sm:h-[76px] sm:w-[76px]"
      required
    />
  );
}

export default function QuickPredictionSection({
  matchId,
  returnTo = "/",
  initialPrediction,
}: Props) {
  return (
    <form action={saveQuickPredictionAction} className="w-full">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-3">
          <ScoreInput
            name="homeScorePred"
            defaultValue={initialPrediction?.home_score_pred ?? null}
            ariaLabel="Goles equipo local"
          />
          <div className="text-xl font-bold text-slate-400">-</div>
          <ScoreInput
            name="awayScorePred"
            defaultValue={initialPrediction?.away_score_pred ?? null}
            ariaLabel="Goles equipo visitante"
          />
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}