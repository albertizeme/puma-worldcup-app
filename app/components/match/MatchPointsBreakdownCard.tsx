"use client";

import { useTranslations } from "next-intl";
import { BreakdownItem } from "@/lib/match-detail";

type Props = {
  breakdown: BreakdownItem[];
  totalPoints: number;
};

export default function MatchPointsBreakdownCard({
  breakdown,
  totalPoints,
}: Props) {
  const t = useTranslations("matchDetail");

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">
        {t("breakdown.title")}
      </h2>

      <div className="mt-4 space-y-3">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
              item.highlight
                ? "border border-orange-200 bg-orange-50"
                : "bg-slate-50"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                item.highlight ? "text-orange-700" : "text-slate-700"
              }`}
            >
              {item.label}
            </span>
            <span
              className={`text-sm font-bold ${
                item.highlight ? "text-orange-700" : "text-slate-900"
              }`}
            >
              {item.points > 0 ? `+${item.points}` : item.points}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-base font-semibold text-slate-900">
            {t("breakdown.total")}
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {t("breakdown.totalPoints", { points: totalPoints })}
          </span>
        </div>
      </div>
    </section>
  );
}