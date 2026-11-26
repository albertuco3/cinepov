import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";
import { getRequestLocale } from "@/lib/i18n/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para obtener recomendaciones personalizadas." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const data = await getRecommendations(session.user.id, limit, await getRequestLocale());

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al obtener recomendaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al calcular recomendaciones." },
      { status: 500 }
    );
  }
}
