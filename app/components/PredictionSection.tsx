import PredictionForm from "@/components/PredictionForm";

type PredictionRow = {
  id?: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  points?: number | null;
  exact_hit?: boolean | null;
};

type PredictionSectionProps = {
  matchId: string;
  matchDatetime: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  userId: string | null;
  prediction: PredictionRow | null;
};

function isValidDate(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function hasMatchStarted(matchDatetime: string | null) {
  if (!isValidDate(matchDatetime)) return false;
  return new Date(matchDatetime as string).getTime() <= Date.now();
}

function isMatchFinished(homeScore: number | null, awayScore: number | null) {
  return homeScore !== null && awayScore !== null;
}

function getPredictionOutcomeLabel(prediction: PredictionRow | null) {
  if (!prediction) return null;

  const points = prediction.points ?? 0;

  if (points <= 0) {
    return {
      label: "Sin puntos",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }

  const pointsLabel = points === 1 ? "punto" : "puntos";
  const hasPumaBonus = prediction.exact_hit ? points > 3 : points > 1;

  if (prediction.exact_hit) {
    return {
      label: hasPumaBonus
        ? `+${points} ${pointsLabel} · Exacta + bonus PUMA`
        : `+${points} ${pointsLabel} · Exacta`,
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }

  return {
    label: hasPumaBonus
      ? `+${points} ${pointsLabel} · Tendencia + bonus PUMA`
      : `+${points} ${pointsLabel} · Tendencia`,
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  };
}

function TeamScoreRow({
  homeTeam,
  awayTeam,
  homeValue,
  awayValue,
}: {
  homeTeam: string;
  awayTeam: string;
  homeValue: number | null;
  awayValue: number | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:gap-4 sm:px-5">
      <div className="min-w-0 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
          Local
        </p>
        <p className="mt-2 text-sm font-semibold leading-tight text-slate-800 sm:text-base">
          {homeTeam}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-extrabold text-slate-900 sm:h-14 sm:w-14">
          {homeValue ?? "-"}
        </div>

        <span className="text-lg font-bold text-slate-400 sm:text-xl">-</span>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-extrabold text-slate-900 sm:h-14 sm:w-14">
          {awayValue ?? "-"}
        </div>
      </div>

      <div className="min-w-0 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
          Visitante
        </p>
        <p className="mt-2 text-sm font-semibold leading-tight text-slate-800 sm:text-base">
          {awayTeam}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-sm md:p-6">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>

      {description ? (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

function LoggedOutState() {
  return (
    <SectionCard
      eyebrow="Tu predicción"
      title="Inicia sesión para participar"
      description="Accede con tu cuenta para guardar tu predicción antes de que empiece el partido."
    />
  );
}

function OpenPredictionState({
  matchId,
  userId,
  matchDatetime,
  prediction,
}: {
  matchId: string;
  userId: string;
  matchDatetime: string | null;
  prediction: PredictionRow | null;
}) {
  return (
    <SectionCard
      eyebrow="Tu predicción"
      title={prediction ? "Edita tu predicción" : "¿Cómo quedará el partido?"}
      description="Puedes modificar tu marcador hasta el inicio del partido."
    >
      <PredictionForm
        matchId={matchId}
        userId={userId}
        matchDatetime={matchDatetime}
        initialHomeScore={prediction?.home_score_pred ?? null}
        initialAwayScore={prediction?.away_score_pred ?? null}
      />
    </SectionCard>
  );
}

function ClosedPendingState({
  prediction,
  homeTeam,
  awayTeam,
}: {
  prediction: PredictionRow | null;
  homeTeam: string;
  awayTeam: string;
}) {
  return (
    <SectionCard
      eyebrow="Predicción cerrada"
      title={
        prediction
          ? "Ya no puedes modificar tu predicción"
          : "No hiciste tu predicción a tiempo"
      }
      description="Las predicciones se cerraron al comenzar el partido."
    >
      {prediction ? (
        <div className="space-y-4">
          <TeamScoreRow
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeValue={prediction.home_score_pred}
            awayValue={prediction.away_score_pred}
          />
        
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tu predicción ha quedado guardada y se evaluará cuando el partido finalice.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm">
          Esta vez te has quedado fuera. Cuando se publique el resultado final, no sumarás puntos en este partido.
        </div>
      )}
    </SectionCard>
  );
}

function FinishedState({
  prediction,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}: {
  prediction: PredictionRow | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
}) {
  const outcome = getPredictionOutcomeLabel(prediction);

  const points = prediction?.points ?? 0;
  const hasPumaBonus = prediction
    ? prediction.exact_hit
      ? points > 3
      : points > 1
    : false;

  const basePoints = prediction
    ? prediction.exact_hit
      ? hasPumaBonus
        ? 3
        : points
      : hasPumaBonus
      ? 1
      : points
    : 0;

  return (
    <SectionCard
      eyebrow="Partido finalizado"
      title="Resultado y puntuación"
      description="Aquí puedes comparar el marcador real con tu predicción."
    >
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Resultado real</p>
          <TeamScoreRow
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeValue={homeScore}
            awayValue={awayScore}
          />
        </div>

        {prediction ? (
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-700">Tu predicción</p>

              {outcome ? (
                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${outcome.badgeClass}`}
                >
                  {outcome.label}
                </span>
              ) : null}
            </div>

            <TeamScoreRow
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeValue={prediction.home_score_pred}
              awayValue={prediction.away_score_pred}
            />
            {prediction && hasPumaBonus ? (
              <div className="mt-3 flex justify-end">
                <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700">
                  {basePoints} + 1 bonus PUMA
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              No registraste predicción para este partido
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Como no llegaste a enviar marcador antes del inicio, aquí no sumas puntos.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default function PredictionSection({
  matchId,
  matchDatetime,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  userId,
  prediction,
}: PredictionSectionProps) {
  if (!userId) {
    return <LoggedOutState />;
  }

  const started = hasMatchStarted(matchDatetime);
  const finished = isMatchFinished(homeScore, awayScore);

  if (finished) {
    return (
      <FinishedState
        prediction={prediction}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={homeScore}
        awayScore={awayScore}
      />
    );
  }

  if (started) {
    return (
      <ClosedPendingState
        prediction={prediction}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
    );
  }

  return (
    <OpenPredictionState
      matchId={matchId}
      userId={userId}
      matchDatetime={matchDatetime}
      prediction={prediction}
    />
  );
}