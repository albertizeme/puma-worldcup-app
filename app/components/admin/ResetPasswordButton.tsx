"use client";

import { useState } from "react";

type Props = {
  userId: string;
};

export default function ResetPasswordButton({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResetPassword() {
    const confirmed = window.confirm(
      "¿Seguro que quieres generar una nueva contraseña temporal para este usuario?"
    );

    if (!confirmed) return;

    setLoading(true);
    setTemporaryPassword(null);
    setCopied(false);
    setMessage(null);
    setError(null);

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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Gestión de contraseña
      </h3>

      <p className="mt-1 text-sm text-slate-600">
        Genera una contraseña temporal para este usuario.
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={loading}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generando..." : "Generar contraseña temporal"}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {temporaryPassword && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">
            Nueva contraseña temporal
          </div>

          <div className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-900 break-all">
            {temporaryPassword}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Copiar
            </button>

            {copied && (
              <span className="text-xs text-amber-800">Copiada al portapapeles</span>
            )}
          </div>

          <p className="mt-3 text-xs text-amber-900">
            Muéstrala o comunícala al usuario por un canal seguro. Evita dejarla
            visible más tiempo del necesario.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}