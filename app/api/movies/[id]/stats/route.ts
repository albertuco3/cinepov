import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: ParamsProps) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Falta el identificador de la película." }, { status: 400 });
    }

    // Calcular estadísticas en tiempo real
    const ratings = await db.rating.findMany({
      where: { movieId: id },
      select: { score: true },
    });

    const count = ratings.length;
    const avg = count > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / count).toFixed(1)
      : null;

    return NextResponse.json({
      avgRating: avg,
      ratingCount: count,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de la película:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al calcular estadísticas." },
      { status: 500 }
    );
  }
}
