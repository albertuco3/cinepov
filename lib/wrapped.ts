import { db } from "@/lib/db";
import { ageKeyFromBirthYear } from "@/lib/demographics";

export interface WrappedStats {
  year: number;
  totalMovies: number;
  totalHoursEstimated: number;
  averageScore: number;
  highestRated: {
    tmdbId: number;
    title: string;
    score: number;
    year: number;
    posterUrl: string;
  } | null;
  lowestRated: {
    tmdbId: number;
    title: string;
    score: number;
    year: number;
    posterUrl: string;
  } | null;
  favoriteGenre: string | null;
  mostActiveMonth: string;
  demographicComparison: {
    userAvg: number;
    segmentAvg: number | null;
    diff: number | null;
    comparisonText: string;
  };
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/**
 * Calcula las estadísticas anuales de cine del usuario (Fase 4.10).
 */
export async function calculateUserWrapped(
  userId: string,
  preferredYear?: number
): Promise<WrappedStats | null> {
  const currentYear = preferredYear || new Date().getFullYear();

  // Obtener usuario con demografía
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      birthYear: true,
      gender: true,
    },
  });

  if (!user) return null;

  // Consultar todas las valoraciones del usuario
  const allRatings = await db.rating.findMany({
    where: {
      userId,
      isArtificial: false,
    },
    include: {
      movie: {
        include: {
          genres: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (allRatings.length === 0) {
    return null;
  }

  // Filtrar por año de visualización o registro
  let yearRatings = allRatings.filter((r) => {
    const d = r.watchedAt || r.createdAt;
    return d.getFullYear() === currentYear;
  });

  // Si en el año actual tiene menos de 2, usar todas las valoraciones históricas
  let effectiveYear = currentYear;
  if (yearRatings.length < 2) {
    yearRatings = allRatings;
    effectiveYear = allRatings[0].createdAt.getFullYear();
  }

  const totalMovies = yearRatings.length;
  const totalHoursEstimated = Math.round((totalMovies * 110) / 60);

  const scores = yearRatings.map((r) => r.score);
  const avgScore = parseFloat((scores.reduce((a, b) => a + b, 0) / totalMovies).toFixed(1));

  // Mejor y peor valorada
  const sortedByScore = [...yearRatings].sort((a, b) => b.score - a.score);
  const best = sortedByScore[0];
  const worst = sortedByScore[sortedByScore.length - 1];

  // Género rey
  const genreCounts: Record<string, number> = {};
  for (const r of yearRatings) {
    for (const g of r.movie.genres) {
      genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
    }
  }
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Mes más cinéfilo
  const monthCounts: Record<number, number> = {};
  for (const r of yearRatings) {
    const m = (r.watchedAt || r.createdAt).getMonth();
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  }
  const topMonthIndex = parseInt(
    Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "0",
    10
  );
  const mostActiveMonth = MONTH_NAMES[topMonthIndex] || "Noviembre";

  // Comparativa de severidad contra su segmento demográfico
  const ageKey = ageKeyFromBirthYear(user.birthYear, currentYear);
  const segmentLabel =
    user.gender === "female"
      ? `mujeres de ${ageKey} años`
      : user.gender === "male"
      ? `hombres de ${ageKey} años`
      : `espectadores de ${ageKey} años`;

  // Media global de la comunidad en estas mismas películas
  const movieIds = yearRatings.map((r) => r.movieId);
  const communityRatings = await db.rating.findMany({
    where: {
      movieId: { in: movieIds },
      isArtificial: false,
      userId: { not: userId },
    },
    select: { score: true },
  });

  const segmentAvg =
    communityRatings.length > 0
      ? parseFloat(
          (communityRatings.reduce((a, b) => a + b.score, 0) / communityRatings.length).toFixed(1)
        )
      : null;

  const diff = segmentAvg !== null ? parseFloat((avgScore - segmentAvg).toFixed(1)) : null;

  let comparisonText = `Has calificado ${totalMovies} películas este año.`;
  if (diff !== null) {
    if (diff > 0.3) {
      comparisonText = `Has sido un cinéfilo más generoso que la media comunitaria (+${diff} puntos por encima).`;
    } else if (diff < -0.3) {
      comparisonText = `Has tenido un criterio más exigente y crítico que la media de la comunidad (${diff} puntos por debajo).`;
    } else {
      comparisonText = `Tu criterio ha estado en perfecto alineamiento con la media de la comunidad.`;
    }
  }

  return {
    year: effectiveYear,
    totalMovies,
    totalHoursEstimated,
    averageScore: avgScore,
    highestRated: best
      ? {
          tmdbId: best.movie.tmdbId,
          title: best.movie.title,
          score: best.score,
          year: best.movie.year,
          posterUrl: best.movie.posterUrl,
        }
      : null,
    lowestRated: worst
      ? {
          tmdbId: worst.movie.tmdbId,
          title: worst.movie.title,
          score: worst.score,
          year: worst.movie.year,
          posterUrl: worst.movie.posterUrl,
        }
      : null,
    favoriteGenre: topGenre,
    mostActiveMonth,
    demographicComparison: {
      userAvg: avgScore,
      segmentAvg,
      diff,
      comparisonText,
    },
  };
}
