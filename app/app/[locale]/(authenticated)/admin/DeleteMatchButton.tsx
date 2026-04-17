"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
};

export default function DeleteMatchButton({ label }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      onClick={(e) => {
        if (pending) return;

        const ok = window.confirm(`¿Seguro que quieres eliminar ${label}?`);
        if (!ok) {
          e.preventDefault();
        }
      }}
      disabled={pending}
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
    >
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}