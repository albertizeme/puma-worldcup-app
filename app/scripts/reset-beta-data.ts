import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_EMAIL = "albert.fernandez@puma.com";
const HARD_RESET_NON_ADMIN_USERS = false;

async function main() {
  console.log("🧹 Limpiando datos beta...");

  const { error: predictionsError } = await supabase.from("predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (predictionsError) throw predictionsError;

  const { error: matchesError } = await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (matchesError) throw matchesError;

  const { error: teamsError } = await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (teamsError) throw teamsError;

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .neq("email", ADMIN_EMAIL);

  if (profilesError) throw profilesError;

  if (!profiles?.length) {
    console.log("✅ Limpieza completada. Solo quedaba el admin o no había usuarios.");
    return;
  }

  const fakeIds = profiles
    .filter((p) => p.email?.startsWith("fake_") || p.email?.endsWith("@test.local"))
    .map((p) => p.id);

  const idsToDelete = HARD_RESET_NON_ADMIN_USERS
    ? profiles.map((p) => p.id)
    : fakeIds;

  if (!idsToDelete.length) {
    console.log("✅ Limpieza completada. No había usuarios fake para borrar.");
    return;
  }

  const { error: usersDeleteError } = await supabase.from("users").delete().in("id", idsToDelete);
  if (usersDeleteError) throw usersDeleteError;

  const { error: profilesDeleteError } = await supabase.from("profiles").delete().in("id", idsToDelete);
  if (profilesDeleteError) throw profilesDeleteError;

  for (const id of idsToDelete) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error(`⚠️ No se pudo borrar auth user ${id}:`, error.message);
    }
  }

  console.log(`✅ Limpieza completada. Usuarios borrados: ${idsToDelete.length}`);
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
