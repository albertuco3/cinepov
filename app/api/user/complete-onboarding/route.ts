import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const userId = session.user.id;

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
