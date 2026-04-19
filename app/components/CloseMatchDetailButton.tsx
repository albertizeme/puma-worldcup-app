"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function CloseMatchDetailButton() {
  const router = useRouter();
  const t = useTranslations("common");
  const locale = useLocale();

  function handleClose() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(`/${locale}`);
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label={t("closeMatchDetail")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
    >
      <span className="text-xl leading-none">×</span>
    </button>
  );
}