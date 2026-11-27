import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { getRecommendations } from "@/lib/recommendations";
import { getRequestLocale } from "@/lib/i18n/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const data = await getRecommendations(auth.user.id, limit, await getRequestLocale());

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al obtener recomendaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al calcular recomendaciones." },
      { status: 500 }
    );
  }
}
