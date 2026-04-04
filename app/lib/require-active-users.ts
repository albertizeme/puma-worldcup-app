import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function requireActiveUser(options?: { allowPasswordChangePage?: boolean }) {
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
    .select("id, email, role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    redirect("/login");
  }

  if (profile.must_change_password && !options?.allowPasswordChangePage) {
    redirect("/update-password");
  }

  return { user, profile };
}