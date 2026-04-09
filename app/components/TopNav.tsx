"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonStyles } from "@/lib/ui";

type TopNavProps = {
  isAdmin?: boolean;
};

export default function TopNav({ isAdmin = false }: TopNavProps) {
  const pathname = usePathname();
  const [pressedHref, setPressedHref] = useState<string | null>(null);

  const getNavClass = (href: string) => {
    const isCurrent = pathname === href;
    const isPressed = pressedHref === href;

    if (isCurrent || isPressed) {
      return `${buttonStyles.navActive} scale-95`;
    }

    return buttonStyles.nav;
  };

  const navPressHandlers = (href: string) => ({
    onMouseDown: () => setPressedHref(href),
    onMouseUp: () => setPressedHref(null),
    onMouseLeave: () => setPressedHref(null),
    onTouchStart: () => setPressedHref(href),
    onTouchEnd: () => setPressedHref(null),
    onTouchCancel: () => setPressedHref(null),
  });

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {isAdmin ? (
        <Link
          href="/admin"
          className={getNavClass("/admin")}
          {...navPressHandlers("/admin")}
        >
          Admin
        </Link>
      ) : null}

      <Link
        href="/ranking"
        className={getNavClass("/ranking")}
        {...navPressHandlers("/ranking")}
      >
        Ranking
      </Link>

      <Link
        href="/my-predictions"
        className={getNavClass("/my-predictions")}
        {...navPressHandlers("/my-predictions")}
      >
        Mis predicciones
      </Link>
    </div>
  );
}