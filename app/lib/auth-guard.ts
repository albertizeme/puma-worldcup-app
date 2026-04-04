// lib/auth-guard.ts
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type RequireAuthenticatedUserOptions = {
  allowPasswordChangePage?: boolean;
  requireAdmin?: boolean;
};

export async function requireAuthenticatedUser(
  options: RequireAuthenticatedUserOptions = {}
) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("[auth-guard] userError:", userError?.message);
  console.log("[auth-guard] user:", user?.id, user?.email);

  if (userError || !user) {
    console.log("[auth-guard] redirect -> /login (no user)");
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .single();

  console.log("[auth-guard] profileError:", profileError?.message);
  console.log("[auth-guard] profile:", profile);

  if (profileError || !profile) {
    console.log("[auth-guard] redirect -> /login (no profile)");
    redirect("/login");
  }

  if (!profile.is_active) {
    console.log("[auth-guard] redirect -> /login (inactive)");
    redirect("/login");
  }

  if (!options.allowPasswordChangePage && profile.must_change_password) {
    console.log("[auth-guard] redirect -> /change-password");
    redirect("/change-password");
  }

  if (options.requireAdmin && profile.role !== "admin") {
    console.log("[auth-guard] redirect -> / (not admin)");
    redirect("/");
  }

  return {
    supabase,
    user,
    profile,
  };
}