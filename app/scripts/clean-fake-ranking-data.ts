import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("🧹 Buscando usuarios fake...");

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", "fake_ranking_%");

  if (error) throw error;

  if (!profiles?.length) {
    console.log("No se encontraron usuarios fake");
    return;
  }

  const ids = profiles.map((p) => p.id);

  console.log(`Encontrados ${ids.length} usuarios fake`);

  const { error: predictionsError } = await supabase
    .from("predictions")
    .delete()
    .in("user_id", ids);

  if (predictionsError) throw predictionsError;

  const { error: usersError } = await supabase
    .from("users")
    .delete()
    .in("id", ids);

  if (usersError) throw usersError;

  const { error: profilesError } = await supabase
    .from("profiles")
    .delete()
    .in("id", ids);

  if (profilesError) throw profilesError;

  for (const id of ids) {
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    if (authDeleteError) {
      console.error(`⚠️ Error borrando auth user ${id}:`, authDeleteError);
    }
  }

  console.log("✅ Limpieza completada");
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});