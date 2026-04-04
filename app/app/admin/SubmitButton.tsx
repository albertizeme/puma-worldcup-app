"use client";

import { useFormStatus } from "react-dom";

type Props = {
  idleText: string;
  pendingText: string;
  variant?: "primary" | "danger" | "secondary";
};

export default function SubmitButton({
  idleText,
  pendingText,
  variant = "primary",
}: Props) {
  const { pending } = useFormStatus();

  const className =
    variant === "danger"
      ? "rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
      : variant === "secondary"
      ? "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
      : "rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : idleText}
    </button>
  );
}