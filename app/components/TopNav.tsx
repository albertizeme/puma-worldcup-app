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
    <div className="flex items-center gap-3">
      <Link href="/" className={getNavClass("/")}>
        Próximos partidos
      </Link>

      <Link href="/ranking" className={getNavClass("/ranking")}>
        Ranking
      </Link>

      <Link href="/my-predictions" className={getNavClass("/my-predictions")}>
        Mis predicciones
      </Link>

      {isAdmin && (
        <Link href="/admin" className={getNavClass("/admin")}>
          Admin
        </Link>
      )}
    </div>
  );
}