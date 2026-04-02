"use client";

import { useEffect, useState } from "react";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { buttonStyles } from "@/lib/ui";

type SimpleUser = {
  email?: string;
} | null;

export default function AuthButton() {
  const [user, setUser] = useState<SimpleUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("[AuthButton] getSession error:", error);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(data.session?.user ? { email: data.session.user.email } : null);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        setUser(session?.user ? { email: session.user.email } : null);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-400">
        Cargando...
      </span>
    );
  }

  if (!user) {
    return (
      <a href="/login" className={buttonStyles.primary}>
        Login
      </a>
    );
  }

  return (
    <button type="button" onClick={handleLogout} className={buttonStyles.secondary}>
      Salir
    </button>
  );
}