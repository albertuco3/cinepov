export interface RecommendedMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string;
  year: number;
  genres: string[];
  cohortRating: number;
  cohortVotes: number;
  affinityScore: number;
  inWatchlist: boolean;
  taglineReason: string;
}

export interface DemographicRecommendationsResult {
  cohortName: string;
  gender: string;
  ageRange: string;
  userRatingsCount: number;
  averageAffinity: number;
  recommendations: RecommendedMovie[];
}

/**
 * Mapeo de clave interna de edad a texto legible para el usuario.
 */
export function getAgeRangeLabel(ageKey: string): string {
  switch (ageKey) {
    case "18_24": return "18 a 24 años";
    case "25_34": return "25 a 34 años";
    case "35_44": return "35 a 44 años";
    case "45_54": return "45 a 54 años";
    case "55_plus": return "más de 55 años";
    default: return "todas las edades";
  }
}

/**
 * Mapeo de género interno a texto legible.
 */
export function getGenderLabel(gender: string): string {
  switch (gender) {
    case "male": return "Hombres";
    case "female": return "Mujeres";
    case "non_binary": return "Comunidad no binaria";
    default: return "Usuarios";
  }
}

/**
 * Calcula la clave de rango de edad a partir del año de nacimiento.
 */
export function getAgeKeyFromBirthYear(birthYear: number, currentYear = new Date().getFullYear()): string {
  const age = currentYear - birthYear;
  if (age >= 18 && age <= 24) return "18_24";
  if (age >= 25 && age <= 34) return "25_34";
  if (age >= 35 && age <= 44) return "35_44";
  if (age >= 45 && age <= 54) return "45_54";
  if (age >= 55) return "55_plus";
  return "25_34"; // Fallback estándar
}

/**
 * Calcula el porcentaje de afinidad estadística con base en la calificación media de la cohorte.
 */
export function calculateAffinityScore(averageScore: number, voteCount: number): number {
  if (voteCount === 0) return 75;
  // A mayor nota y mayor muestra, mayor afinidad calculada (entre 60% y 98%)
  const base = (averageScore / 10) * 100;
  const confidenceBonus = Math.min(voteCount * 1.5, 6);
  const calculated = Math.round(base * 0.95 + confidenceBonus);
  return Math.min(98, Math.max(60, calculated));
}

/**
 * Motor de recomendaciones cinematográficas personalizadas según segmento demográfico (Fase 7.1).
 * Selecciona películas con alta calificación en el colectivo del usuario que aún no han sido vistas.
 */
export async function getDemographicRecommendations(
  userId: string,
  limit = 12
): Promise<DemographicRecommendationsResult> {
  const { db } = await import("@/lib/db");
  const currentYear = new Date().getFullYear();

  // 1. Obtener perfil demográfico del usuario
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      gender: true,
      birthYear: true,
      ratings: {
        select: { movieId: true, score: true },
      },
      watchlists: {
        select: { movieId: true },
      },
    },
  });

  const gender = user?.gender || "female";
  const birthYear = user?.birthYear || (currentYear - 28);
  const ageKey = getAgeKeyFromBirthYear(birthYear, currentYear);
  const ratedMovieIds = new Set(user?.ratings.map((r) => r.movieId) || []);
  const watchlistMovieIds = new Set(user?.watchlists.map((w) => w.movieId) || []);

  const cohortName = `${getGenderLabel(gender)} de ${getAgeRangeLabel(ageKey)}`;

  // 2. Obtener películas que el usuario no haya valorado aún
  const candidateMovies = await db.movie.findMany({
    where: {
      id: { notIn: Array.from(ratedMovieIds) },
    },
    select: {
      id: true,
      tmdbId: true,
      title: true,
      posterUrl: true,
      year: true,
      tmdbRating: true,
      genres: {
        select: { name: true },
      },
      ratings: {
        where: {
          isArtificial: false,
          user: {
            gender,
            emailVerified: { not: null },
          },
        },
        select: {
          score: true,
          user: {
            select: { birthYear: true },
          },
        },
      },
    },
    take: 60,
  });

  // 3. Procesar y ordenar según la nota del segmento demográfico
  const scoredMovies: RecommendedMovie[] = [];

  for (const movie of candidateMovies) {
    // Filtrar votos de usuarios que pertenecen al mismo rango de edad
    const cohortRatings = movie.ratings.filter((r) => {
      if (!r.user?.birthYear) return false;
      const voterAgeKey = getAgeKeyFromBirthYear(r.user.birthYear, currentYear);
      return voterAgeKey === ageKey;
    });

    const cohortVotes = cohortRatings.length;
    let cohortRating = 0;

    if (cohortVotes > 0) {
      const sum = cohortRatings.reduce((acc: number, curr) => acc + curr.score, 0);
      cohortRating = parseFloat((sum / cohortVotes).toFixed(1));
    } else {
      // Fallback: usar calificación TMDB o media
      cohortRating = movie.tmdbRating ? parseFloat(movie.tmdbRating.toFixed(1)) : 7.2;
    }

    const affinity = calculateAffinityScore(cohortRating, cohortVotes);

    let taglineReason = "";
    if (cohortVotes >= 3 && cohortRating >= 8.0) {
      taglineReason = `Aclamada por ${cohortName} (${cohortRating}/10)`;
    } else if (cohortVotes >= 1 && cohortRating >= 7.5) {
      taglineReason = `Muy valorada en tu colectivo (${cohortRating}/10)`;
    } else {
      taglineReason = `Recomendación afín para tu perfil`;
    }

    scoredMovies.push({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      posterUrl: movie.posterUrl,
      year: movie.year,
      genres: movie.genres.map((g) => g.name),
      cohortRating,
      cohortVotes,
      affinityScore: affinity,
      inWatchlist: watchlistMovieIds.has(movie.id),
      taglineReason,
    });
  }

  // Ordenar por nota de cohorte descendente y volumen de votos
  scoredMovies.sort((a, b) => {
    if (b.cohortRating !== a.cohortRating) {
      return b.cohortRating - a.cohortRating;
    }
    return b.cohortVotes - a.cohortVotes;
  });

  const finalRecommendations = scoredMovies.slice(0, limit);

  const averageAffinity = finalRecommendations.length > 0
    ? Math.round(
        finalRecommendations.reduce((sum, m) => sum + m.affinityScore, 0) /
          finalRecommendations.length
      )
    : 80;

  return {
    cohortName,
    gender,
    ageRange: ageKey,
    userRatingsCount: user?.ratings.length || 0,
    averageAffinity,
    recommendations: finalRecommendations,
  };
}
