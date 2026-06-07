"use client";

import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Labels = {
  label: string;
  placeholder: string;
  clear: string;
  resultCount: string;
  noResults: string;
};

const labelsByLocale: Record<string, Labels> = {
  en: {
    label: "Search team",
    placeholder: "Search team in your predictions",
    clear: "Clear team search",
    resultCount: "{count} predictions shown",
    noResults: "No predictions match that team.",
  },
  es: {
    label: "Buscar equipo",
    placeholder: "Buscar equipo en tus predicciones",
    clear: "Limpiar busqueda de equipo",
    resultCount: "{count} predicciones visibles",
    noResults: "No hay predicciones para ese equipo.",
  },
  it: {
    label: "Cerca squadra",
    placeholder: "Cerca squadra nei tuoi pronostici",
    clear: "Cancella ricerca squadra",
    resultCount: "{count} pronostici visibili",
    noResults: "Nessun pronostico corrisponde a quella squadra.",
  },
  pt: {
    label: "Pesquisar equipa",
    placeholder: "Pesquisar equipa nas tuas previsoes",
    clear: "Limpar pesquisa de equipa",
    resultCount: "{count} previsoes visiveis",
    noResults: "Nao ha previsoes para essa equipa.",
  },
};

function getLocaleFromPathname(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] ?? "en";
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getLabels(locale: string) {
  return labelsByLocale[locale] ?? labelsByLocale.en;
}

function getPredictionSections() {
  const main = document.querySelector("main");
  if (!main) return [];

  return Array.from(main.querySelectorAll<HTMLDetailsElement>("details"));
}

function getPredictionCards(section: HTMLDetailsElement) {
  return Array.from(section.querySelectorAll<HTMLAnchorElement>('a[href*="/match/"]'));
}

export default function MyPredictionsTeamSearch() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);

  const locale = getLocaleFromPathname(pathname);
  const labels = getLabels(locale);

  useEffect(() => {
    if (!pathname.includes("/my-predictions")) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const mount = () => {
      const statsGrid = document.querySelector<HTMLElement>("main section.mb-6.grid");

      if (!statsGrid) {
        timeoutId = setTimeout(mount, 100);
        return;
      }

      if (cancelled) return;

      const sections = getPredictionSections();
      const predictionCount = sections.reduce(
        (count, section) => count + getPredictionCards(section).length,
        0
      );

      setTotalCount(predictionCount);
      setVisibleCount(predictionCount);

      if (predictionCount <= 1) return;

      const existingHost = document.querySelector<HTMLElement>(
        "[data-my-predictions-team-search-host]"
      );
      if (existingHost) {
        setPortalHost(existingHost);
        return;
      }

      const host = document.createElement("div");
      host.dataset.myPredictionsTeamSearchHost = "true";
      statsGrid.insertAdjacentElement("afterend", host);
      setPortalHost(host);
    };

    mount();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);

      getPredictionSections().forEach((section) => {
        section.hidden = false;
        getPredictionCards(section).forEach((card) => {
          card.hidden = false;
        });
      });

      const host = document.querySelector<HTMLElement>(
        "[data-my-predictions-team-search-host]"
      );
      host?.remove();
      setPortalHost(null);
      setSearch("");
      setTotalCount(0);
      setVisibleCount(0);
    };
  }, [pathname]);

  useEffect(() => {
    if (!portalHost) return;

    const normalizedSearch = normalizeSearchValue(search);
    const sections = getPredictionSections();
    let nextVisibleCount = 0;

    sections.forEach((section) => {
      const cards = getPredictionCards(section);
      let visibleCardsInSection = 0;

      cards.forEach((card) => {
        const cardText = normalizeSearchValue(card.textContent ?? "");
        const isVisible = !normalizedSearch || cardText.includes(normalizedSearch);

        card.hidden = !isVisible;
        if (isVisible) {
          visibleCardsInSection += 1;
          nextVisibleCount += 1;
        }
      });

      section.hidden = visibleCardsInSection === 0;
    });

    setVisibleCount(nextVisibleCount);
  }, [portalHost, search]);

  if (!portalHost || totalCount <= 1) return null;

  return createPortal(
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="sr-only" htmlFor="my-predictions-team-search">
        {labels.label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          id="my-predictions-team-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={labels.placeholder}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label={labels.clear}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">
        {labels.resultCount.replace("{count}", String(visibleCount))}
      </p>
      {search && visibleCount === 0 ? (
        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          {labels.noResults}
        </p>
      ) : null}
    </section>,
    portalHost
  );
}
