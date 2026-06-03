import fs from "node:fs";
import path from "node:path";

const FIFA_URL =
  "https://api.fifa.com/api/v3/calendar/matches?language=es&count=500&idSeason=285023";

const inputPath = path.resolve(
  process.cwd(),
  "data/worldcup-2026-matches-official.json"
);

const outputPath = inputPath;

function toMadridDateTimeParts(utcDate: string) {
  const date = new Date(utcDate);

  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  return {
    source_match_date: `${get("year")}-${get("month")}-${get("day")}`,
    source_kickoff_time: `${get("hour")}:${get("minute")}`,
  };
}

async function main() {
  const currentMatches = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const response = await fetch(FIFA_URL);

  if (!response.ok) {
    throw new Error(`Error FIFA API: ${response.status} ${response.statusText}`);
  }

  const fifaPayload = await response.json();

  const fifaMatches = fifaPayload.Results ?? [];

  console.log(`Partidos recibidos desde FIFA: ${fifaMatches.length}`);

  const fifaByMatchNumber = new Map<number, any>(
    fifaMatches.map((match: any) => [Number(match.MatchNumber), match])
);

  const updatedMatches = currentMatches.map((match: any) => {
    const fifaMatch = fifaByMatchNumber.get(Number(match.match_number));

    if (!fifaMatch) {
      throw new Error(`No encuentro en FIFA el match_number ${match.match_number}`);
    }

    if (!fifaMatch.Date) {
      throw new Error(`FIFA no trae Date para match_number ${match.match_number}`);
    }

    const madrid = toMadridDateTimeParts(fifaMatch.Date);

    return {
      ...match,
      source_match_date: madrid.source_match_date,
      source_kickoff_time: madrid.source_kickoff_time,
    };
  });

  fs.writeFileSync(
    outputPath,
    JSON.stringify(updatedMatches, null, 2) + "\n",
    "utf-8"
  );

  console.log(`✅ JSON actualizado: ${outputPath}`);

  console.log("Primeros 5 partidos:");
  console.table(
    updatedMatches.slice(0, 5).map((m: any) => ({
      match_number: m.match_number,
      home_team: m.home_team,
      away_team: m.away_team,
      source_match_date: m.source_match_date,
      source_kickoff_time: m.source_kickoff_time,
    }))
  );
}

main().catch((error) => {
  console.error("💥 Error:", error);
  process.exit(1);
});