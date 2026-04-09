// app/match/[id]/quick/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth-guard";

const DEADLINE_BUFFER_HOURS = 1;
const DEFAULT_RETURN_TO = "/";

function parseInputScore(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;

  const str = String(value).trim();
  if (!str) return null;

  const parsed = Number(str);
  if (!Number.isInteger(parsed) || parsed < 0) return null;

  return parsed;
}

function getPredictionDeadline(dateString: string | null | undefined) {
  if (!dateString) return null;

  const matchDate = new Date(dateString);
  if (Number.isNaN(matchDate.getTime())) return null;

  return new Date(
    matchDate.getTime() - DEADLINE_BUFFER_HOURS * 60 * 60 * 1000,
  );
}

export async function saveQuickPredictionAction(formData: FormData) {
  const matchId = String(formData.get("matchId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN_TO);

  const homeScorePred = parseInputScore(formData.get("homeScorePred"));
  const awayScorePred = parseInputScore(formData.get("awayScorePred"));

  if (!matchId) {
    throw new Error("Falta el matchId.");
  }

  if (homeScorePred === null || awayScorePred === null) {
    throw new Error("Debes indicar un marcador válido.");
  }

  const { supabase: supabaseServer, user } = await requireAuthenticatedUser();

  const { data: match, error: matchError } = await supabaseServer
    .from("matches")
    .select("id, match_datetime, home_score, away_score")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    throw new Error("No se ha encontrado el partido.");
  }

  const alreadyFinished =
    match.home_score != null && String(match.home_score).trim() !== "" &&
    match.away_score != null && String(match.away_score).trim() !== "";

  if (alreadyFinished) {
    throw new Error("Este partido ya ha finalizado.");
  }

  const deadline = getPredictionDeadline(match.match_datetime);

  if (!deadline) {
    throw new Error("No se puede calcular la hora límite del partido.");
  }

  if (Date.now() >= deadline.getTime()) {
    throw new Error("La predicción ya está cerrada para este partido.");
  }

  const { error: upsertError } = await supabaseServer
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score_pred: homeScorePred,
        away_score_pred: awayScorePred,
      },
      {
        onConflict: "user_id,match_id",
      },
    );

  if (upsertError) {
    throw new Error(`No se pudo guardar la predicción: ${upsertError.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/quick`);

  redirect(returnTo);
}