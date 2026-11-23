import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";
import { countedRatingWhere } from "@/lib/rating-filters";
import {
  computeConsensusScore,
  buildDemographicWhereClause,
} from "@/lib/consensus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genderA = searchParams.get("genderA") || "female";
    const ageA = searchParams.get("ageA") || "young";
    const genderB = searchParams.get("genderB") || "male";
    const ageB = searchParams.get("ageB") || "young";
    const genreId = searchParams.get("genreId") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "15", 10), 1), 30);

    const currentYear = new Date().getFullYear();

    const movieFilter: Prisma.RatingWhereInput = genreId ? { movie: { genres: { some: { id: genreId } } } } : {};

    // Media de cada perfil por película, calculada en la base de datos sobre
    // todas las películas (no sobre un subconjunto arbitrario).
    const segmentAverages = (gender: string, ageBroad: string) =>
      db.rating.groupBy({
        by: ["movieId"],
        where: {
          ...countedRatingWhere(buildDemographicWhereClause(gender, ageBroad, currentYear)),
          ...movieFilter,
        },
        _avg: { score: true },
        _count: { score: true },
      });

    const [groupsA, groupsB] = await Promise.all([
      segmentAverages(genderA, ageA),
      segmentAverages(genderB, ageB),
    ]);

    const byMovieB = new Map(groupsB.map((g) => [g.movieId, g]));
    const shared = groupsA.filter((g) => byMovieB.has(g.movieId));

    const movies = await db.movie.findMany({
      where: { id: { in: shared.map((g) => g.movieId) } },
      select: {
        id: true,
        tmdbId: true,
        title: true,
        year: true,
        posterUrl: true,
        tmdbRating: true,
        genres: { select: { name: true } },
      },
    });
    const movieById = new Map(movies.map((m) => [m.id, m]));

    const matches = shared.flatMap((groupA) => {
      const groupB = byMovieB.get(groupA.movieId);
      const movie = movieById.get(groupA.movieId);
      if (!groupB || !movie || groupA._avg.score === null || groupB._avg.score === null) return [];

      const avgA = parseFloat(groupA._avg.score.toFixed(1));
      const avgB = parseFloat(groupB._avg.score.toFixed(1));

      return [
        {
          id: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          tmdbRating: movie.tmdbRating,
          genres: movie.genres.map((g) => g.name),
          scoreA: avgA,
          votesA: groupA._count.score,
          scoreB: avgB,
          votesB: groupB._count.score,
          consensusScore: computeConsensusScore(avgA, avgB),
        },
      ];
    });

    // Ordenar por nota de consenso descendente
    matches.sort((a, b) => b.consensusScore - a.consensusScore);

    return NextResponse.json({
      movies: matches.slice(0, limit),
      count: matches.length,
    });
  } catch (error) {
    console.error("Error en API consensus:", error);
    return NextResponse.json(
      { error: "Error al calcular películas de consenso" },
      { status: 500 }
    );
  }
}
