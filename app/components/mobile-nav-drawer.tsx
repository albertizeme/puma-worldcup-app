"use client";

import Link from "next/link";
import { useEffect } from "react";

type NavItem = {
  label: string;
  href: string;
};

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
};

export default function MobileNavDrawer({
  open,
  onClose,
  items,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[82%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Menú de navegación móvil"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <span className="text-lg font-extrabold text-neutral-900">Menú</span>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 transition hover:bg-neutral-100"
            aria-label="Cerrar menú"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block rounded-2xl px-4 py-3 text-base font-semibold text-neutral-900 transition hover:bg-neutral-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-neutral-200 px-4 py-4">
          <div className="space-y-2">
            <Link
              href="/app/profile"
              onClick={onClose}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
            >
              Mi cuenta
            </Link>

            <Link
              href="/logout"
              onClick={onClose}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Cerrar sesión
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}