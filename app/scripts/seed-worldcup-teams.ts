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

type TeamSeed = {
  name: string;
  flag_code: string;
  is_puma_team: boolean;
};

async function main() {
  const dataPath = path.resolve(process.cwd(), "data/worldcup-2026-teams.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const teams = JSON.parse(raw) as TeamSeed[];

  const rows = teams.map((team) => ({
    name: team.name,
    is_puma_team: team.is_puma_team,
    sponsor_brand: team.is_puma_team ? "PUMA" : null,
    sponsor_campaign_image: null,
    sponsor_kit_image: null,
    sponsor_card_text: null,
    sponsor_card_title: null,
  }));

  const { error } = await supabase.from("teams").upsert(rows, { onConflict: "name" });

  if (error) throw error;

  console.log(`✅ Equipos cargados: ${rows.length}`);
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
