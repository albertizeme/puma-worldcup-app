// app/api/admin/reset-password/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function generateTempPassword(length = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const supabaseAdmin = getSupabaseAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: myProfile, error: myProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (myProfileError || !myProfile || myProfile.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo admins." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const targetUserId = body.userId as string | undefined;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Falta userId del usuario a resetear" },
        { status: 400 }
      );
    }

    const tempPassword = generateTempPassword(12);

    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      {
        password: tempPassword,
      }
    );

    if (resetError) {
      return NextResponse.json(
        { error: resetError.message || "Error reseteando password" },
        { status: 500 }
      );
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        must_change_password: true,
        last_password_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);

    if (profileUpdateError) {
      return NextResponse.json(
        {
          error:
            profileUpdateError.message ||
            "Password cambiada, pero error actualizando profile",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tempPassword,
    });
  } catch (error) {
    console.error("[reset-password]", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}