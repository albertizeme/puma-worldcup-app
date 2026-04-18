"use client";

import { useFormStatus } from "react-dom";

export default function SaveChampionButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Guardar campeón oficial"}
    </button>
  );
}