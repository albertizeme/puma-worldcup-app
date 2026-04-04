import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { generateTempPassword } from "@/lib/password";

async function requireAdminUser() {
  const supabase = await getSupabaseServerClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  const userId = claimsData.claims.sub;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      ok: false as const,
      status: 403,
      error: "No se pudo validar el perfil admin",
    };
  }

  if (profile.role !== "admin" || !profile.is_active) {
    return {
      ok: false as const,
      status: 403,
      error: "No tienes permisos de admin",
    };
  }

  return { ok: true as const, adminUser: profile };
}

export async function POST(req: Request) {
  try {
    const adminCheck = await requireAdminUser();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await req.json();
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Falta userId válido" },
        { status: 400 }
      );
    }

    if (userId === adminCheck.adminUser.id) {
      return NextResponse.json(
        { error: "No puedes resetear tu propia contraseña desde este flujo" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const temporaryPassword = generateTempPassword(14);

    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, is_active")
      .eq("id", userId)
      .maybeSingle();

    if (targetProfileError || !targetProfile) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!targetProfile.is_active) {
      return NextResponse.json(
        { error: "No se puede resetear la contraseña de un usuario inactivo" },
        { status: 400 }
      );
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: temporaryPassword }
    );

    if (authError) {
      return NextResponse.json(
        { error: authError.message || "No se pudo actualizar la contraseña" },
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
      .eq("id", userId);

    if (profileUpdateError) {
      return NextResponse.json(
        { error: "La contraseña se cambió pero falló la actualización del perfil" },
        { status: 500 }
      );
    }

    const { error: auditError } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert({
        admin_user_id: adminCheck.adminUser.id,
        target_user_id: userId,
        action: "password_reset",
        details: {
          mode: "temporary_password",
          email: targetProfile.email,
        },
      });

    if (auditError) {
      console.error("[reset-password][audit]", auditError);
    }

    return NextResponse.json({
      ok: true,
      userId,
      email: targetProfile.email,
      displayName: targetProfile.display_name,
      temporaryPassword,
    });
  } catch (error) {
    console.error("[reset-password][POST]", error);

    return NextResponse.json(
      { error: "Error interno al resetear la contraseña" },
      { status: 500 }
    );
  }
}