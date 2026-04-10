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
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (meError) {
    throw new Error(`Error comprobando permisos admin: ${meError.message}`);
  }

  if (!me || me.role !== "admin" || !me.is_active) {
    redirect("/");
  }

  return userId;
}

function revalidateAdminSurfaces() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/matches");
  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-predictions");
}

function redirectMatchError(code: string): never {
  redirect(`/admin/matches?error=${code}`);
}

function redirectMatchSuccess(code: string): never {
  redirect(`/admin/matches?success=${code}`);
}

function redirectUserError(code: string): never {
  redirect(`/admin/users?error=${code}`);
}

function redirectUserSuccess(code: string): never {
  redirect(`/admin/users?success=${code}`);
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
    redirectMatchError("match-create");
  }

  if (homeTeam === awayTeam) {
    redirectMatchError("match-create");
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
    console.error("[createMatchAction]", error);
    redirectMatchError("match-create");
  }

  revalidateAdminSurfaces();
  redirectMatchSuccess("match-created");
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
    redirectMatchError("match-update");
  }

  if (!homeTeam || !awayTeam) {
    redirectMatchError("match-update");
  }

  if (homeTeam === awayTeam) {
    redirectMatchError("match-update");
  }

  if ((homeScore !== null && homeScore < 0) || (awayScore !== null && awayScore < 0)) {
    redirectMatchError("match-update");
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
    console.error("[updateMatchAction]", error);
    redirectMatchError("match-update");
  }

  revalidateAdminSurfaces();
  redirectMatchSuccess("match-updated");
}

export async function deleteMatchAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectMatchError("match-delete");
  }

  const { error } = await supabaseAdmin.from("matches").delete().eq("id", id);

  if (error) {
    console.error("[deleteMatchAction]", error);
    redirectMatchError("match-delete");
  }

  revalidateAdminSurfaces();
  redirectMatchSuccess("match-deleted");
}

export async function toggleUserActiveAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "");
  const nextValueRaw = String(formData.get("next_is_active") ?? "");

  if (!id) {
    redirectUserError("user-toggle");
  }

  if (nextValueRaw !== "true" && nextValueRaw !== "false") {
    redirectUserError("user-toggle");
  }

  const nextIsActive = nextValueRaw === "true";

  const supabase = await getSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const currentAdminId = claimsData.claims.sub;

  if (id === currentAdminId) {
    redirectUserError("user-toggle-self");
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_active: nextIsActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[toggleUserActiveAction]", error);
    redirectUserError("user-toggle");
  }

  const { error: auditError } = await supabaseAdmin.from("admin_audit_logs").insert({
    admin_user_id: currentAdminId,
    target_user_id: id,
    action: nextIsActive ? "user_activated" : "user_deactivated",
    details: {
      is_active: nextIsActive,
    },
  });

  if (auditError) {
    console.error("[toggleUserActiveAction][audit]", auditError);
  }

  revalidateAdminSurfaces();
  redirectUserSuccess(nextIsActive ? "user-activated" : "user-deactivated");
}