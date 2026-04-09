"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { buttonStyles } from "@/lib/ui";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
};

export default function MobileNavDrawer({
  open,
  onClose,
  isAdmin = false,
}: MobileNavDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const getNavClass = (href: string) =>
    pathname === href ? buttonStyles.navActive : buttonStyles.nav;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[82%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Menú principal"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
              Navigation
            </p>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Menú
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label="Cerrar menú"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-3">
            <Link href="/" className={getNavClass("/")} onClick={onClose}>
              Próximos partidos
            </Link>

            <Link
              href="/ranking"
              className={getNavClass("/ranking")}
              onClick={onClose}
            >
              Ranking
            </Link>

            <Link
              href="/my-predictions"
              className={getNavClass("/my-predictions")}
              onClick={onClose}
            >
              Mis predicciones
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className={getNavClass("/admin")}
                onClick={onClose}
              >
                Admin
              </Link>
            ) : null}
          </div>
        </nav>
      </aside>
    </>
  );
}