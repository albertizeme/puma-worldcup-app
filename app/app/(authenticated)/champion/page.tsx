import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  getChampionPrediction,
  getChampionPredictionDeadline,
  getChampionTeams,
} from "@/lib/champion/queries";
import ChampionPageClient from "@/components/champion/ChampionPageClient";

export default async function ChampionPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [teams, prediction, deadlineInfo] = await Promise.all([
    getChampionTeams(),
    getChampionPrediction(user.id),
    getChampionPredictionDeadline(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <ChampionPageClient
        teams={teams}
        prediction={prediction}
        deadline={deadlineInfo.deadline}
        isOpen={deadlineInfo.isOpen}
      />
    </div>
  );
}