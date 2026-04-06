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

const FIRST_NAMES = [
  "Alex", "Marta", "David", "Laura", "Sergio", "Claudia", "Javier", "Paula",
  "Daniel", "Lucía", "Carlos", "Ana", "Raúl", "Elena", "Iván", "Marina",
  "Víctor", "Nuria", "Adrián", "Cristina", "Joan", "Marc", "Aina", "Oriol"
];

const LAST_NAMES = [
  "García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Ruiz",
  "Fernández", "Díaz", "Moreno", "Torres", "Romero", "Navarro", "Vidal"
];

function buildDisplayName(index: number) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];
  return `${first} ${last} FAKE ${String(index + 1).padStart(3, "0")}`;
}

function buildEmail(index: number) {
  return `fake_ranking_${String(index + 1).padStart(4, "0")}@test.local`;
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

  const profileRow = {
    id: authUser.id,
    email,
    display_name: displayName,
    role: "user",
    must_change_password: false,
    is_active: true,
  };

  const publicUserRow = {
    id: authUser.id,
    email,
    display_name: displayName,
    is_admin: false,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profileRow, { onConflict: "id" });

  if (profileError) {
    throw profileError;
  }

  const { error: usersError } = await supabase
    .from("users")
    .upsert(publicUserRow, { onConflict: "id" });

  if (usersError) {
    throw usersError;
  }

  return {
    id: authUser.id,
    email,
    display_name: displayName,
  };
}

async function main() {
  console.log(`🚀 Creando ${TOTAL_USERS} usuarios fake en Auth + profiles + users`);

  const createdUsers: Array<{
    id: string;
    email: string;
    display_name: string;
  }> = [];

  for (let i = 0; i < TOTAL_USERS; i++) {
    try {
      const user = await createFakeUser(i);
      createdUsers.push(user);

      if ((i + 1) % 25 === 0) {
        console.log(`✅ ${i + 1}/${TOTAL_USERS} usuarios creados`);
      }
    } catch (error) {
      console.error(`❌ Error en usuario ${i + 1}:`, error);
    }
  }

  console.log(`\n🎯 Total creados correctamente: ${createdUsers.length}`);
  console.log("Ejemplo primeros usuarios:");
  console.log(createdUsers.slice(0, 5));
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});