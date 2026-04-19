"use client";

import {useEffect, useRef, useState} from "react";
import type {Session, AuthChangeEvent} from "@supabase/supabase-js";
import {useTranslations} from "next-intl";
import {Link, useRouter} from "@/i18n/navigation";
import {getSupabaseBrowserClient} from "@/lib/supabase-browser";
import {buttonStyles} from "@/lib/ui";

type SimpleUser = {
  email?: string;
} | null;

function getInitials(email: string) {
  const localPart = email.split("@")[0] || "";
  const parts = localPart
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .split(/[._-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  const clean = localPart.replace(/[^a-zA-Z0-9]/g, "");
  return clean.slice(0, 2).toUpperCase() || "U";
}

function truncateEmail(email: string, max = 28) {
  if (email.length <= max) return email;
  return `${email.slice(0, max - 3)}...`;
}

export default function UserMenu() {
  const [user, setUser] = useState<SimpleUser>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const t = useTranslations("navigation");

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    async function loadSession() {
      const {data, error} = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("[UserMenu] getSession error:", error);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(data.session?.user ? {email: data.session.user.email} : null);
      setLoading(false);
    }

    loadSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        setUser(session?.user ? {email: session.user.email} : null);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-400 shadow-sm">
        ...
      </div>
    );
  }

  if (!user?.email) {
    return (
      <Link href="/login" className={buttonStyles.nav}>
        {t("login")}
      </Link>
    );
  }

  const initials = getInitials(user.email);

  return (
    <div className="relative z-40" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("openUserMenu")}
        aria-expanded={open}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {initials}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[120] mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t("signedIn")}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {truncateEmail(user.email)}
            </p>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {t("logout")}
            </button>

            <button
              type="button"
              disabled
              className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-400"
            >
              {t("languageSoon")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}