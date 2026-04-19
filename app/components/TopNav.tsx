"use client";

import {useTranslations} from "next-intl";
import {Link, usePathname} from "@/i18n/navigation";
import {buttonStyles} from "@/lib/ui";

type TopNavProps = {
  isAdmin?: boolean;
};

export default function TopNav({isAdmin = false}: TopNavProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  const getNavClass = (href: string) =>
    pathname === href ? buttonStyles.navActive : buttonStyles.nav;

  return (
    <div className="hidden min-w-max items-center gap-3 md:flex">
      <Link
        href="/"
        className={getNavClass("/")}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        {t("upcomingMatches")}
      </Link>

      <Link
        href="/ranking"
        className={getNavClass("/ranking")}
        aria-current={pathname === "/ranking" ? "page" : undefined}
      >
        {t("ranking")}
      </Link>

      <Link
        href="/my-predictions"
        className={getNavClass("/my-predictions")}
        aria-current={pathname === "/my-predictions" ? "page" : undefined}
      >
        {t("myPredictions")}
      </Link>

      {isAdmin ? (
        <Link
          href="/admin"
          className={getNavClass("/admin")}
          aria-current={pathname === "/admin" ? "page" : undefined}
        >
          {t("admin")}
        </Link>
      ) : null}
    </div>
  );
}