"use client";

type Props = {
  label: string;
};

export default function DeleteMatchButton({ label }: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const ok = window.confirm(`¿Seguro que quieres eliminar ${label}?`);
        if (!ok) {
          e.preventDefault();
        }
      }}
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
    >
      Eliminar
    </button>
  );
}