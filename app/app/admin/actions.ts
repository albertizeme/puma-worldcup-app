"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function parseNullableScore(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const num = Number(text);
  if (Number.isNaN(num)) return null;

  return num;
}

export async function updateMatchAction(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: me, error: meError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (meError) {
    throw new Error(`Error comprobando permisos admin: ${meError.message}`);
  }

  if (!me?.is_admin) {
    redirect("/");
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "upcoming") as
    | "upcoming"
    | "live"
    | "finished";

  const homeScore = parseNullableScore(formData.get("home_score"));
  const awayScore = parseNullableScore(formData.get("away_score"));

  if (!id) {
    throw new Error("Falta el id del partido.");
  }

  const payload: {
    status: "upcoming" | "live" | "finished";
    home_score: number | null;
    away_score: number | null;
  } = {
    status,
    home_score: homeScore,
    away_score: awayScore,
  };

  if (status !== "finished" && (homeScore === null || awayScore === null)) {
    payload.home_score = null;
    payload.away_score = null;
  }

  const { error } = await supabase.from("matches").update(payload).eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el partido: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-predictions");
}