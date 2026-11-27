import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const userId = auth.user.id;

    // Actualizar el estado de onboarding en la base de datos
    await db.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({ success: true, onboardingCompleted: true });
  } catch (error) {
    console.error("Error al completar el onboarding del usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al completar el onboarding." },
      { status: 500 }
    );
  }
}
