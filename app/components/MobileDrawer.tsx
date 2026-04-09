"use client";

import Link from "next/link";
import { NAV_ITEMS } from "@/lib/navigation";
import { usePathname } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
};

export default function MobileDrawer({ open, onClose, isAdmin }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* drawer */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[80%] max-w-[300px] bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <span className="font-bold">Menú</span>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-2">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
            (item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`block rounded-xl px-4 py-3 font-semibold ${
                    active
                      ? "bg-black text-white"
                      : "text-black hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
          )}
        </div>
      </div>
    </>
  );
}