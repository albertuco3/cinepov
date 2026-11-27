import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getManyMovieDemographics, getMostRatedMovieIds } from "@/lib/movie-demographics";
import { getTopDemographicContrast, isNotableGap } from "@/lib/viral";
import type { Segment } from "@/lib/demographics";

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

      // Solo cuentan las brechas reales (lib/viral.ts): una diferencia que
      // puede ser ruido de pocos votos no es "polarizante".
      const gap = (a: Segment, b: Segment) =>
        isNotableGap(a, b) ? parseFloat(Math.abs(a.avg! - b.avg!).toFixed(1)) : 0;
      const { byGender: g, byAgeBroad: age } = payload.real;
      const genderGap = gap(g.female, g.male);
      const ageGap = Math.max(gap(age.young, age.senior), gap(age.young, age.adult), gap(age.adult, age.senior));
      const polarizationScore = Math.max(genderGap, ageGap);

      // Solo se incluye si tiene al menos una brecha real.
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
