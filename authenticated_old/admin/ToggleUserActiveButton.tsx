import { toggleUserActiveAction } from "./actions";

type Props = {
  userId: string;
  isActive: boolean;
  userLabel: string;
  disabled?: boolean;
};

export default function ToggleUserActiveButton({
  userId,
  isActive,
  userLabel,
  disabled = false,
}: Props) {
  return (
    <form action={toggleUserActiveAction}>
      <input type="hidden" name="id" value={userId} />
      <input
        type="hidden"
        name="next_is_active"
        value={String(!isActive)}
      />

      <button
        type="submit"
        disabled={disabled}
        className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isActive
            ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
        title={
          disabled
            ? "No puedes cambiar el estado de tu propio usuario"
            : isActive
              ? `Desactivar ${userLabel}`
              : `Activar ${userLabel}`
        }
      >
        {isActive ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}