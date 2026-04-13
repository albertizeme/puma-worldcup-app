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

function buildMatchesRedirectUrl(params: {
  filterStatus?: string | null;
  success?: string;
  error?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.filterStatus && params.filterStatus !== "all") {
    searchParams.set("status", params.filterStatus);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  const query = searchParams.toString();
  return query ? `/admin/matches?${query}` : "/admin/matches";
}

function redirectMatchError(code: string, filterStatus?: string | null): never {
  redirect(buildMatchesRedirectUrl({ filterStatus, error: code }));
}

function redirectMatchSuccess(code: string, filterStatus?: string | null): never {
  redirect(buildMatchesRedirectUrl({ filterStatus, success: code }));
}

function redirectUserError(code: string): never {
  redirect(`/admin/users?error=${code}`);
}

function redirectUserSuccess(code: string): never {
  redirect(`/admin/users?success=${code}`);
}

function redirectAdminError(code: string): never {
  redirect(`/admin?error=${code}`);
}

function redirectAdminSuccess(code: string): never {
  redirect(`/admin?success=${code}`);
}

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const filterStatus = String(formData.get("filter_status") ?? "all");

  const stage = parseNullableText(formData.get("stage"));
  const matchDatetime = parseNullableDateTime(formData.get("match_datetime"));
  const homeTeam = parseNullableText(formData.get("home_team"));
  const awayTeam = parseNullableText(formData.get("away_team"));
  const homeFlag = parseNullableText(formData.get("home_flag"));
  const awayFlag = parseNullableText(formData.get("away_flag"));
  const matchStatus = String(
    formData.get("match_status") ?? "upcoming"
  ) as MatchStatus;

  const isPumaMatch = parseCheckbox(formData.get("is_puma_match"));
  const isVisible = parseCheckbox(formData.get("is_visible"));
  const isPredictionOpen = parseCheckbox(formData.get("is_prediction_open"));

  if (!homeTeam || !awayTeam) {
    redirectMatchError("match-create", filterStatus);
  }

  if (homeTeam === awayTeam) {
    redirectMatchError("match-create", filterStatus);
  }

  const payload = {
    stage,
    match_datetime: matchDatetime,
    home_team: homeTeam,
    away_team: awayTeam,
    home_flag: homeFlag,
    away_flag: awayFlag,
    status: matchStatus,
    is_puma_match: isPumaMatch,
    is_visible: isVisible,
    is_prediction_open: isPredictionOpen,
    home_score: null,
    away_score: null,
  };

  const { error } = await supabaseAdmin.from("matches").insert(payload);

  if (error) {
    console.error("[createMatchAction]", error);
    redirectMatchError("match-create", filterStatus);
  }

  revalidateAdminSurfaces();
  redirectMatchSuccess("match-created", filterStatus);
}

export async function updateMatchAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "");
  const filterStatus = String(formData.get("filter_status") ?? "all");

  const stage = parseNullableText(formData.get("stage"));
  const matchDatetime = parseNullableDateTime(formData.get("match_datetime"));
  const homeTeam = parseNullableText(formData.get("home_team"));
  const awayTeam = parseNullableText(formData.get("away_team"));
  const homeFlag = parseNullableText(formData.get("home_flag"));
  const awayFlag = parseNullableText(formData.get("away_flag"));
  const matchStatus = String(
    formData.get("match_status") ?? "upcoming"
  ) as MatchStatus;

  const isPumaMatch = parseCheckbox(formData.get("is_puma_match"));
  const isVisible = parseCheckbox(formData.get("is_visible"));
  const isPredictionOpen = parseCheckbox(formData.get("is_prediction_open"));

  const homeScore = parseNullableScore(formData.get("home_score"));
  const awayScore = parseNullableScore(formData.get("away_score"));

  if (!id) {
    redirectMatchError("match-update", filterStatus);
  }

  if (!homeTeam || !awayTeam) {
    redirectMatchError("match-update", filterStatus);
  }

  if (homeTeam === awayTeam) {
    redirectMatchError("match-update", filterStatus);
  }

  if ((homeScore !== null && homeScore < 0) || (awayScore !== null && awayScore < 0)) {
    redirectMatchError("match-update", filterStatus);
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
    is_visible: boolean;
    is_prediction_open: boolean;
    home_score: number | null;
    away_score: number | null;
  } = {
    stage,
    match_datetime: matchDatetime,
    home_team: homeTeam,
    away_team: awayTeam,
    home_flag: homeFlag,
    away_flag: awayFlag,
    status: matchStatus,
    is_puma_match: isPumaMatch,
    is_visible: isVisible,
    is_prediction_open: isPredictionOpen,
    home_score: homeScore,
    away_score: awayScore,
  };

  if (matchStatus !== "finished") {
    payload.home_score = null;
    payload.away_score = null;
  }

  const { error } = await supabaseAdmin
    .from("matches")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("[updateMatchAction]", error);
    redirectMatchError("match-update", filterStatus);
  }

  revalidateAdminSurfaces();
  redirectMatchSuccess("match-updated", filterStatus);
}

export async function deleteMatchAction(formData: FormData) {
  await requireAdmin();
  const supabaseAdmin = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "");
  const filterStatus = String(formData.get("filter_status") ?? "all");

  if (!id) {
    redirectMatchError("match-delete", filterStatus);
  }

  const { error } = await supabaseAdmin.from("matches").delete().eq("id", id);

  if (error) {
    console.error("[deleteMatchAction]", error);
    redirectMatchError("match-delete", filterStatus);
  }

  revalidateAdminSurfaces();
  redirectMatchSuccess("match-deleted", filterStatus);
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

export async function generateRankingSnapshotAction(formData: FormData) {
  await requireAdmin();

  const snapshotKey = String(formData.get("snapshot_key") ?? "").trim();
  const snapshotLabel = String(formData.get("snapshot_label") ?? "").trim();

  if (!snapshotKey) {
    redirectAdminError("snapshot-missing-key");
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient();

    const { error } = await supabaseAdmin.rpc("generate_ranking_snapshot", {
      p_snapshot_key: snapshotKey,
      p_snapshot_label: snapshotLabel || null,
    });

    if (error) {
      console.error("[generateRankingSnapshotAction]", error);
      redirectAdminError("snapshot-generate");
    }
  } catch (err) {
    console.error("[generateRankingSnapshotAction][unexpected]", err);
    redirectAdminError("snapshot-generate");
  }

  revalidateAdminSurfaces();
  redirectAdminSuccess("snapshot-generated");
}