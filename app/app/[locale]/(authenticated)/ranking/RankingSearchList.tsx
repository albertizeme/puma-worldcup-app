"use client";

import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type RankingSearchLabels = {
  searchLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  noSearchResults: string;
  resultCount: string;
};

const labelsByLocale: Record<string, RankingSearchLabels> = {
  en: {
    searchLabel: "Search user",
    searchPlaceholder: "Search user by name",
    clearSearch: "Clear search",
    noSearchResults: "No users match your search.",
    resultCount: "{count} users shown",
  },
  es: {
    searchLabel: "Buscar usuario",
    searchPlaceholder: "Buscar usuario por nombre",
    clearSearch: "Limpiar búsqueda",
    noSearchResults: "No hay usuarios que coincidan con tu búsqueda.",
    resultCount: "{count} usuarios visibles",
  },
  it: {
    searchLabel: "Cerca utente",
    searchPlaceholder: "Cerca utente per nome",
    clearSearch: "Cancella ricerca",
    noSearchResults: "Nessun utente corrisponde alla ricerca.",
    resultCount: "{count} utenti visualizzati",
  },
  pt: {
    searchLabel: "Pesquisar utilizador",
    searchPlaceholder: "Pesquisar utilizador por nome",
    clearSearch: "Limpar pesquisa",
    noSearchResults: "Nenhum utilizador corresponde à pesquisa.",
    resultCount: "{count} utilizadores visíveis",
  },
};

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getLocaleFromPathname(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] ?? "en";
}

function getFullRankingDetails() {
  const details = Array.from(document.querySelectorAll("main details"));
  return details.at(-1) ?? null;
}

function getRankingRows(details: HTMLDetailsElement) {
  const list = details.querySelector(".divide-y.divide-neutral-100");
  if (!list) return [];

  return Array.from(list.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
}

export default function RankingSearchList() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  const labels = useMemo(() => {
    const locale = getLocaleFromPathname(pathname);
    return labelsByLocale[locale] ?? labelsByLocale.en;
  }, [pathname]);

  useEffect(() => {
    if (!pathname.includes("/ranking")) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const mount = () => {
      const details = getFullRankingDetails();
      const summary = details?.querySelector("summary");

      if (!details || !summary) {
        timeoutId = setTimeout(mount, 100);
        return;
      }

      if (cancelled) return;

      const existingHost = details.querySelector<HTMLElement>("[data-ranking-search-host]");
      if (existingHost) {
        setPortalHost(existingHost);
        return;
      }

      const host = document.createElement("div");
      host.dataset.rankingSearchHost = "true";
      details.insertBefore(host, summary.nextSibling);
      setPortalHost(host);
    };

    mount();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      const details = getFullRankingDetails();
      if (details) {
        getRankingRows(details).forEach((row) => {
          row.hidden = false;
        });
      }
      const host = document.querySelector<HTMLElement>("[data-ranking-search-host]");
      host?.remove();
      setPortalHost(null);
      setSearch("");
      setVisibleCount(0);
    };
  }, [pathname]);

  useEffect(() => {
    if (!portalHost) return;

    const details = portalHost.closest("details");
    if (!(details instanceof HTMLDetailsElement)) return;

    const normalizedSearch = normalizeSearchValue(search);
    const rows = getRankingRows(details);
    let nextVisibleCount = 0;

    rows.forEach((row) => {
      const name = row.querySelector("p.truncate")?.textContent ?? row.textContent ?? "";
      const isVisible = !normalizedSearch || normalizeSearchValue(name).includes(normalizedSearch);
      row.hidden = !isVisible;
      if (isVisible) nextVisibleCount += 1;
    });

    setVisibleCount(nextVisibleCount);
  }, [portalHost, search]);

  if (!portalHost) return null;

  return createPortal(
    <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-4 sm:px-6">
      <label className="sr-only" htmlFor="ranking-user-search">
        {labels.searchLabel}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        />
        <input
          id="ranking-user-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={labels.searchPlaceholder}
          className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-11 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label={labels.clearSearch}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs font-medium text-neutral-500">
        {labels.resultCount.replace("{count}", String(visibleCount))}
      </p>
      {visibleCount === 0 && (
        <p className="mt-3 rounded-2xl bg-white px-4 py-4 text-sm text-neutral-600">
          {labels.noSearchResults}
        </p>
      )}
    </div>,
    portalHost
  );
}
