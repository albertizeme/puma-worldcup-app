"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isChampionPredictionOpen } from "@/lib/champion/utils";

type SaveChampionPredictionResult = {
  ok: boolean;
  message: string;
};

export async function saveChampionPredictionAction(
  teamId: string
): Promise<SaveChampionPredictionResult> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      message: "Sesión no válida.",
    };
  }

  const { data: deadlineRow, error: deadlineError } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "champion_prediction_deadline")
    .maybeSingle();

  if (deadlineError) {
    console.error("Error loading deadline:", deadlineError);
    return {
      ok: false,
      message: "No se pudo validar la fecha límite.",
    };
  }

  const deadline = deadlineRow?.value ?? null;

  if (!isChampionPredictionOpen(deadline)) {
    return {
      ok: false,
      message: "El plazo para pronosticar el campeón ya está cerrado.",
    };
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !team) {
    return {
      ok: false,
      message: "Equipo no válido.",
    };
  }

  const { error: upsertError } = await supabase
    .from("champion_predictions")
    .upsert(
      {
        user_id: user.id,
        predicted_team_id: teamId,
      },
      {
        onConflict: "user_id",
      }
    );

  if (upsertError) {
    console.error("Error saving champion prediction:", upsertError);
    return {
      ok: false,
      message: "No se pudo guardar tu pronóstico.",
    };
  }

  revalidatePath("/champion");
  revalidatePath("/");
  revalidatePath("/ranking");

  return {
    ok: true,
    message: "Pronóstico guardado correctamente.",
  };
}