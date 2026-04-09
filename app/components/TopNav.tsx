"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonStyles } from "@/lib/ui";

type TopNavProps = {
  isAdmin?: boolean;
};

export default function TopNav({ isAdmin = false }: TopNavProps) {
  const pathname = usePathname();

  const getNavClass = (href: string) =>
    pathname === href ? buttonStyles.navActive : buttonStyles.nav;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {isAdmin ? (
        <Link href="/admin" className={getNavClass("/admin")}>
          Admin
        </Link>
      ) : null}

      <Link href="/ranking" className={getNavClass("/ranking")}>
        Ranking
      </Link>

      <Link href="/my-predictions" className={getNavClass("/my-predictions")}>
        Mis predicciones
      </Link>
    </div>
  );
}