import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        last_seen_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", user.id);

    if (error) {
      console.error("[track-seen]", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[track-seen][POST]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}