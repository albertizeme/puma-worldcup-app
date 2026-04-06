import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";


const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TOTAL_USERS = parseInt(process.argv[2] || "500", 10);
const MAX_RESOLVED_MATCHES = parseInt(process.argv[3] || "40", 10);

const FIRST_NAMES = [
  "Alex", "Marta", "David", "Laura", "Sergio", "Claudia", "Javier", "Paula",
  "Daniel", "Lucía", "Carlos", "Ana", "Raúl", "Elena", "Iván", "Marina",
  "Víctor", "Nuria", "Adrián", "Cristina", "Joan", "Marc", "Aina", "Oriol"
];

const LAST_NAMES = [
  "García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Ruiz",
  "Fernández", "Díaz", "Moreno", "Torres", "Romero", "Navarro", "Vidal"
];

type MatchRow = {
  id: string;
  home_score: number | null;
  away_score: number | null;
};

function buildDisplayName(index: number) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];
  return `${first} ${last} FAKE ${String(index + 1).padStart(3, "0")}`;
}

function buildEmail(index: number) {
  return `fake_ranking_${String(index + 1).padStart(4, "0")}@test.local`;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getUserTier(index: number, totalUsers: number) {
  const percentile = index / totalUsers;

  if (percentile < 0.08) return "top";
  if (percentile < 0.30) return "good";
  if (percentile < 0.80) return "mid";
  return "low";
}

function generatePredictionForMatch(
  match: MatchRow,
  tier: "top" | "good" | "mid" | "low"
) {
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;

  const isHomeWin = home > away;
  const isAwayWin = away > home;
  const isDraw = home === away;

  const exactProbability =
    tier === "top" ? 0.28 :
    tier === "good" ? 0.16 :
    tier === "mid" ? 0.08 :
    0.03;

  const tendencyProbability =
    tier === "top" ? 0.72 :
    tier === "good" ? 0.56 :
    tier === "mid" ? 0.42 :
    0.22;

  const roll = Math.random();

  // 1) exacta
  if (roll < exactProbability) {
    return {
      home_score_pred: home,
      away_score_pred: away,
    };
  }

  // 2) acierta tendencia, pero no exacto
  if (roll < tendencyProbability) {
    if (isDraw) {
      const drawValue = clamp(home + randomBetween(-1, 1), 0, 6);
      const adjusted = drawValue === home ? clamp(drawValue + 1, 0, 6) : drawValue;
      return {
        home_score_pred: adjusted,
        away_score_pred: adjusted,
      };
    }

    if (isHomeWin) {
      let predHome = clamp(home + randomBetween(-1, 1), 0, 6);
      let predAway = clamp(away + randomBetween(-1, 1), 0, 6);

      if (predHome <= predAway) {
        predHome = clamp(predAway + 1, 0, 6);
      }

      if (predHome === home && predAway === away) {
        predHome = clamp(predHome + 1, 0, 6);
      }

      return {
        home_score_pred: predHome,
        away_score_pred: predAway,
      };
    }

    let predHome = clamp(home + randomBetween(-1, 1), 0, 6);
    let predAway = clamp(away + randomBetween(-1, 1), 0, 6);

    if (predAway <= predHome) {
      predAway = clamp(predHome + 1, 0, 6);
    }

    if (predHome === home && predAway === away) {
      predAway = clamp(predAway + 1, 0, 6);
    }

    return {
      home_score_pred: predHome,
      away_score_pred: predAway,
    };
  }

  // 3) falla
  if (isDraw) {
    const predHome = clamp(home + randomBetween(0, 2), 0, 6);
    const predAway = predHome === 0 ? 1 : predHome - 1;
    return {
      home_score_pred: predHome,
      away_score_pred: predAway,
    };
  }

  if (isHomeWin) {
    const predHome = clamp(home - randomBetween(0, 2), 0, 6);
    const predAway = clamp(predHome + randomBetween(0, 2), 0, 6);
    return {
      home_score_pred: predHome,
      away_score_pred: predAway,
    };
  }

  const predAway = clamp(away - randomBetween(0, 2), 0, 6);
  const predHome = clamp(predAway + randomBetween(0, 2), 0, 6);
  return {
    home_score_pred: predHome,
    away_score_pred: predAway,
  };
}

async function createFakeUser(index: number) {
  const email = buildEmail(index);
  const displayName = buildDisplayName(index);
  const password = "FakeRanking123!";

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      seed_fake: true,
      seed_type: "ranking",
    },
  });

  if (error) {
    throw error;
  }

  const authUser = data.user;

  if (!authUser) {
    throw new Error(`No se pudo crear auth user para ${email}`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: authUser.id,
      email,
      display_name: displayName,
      role: "user",
      must_change_password: false,
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw profileError;
  }

  const { error: usersError } = await supabase.from("users").upsert(
    {
      id: authUser.id,
      email,
      display_name: displayName,
      is_admin: false,
    },
    { onConflict: "id" }
  );

  if (usersError) {
    throw usersError;
  }

  return {
    id: authUser.id,
    email,
    display_name: displayName,
  };
}

async function getResolvedMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select("id, home_score, away_score")
    .not("home_score", "is", null)
    .not("away_score", "is", null)
    .limit(MAX_RESOLVED_MATCHES);

  if (error) {
    throw error;
  }

  return (data ?? []) as MatchRow[];
}

async function insertPredictionsForUser(
  userId: string,
  matches: MatchRow[],
  tier: "top" | "good" | "mid" | "low",
  userIndex: number
) {
  const rows = matches.map((match, matchIndex) => {
    let prediction = generatePredictionForMatch(match, tier);

    // Fuerza pequeños empates entre grupos de usuarios
    // haciendo que cada ciertos usuarios tengan patrones parecidos
    if (userIndex % 25 === 0 && matchIndex % 5 === 0) {
      prediction = {
        home_score_pred: match.home_score ?? 0,
        away_score_pred: match.away_score ?? 0,
      };
    }

    if (userIndex % 40 === 0 && matchIndex % 7 === 0) {
      prediction = {
        home_score_pred: clamp((match.home_score ?? 0) + 1, 0, 6),
        away_score_pred: match.away_score ?? 0,
      };
    }

    return {
      user_id: userId,
      match_id: match.id,
      home_score_pred: prediction.home_score_pred,
      away_score_pred: prediction.away_score_pred,
    };
  });

  const { error } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });

  if (error) {
    throw error;
  }
}

async function main() {
  console.log(`🚀 Creando ${TOTAL_USERS} usuarios fake y sus predicciones`);

  const matches = await getResolvedMatches();

  if (!matches.length) {
    throw new Error(
      "No hay partidos resueltos en matches. Necesitas partidos con home_score y away_score."
    );
  }

  console.log(`⚽ Partidos resueltos encontrados: ${matches.length}`);

  const createdUsers: Array<{ id: string; email: string; display_name: string }> = [];

  for (let i = 0; i < TOTAL_USERS; i++) {
    try {
      const user = await createFakeUser(i);
      createdUsers.push(user);

      const tier = getUserTier(i, TOTAL_USERS);
      await insertPredictionsForUser(user.id, matches, tier, i);

      if ((i + 1) % 25 === 0) {
        console.log(`✅ ${i + 1}/${TOTAL_USERS} usuarios procesados`);
      }
    } catch (error) {
      console.error(`❌ Error en usuario ${i + 1}:`, error);
    }
  }

  console.log(`\n🎯 Total usuarios creados: ${createdUsers.length}`);
  console.log(`🧪 Predicciones generadas: ${createdUsers.length * matches.length}`);
  console.log("✅ Seed completado");
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});