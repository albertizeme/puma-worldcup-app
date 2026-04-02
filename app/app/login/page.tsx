"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { buttonStyles } from "@/lib/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (loading) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
        },
      });

      if (error) {
        setError(`No se pudo enviar el magic link: ${error.message}`);
        return;
      }

      setMessage("Te hemos enviado un enlace de acceso por email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
        <section className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Login
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Accede para guardar tus predicciones
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Introduce tu email corporativo y te enviaremos un enlace de acceso.
          </p>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email @puma.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || !email}
            className={`${buttonStyles.primary} mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading ? "Enviando enlace..." : "Enviar magic link"}
          </button>

          {message && (
            <p className="mt-4 text-sm font-medium text-green-600">{message}</p>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}
        </section>
      </div>
    </main>
  );
}