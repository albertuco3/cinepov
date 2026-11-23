import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveMovieId } from "@/lib/movies";
import { countedRatingWhere } from "@/lib/rating-filters";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

/** Nota media y número de valoraciones que cuentan de una película. */
export async function GET(request: Request, { params }: ParamsProps) {
  try {
    const { id } = await params;
    const movieId = await resolveMovieId(id ?? "");
    if (!movieId) {
      return NextResponse.json({ error: "Película no encontrada." }, { status: 404 });
    }

    const agg = await db.rating.aggregate({
      where: { ...countedRatingWhere(), movieId },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      avgRating: agg._avg.score === null ? null : agg._avg.score.toFixed(1),
      ratingCount: agg._count.score,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de la película:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al calcular estadísticas." },
      { status: 500 }
    );
  }
}
