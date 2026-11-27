import { db } from "@/lib/db";
import { countedRatingWhere } from "@/lib/rating-filters";
import { comparisonText, summarizeYear, type WrappedStats } from "@/lib/wrapped-summary";

export type { WrappedMovie, WrappedStats } from "@/lib/wrapped-summary";

/**
 * Calcula las estadísticas anuales de cine del usuario (Fase 4.10).
 */
export async function calculateUserWrapped(userId: string, preferredYear?: number): Promise<WrappedStats | null> {
  const year = preferredYear || new Date().getFullYear();

  const ratings = await db.rating.findMany({
    where: { userId, isArtificial: false },
    select: {
      score: true,
      createdAt: true,
      watchedAt: true,
      movieId: true,
      movie: {
        select: {
          tmdbId: true,
          title: true,
          year: true,
          posterUrl: true,
          runtime: true,
          genres: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = summarizeYear(ratings, year);
  if (!summary) return null;
  const { movieIds, ...stats } = summary;

  // Media de la comunidad en estas mismas películas, calculada en la base de
  // datos y solo con valoraciones que cuentan.
  const community = await db.rating.aggregate({
    where: { ...countedRatingWhere(), movieId: { in: movieIds }, userId: { not: userId } },
    _avg: { score: true },
  });

  const segmentAvg = community._avg.score !== null ? parseFloat(community._avg.score.toFixed(1)) : null;
  const diff = segmentAvg !== null ? parseFloat((stats.averageScore - segmentAvg).toFixed(1)) : null;

  return {
    ...stats,
    demographicComparison: {
      userAvg: stats.averageScore,
      segmentAvg,
      diff,
      comparisonText: comparisonText(stats.totalMovies, diff),
    },
  };
}
