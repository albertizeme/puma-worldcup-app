import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isKnockout(stage: string) {
  return !stage.startsWith("Group ");
}

function generateScore(stage: string) {
  let home = randomBetween(0, 4);
  let away = randomBetween(0, 4);

  if (isKnockout(stage) && home === away) {
    if (Math.random() < 0.5) {
      home += 1;
    } else {
      away += 1;
    }
  }

  return { home, away };
}

async function listPendingMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select("id, stage, match_datetime, home_team, away_team, status")
    .order("match_datetime", { ascending: true });

  if (error) throw error;

  for (const match of data ?? []) {
    console.log(`${match.stage} | ${match.match_datetime} | ${match.home_team} vs ${match.away_team} | ${match.status}`);
  }
}

async function resolveByMatchNumber(matchNumber: number) {
  const token = `M${matchNumber}`;
  const { data, error } = await supabase
    .from("matches")
    .select("id, stage, home_team, away_team")
    .ilike("stage", `%${token}%`)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`No se encontró el partido ${token}`);

  const score = generateScore(data.stage);

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      home_score: score.home,
      away_score: score.away,
      status: "finished",
    })
    .eq("id", data.id);

  if (updateError) throw updateError;

  console.log(`✅ ${data.stage}: ${data.home_team} ${score.home}-${score.away} ${data.away_team}`);
}

async function resolveByDate(date: string) {
  const from = `${date}T00:00:00+02:00`;
  const to = `${date}T23:59:59+02:00`;

  const { data, error } = await supabase
    .from("matches")
    .select("id, stage, home_team, away_team")
    .gte("match_datetime", from)
    .lte("match_datetime", to)
    .neq("status", "finished")
    .order("match_datetime", { ascending: true });

  if (error) throw error;
  if (!data?.length) {
    console.log("No hay partidos pendientes para esa fecha.");
    return;
  }

  for (const match of data) {
    const score = generateScore(match.stage);

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: score.home,
        away_score: score.away,
        status: "finished",
      })
      .eq("id", match.id);

    if (updateError) throw updateError;

    console.log(`✅ ${match.stage}: ${match.home_team} ${score.home}-${score.away} ${match.away_team}`);
  }
}

async function resetResultsByDate(date: string) {
  const from = `${date}T00:00:00+02:00`;
  const to = `${date}T23:59:59+02:00`;

  const { error } = await supabase
    .from("matches")
    .update({
      home_score: null,
      away_score: null,
      status: "upcoming",
    })
    .gte("match_datetime", from)
    .lte("match_datetime", to);

  if (error) throw error;
  console.log(`✅ Resultados reseteados para ${date}`);
}

async function main() {
  const mode = process.argv[2];

  if (!mode || mode === "list") {
    await listPendingMatches();
    return;
  }

  if (mode === "match") {
    const number = Number(process.argv[3]);
    if (!number) throw new Error("Usa: npm run simulate:results:match -- 73");
    await resolveByMatchNumber(number);
    return;
  }

  if (mode === "date") {
    const date = process.argv[3];
    if (!date) throw new Error("Usa: npm run simulate:results:date -- 2026-04-10");
    await resolveByDate(date);
    return;
  }

  if (mode === "reset-date") {
    const date = process.argv[3];
    if (!date) throw new Error("Usa: npm run simulate:results:reset-date -- 2026-04-10");
    await resetResultsByDate(date);
    return;
  }

  throw new Error("Modo no soportado. Usa: list | match <n> | date <YYYY-MM-DD> | reset-date <YYYY-MM-DD>");
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
