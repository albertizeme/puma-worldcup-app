"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ChangePasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("changePassword");
  const supabase = getSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace(`/${locale}/login`);
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router, supabase, locale]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(t("errors.sessionValidationFailed"));
        setLoading(false);
        return;
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      });

      if (passwordError) {
        setError(passwordError.message);
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setMessage(t("success"));
      setLoading(false);

      setTimeout(() => {
        router.replace(`/${locale}`);
      }, 1000);
    } catch (err) {
      console.error("[change-password]", err);
      setError(t("errors.unexpected"));
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#140c1f]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#140c1f] via-[#3b1d73] to-[#0f172a]" />
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
          <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <p className="text-sm text-white/75">{t("checkingSession")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#140c1f]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#140c1f] via-[#3b1d73] to-[#0f172a]" />
      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-8 sm:py-10">
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-white/85"
              >
                {t("newPasswordLabel")}
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-violet-300/60 focus:bg-white/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={t("newPasswordPlaceholder")}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-white/85"
              >
                {t("confirmPasswordLabel")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-violet-300/60 focus:bg-white/15"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={t("confirmPasswordPlaceholder")}
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-400/20 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? t("submitLoading") : t("submit")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}