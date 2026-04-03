"use client";

import { useRouter } from "next/navigation";

export default function CloseMatchDetailButton() {
  const router = useRouter();

  function handleClose() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label="Cerrar detalle del partido"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
    >
      <span className="text-xl leading-none">×</span>
    </button>
  );
}