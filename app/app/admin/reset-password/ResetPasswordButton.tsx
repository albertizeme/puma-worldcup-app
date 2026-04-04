"use client";

import { useState } from "react";

type Props = {
  userId: string;
  userLabel: string;
};

export default function ResetPasswordButton({ userId, userLabel }: Props) {
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    const confirmed = window.confirm(
      `¿Seguro que quieres generar una nueva contraseña temporal para ${userLabel}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setTemporaryPassword(null);
    setMessage(null);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudo resetear la contraseña");
      }

      setTemporaryPassword(result.temporaryPassword);
      setMessage("Contraseña temporal generada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error inesperado al resetear"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleReset}
        disabled={loading}
        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Generando..." : "Reset password"}
      </button>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          {message}
        </div>
      )}

      {temporaryPassword && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs font-semibold text-amber-900">
            Password temporal
          </div>

          <div className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-900">
            {temporaryPassword}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              Copiar
            </button>

            {copied && (
              <span className="text-[11px] text-amber-800">
                Copiada al portapapeles
              </span>
            )}
          </div>

          <p className="mt-2 text-[11px] text-amber-900">
            El usuario deberá cambiarla en el siguiente login.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}