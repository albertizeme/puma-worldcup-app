import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { buttonStyles } from "@/lib/ui";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PredictionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: prediction, error } = await supabase
  .from("my_predictions_view")
  .select("*")
  .eq("prediction_id", id)
  .eq("user_id", user.id)
  .single();

  if (error || !prediction) {
    notFound();
  }

  const hasResult =
    prediction.home_score !== null && prediction.away_score !== null;

  let outcomeText = "Pendiente";
  if (hasResult) {
    if (prediction.points === 3) outcomeText = "Marcador exacto";
    else if (prediction.points === 1) outcomeText = "Acertaste el signo";
    else outcomeText = "Predicción fallada";
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalle de predicción</h1>
        <Link
          href="/my-predictions"
          className={buttonStyles.secondary}
        >
          Volver
        </Link>
      </div>

      <div className="space-y-5">

  {/* PARTIDO */}
  <section className="rounded-2xl border bg-white p-5 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500">Partido</p>

    <h2 className="mt-1 text-xl font-semibold text-slate-900">
      {prediction.home_team} vs {prediction.away_team}
    </h2>

    <p className="mt-2 text-sm text-slate-500">
      {new Date(prediction.match_datetime).toLocaleString("es-ES")}
      {prediction.stage ? ` · ${prediction.stage}` : ""}
    </p>
  </section>

  {/* RESULTADO PRINCIPAL */}
  <section className="rounded-2xl border bg-slate-50 p-6 text-center shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500">
      Resultado del partido
    </p>

    {hasResult ? (
      <div className="mt-2 text-4xl font-bold text-slate-900">
        {prediction.home_score} - {prediction.away_score}
      </div>
    ) : (
      <div className="mt-2 text-lg font-medium text-slate-500">
        Pendiente de jugar
      </div>
    )}
  </section>

  {/* COMPARACIÓN */}
  <section className="grid grid-cols-2 gap-4">

    {/* TU PREDICCIÓN */}
    <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
      <p className="text-xs uppercase text-slate-500">Tu predicción</p>
      <div className="mt-2 text-2xl font-bold text-slate-900">
        {prediction.home_score_pred} - {prediction.away_score_pred}
      </div>
    </div>

    {/* PUNTOS */}
    <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
      <p className="text-xs uppercase text-slate-500">Puntos</p>
      <div className="mt-2 text-2xl font-bold text-slate-900">
        {prediction.points ?? "-"}
      </div>
      <p className="mt-1 text-sm text-slate-500">{outcomeText}</p>
    </div>

  </section>
</div>
    </main>
  );
}