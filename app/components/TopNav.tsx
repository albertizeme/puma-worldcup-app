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
    <div className="hidden min-w-max items-center gap-3 md:flex">
      <Link
        href="/"
        className={getNavClass("/")}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        Próximos partidos
      </Link>

      <Link
        href="/ranking"
        className={getNavClass("/ranking")}
        aria-current={pathname === "/ranking" ? "page" : undefined}
      >
        Ranking
      </Link>

      <Link
        href="/my-predictions"
        className={getNavClass("/my-predictions")}
        aria-current={pathname === "/my-predictions" ? "page" : undefined}
      >
        Mis predicciones
      </Link>

      {isAdmin ? (
        <Link
          href="/admin"
          className={getNavClass("/admin")}
          aria-current={pathname === "/admin" ? "page" : undefined}
        >
          Admin
        </Link>
      ) : null}
    </div>
  );
}