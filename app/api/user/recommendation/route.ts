import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 1. Obtener la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Obtener el perfil del usuario actual (género y año de nacimiento)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { gender: true, birthYear: true },
    });

    if (!user || !user.gender || !user.birthYear) {
      return NextResponse.json(
        { error: "Perfil demográfico incompleto. Es necesario configurar el género y año de nacimiento." },
        { status: 400 }
      );
    }

    // 3. Determinar el rango de edad del usuario
    const currentYear = new Date().getFullYear();
    const userAge = currentYear - user.birthYear;
    let userAgeKey = "";
    
    if (userAge >= 18 && userAge <= 24) userAgeKey = "18_24";
    else if (userAge >= 25 && userAge <= 34) userAgeKey = "25_34";
    else if (userAge >= 35 && userAge <= 44) userAgeKey = "35_44";
    else if (userAge >= 45 && userAge <= 54) userAgeKey = "45_54";
    else if (userAge >= 55) userAgeKey = "55_plus";

    if (!userAgeKey) {
      return NextResponse.json(
        { error: "Rango de edad no soportado para recomendaciones." },
        { status: 400 }
      );
    }

    // 4. Obtener las películas esenciales (isFeatured: true)
    const featuredMovies = await db.movie.findMany({
      where: { isFeatured: true },
      select: { id: true, tmdbId: true, title: true, tmdbRating: true },
    });

    if (featuredMovies.length === 0) {
      return NextResponse.json({ recommendedMovieId: null });
    }

    // 5. Obtener las películas que el usuario ya ha valorado
    const userRatings = await db.rating.findMany({
      where: { userId },
      select: { movieId: true },
    });
    const ratedMovieIds = new Set(userRatings.map((r) => r.movieId));

    // Filtrar para quedarse solo con las películas no valoradas
    const unratedMovies = featuredMovies.filter((m) => !ratedMovieIds.has(m.id));

    // Si el usuario ya ha valorado todas las películas destacadas, devolvemos null o la primera que no haya valorado en la BD
    if (unratedMovies.length === 0) {
      // Buscar cualquier película del catálogo general que no haya valorado
      const anyUnratedMovie = await db.movie.findFirst({
        where: {
          id: { notIn: Array.from(ratedMovieIds) }
        },
        select: { tmdbId: true }
      });
      return NextResponse.json({ recommendedMovieId: anyUnratedMovie?.tmdbId || null });
    }

    // 6. Para cada película no valorada, calcular el promedio de su segmento demográfico
    const unratedMovieIds = unratedMovies.map((m) => m.id);

    // Obtener todas las valoraciones de estas películas junto a los datos demográficos de los votantes
    const ratings = await db.rating.findMany({
      where: {
        movieId: { in: unratedMovieIds },
      },
      include: {
        user: {
          select: {
            gender: true,
            birthYear: true,
          },
        },
      },
    });

    // Agrupar valoraciones por película
    const movieRatingsMap: Record<string, number[]> = {};
    unratedMovieIds.forEach((id) => {
      movieRatingsMap[id] = [];
    });

    ratings.forEach((r) => {
      if (!r.user) return;
      
      // Validar si pertenece al segmento del usuario (mismo género y mismo rango de edad)
      const botAge = currentYear - r.user.birthYear;
      let botAgeKey = "";
      if (botAge >= 18 && botAge <= 24) botAgeKey = "18_24";
      else if (botAge >= 25 && botAge <= 34) botAgeKey = "25_34";
      else if (botAge >= 35 && botAge <= 44) botAgeKey = "35_44";
      else if (botAge >= 45 && botAge <= 54) botAgeKey = "45_54";
      else if (botAge >= 55) botAgeKey = "55_plus";

      if (r.user.gender === user.gender && botAgeKey === userAgeKey) {
        movieRatingsMap[r.movieId].push(r.score);
      }
    });

    // Calcular la puntuación de recomendación de cada película
    let bestMovie = unratedMovies[0];
    let highestScore = -1;

    for (const m of unratedMovies) {
      const segmentScores = movieRatingsMap[m.id];
      let score = 0;

      if (segmentScores.length >= 3) {
        // Promedio del segmento demográfico
        score = segmentScores.reduce((sum, s) => sum + s, 0) / segmentScores.length;
      } else {
        // Si no hay votos suficientes en el segmento, usamos el promedio global o TMDB como fallback ponderado
        score = m.tmdbRating || 7.0;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMovie = m;
      }
    }

    return NextResponse.json({
      recommendedMovieId: bestMovie.tmdbId,
      title: bestMovie.title,
      score: parseFloat(highestScore.toFixed(1)),
    });

  } catch (error) {
    console.error("Error al calcular recomendación de onboarding:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la recomendación." },
      { status: 500 }
    );
  }
}
