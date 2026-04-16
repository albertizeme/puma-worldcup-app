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

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[auth-guard] Error loading profile:", profileError);
    throw new Error("No se pudo cargar el perfil del usuario autenticado.");
  }

  if (!profile) {
    throw new Error("El usuario autenticado no tiene perfil en public.profiles.");
  }

  if (!profile.is_active) {
    redirect("/login?error=inactive");
  }

  if (!options.allowPasswordChangePage && profile.must_change_password) {
    redirect("/change-password");
  }

  if (options.requireAdmin && profile.role !== "admin") {
    redirect("/");
  }

  return {
    supabase,
    user,
    profile,
  };
}