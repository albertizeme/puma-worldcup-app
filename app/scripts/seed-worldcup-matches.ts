import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Madrid is UTC+2 on 10-18 April 2026
const MADRID_OFFSET = "+02:00";
const START_DATE = "2026-04-10";

type MatchSeed = {
  match_number: number;
  stage: string;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  source_kickoff_time: string;
  group_round?: number;
};

function addDaysToDateString(baseDate: string, daysToAdd: number) {
  const [year, month, day] = baseDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  return date.toISOString().slice(0, 10);
}

function isPlaceholderTeam(name: string | null | undefined) {
  if (!name) return true;

  const value = name.trim();

  if (/^[12][A-L]$/i.test(value)) return true;
  if (/^Winner\s+\d+$/i.test(value)) return true;
  if (/^Loser\s+\d+$/i.test(value)) return true;
  if (/^Bronze/i.test(value)) return true;

  return false;
}

function normalizeStage(stage: string) {
  switch (stage) {
    case "Round of 32":
      return "Dieciseisavos de final";
    case "Round of 16":
      return "Octavos de final";
    case "Quarter-finals":
      return "Cuartos de final";
    case "Semi-finals":
      return "Semifinales";
    case "Third-place play-off":
      return "Tercer y cuarto puesto";
    case "Final":
      return "Final";
    default:
      return stage; // Group A, Group B, etc.
  }
}

function getDayOffset(match: MatchSeed): number {
  if (match.stage.startsWith("Group ")) {
    if (match.group_round === 1) return 0;
    if (match.group_round === 2) return 1;
    if (match.group_round === 3) return 2;
    throw new Error(`group_round inválido en partido ${match.match_number}`);
  }

  switch (match.stage) {
    case "Round of 32":
      return 3;
    case "Round of 16":
      return 4;
    case "Quarter-finals":
      return 5;
    case "Semi-finals":
      return 6;
    case "Third-place play-off":
      return 7;
    case "Final":
      return 8;
    default:
      throw new Error(`stage no soportado: ${match.stage}`);
  }
}

async function main() {
  const dataPath = path.resolve(
    process.cwd(),
    "data/worldcup-2026-matches-official.json"
  );
  const raw = fs.readFileSync(dataPath, "utf-8");
  const matches = JSON.parse(raw) as MatchSeed[];

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("name, is_puma_team");

  if (teamsError) throw teamsError;

  const pumaTeams = new Set(
    (teams ?? []).filter((t) => t.is_puma_team).map((t) => t.name)
  );

  const rows = matches.map((match) => {
    const fakeDate = addDaysToDateString(START_DATE, getDayOffset(match));
    const iso = `${fakeDate}T${match.source_kickoff_time}:00${MADRID_OFFSET}`;

    const isPumaMatch =
      pumaTeams.has(match.home_team) || pumaTeams.has(match.away_team);

    const hasRealTeams =
      !isPlaceholderTeam(match.home_team) && !isPlaceholderTeam(match.away_team);

    return {
      stage: normalizeStage(match.stage),
      match_number: match.match_number,
      match_datetime: iso,
      home_team: match.home_team,
      away_team: match.away_team,
      is_puma_match: isPumaMatch,
      match_time: match.source_kickoff_time,
      home_flag: match.home_flag,
      away_flag: match.away_flag,
      home_score: null,
      away_score: null,
      status: "upcoming",
      is_prediction_open: hasRealTeams,
      is_visible: hasRealTeams,
    };
  });

  const { error } = await supabase.from("matches").insert(rows);
  if (error) throw error;

  console.log(`✅ Partidos cargados: ${rows.length}`);
  console.log(
    `📅 Mundial fake: ${START_DATE} → ${addDaysToDateString(START_DATE, 8)}`
  );
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});