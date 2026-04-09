export type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Próximos partidos", href: "/" },
  { label: "Ranking", href: "/ranking" },
  { label: "Mis predicciones", href: "/my-predictions" },
  { label: "Admin", href: "/admin", adminOnly: true },
];