"use client";

import { useCallback, useState } from "react";
import TopNav from "@/components/TopNav";
import UserMenu from "@/components/UserMenu";
import MobileNavDrawer from "@/components/MobileNavDrawer";

type AppTopBarProps = {
  isAdmin?: boolean;
};

export default function AppTopBar({ isAdmin = false }: AppTopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      <div className="relative z-30 mb-5 flex items-center justify-between gap-3 pb-1">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleOpenMenu}
            className="relative z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-label="Abrir menú"
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
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>

          <div className="hidden min-w-0 flex-1 overflow-x-auto no-scrollbar md:block">
            <TopNav isAdmin={isAdmin} />
          </div>
        </div>

        <div className="relative z-20 shrink-0">
          <UserMenu />
        </div>
      </div>

      <MobileNavDrawer
        open={mobileMenuOpen}
        onClose={handleCloseMenu}
        isAdmin={isAdmin}
      />
    </>
  );
}