"use client";

import { useMemo, useState, useTransition } from "react";
import { saveChampionPredictionAction } from "@/lib/champion/actions";
import { formatChampionDeadline } from "@/lib/champion/utils";
import CountryFlag from "@/components/CountryFlag";

type Team = {
  id: string;
  name: string;
  flag_code: string | null;
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
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-2">
          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
            Pronóstico especial
          </span>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Pronóstico de campeón
          </h1>

          <p className="text-sm text-slate-600 sm:text-base">
            Elige la selección que crees que ganará el Mundial. Este pronóstico
            solo puede hacerse hasta la fecha límite.
          </p>

          <p className="text-sm font-medium text-slate-700">
            Cierre: {formatChampionDeadline(deadline)}
          </p>

          {!isOpen && (
            <p className="text-sm font-semibold text-red-600">
              El plazo está cerrado.
            </p>
          )}

          {currentTeam && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
              <CountryFlag
                code={currentTeam.flag_code}
                teamName={currentTeam.name}
                alt={`Bandera de ${currentTeam.name}`}
              />
              Tu campeón actual: {currentTeam.name}
            </div>
          )}
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            Selecciona tu campeón
          </h2>

          {selectedTeam && (
            <div className="text-sm text-slate-600">
              Selección actual:{" "}
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
                  alt={`Bandera de ${team.name}`}
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
              ? "Guardando..."
              : prediction
                ? "Actualizar campeón"
                : "Guardar campeón"}
          </button>

          {message && (
            <p className="text-sm font-medium text-slate-700">{message}</p>
          )}
        </div>
      </div>
    </section>
  );
}