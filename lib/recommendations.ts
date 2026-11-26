import { SEGMENT_MIN_VOTES, ageKeyFromBirthYear } from "./demographics";
import { countedRatingWhere, segmentUserWhere } from "./rating-filters";

export interface RecommendedMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string;
  year: number;
  genres: string[];
  /** Nota del segmento del usuario o, si `source` es "tmdb", la nota de TMDB. */
  cohortRating: number;
  cohortVotes: number;
  /** Solo existe cuando la recomendación se apoya en votos del segmento. */
  affinityScore: number | null;
  inWatchlist: boolean;
  taglineReason: string;
  /**
   * De dónde sale la nota, para etiquetarla siempre:
   * - "taste": la nota que le darías, según cómo puntúas y la gente con tus gustos;
   * - "segment": la media de tu grupo de edad y género;
   * - "tmdb": la nota de TMDB, cuando aún no hay datos propios.
   */
  source: "taste" | "segment" | "tmdb";
}

export interface DemographicRecommendationsResult {
  cohortName: string;
  gender: string;
  ageRange: string;
  userRatingsCount: number;
  averageAffinity: number | null;
  /** Personas con gustos parecidos encontradas (0 si aún no hay). */
  tasteNeighbors: number;
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
 * Recomendaciones para un usuario, en tres capas por orden:
 * 1. Por gusto: la nota que le darías, según cómo puntúa y la gente que puntúa
 *    como él (lib/taste-db.ts). Es lo que mejor predice (ver la validación).
 * 2. Por segmento: lo mejor valorado por su grupo de edad y género.
 * 3. TMDB: relleno mientras no haya datos propios.
 * Cada recomendación lleva su procedencia para etiquetarla.
 */
export async function getRecommendations(
  userId: string,
  limit = 12,
  locale: "es" | "en" = "es"
): Promise<DemographicRecommendationsResult> {
  const { db } = await import("@/lib/db");
  const { recommendByTaste } = await import("@/lib/taste-db");
  const en = locale === "en";
  const currentYear = new Date().getFullYear();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      gender: true,
      birthYear: true,
      ratings: { select: { movieId: true } },
      watchlists: { select: { movieId: true } },
    },
  });

  const gender = user?.gender ?? "";
  const ageKey = user?.birthYear ? ageKeyFromBirthYear(user.birthYear, currentYear) : null;
  const ratedMovieIds = user?.ratings.map((r) => r.movieId) ?? [];
  const watchlistMovieIds = new Set(user?.watchlists.map((w) => w.movieId) ?? []);
  const cohortName = ageKey ? `${getGenderLabel(gender)} de ${getAgeRangeLabel(ageKey)}` : "tu perfil";

  // 1. Por gusto.
  const taste = await recommendByTaste(userId, limit);
  const tasteIds = taste.recommendations.map((r) => r.movieId);

  // 2. Por segmento, en la base de datos y sobre todas las películas que no ha
  // valorado ni le recomienda ya su gusto.
  const segmentLimit = limit - tasteIds.length;
  const segmentGroups =
    gender && ageKey && segmentLimit > 0
      ? await db.rating.groupBy({
          by: ["movieId"],
          where: {
            ...countedRatingWhere(segmentUserWhere({ gender, ageKey }, currentYear)),
            movieId: { notIn: [...ratedMovieIds, ...tasteIds] },
          },
          _avg: { score: true },
          _count: { score: true },
          having: { score: { _count: { gte: SEGMENT_MIN_VOTES } } },
          orderBy: [{ _avg: { score: "desc" } }, { _count: { score: "desc" } }],
          take: segmentLimit,
        })
      : [];

  // 3. Relleno de TMDB, etiquetado.
  const segmentMovieIds = segmentGroups.map((g) => g.movieId);
  const fillCount = limit - tasteIds.length - segmentGroups.length;
  const movieSelect = {
    id: true,
    tmdbId: true,
    title: true,
    posterUrl: true,
    year: true,
    tmdbRating: true,
    genres: { select: { name: true } },
  } as const;

  const [knownMovies, fallbackMovies] = await Promise.all([
    db.movie.findMany({ where: { id: { in: [...tasteIds, ...segmentMovieIds] } }, select: movieSelect }),
    fillCount > 0
      ? db.movie.findMany({
          where: {
            id: { notIn: [...ratedMovieIds, ...tasteIds, ...segmentMovieIds] },
            tmdbRating: { not: null },
          },
          orderBy: { tmdbRating: "desc" },
          take: fillCount,
          select: movieSelect,
        })
      : Promise.resolve([]),
  ]);
  const movieById = new Map(knownMovies.map((m) => [m.id, m]));

  const card = (movie: (typeof knownMovies)[number]) => ({
    id: movie.id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    posterUrl: movie.posterUrl,
    year: movie.year,
    genres: movie.genres.map((g) => g.name),
    inWatchlist: watchlistMovieIds.has(movie.id),
  });

  const fromTaste: RecommendedMovie[] = taste.recommendations.flatMap((rec) => {
    const movie = movieById.get(rec.movieId);
    if (!movie) return [];
    return [
      {
        ...card(movie),
        cohortRating: rec.score,
        cohortVotes: rec.neighborCount,
        affinityScore: null,
        taglineReason: en
          ? `You'd give it ${rec.score} · ${rec.neighborCount} people with your taste have seen it`
          : `Le darías un ${rec.score} · la han visto ${rec.neighborCount} personas con tus gustos`,
        source: "taste" as const,
      },
    ];
  });

  const fromSegment: RecommendedMovie[] = segmentGroups.flatMap((group) => {
    const movie = movieById.get(group.movieId);
    if (!movie || group._avg.score === null) return [];
    const cohortRating = parseFloat(group._avg.score.toFixed(1));
    const cohortVotes = group._count.score;
    return [
      {
        ...card(movie),
        cohortRating,
        cohortVotes,
        affinityScore: calculateAffinityScore(cohortRating, cohortVotes),
        taglineReason: en
          ? `Rated ${cohortRating}/10 by people your age and gender`
          : `Valorada con ${cohortRating}/10 por ${cohortName}`,
        source: "segment" as const,
      },
    ];
  });

  const fromTmdb: RecommendedMovie[] = fallbackMovies.map((movie) => ({
    ...card(movie),
    cohortRating: parseFloat((movie.tmdbRating ?? 0).toFixed(1)),
    cohortVotes: 0,
    affinityScore: null,
    taglineReason: en ? "TMDB score: not enough CinePOV data yet" : "Nota de TMDB: aún no hay datos suficientes en CinePOV",
    source: "tmdb" as const,
  }));

  const averageAffinity =
    fromSegment.length > 0
      ? Math.round(fromSegment.reduce((sum, m) => sum + (m.affinityScore ?? 0), 0) / fromSegment.length)
      : null;

  return {
    cohortName,
    gender,
    ageRange: ageKey ?? "",
    userRatingsCount: ratedMovieIds.length,
    averageAffinity,
    tasteNeighbors: taste.neighborCount,
    recommendations: [...fromTaste, ...fromSegment, ...fromTmdb],
  };
}
