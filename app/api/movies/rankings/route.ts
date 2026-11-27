import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";
import { isAgeKey } from "@/lib/demographics";
import { countedRatingWhere, segmentUserWhere } from "@/lib/rating-filters";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender") || "all";
    const ageRange = searchParams.get("ageRange") || "all";
    const genreId = searchParams.get("genreId") || "all";
    const decade = searchParams.get("decade") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    const pageSize = 20;
    const skip = (page - 1) * pageSize;
    // Mínimo de valoraciones REALES para aparecer en el ranking. Un ranking es
    // contenido público y compartible: solo puede construirse con votos de
    // personas (ver sección 6.4 del plan de proyecto).
    const minRatings = 5;

    // 1. Filtro de valoraciones: solo las que cuentan, del segmento pedido y,
    // opcionalmente, de un género cinematográfico o una década.
    const segment = {
      gender: gender !== "all" ? gender : undefined,
      ageKey: isAgeKey(ageRange) ? ageRange : undefined,
    };
    const movieFilter: Prisma.MovieWhereInput = {};
    if (genreId !== "all") {
      movieFilter.genres = { some: { id: genreId } };
    }
    const startYear = parseInt(decade.substring(0, 4), 10);
    if (decade !== "all" && !isNaN(startYear)) {
      movieFilter.year = { gte: startYear, lte: startYear + 9 };
    }
    const ratingsFilter: Prisma.RatingWhereInput = {
      ...countedRatingWhere(segmentUserWhere(segment)),
      ...(Object.keys(movieFilter).length > 0 ? { movie: movieFilter } : {}),
    };

    // 2. Agrupar ratings por película en la base de datos
    // Obtenemos los promedios en base al filtro demográfico y de película
    const groupedRatings = await db.rating.groupBy({
      by: ["movieId"],
      where: ratingsFilter,
      _avg: {
        score: true,
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: minRatings,
          },
        },
      },
      orderBy: {
        _avg: {
          score: "desc",
        },
      },
      take: pageSize,
      skip: skip,
    });

    if (groupedRatings.length === 0) {
      return NextResponse.json({
        success: true,
        page,
        pageSize,
        totalResults: 0,
        results: [],
      });
    }

    const movieIds = groupedRatings.map((r) => r.movieId);

    // 3. Consultar las películas correspondientes
    const movies = await db.movie.findMany({
      where: {
        id: { in: movieIds },
      },
      include: {
        genres: {
          select: {
            name: true,
          },
        },
      },
    });

    // 4. Calcular el promedio global de cada película para comparar desviaciones
    const globalAverages = await db.rating.groupBy({
      by: ["movieId"],
      where: {
        ...countedRatingWhere(),
        movieId: { in: movieIds },
      },
      _avg: {
        score: true,
      },
      _count: {
        id: true,
      },
    });

    // 5. Mapear y ordenar los resultados manteniendo el ranking calculado en el groupBy
    const results = groupedRatings
      .map((group, index) => {
        const movie = movies.find((m) => m.id === group.movieId);
        if (!movie) return null;

        const globalGroup = globalAverages.find((g) => g.movieId === group.movieId);
        const globalAvgScore = globalGroup?._avg.score || 0;
        const globalRatingCount = globalGroup?._count.id || 0;

        const avgScore = group._avg.score || 0;
        const ratingCount = group._count.id;

        // Desviación del segmento contra la media global de la película
        const deviation = parseFloat((avgScore - globalAvgScore).toFixed(1));

        return {
          rank: skip + index + 1,
          id: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          director: movie.director,
          genres: movie.genres.map((g) => g.name),
          avgScore: parseFloat(avgScore.toFixed(1)),
          ratingCount,
          globalAvgScore: parseFloat(globalAvgScore.toFixed(1)),
          globalRatingCount,
          deviation,
        };
      })
      .filter((r) => r !== null);

    // Calcular el total de elementos que cumplen la condición para la paginación
    const totalGrouped = await db.rating.groupBy({
      by: ["movieId"],
      where: ratingsFilter,
      having: {
        id: {
          _count: {
            gte: minRatings,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      totalResults: totalGrouped.length,
      results,
    });
  } catch (error) {
    console.error("Error al calcular rankings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener el ranking." },
      { status: 500 }
    );
  }
}
