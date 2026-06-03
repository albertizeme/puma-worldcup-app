import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEMP_PASSWORD = "Puma2026!Temp";

const users = [
  { display_name: "Juan Viscarro", email: "juan@test.com", role: "user" },
  { display_name: "Rafa Gonzalez", email: "rafa@test.com", role: "user" },
  { display_name: "Albert Fernandez", email: "albert.fdez@gmail.com", role: "admin" },
];

async function main() {
  for (const user of users) {
    const { data: createdUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          display_name: user.display_name,
        },
      });

    if (createError && !createError.message.includes("already registered")) {
      console.error(`Error creating ${user.email}:`, createError.message);
      continue;
    }

    let userId = createdUser.user?.id;

    if (!userId) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(
        (u) => u.email?.toLowerCase() === user.email.toLowerCase()
      );
      userId = existingUser?.id;
    }

    if (!userId) {
      console.error(`Could not find user id for ${user.email}`);
      continue;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      must_change_password: true,
      is_active: true,
    });

    if (profileError) {
      console.error(`Error upserting profile ${user.email}:`, profileError);
      continue;
    }

    console.log(`✅ User ready: ${user.email}`);
  }
}

main();