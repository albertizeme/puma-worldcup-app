import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isChampionPredictionOpen } from "@/lib/champion/utils";

export async function getChampionPredictionDeadline() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "champion_prediction_deadline")
    .maybeSingle();

  if (error) {
    console.error("Error loading champion prediction deadline:", error);
    return {
      deadline: null,
      isOpen: false,
    };
  }

  const deadline = data?.value ?? null;

  return {
    deadline,
    isOpen: isChampionPredictionOpen(deadline),
  };
}

export async function getChampionTeams() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, is_puma_team")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading teams:", error);
    return [];
  }

  return data ?? [];
}

export async function getChampionPrediction(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("champion_predictions")
    .select("id, user_id, predicted_team_id, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error loading champion prediction:", error);
    return null;
  }

  return data;
}