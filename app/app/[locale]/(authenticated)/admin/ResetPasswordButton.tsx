"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  userLabel: string;
};

export default function ResetPasswordButton({ userId, userLabel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, startTransition] = useTransition();
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

      const raw = await response.text();

      let result: {
        error?: string;
        temporaryPassword?: string;
      } | null = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.error || `Respuesta no válida del servidor (${response.status}).`
        );
      }

      if (!result?.temporaryPassword) {
        throw new Error("El servidor no devolvió una contraseña temporal.");
      }

      setTemporaryPassword(result.temporaryPassword);
      setMessage("Contraseña temporal generada correctamente. Copia la contraseña y refresca la tabla.");
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
      setError("No se pudo copiar la contraseña al portapapeles.");
    }
  }

  function handleRefreshTable() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleCopyAndRefresh() {
    await handleCopy();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleReset}
        disabled={loading || refreshing}
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={refreshing}
              className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copiar
            </button>

            <button
              type="button"
              onClick={handleCopyAndRefresh}
              disabled={refreshing}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refrescando..." : "Copiar y refrescar"}
            </button>

            <button
              type="button"
              onClick={handleRefreshTable}
              disabled={refreshing}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refrescar tabla
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