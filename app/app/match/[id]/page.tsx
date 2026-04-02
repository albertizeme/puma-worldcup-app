// app/match/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import CountryFlag from "@/components/CountryFlag";
import PredictionSection from "@/components/PredictionSection";
import { Match } from "@/types/match";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type PredictionRow = {
  id: string;
  user_id: string;
  match_id: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  created_at: string | null;
};

type PredictionSectionRow = {
  id?: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  points?: number | null;
  exact_hit?: boolean | null;
};

type PredictionOutcome =
  | "exact"
  | "trend"
  | "miss"
  | "pending"
  | "no_prediction";

type MatchStatus = "scheduled" | "live" | "finished";

type BreakdownItem = {
  label: string;
  points: number;
};

function formatMatchDate(value: string | null | undefined) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "Fecha por confirmar";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function parseScore(value: string | number | null | undefined): number | null {
  if (value == null) return null;

  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "-") return null;

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeMatchStatus(match: Match): MatchStatus {
  const homeScore = parseScore(match.home_score);
  const awayScore = parseScore(match.away_score);

  if (homeScore !== null && awayScore !== null) {
    return "finished";
  }

  const kickoff = new Date(match.match_datetime ?? "");
  if (isNaN(kickoff.getTime())) {
    return "scheduled";
  }

  return kickoff.getTime() > Date.now() ? "scheduled" : "live";
}

function getOutcome(params: {
  matchStatus: MatchStatus;
  match: Match;
  prediction: PredictionRow | null;
}): PredictionOutcome {
  const { matchStatus, match, prediction } = params;

  if (!prediction) {
    return matchStatus === "finished" ? "no_prediction" : "pending";
  }

  if (matchStatus !== "finished") {
    return "pending";
  }

  const actualHome = parseScore(match.home_score);
  const actualAway = parseScore(match.away_score);
  const predictedHome = prediction.home_score_pred;
  const predictedAway = prediction.away_score_pred;

  if (
    actualHome == null ||
    actualAway == null ||
    predictedHome == null ||
    predictedAway == null
  ) {
    return "pending";
  }

  const isExact =
    actualHome === predictedHome && actualAway === predictedAway;

  if (isExact) return "exact";

  const actualDiff = actualHome - actualAway;
  const predictedDiff = predictedHome - predictedAway;

  const sameTrend =
    (actualDiff > 0 && predictedDiff > 0) ||
    (actualDiff < 0 && predictedDiff < 0) ||
    (actualDiff === 0 && predictedDiff === 0);

  return sameTrend ? "trend" : "miss";
}

function getPointsAndBreakdown(outcome: PredictionOutcome): {
  totalPoints: number;
  breakdown: BreakdownItem[];
} {
  switch (outcome) {
    case "exact":
      return {
        totalPoints: 3,
        breakdown: [
          { label: "Marcador exacto", points: 3 },
          { label: "Tendencia acertada", points: 0 },
        ],
      };
    case "trend":
      return {
        totalPoints: 1,
        breakdown: [{ label: "Tendencia acertada", points: 1 }],
      };
    case "miss":
      return {
        totalPoints: 0,
        breakdown: [{ label: "Sin puntuación", points: 0 }],
      };
    case "no_prediction":
      return {
        totalPoints: 0,
        breakdown: [{ label: "Sin predicción enviada", points: 0 }],
      };
    case "pending":
    default:
      return {
        totalPoints: 0,
        breakdown: [],
      };
  }
}

function getOutcomeContent(outcome: PredictionOutcome, points: number) {
  switch (outcome) {
    case "exact":
      return {
        badge: "Predicción exacta",
        title: "✅ Predicción exacta",
        subtitle: `Has ganado ${points} puntos`,
        description: "Acertaste el marcador final de este partido.",
        containerClass:
          "border-emerald-200 bg-emerald-50 text-emerald-900",
        badgeClass:
          "bg-emerald-100 text-emerald-800 border border-emerald-200",
      };
    case "trend":
      return {
        badge: "Tendencia acertada",
        title: "🟡 Has acertado el ganador",
        subtitle: `Has ganado ${points} punto${points === 1 ? "" : "s"}`,
        description:
          "No acertaste el marcador exacto, pero sí el resultado del partido.",
        containerClass:
          "border-amber-200 bg-amber-50 text-amber-900",
        badgeClass:
          "bg-amber-100 text-amber-800 border border-amber-200",
      };
    case "miss":
      return {
        badge: "Sin acierto",
        title: "❌ Predicción no acertada",
        subtitle: "Has ganado 0 puntos",
        description: "Tu predicción no coincide con el resultado final.",
        containerClass: "border-rose-200 bg-rose-50 text-rose-900",
        badgeClass:
          "bg-rose-100 text-rose-800 border border-rose-200",
      };
    case "no_prediction":
      return {
        badge: "Sin predicción",
        title: "⚪ No enviaste predicción",
        subtitle: "No has sumado puntos en este partido",
        description:
          "El partido ya finalizó y no había una predicción registrada.",
        containerClass: "border-slate-200 bg-slate-50 text-slate-900",
        badgeClass:
          "bg-slate-100 text-slate-700 border border-slate-200",
      };
    case "pending":
    default:
      return {
        badge: "Pendiente",
        title: "🕒 Partido pendiente",
        subtitle: "La puntuación se calculará al finalizar",
        description:
          "Si ya enviaste tu predicción, quedará bloqueada al empezar el partido.",
        containerClass: "border-sky-200 bg-sky-50 text-sky-900",
        badgeClass:
          "bg-sky-100 text-sky-800 border border-sky-200",
      };
  }
}

function getStatusLabel(status: MatchStatus) {
  switch (status) {
    case "finished":
      return "Finalizado";
    case "live":
      return "En juego";
    case "scheduled":
    default:
      return "Próximamente";
  }
}

function getPredictionBadge(outcome: PredictionOutcome) {
  switch (outcome) {
    case "exact":
      return {
        label: "Exacta",
        className:
          "bg-emerald-100 text-emerald-800 border border-emerald-200",
      };
    case "trend":
      return {
        label: "Tendencia",
        className:
          "bg-amber-100 text-amber-800 border border-amber-200",
      };
    case "miss":
      return {
        label: "Fallo",
        className: "bg-rose-100 text-rose-800 border border-rose-200",
      };
    case "no_prediction":
      return {
        label: "Sin predicción",
        className:
          "bg-slate-100 text-slate-700 border border-slate-200",
      };
    case "pending":
    default:
      return {
        label: "Pendiente",
        className: "bg-sky-100 text-sky-800 border border-sky-200",
      };
  }
}

function ScoreBox({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const displayValue =
    value == null || String(value).trim() === "" ? "-" : String(value);

  return (
    <div className="flex min-w-[72px] flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="mt-1 text-3xl font-extrabold text-slate-900">
        {displayValue}
      </span>
    </div>
  );
}

function ComparisonCard({
  title,
  badgeLabel,
  badgeClassName,
  homeTeam,
  awayTeam,
  homeFlag,
  awayFlag,
  homeScore,
  awayScore,
  isPrediction = false,
  emptyText,
}: {
  title: string;
  badgeLabel: string;
  badgeClassName: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string | null;
  awayFlag?: string | null;
  homeScore: string | number | null;
  awayScore: string | number | null;
  isPrediction?: boolean;
  emptyText?: string;
}) {
  const homeDisplay =
    homeScore == null || String(homeScore).trim() === ""
      ? null
      : String(homeScore);
  const awayDisplay =
    awayScore == null || String(awayScore).trim() === ""
      ? null
      : String(awayScore);

  const isEmpty = homeDisplay == null || awayDisplay == null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName}`}
        >
          {badgeLabel}
        </span>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-600">
          {emptyText ?? "Sin información disponible."}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <CountryFlag
                code={homeFlag}
                teamName={homeTeam}
                alt={`Bandera de ${homeTeam}`}
              />
              <span className="truncate text-sm font-medium text-slate-800 sm:text-base">
                {homeTeam}
              </span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900">
              {homeDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <CountryFlag
                code={awayFlag}
                teamName={awayTeam}
                alt={`Bandera de ${awayTeam}`}
              />
              <span className="truncate text-sm font-medium text-slate-800 sm:text-base">
                {awayTeam}
              </span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900">
              {awayDisplay}
            </span>
          </div>

          <div className="pt-2 text-xs text-slate-500">
            {isPrediction
              ? "Esta es la predicción registrada para este partido."
              : "Resultado oficial del partido."}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single<Match>();

  if (matchError || !match) {
    notFound();
  }

  let prediction: PredictionRow | null = null;

  if (user) {
    const { data: predictionData } = await supabase
      .from("predictions")
      .select(
        "id, user_id, match_id, home_score_pred, away_score_pred, created_at"
      )
      .eq("match_id", id)
      .eq("user_id", user.id)
      .maybeSingle<PredictionRow>();

    prediction = predictionData ?? null;
  }

  const matchStatus = normalizeMatchStatus(match);
  const outcome = getOutcome({
    matchStatus,
    match,
    prediction,
  });

  const { totalPoints, breakdown } = getPointsAndBreakdown(outcome);
  const outcomeContent = getOutcomeContent(outcome, totalPoints);
  const predictionBadge = getPredictionBadge(outcome);

  const predictionForSection: PredictionSectionRow | null = prediction
    ? {
        id: prediction.id,
        home_score_pred: prediction.home_score_pred,
        away_score_pred: prediction.away_score_pred,
        points: matchStatus === "finished" ? totalPoints : null,
        exact_hit: outcome === "exact",
      }
    : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          ← Volver
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
              {getStatusLabel(matchStatus)}
            </span>
            {match.stage ? <span>· {match.stage}</span> : null}
            <span>· {formatMatchDate(match.match_datetime)}</span>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="flex items-center gap-4">
              <CountryFlag
                code={match.home_flag}
                teamName={match.home_team}
                alt={`Bandera de ${match.home_team}`}
              />
              <div className="min-w-0">
                <div className="text-lg font-bold text-slate-900 sm:text-2xl">
                  {match.home_team}
                </div>
                <div className="text-sm text-slate-500">Local</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <ScoreBox label="Local" value={match.home_score} />
              <div className="text-xl font-bold text-slate-400">-</div>
              <ScoreBox label="Visitante" value={match.away_score} />
            </div>

            <div className="flex items-center justify-start gap-4 md:justify-end">
              <div className="min-w-0 text-left md:text-right">
                <div className="text-lg font-bold text-slate-900 sm:text-2xl">
                  {match.away_team}
                </div>
                <div className="text-sm text-slate-500">Visitante</div>
              </div>
              <CountryFlag
                code={match.away_flag}
                teamName={match.away_team}
                alt={`Bandera de ${match.away_team}`}
              />
            </div>
          </div>

          {match.stadium || match.city ? (
            <div className="mt-5 text-sm text-slate-500">
              {[match.stadium, match.city].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </div>
      </section>

      <section
        className={`rounded-3xl border px-5 py-5 shadow-sm sm:px-6 ${outcomeContent.containerClass}`}
      >
        <div className="mb-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${outcomeContent.badgeClass}`}
          >
            {outcomeContent.badge}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {outcomeContent.title}
          </h1>
          <p className="text-lg font-semibold">{outcomeContent.subtitle}</p>
          <p className="text-sm opacity-90">{outcomeContent.description}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ComparisonCard
          title="Resultado final"
          badgeLabel={
            matchStatus === "finished" ? "Oficial" : getStatusLabel(matchStatus)
          }
          badgeClassName="bg-slate-100 text-slate-700 border border-slate-200"
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          homeFlag={match.home_flag}
          awayFlag={match.away_flag}
          homeScore={match.home_score}
          awayScore={match.away_score}
          emptyText="El resultado oficial todavía no está disponible."
        />

        <ComparisonCard
          title="Tu predicción"
          badgeLabel={predictionBadge.label}
          badgeClassName={predictionBadge.className}
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          homeFlag={match.home_flag}
          awayFlag={match.away_flag}
          homeScore={prediction?.home_score_pred ?? null}
          awayScore={prediction?.away_score_pred ?? null}
          isPrediction
          emptyText={
            user
              ? "Todavía no has enviado una predicción para este partido."
              : "Inicia sesión para ver o guardar tu predicción."
          }
        />
      </section>

      {matchStatus === "finished" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Cómo se calculó</h2>

          <div className="mt-4 space-y-3">
            {breakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">
                  {item.label}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {item.points > 0 ? `+${item.points}` : item.points}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-base font-semibold text-slate-900">
                Total
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                {totalPoints} pts
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Estado</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Predicción registrada
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {prediction ? formatShortDate(prediction.created_at) : "—"}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado del partido
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {getStatusLabel(matchStatus)}
            </div>
          </div>
        </div>
      </section>

      <PredictionSection
        matchId={match.id}
        matchDatetime={match.match_datetime}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        homeScore={parseScore(match.home_score)}
        awayScore={parseScore(match.away_score)}
        userId={user?.id ?? null}
        prediction={predictionForSection}
      />
    </main>
  );
}