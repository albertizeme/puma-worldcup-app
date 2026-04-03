"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      console.log("[auth/callback] URL:", window.location.href);
      console.log("[auth/callback] code:", code);
      console.log("[auth/callback] token_hash:", tokenHash);
      console.log("[auth/callback] type:", type);

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log("[auth/callback] exchangeCodeForSession", { data, error });

        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        router.replace("/");
        return;
      }

      if (tokenHash && type === "email") {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email",
        });

        console.log("[auth/callback] verifyOtp", { data, error });

        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        router.replace("/");
        return;
      }

      const hash = window.location.hash;
      console.log("[auth/callback] hash:", hash);

      setTimeout(async () => {
        const { data, error } = await supabase.auth.getSession();
        console.log("[auth/callback] getSession fallback", { data, error });

        if (error || !data.session) {
          router.replace("/login?error=no_session");
          return;
        }

        router.replace("/");
      }, 800);
    };

    run();
  }, [router, searchParams]);

  return <p className="p-6">Validando acceso...</p>;
}