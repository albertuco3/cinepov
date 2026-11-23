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
  /** De dónde sale la nota: nunca se presenta una nota de TMDB como opinión del segmento. */
  source: "segment" | "tmdb";
}

export interface DemographicRecommendationsResult {
  cohortName: string;
  gender: string;
  ageRange: string;
  userRatingsCount: number;
  averageAffinity: number | null;
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
 * Motor de recomendaciones cinematográficas personalizadas según segmento demográfico (Fase 7.1).
 * Selecciona películas con alta calificación en el colectivo del usuario que aún no ha valorado.
 *
 * Mientras el segmento no tenga datos suficientes, completa la lista con
 * películas bien valoradas en TMDB, marcadas como tales (`source: "tmdb"`).
 */
export async function getDemographicRecommendations(
  userId: string,
  limit = 12
): Promise<DemographicRecommendationsResult> {
  const { db } = await import("@/lib/db");
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

  // 1. Media del segmento por película, calculada en la base de datos sobre
  // todas las películas que el usuario no ha valorado.
  const segmentGroups =
    gender && ageKey
      ? await db.rating.groupBy({
          by: ["movieId"],
          where: {
            ...countedRatingWhere(segmentUserWhere({ gender, ageKey }, currentYear)),
            movieId: { notIn: ratedMovieIds },
          },
          _avg: { score: true },
          _count: { score: true },
          having: { score: { _count: { gte: SEGMENT_MIN_VOTES } } },
          orderBy: [{ _avg: { score: "desc" } }, { _count: { score: "desc" } }],
          take: limit,
        })
      : [];

  // 2. Relleno mientras el segmento no tiene datos: TMDB, etiquetado.
  const segmentMovieIds = segmentGroups.map((g) => g.movieId);
  const fillCount = limit - segmentGroups.length;
  const movieSelect = {
    id: true,
    tmdbId: true,
    title: true,
    posterUrl: true,
    year: true,
    tmdbRating: true,
    genres: { select: { name: true } },
  } as const;

  const [segmentMovies, fallbackMovies] = await Promise.all([
    db.movie.findMany({ where: { id: { in: segmentMovieIds } }, select: movieSelect }),
    fillCount > 0
      ? db.movie.findMany({
          where: { id: { notIn: [...ratedMovieIds, ...segmentMovieIds] }, tmdbRating: { not: null } },
          orderBy: { tmdbRating: "desc" },
          take: fillCount,
          select: movieSelect,
        })
      : Promise.resolve([]),
  ]);
  const segmentMovieById = new Map(segmentMovies.map((m) => [m.id, m]));

  const fromSegment: RecommendedMovie[] = segmentGroups.flatMap((group) => {
    const movie = segmentMovieById.get(group.movieId);
    if (!movie || group._avg.score === null) return [];
    const cohortRating = parseFloat(group._avg.score.toFixed(1));
    const cohortVotes = group._count.score;
    return [
      {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterUrl: movie.posterUrl,
        year: movie.year,
        genres: movie.genres.map((g) => g.name),
        cohortRating,
        cohortVotes,
        affinityScore: calculateAffinityScore(cohortRating, cohortVotes),
        inWatchlist: watchlistMovieIds.has(movie.id),
        taglineReason:
          cohortRating >= 8
            ? `Aclamada por ${cohortName} (${cohortRating}/10)`
            : `Valorada con ${cohortRating}/10 por ${cohortName}`,
        source: "segment" as const,
      },
    ];
  });

  const fromTmdb: RecommendedMovie[] = fallbackMovies.map((movie) => ({
    id: movie.id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    posterUrl: movie.posterUrl,
    year: movie.year,
    genres: movie.genres.map((g) => g.name),
    cohortRating: parseFloat((movie.tmdbRating ?? 0).toFixed(1)),
    cohortVotes: 0,
    affinityScore: null,
    inWatchlist: watchlistMovieIds.has(movie.id),
    taglineReason: "Nota de TMDB: tu segmento aún no la ha valorado",
    source: "tmdb" as const,
  }));

  const recommendations = [...fromSegment, ...fromTmdb];
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
    recommendations,
  };
}
