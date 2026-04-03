"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { buttonStyles } from "@/lib/ui";

type Mode = "login" | "register";

function isValidCorporateEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@puma.com");
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!cleanEmail || !password) {
        setError("Debes completar email y contraseña.");
        return;
      }

      if (!isValidCorporateEmail(cleanEmail)) {
        setError("Solo se permite acceso con email corporativo @puma.com.");
        return;
      }

      if (mode === "register" && !displayName.trim()) {
        setError("Debes indicar un nombre visible.");
        return;
      }

      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      const supabase = getSupabaseBrowserClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setError(`No se pudo iniciar sesión: ${error.message}`);
          return;
        }

        router.replace("/");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (error) {
        setError(`No se pudo crear la cuenta: ${error.message}`);
        return;
      }

      if (data.session) {
        setMessage("Cuenta creada correctamente. Accediendo...");
        router.replace("/");
        router.refresh();
        return;
      }

      setMessage(
        "Cuenta creada correctamente. Ya puedes iniciar sesión con tu email y contraseña."
      );
      setMode("login");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
        <section className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Acceso
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Accede con tu email corporativo y una contraseña. Ya no dependemos
            del magic link.
          </p>

          <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage(null);
                setError(null);
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setMessage(null);
                setError(null);
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {mode === "register" && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre visible
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Albert"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          )}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.email@puma.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className={`${buttonStyles.primary} mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading
              ? mode === "login"
                ? "Accediendo..."
                : "Creando cuenta..."
              : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
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