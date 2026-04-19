"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { buttonStyles } from "@/lib/ui";

type TopNavProps = {
  isAdmin?: boolean;
};

export default function TopNav({ isAdmin = false }: TopNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");

  const homeHref = `/${locale}`;
  const rankingHref = `/${locale}/ranking`;
  const myPredictionsHref = `/${locale}/my-predictions`;
  const adminHref = `/${locale}/admin`;

  const getNavClass = (href: string) =>
    pathname === href ? buttonStyles.navActive : buttonStyles.nav;

  return (
    <div className="hidden min-w-max items-center gap-3 md:flex">
      <Link
        href={homeHref}
        className={getNavClass(homeHref)}
        aria-current={pathname === homeHref ? "page" : undefined}
      >
        {t("upcomingMatches")}
      </Link>

      <Link
        href={rankingHref}
        className={getNavClass(rankingHref)}
        aria-current={pathname === rankingHref ? "page" : undefined}
      >
        {t("ranking")}
      </Link>

      <Link
        href={myPredictionsHref}
        className={getNavClass(myPredictionsHref)}
        aria-current={pathname === myPredictionsHref ? "page" : undefined}
      >
        {t("myPredictions")}
      </Link>

      {isAdmin ? (
        <Link
          href={adminHref}
          className={getNavClass(adminHref)}
          aria-current={pathname === adminHref ? "page" : undefined}
        >
          {t("admin")}
        </Link>
      ) : null}
    </div>
  );
}