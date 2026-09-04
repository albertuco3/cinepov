import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    const userWhereA = buildDemographicWhereClause(genderA, ageA, currentYear);
    const userWhereB = buildDemographicWhereClause(genderB, ageB, currentYear);

    // Buscar películas con votos reales verificados
    const candidateMovies = await db.movie.findMany({
      where: {
        ...(genreId ? { genres: { some: { id: genreId } } } : {}),
        ratings: {
          some: {
            isArtificial: false,
            user: { emailVerified: { not: null } },
          },
        },
      },
      select: {
        id: true,
        tmdbId: true,
        title: true,
        year: true,
        posterUrl: true,
        tmdbRating: true,
        genres: {
          select: { id: true, name: true },
        },
        ratings: {
          where: {
            isArtificial: false,
            user: { emailVerified: { not: null }, isAnonymized: false },
          },
          select: {
            score: true,
            user: {
              select: {
                gender: true,
                birthYear: true,
              },
            },
          },
        },
      },
      take: 100,
    });

    const matches = [];

    for (const movie of candidateMovies) {
      // Filtrar votos para Perfil A
      const votesA = movie.ratings.filter((r) => {
        if (!r.user.gender || !r.user.birthYear) return false;
        if (genderA !== "all" && r.user.gender !== genderA) return false;
        if (ageA === "young" && (r.user.birthYear < currentYear - 34 || r.user.birthYear > currentYear - 18)) return false;
        if (ageA === "adult" && (r.user.birthYear < currentYear - 54 || r.user.birthYear > currentYear - 35)) return false;
        if (ageA === "senior" && r.user.birthYear > currentYear - 55) return false;
        return true;
      });

      // Filtrar votos para Perfil B
      const votesB = movie.ratings.filter((r) => {
        if (!r.user.gender || !r.user.birthYear) return false;
        if (genderB !== "all" && r.user.gender !== genderB) return false;
        if (ageB === "young" && (r.user.birthYear < currentYear - 34 || r.user.birthYear > currentYear - 18)) return false;
        if (ageB === "adult" && (r.user.birthYear < currentYear - 54 || r.user.birthYear > currentYear - 35)) return false;
        if (ageB === "senior" && r.user.birthYear > currentYear - 55) return false;
        return true;
      });

      // Si ambos segmentos tienen votos
      if (votesA.length > 0 && votesB.length > 0) {
        const avgA = parseFloat(
          (votesA.reduce((sum, v) => sum + v.score, 0) / votesA.length).toFixed(1)
        );
        const avgB = parseFloat(
          (votesB.reduce((sum, v) => sum + v.score, 0) / votesB.length).toFixed(1)
        );

        const consensusScore = computeConsensusScore(avgA, avgB);

        matches.push({
          id: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          tmdbRating: movie.tmdbRating,
          genres: movie.genres.map((g) => g.name),
          scoreA: avgA,
          votesA: votesA.length,
          scoreB: avgB,
          votesB: votesB.length,
          consensusScore,
        });
      }
    }

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
