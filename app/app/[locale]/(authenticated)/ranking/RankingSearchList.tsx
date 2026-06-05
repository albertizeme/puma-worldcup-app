"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export type RankingSearchListRow = {
  userId: string;
  displayName: string;
  position: number;
  totalPoints: number;
  exactHits: number;
  tendencyHits: number;
  championBonusPoints: number;
  isCurrentUser: boolean;
  isPodium: boolean;
  competitiveHint: string | null;
  movementLabel: string | null;
  movementPointsLabel: string | null;
  movementClass: string;
};

type RankingSearchListLabels = {
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  emptyRanking: string;
  noSearchResults: string;
  resultCount: string;
  you: string;
  top3: string;
  champion: string;
  exactHitsLower: string;
  tendencyHitsLower: string;
  pointsLabel: string;
};

function getPositionBadgeClass(position: number) {
  if (position === 1) {
    return "bg-yellow-400 text-neutral-950 ring-2 ring-yellow-200";
  }
  if (position === 2) {
    return "bg-slate-300 text-neutral-950 ring-2 ring-slate-200";
  }
  if (position === 3) {
    return "bg-amber-500 text-white ring-2 ring-amber-200";
  }
  return "bg-neutral-100 text-neutral-700";
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function RankingSearchListItem({
  row,
  labels,
}: {
  row: RankingSearchListRow;
  labels: RankingSearchListLabels;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-4 sm:px-6 ${
        row.isCurrentUser ? "bg-violet-50" : row.isPodium ? "bg-neutral-50" : "bg-white"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm sm:h-11 sm:w-11 ${getPositionBadgeClass(
            row.position
          )}`}
        >
          #{row.position}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-neutral-900 sm:text-base">
              {row.displayName}
            </p>

            {row.isCurrentUser && (
              <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {labels.you}
              </span>
            )}

            {row.isPodium && !row.isCurrentUser && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                {labels.top3}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            {row.exactHits} {labels.exactHitsLower} · {row.tendencyHits}{" "}
            {labels.tendencyHitsLower}
            {row.championBonusPoints > 0 && (
              <span className="font-semibold text-amber-700"> · 🏆 {labels.champion}</span>
            )}
          </p>

          {row.competitiveHint && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700/85 sm:text-[11px]">
              {row.competitiveHint}
            </p>
          )}

          {row.movementLabel && (
            <div className="mt-1 flex flex-col gap-0.5">
              <p
                className={`text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${row.movementClass}`}
              >
                {row.movementLabel}
              </p>

              {row.movementPointsLabel && (
                <p className="text-[10px] font-medium text-neutral-500 sm:text-[11px]">
                  {row.movementPointsLabel}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xl font-black text-neutral-900 sm:text-2xl">{row.totalPoints}</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
          {labels.pointsLabel}
        </p>
      </div>
    </div>
  );
}

export default function RankingSearchList({
  rows,
  labels,
}: {
  rows: RankingSearchListRow[];
  labels: RankingSearchListLabels;
}) {
  const [search, setSearch] = useState("");
  const normalizedSearch = normalizeSearchValue(search);

  const filteredRows = useMemo(() => {
    if (!normalizedSearch) return rows;

    return rows.filter((row) =>
      normalizeSearchValue(row.displayName).includes(normalizedSearch)
    );
  }, [normalizedSearch, rows]);

  return (
    <details className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
      <summary className="cursor-pointer list-none border-b border-neutral-100 px-4 py-4 font-bold text-neutral-900 sm:px-6">
        <div className="font-bold text-neutral-900">{labels.title}</div>
        <p className="mt-1 text-sm font-normal text-neutral-600">{labels.description}</p>
      </summary>

      {rows.length === 0 ? (
        <div className="px-6 py-8 text-sm text-neutral-600">{labels.emptyRanking}</div>
      ) : (
        <>
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
              {labels.resultCount.replace("{count}", String(filteredRows.length))}
            </p>
          </div>

          {filteredRows.length === 0 ? (
            <div className="px-6 py-8 text-sm text-neutral-600">{labels.noSearchResults}</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredRows.map((row) => (
                <RankingSearchListItem key={row.userId} row={row} labels={labels} />
              ))}
            </div>
          )}
        </>
      )}
    </details>
  );
}
