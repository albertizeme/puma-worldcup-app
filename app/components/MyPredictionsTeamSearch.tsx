"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Labels = {
  label: string;
  placeholder: string;
  clear: string;
  resultCount: string;
  searching: string;
};

const labelsByLocale: Record<string, Labels> = {
  en: {
    label: "Search team",
    placeholder: "Search team in your predictions",
    clear: "Clear team search",
    resultCount: "{count} predictions shown",
    searching: "Filtering...",
  },
  es: {
    label: "Buscar equipo",
    placeholder: "Buscar equipo en tus predicciones",
    clear: "Limpiar busqueda de equipo",
    resultCount: "{count} predicciones visibles",
    searching: "Filtrando...",
  },
  it: {
    label: "Cerca squadra",
    placeholder: "Cerca squadra nei tuoi pronostici",
    clear: "Cancella ricerca squadra",
    resultCount: "{count} pronostici visibili",
    searching: "Filtrando...",
  },
  pt: {
    label: "Pesquisar equipa",
    placeholder: "Pesquisar equipa nas tuas previsoes",
    clear: "Limpar pesquisa de equipa",
    resultCount: "{count} previsoes visiveis",
    searching: "A filtrar...",
  },
};

function getLabels(locale: string) {
  return labelsByLocale[locale] ?? labelsByLocale.en;
}

export default function MyPredictionsTeamSearch({
  initialValue,
  visibleCount,
}: {
  initialValue: string;
  visibleCount: number;
}) {
  const locale = useLocale();
  const labels = getLabels(locale);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmedValue = value.trim();

      if (trimmedValue) {
        params.set("team", trimmedValue);
      } else {
        params.delete("team");
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [pathname, router, searchParams, value]);

  return (
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
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={labels.placeholder}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label={labels.clear}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">
        {isPending
          ? labels.searching
          : labels.resultCount.replace("{count}", String(visibleCount))}
      </p>
    </section>
  );
}
