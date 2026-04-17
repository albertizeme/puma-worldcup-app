import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import UpdatePasswordForm from "./UpdatePasswordForm";

export default async function UpdatePasswordPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("updatePassword");
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, must_change_password, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    redirect(`/${locale}/login`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#140c1f]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#140c1f] via-[#3b1d73] to-[#0f172a]" />
      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
        <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            {t("security")}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {t("title")}
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/70">
            {t("subtitle")}
          </p>

          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-50">
            {t("userLabel")} <span className="font-semibold">{profile.email}</span>
          </div>

          <div className="mt-6">
            <UpdatePasswordForm mustChangePassword={profile.must_change_password} />
          </div>

          <div className="mt-6">
            <Link
              href={`/${locale}`}
              className="text-sm font-medium text-white/65 underline-offset-4 transition hover:text-white hover:underline"
            >
              ← {t("back")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}