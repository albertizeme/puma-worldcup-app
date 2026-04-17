"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Props = {
  mustChangePassword: boolean;
};

export default function UpdatePasswordForm({ mustChangePassword }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("updatePassword");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (!password || !confirmPassword) {
      setError(t("errors.missingFields"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error: authError } = await supabase.auth.updateUser({
        password,
      });

      if (authError) {
        throw new Error(authError.message || t("errors.updatePasswordFailed"));
      }

      const response = await fetch("/api/account/complete-password-change", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("errors.updateProfileFailed"));
      }

      setSuccess(t("success"));

      setTimeout(() => {
        router.push(`/${locale}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : t("errors.unexpected")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mustChangePassword && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
          {t("mustChangeNotice")}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/85">
          {t("newPasswordLabel")}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-violet-300/60 focus:bg-white/15"
          placeholder={t("newPasswordPlaceholder")}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/85">
          {t("confirmPasswordLabel")}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-violet-300/60 focus:bg-white/15"
          placeholder={t("confirmPasswordPlaceholder")}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? t("submitLoading") : t("submit")}
      </button>

      {success && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/15 p-3 text-sm text-emerald-100">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/15 p-3 text-sm text-red-100">
          {error}
        </div>
      )}
    </form>
  );
}