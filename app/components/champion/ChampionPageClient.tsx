"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { saveChampionPredictionAction } from "@/lib/champion/actions";
import { formatChampionDeadline } from "@/lib/champion/utils";
import CountryFlag from "@/components/CountryFlag";

type Team = {
  id: string;
  name: string;
  flag_code: string;
  is_puma_team?: boolean | null;
};

type Prediction = {
  id: string;
  user_id: string;
  predicted_team_id: string;
  created_at: string;
  updated_at: string;
} | null;

type Props = {
  teams: Team[];
  prediction: Prediction;
  deadline: string | null;
  isOpen: boolean;
};

export default function ChampionPageClient({
  teams,
  prediction,
  deadline,
  isOpen,
}: Props) {
  const t = useTranslations("champion");
  const locale = useLocale();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    prediction?.predicted_team_id ?? null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  const currentTeam = useMemo(
    () =>
      teams.find((team) => team.id === prediction?.predicted_team_id) ?? null,
    [teams, prediction]
  );

  const hasChanged = selectedTeamId !== prediction?.predicted_team_id;

  const handleSave = () => {
    if (!selectedTeamId || !isOpen) return;

    setMessage(null);

    startTransition(async () => {
      const result = await saveChampionPredictionAction(selectedTeamId);
      setMessage(result.message);
    });
  };

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] bg-white p-6 shadow-lg ring-1 ring-slate-200 md:p-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-400 md:text-xs">
            {t("eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            {t("title")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            {t("description")}
          </p>

          <p className="mt-3 text-sm font-medium text-slate-700">
            {t("deadlineLabel")}: {formatChampionDeadline(deadline, locale)}
          </p>

          {!isOpen && (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {t("closed")}
            </p>
          )}

          {currentTeam && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
              <CountryFlag
                code={currentTeam.flag_code}
                teamName={currentTeam.name}
                alt={t("flagAlt", { team: currentTeam.name })}
              />
              {t("currentChampion", { team: currentTeam.name })}
            </div>
          )}
        </div>
      </header>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {t("selectTitle")}
          </h2>

          {selectedTeam && (
            <div className="text-sm text-slate-600">
              {t("currentSelectionLabel")}{" "}
              <span className="font-semibold text-slate-900">
                {selectedTeam.name}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const isSelected = selectedTeamId === team.id;

            return (
              <button
                key={team.id}
                type="button"
                disabled={!isOpen}
                onClick={() => setSelectedTeamId(team.id)}
                className={[
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  isSelected
                    ? "border-orange-400 bg-orange-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300",
                  !isOpen ? "cursor-not-allowed opacity-70" : "",
                ].join(" ")}
              >
                <CountryFlag
                  code={team.flag_code}
                  teamName={team.name}
                  alt={t("flagAlt", { team: team.name })}
                />
                <span className="font-semibold text-slate-900">{team.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isOpen || !selectedTeamId || !hasChanged || isPending}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? t("saving")
              : prediction
                ? t("updateButton")
                : t("saveButton")}
          </button>

          {message && (
            <p className="text-sm font-medium text-slate-700">{message}</p>
          )}
        </div>
      </div>
    </section>
  );
}