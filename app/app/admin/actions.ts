"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type MatchStatus = "upcoming" | "live" | "finished";

function parseNullableScore(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const num = Number(text);
  if (Number.isNaN(num)) return null;

  return num;
}

function parseNullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseNullableDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function parseCheckbox(value: FormDataEntryValue | null) {
  return value === "true";
}

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

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

  return userId;
}

function revalidateAdminSurfaces() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-predictions");
}

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const stage = parseNullableText(formData.get("stage"));
  const matchDatetime = parseNullableDateTime(formData.get("match_datetime"));
  const homeTeam = parseNullableText(formData.get("home_team"));
  const awayTeam = parseNullableText(formData.get("away_team"));
  const homeFlag = parseNullableText(formData.get("home_flag"));
  const awayFlag = parseNullableText(formData.get("away_flag"));
  const status = String(formData.get("status") ?? "upcoming") as MatchStatus;
  const isPumaMatch = parseCheckbox(formData.get("is_puma_match"));

  if (!homeTeam || !awayTeam) {
    throw new Error("Debes informar equipo local y visitante.");
  }

  const payload = {
    stage,
    match_datetime: matchDatetime,
    home_team: homeTeam,
    away_team: awayTeam,
    home_flag: homeFlag,
    away_flag: awayFlag,
    status,
    is_puma_match: isPumaMatch,
    home_score: null,
    away_score: null,
  };

  const { error } = await supabaseAdmin.from("matches").insert(payload);

  if (error) {
    throw new Error(`No se pudo crear el partido: ${error.message}`);
  }

  revalidateAdminSurfaces();
}

export async function updateMatchAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "");
  const stage = parseNullableText(formData.get("stage"));
  const matchDatetime = parseNullableDateTime(formData.get("match_datetime"));
  const homeTeam = parseNullableText(formData.get("home_team"));
  const awayTeam = parseNullableText(formData.get("away_team"));
  const homeFlag = parseNullableText(formData.get("home_flag"));
  const awayFlag = parseNullableText(formData.get("away_flag"));
  const status = String(formData.get("status") ?? "upcoming") as MatchStatus;
  const isPumaMatch = parseCheckbox(formData.get("is_puma_match"));
  const homeScore = parseNullableScore(formData.get("home_score"));
  const awayScore = parseNullableScore(formData.get("away_score"));

  if (!id) {
    throw new Error("Falta el id del partido.");
  }

  if (!homeTeam || !awayTeam) {
    throw new Error("Debes informar equipo local y visitante.");
  }

  const payload: {
    stage: string | null;
    match_datetime: string | null;
    home_team: string | null;
    away_team: string | null;
    home_flag: string | null;
    away_flag: string | null;
    status: MatchStatus;
    is_puma_match: boolean;
    home_score: number | null;
    away_score: number | null;
  } = {
    stage,
    match_datetime: matchDatetime,
    home_team: homeTeam,
    away_team: awayTeam,
    home_flag: homeFlag,
    away_flag: awayFlag,
    status,
    is_puma_match: isPumaMatch,
    home_score: homeScore,
    away_score: awayScore,
  };

  if (status !== "finished") {
    payload.home_score = null;
    payload.away_score = null;
  }

  const { error } = await supabaseAdmin
    .from("matches")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el partido: ${error.message}`);
  }

  revalidateAdminSurfaces();
}

export async function deleteMatchAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Falta el id del partido.");
  }

  const { error } = await supabaseAdmin.from("matches").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el partido: ${error.message}`);
  }

  revalidateAdminSurfaces();
}