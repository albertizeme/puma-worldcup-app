"use client";

type Props = {
  label?: string;
};

export default function GenerateSnapshotButton({
  label = "Generar snapshot",
}: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const ok = window.confirm(
          "¿Seguro que quieres generar este snapshot del ranking? Si ya existe para esa clave, se actualizará."
        );

        if (!ok) {
          e.preventDefault();
        }
      }}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      {label}
    </button>
  );
}