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

// España peninsular durante Mundial 2026: CEST / UTC+2
const MADRID_OFFSET = "+02:00";

type MatchSeed = {
  match_number: number;
  stage: string;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  source_match_date: string; // YYYY-MM-DD en fecha española
  source_kickoff_time: string; // HH:mm en hora española
  group_round?: number;
};

function isPlaceholderTeam(name: string | null | undefined) {
  if (!name) return true;

  const value = name.trim();

  if (/^[12][A-L]$/i.test(value)) return true;
  if (/^3[A-L]+$/i.test(value)) return true;
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
      return stage;
  }
}

function validateMatch(match: MatchSeed) {
  if (!match.match_number) {
    throw new Error("Hay un partido sin match_number");
  }

  if (!match.source_match_date) {
    throw new Error(`Falta source_match_date en partido ${match.match_number}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(match.source_match_date)) {
    throw new Error(
      `source_match_date inválido en partido ${match.match_number}: ${match.source_match_date}`
    );
  }

  if (!match.source_kickoff_time) {
    throw new Error(`Falta source_kickoff_time en partido ${match.match_number}`);
  }

  if (!/^\d{2}:\d{2}$/.test(match.source_kickoff_time)) {
    throw new Error(
      `source_kickoff_time inválido en partido ${match.match_number}: ${match.source_kickoff_time}`
    );
  }

  if (!match.home_team || !match.away_team) {
    throw new Error(`Faltan equipos en partido ${match.match_number}`);
  }
}

async function main() {
  const dataPath = path.resolve(
    process.cwd(),
    "data/worldcup-2026-matches-official.json"
  );

  const raw = fs.readFileSync(dataPath, "utf-8");
  const matches = JSON.parse(raw) as MatchSeed[];

  if (!Array.isArray(matches)) {
    throw new Error("El JSON debe ser un array de partidos");
  }

  if (matches.length !== 104) {
    throw new Error(`El JSON debería tener 104 partidos, pero tiene ${matches.length}`);
  }

  const duplicatedMatchNumbers = matches
    .map((m) => m.match_number)
    .filter((number, index, arr) => arr.indexOf(number) !== index);

  if (duplicatedMatchNumbers.length > 0) {
    throw new Error(
      `Hay match_number duplicados: ${[...new Set(duplicatedMatchNumbers)].join(", ")}`
    );
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("name, is_puma_team");

  if (teamsError) throw teamsError;

  const pumaTeams = new Set(
    (teams ?? []).filter((t) => t.is_puma_team).map((t) => t.name)
  );

  const rows = matches
    .sort((a, b) => a.match_number - b.match_number)
    .map((match) => {
      validateMatch(match);

      const iso = `${match.source_match_date}T${match.source_kickoff_time}:00${MADRID_OFFSET}`;

      const isPumaMatch =
        pumaTeams.has(match.home_team) || pumaTeams.has(match.away_team);

      const hasRealTeams =
        !isPlaceholderTeam(match.home_team) &&
        !isPlaceholderTeam(match.away_team);

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
    `📅 Primer partido: ${rows[0].match_number} - ${rows[0].match_datetime}`
  );
  console.log(
    `🏆 Final: ${rows[rows.length - 1].match_number} - ${
      rows[rows.length - 1].match_datetime
    }`
  );
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});