import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getManyMovieDemographics, getMostRatedMovieIds } from "@/lib/movie-demographics";
import { getTopDemographicContrast } from "@/lib/viral";

export const dynamic = "force-dynamic";

const MIN_VOTES = 6;
const MAX_CANDIDATES = 200;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);

    // 1. Candidatas: las películas con más votos que cuentan (mínimo 6, que es
    // lo que necesita una brecha para ser calculable).
    const candidateIds = await getMostRatedMovieIds(MIN_VOTES, MAX_CANDIDATES);
    const [payloads, movies] = await Promise.all([
      getManyMovieDemographics(candidateIds),
      db.movie.findMany({
        where: { id: { in: candidateIds } },
        select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true },
      }),
    ]);

    const results = [];

    for (const movie of movies) {
      const payload = payloads.get(movie.id);
      if (!payload) continue;
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
          realCount: payload.counts.real,
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
