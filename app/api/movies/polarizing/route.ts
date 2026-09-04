import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDemographicsPayload, type RatingRow } from "@/lib/demographics";
import { getTopDemographicContrast } from "@/lib/viral";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);

    // 1. Buscar películas que tengan al menos 10 votos reales verificados
    const activeMovies = await db.movie.findMany({
      where: {
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
        ratings: {
          where: {
            isArtificial: false,
            user: { emailVerified: { not: null } },
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

    const results = [];

    for (const movie of activeMovies) {
      const rows: RatingRow[] = movie.ratings
        .filter((r) => r.user.gender && r.user.birthYear)
        .map((r) => ({
          score: r.score,
          isArtificial: false,
          gender: r.user.gender!,
          birthYear: r.user.birthYear!,
        }));

      if (rows.length < 6) continue;

      const payload = buildDemographicsPayload(movie.id, rows);
      const contrast = getTopDemographicContrast(payload);

      const female = payload.real.byGender.female;
      const male = payload.real.byGender.male;
      const genderGap =
        female.avg !== null && male.avg !== null && female.count >= 3 && male.count >= 3
          ? parseFloat(Math.abs(female.avg - male.avg).toFixed(1))
          : 0;

      const young = payload.real.byAgeBroad.young;
      const senior = payload.real.byAgeBroad.senior;
      const adult = payload.real.byAgeBroad.adult;
      const ageGap =
        young.avg !== null && senior.avg !== null && young.count >= 3 && senior.count >= 3
          ? parseFloat(Math.abs(young.avg - senior.avg).toFixed(1))
          : young.avg !== null && adult.avg !== null && young.count >= 3 && adult.count >= 3
            ? parseFloat(Math.abs(young.avg - adult.avg).toFixed(1))
            : 0;

      const polarizationScore = Math.max(genderGap, ageGap);

      // Solo incluir si hay alguna brecha calculable mayor a 0
      if (polarizationScore > 0) {
        results.push({
          id: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          realCount: rows.length,
          genderGap,
          ageGap,
          polarizationScore,
          contrast,
        });
      }
    }

    // 2. Ordenar según el tipo de filtro
    if (type === "gender") {
      results.sort((a, b) => b.genderGap - a.genderGap);
    } else if (type === "age") {
      results.sort((a, b) => b.ageGap - a.ageGap);
    } else {
      results.sort((a, b) => b.polarizationScore - a.polarizationScore);
    }

    return NextResponse.json({
      movies: results.slice(0, limit),
      count: results.length,
    });
  } catch (error) {
    console.error("Error en API polarizing:", error);
    return NextResponse.json(
      { error: "Error al calcular películas polarizantes" },
      { status: 500 }
    );
  }
}
