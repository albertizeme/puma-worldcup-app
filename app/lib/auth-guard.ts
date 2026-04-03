// lib/auth-guard.ts
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function requireAuthenticatedUser(options?: {
  allowPasswordChangePage?: boolean;
  requireAdmin?: boolean;
}) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (!profile.is_active) {
    redirect("/login");
  }

  if (!options?.allowPasswordChangePage && profile.must_change_password) {
    redirect("/change-password");
  }

  if (options?.requireAdmin && profile.role !== "admin") {
    redirect("/");
  }

  return { supabase, user, profile };
}