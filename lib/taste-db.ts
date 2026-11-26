import { db } from "./db";
import { COUNTED_RATING_SQL, countedRatingWhere } from "./rating-filters";
import {
  TASTE,
  movieBase,
  predictScore,
  shrunkPearson,
  userBias,
  type CoRatingStats,
  type Neighbor,
  type Prediction,
} from "./taste";

/** Vecinos como máximo que se cargan por usuario (los más parecidos). */
const MAX_NEIGHBORS = 200;
/** Vecinos mínimos que deben haber visto una película para recomendarla. */
const MIN_RECOMMENDATION_NEIGHBORS = 3;

interface CoRatingRow extends CoRatingStats {
  userId: string;
}

export interface TasteContext {
  ownRatings: Map<string, number>;
  bias: number;
  base: (movieId: string) => number;
  neighbors: Neighbor[];
}

/** Base de cada película (TMDB ajustada con los votos que cuentan), para los ids dados. */
async function loadMovieBases(movieIds: string[]): Promise<(movieId: string) => number> {
  const [sums, movies, global] = await Promise.all([
    db.rating.groupBy({
      by: ["movieId"],
      where: { ...countedRatingWhere(), movieId: { in: movieIds } },
      _sum: { score: true },
      _count: { score: true },
    }),
    db.movie.findMany({ where: { id: { in: movieIds } }, select: { id: true, tmdbRating: true } }),
    db.rating.aggregate({ where: countedRatingWhere(), _avg: { score: true } }),
  ]);

  const globalMean = global._avg.score ?? TASTE.DEFAULT_MEAN;
  const tmdb = new Map(movies.map((m) => [m.id, m.tmdbRating]));
  const bases = new Map(
    movieIds.map((id) => {
      const s = sums.find((x) => x.movieId === id);
      return [id, movieBase(s?._sum.score ?? 0, s?._count.score ?? 0, tmdb.get(id) ?? null, globalMean)];
    })
  );
  return (movieId) => bases.get(movieId) ?? globalMean;
}

/**
 * Todo lo necesario para predecir las notas de un usuario, o `null` si aún no
 * ha valorado lo suficiente para estimar su gusto.
 */
export async function loadTasteContext(userId: string, extraMovieIds: string[] = []): Promise<TasteContext | null> {
  const own = await db.rating.findMany({ where: { userId }, select: { movieId: true, score: true } });
  if (own.length < TASTE.MIN_OWN_RATINGS) return null;
  const ownRatings = new Map(own.map((r) => [r.movieId, r.score]));

  // Estadísticos de las películas en común con cada persona cuyos votos cuentan.
  const coRatings = await db.$queryRaw<CoRatingRow[]>`
    SELECT r."userId",
           COUNT(*)::int AS n,
           SUM(m."score")::float AS sx,
           SUM(r."score")::float AS sy,
           SUM(m."score" * r."score")::float AS sxy,
           SUM(m."score" * m."score")::float AS sxx,
           SUM(r."score" * r."score")::float AS syy
    FROM "Rating" r
    JOIN "User" u ON u."id" = r."userId"
    JOIN "Rating" m ON m."movieId" = r."movieId" AND m."userId" = ${userId}
    WHERE r."userId" <> ${userId} AND ${COUNTED_RATING_SQL}
    GROUP BY r."userId"
    HAVING COUNT(*) >= ${TASTE.MIN_OVERLAP}
  `;

  const similar = coRatings
    .map((row) => ({ userId: row.userId, similarity: shrunkPearson(row) }))
    .filter((x): x is { userId: string; similarity: number } => x.similarity !== null && x.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_NEIGHBORS);

  const neighborRatings = similar.length
    ? await db.rating.findMany({
        where: { userId: { in: similar.map((s) => s.userId) } },
        select: { userId: true, movieId: true, score: true },
      })
    : [];

  const movieIds = [...new Set([...ownRatings.keys(), ...neighborRatings.map((r) => r.movieId), ...extraMovieIds])];
  const base = await loadMovieBases(movieIds);

  const ratingsByNeighbor = new Map<string, Map<string, number>>();
  for (const r of neighborRatings) {
    if (!ratingsByNeighbor.has(r.userId)) ratingsByNeighbor.set(r.userId, new Map());
    ratingsByNeighbor.get(r.userId)!.set(r.movieId, r.score);
  }

  const neighbors: Neighbor[] = similar.map((s) => {
    const ratings = ratingsByNeighbor.get(s.userId) ?? new Map<string, number>();
    return { userId: s.userId, similarity: s.similarity, ratings, bias: userBias(ratings, base) };
  });

  return { ownRatings, bias: userBias(ownRatings, base), base, neighbors };
}

/** Nota estimada de una película para un usuario, o `null` si aún no hay base para estimarla. */
export async function predictForMovie(userId: string, movieId: string): Promise<Prediction | null> {
  const ctx = await loadTasteContext(userId, [movieId]);
  if (!ctx) return null;
  return predictScore(movieId, ctx.base(movieId), ctx.bias, ctx.neighbors);
}

export interface TasteRecommendation extends Prediction {
  movieId: string;
}

/**
 * Películas que no has valorado, ordenadas por la nota que les darías.
 * Solo incluye las que han visto al menos tres personas con gustos parecidos:
 * sin vecinos, el orden sería solo el de la nota media y no aportaría nada.
 */
export async function recommendByTaste(
  userId: string,
  limit: number
): Promise<{ neighborCount: number; recommendations: TasteRecommendation[] }> {
  const ctx = await loadTasteContext(userId);
  if (!ctx || ctx.neighbors.length === 0) return { neighborCount: 0, recommendations: [] };

  const candidates = new Set<string>();
  for (const n of ctx.neighbors) {
    for (const movieId of n.ratings.keys()) {
      if (!ctx.ownRatings.has(movieId)) candidates.add(movieId);
    }
  }

  const recommendations = [...candidates]
    .map((movieId) => ({ movieId, ...predictScore(movieId, ctx.base(movieId), ctx.bias, ctx.neighbors) }))
    .filter((p) => p.neighborCount >= MIN_RECOMMENDATION_NEIGHBORS)
    .sort((a, b) => b.score - a.score || b.neighborCount - a.neighborCount)
    .slice(0, limit);
  return { neighborCount: ctx.neighbors.length, recommendations };
}
