import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender") || "all";
    const ageRange = searchParams.get("ageRange") || "all";
    const genreId = searchParams.get("genreId") || "all";
    const decade = searchParams.get("decade") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const pageSize = 20;
    const skip = (page - 1) * pageSize;
    const minRatings = 3; // Mínimo de valoraciones para aparecer en el ranking

    const currentYear = new Date().getFullYear();

    // 1. Construir el filtro para la tabla Rating (Filtros Demográficos)
    const ratingsFilter: any = {};
    
    if (gender !== "all" || ageRange !== "all") {
      ratingsFilter.user = {};
      
      if (gender !== "all") {
        ratingsFilter.user.gender = gender;
      }
      
      if (ageRange !== "all") {
        if (ageRange === "18_24") {
          ratingsFilter.user.birthYear = { gte: currentYear - 24, lte: currentYear - 18 };
        } else if (ageRange === "25_34") {
          ratingsFilter.user.birthYear = { gte: currentYear - 34, lte: currentYear - 25 };
        } else if (ageRange === "35_44") {
          ratingsFilter.user.birthYear = { gte: currentYear - 44, lte: currentYear - 35 };
        } else if (ageRange === "45_54") {
          ratingsFilter.user.birthYear = { gte: currentYear - 54, lte: currentYear - 45 };
        } else if (ageRange === "55_plus") {
          ratingsFilter.user.birthYear = { lte: currentYear - 55 };
        }
      }
    }

    // Filtros sobre la Película (Género y Década)
    if (genreId !== "all" || decade !== "all") {
      ratingsFilter.movie = {};
      
      if (genreId !== "all") {
        ratingsFilter.movie.genres = {
          some: { id: genreId },
        };
      }
      
      if (decade !== "all") {
        const startYear = parseInt(decade.substring(0, 4), 10);
        const endYear = startYear + 9;
        ratingsFilter.movie.year = { gte: startYear, lte: endYear };
      }
    }

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
    // Para simplificar y no sobrecargar SQLite, calculamos el total de grupos agregados de forma global
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
  } catch (error: any) {
    console.error("Error al calcular rankings:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor al obtener el ranking." },
      { status: 500 }
    );
  }
}
