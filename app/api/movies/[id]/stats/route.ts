import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

/**
 * Estadísticas globales de una película.
 *
 * Devuelve la nota de las valoraciones reales y la de las estimaciones de
 * arranque por separado. La interfaz debe presentar la nota real como el dato
 * de la película y la estimada siempre etiquetada como proyección.
 */
export async function GET(request: Request, { params }: ParamsProps) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Falta el identificador de la película." }, { status: 400 });
    }

    const cleanId = id.trim();
    let resolvedMovieId = cleanId;
    if (/^\d+$/.test(cleanId)) {
      const m = await db.movie.findUnique({
        where: { tmdbId: parseInt(cleanId, 10) },
        select: { id: true },
      });
      if (m) resolvedMovieId = m.id;
    }

    const [realAgg, estimatedAgg] = await Promise.all([
      db.rating.aggregate({
        where: {
          movieId: resolvedMovieId,
          isArtificial: false,
          user: { emailVerified: { not: null } },
        },
        _avg: { score: true },
        _count: { score: true },
      }),
      db.rating.aggregate({
        where: { movieId: resolvedMovieId, isArtificial: true },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    const round = (v: number | null) => (v === null ? null : Math.round(v * 10) / 10);

    const realCount = realAgg._count.score;
    const estimatedCount = estimatedAgg._count.score;

    return NextResponse.json({
      real: { avgRating: round(realAgg._avg.score), ratingCount: realCount },
      estimated: { avgRating: round(estimatedAgg._avg.score), ratingCount: estimatedCount },
      // Campos heredados que consume el cliente actual. Reflejan SOLO datos
      // reales: la nota que se presenta como "la nota de CinePOV" nunca puede
      // incluir valoraciones sintéticas.
      avgRating: round(realAgg._avg.score),
      ratingCount: realCount,
      hasEstimated: estimatedCount > 0,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de la película:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al calcular estadísticas." },
      { status: 500 }
    );
  }
}
