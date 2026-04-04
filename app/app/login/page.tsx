// app/login/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { buttonStyles } from "@/lib/ui";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
        return;
      }

      setCheckingSession(false);
    }

    checkExistingSession();
  }, [router, supabase]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setError("Credenciales no válidas.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#140c1f]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#140c1f] via-[#3b1d73] to-[#0f172a]" />
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
          <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="animate-pulse">
              <div className="h-6 w-32 rounded bg-white/20" />
              <div className="mt-3 h-4 w-48 rounded bg-white/10" />
              <div className="mt-8 h-11 rounded-xl bg-white/10" />
              <div className="mt-4 h-11 rounded-xl bg-white/10" />
              <div className="mt-6 h-11 rounded-xl bg-white/20" />
            </div>
            <p className="mt-6 text-sm text-white/70">Cargando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#140c1f]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#140c1f] via-[#3b1d73] to-[#0f172a]" />
      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-8 sm:py-10">
        <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
          <div className="overflow-hidden rounded-[1.25rem] bg-[#1b1330]/80">
            <div
              className="relative h-48 w-full overflow-hidden sm:h-56"
              style={{
                backgroundImage: "url('/images/login-puma-campaign.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <img
  src="/images/puma-logo-white.png"
  alt="PUMA"
  className="absolute top-4 left-4 h-6 w-auto opacity-90"
/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#140c1f]/95 via-[#140c1f]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                  PUMA Employees
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Accede a la plataforma
                </h1>
                <p className="mt-2 max-w-sm text-sm text-white/75">
                  Accede a la experiencia interna para empleados, participa y
                  sigue la competición.
                </p>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-white/85"
                  >
                    Email corporativo
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-violet-300/60 focus:bg-white/15"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="nombre@empresa.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-white/85"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-violet-300/60 focus:bg-white/15"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Introduce tu contraseña"
                    required
                  />
                </div>

                {error ? (
                  <p className="rounded-xl border border-red-400/20 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className={`${buttonStyles.primary} w-full justify-center rounded-xl border-0 bg-violet-600 text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/65">
                Si has olvidado tu contraseña, contacta con IT para que te
                asignemos una temporal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}