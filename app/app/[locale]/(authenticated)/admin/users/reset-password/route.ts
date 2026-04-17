import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { generateTempPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json();
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Falta userId válido" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const temporaryPassword = generateTempPassword(14);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: temporaryPassword,
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message || "No se pudo actualizar la contraseña" },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: adminUser.id,
      target_user_id: userId,
      action: "password_reset",
      details: {
        mode: "temporary_password",
      },
    });

    return NextResponse.json({
      ok: true,
      userId: data.user.id,
      temporaryPassword,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno inesperado";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "No tienes permisos de admin" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Error interno al resetear la contraseña" },
      { status: 500 }
    );
  }
}