import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function requireAdminUser() {
  const supabase = await getSupabaseServerClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    throw new Error("UNAUTHORIZED");
  }

  const userId = claimsData.claims.sub;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error("FORBIDDEN");
  }

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    throw new Error("FORBIDDEN");
  }

  return profile;
}