import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDemographicsPayload, type RatingRow } from "@/lib/demographics";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: ParamsProps) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Falta el identificador de la película." },
        { status: 400 }
      );
    }

    // El `select` se mantiene mínimo a propósito: son los únicos cuatro campos
    // que necesita la agregación, y reducirlo baja el coste de transferencia
    // en las películas con muchas valoraciones.
    //
    // Barrera contra review bombing: las valoraciones reales solo entran en los
    // agregados públicos si la cuenta está verificada (o si son bots sintéticos iniciales).
    const cleanId = id.trim();
    let resolvedMovieId = cleanId;
    if (/^\d+$/.test(cleanId)) {
      const m = await db.movie.findUnique({
        where: { tmdbId: parseInt(cleanId, 10) },
        select: { id: true },
      });
      if (m) resolvedMovieId = m.id;
    }

    const ratings = await db.rating.findMany({
      where: {
        movieId: resolvedMovieId,
        OR: [
          { isArtificial: true },
          { user: { emailVerified: { not: null } } },
        ],
      },
      select: {
        score: true,
        isArtificial: true,
        user: { select: { gender: true, birthYear: true } },
      },
    });

    const rows: RatingRow[] = ratings
      .filter((r) => r.user !== null)
      .map((r) => ({
        score: r.score,
        isArtificial: r.isArtificial,
        gender: r.user!.gender,
        birthYear: r.user!.birthYear,
      }));

    return NextResponse.json(buildDemographicsPayload(resolvedMovieId, rows));
  } catch (error) {
    console.error("Error al agrupar estadísticas demográficas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar datos demográficos." },
      { status: 500 }
    );
  }
}
