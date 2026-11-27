import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "./db";
import { rankByBase } from "./catalog-ranking";
import { countedRatingWhere } from "./rating-filters";

export interface CatalogRankedMovie {
  id: string;
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string;
  director: string;
  tmdbRating: number | null;
  genres: string[];
  /** Media de los votos que cuentan, o null si no hay ninguno. */
  realAvg: number | null;
  realCount: number;
}

/**
 * Las mejores películas que cumplen `where`, sobre todas ellas y no sobre un
 * subconjunto arbitrario. Solo se cargan id y nota de TMDB de cada candidata,
 * más las sumas de votos agregadas en la base; el detalle, solo de las elegidas.
 */
export async function getTopMovies(where: Prisma.MovieWhereInput, limit = 30): Promise<CatalogRankedMovie[]> {
  const [candidates, grouped] = await Promise.all([
    db.movie.findMany({ where, select: { id: true, tmdbRating: true } }),
    db.rating.groupBy({
      by: ["movieId"],
      where: { ...countedRatingWhere(), movie: where },
      _sum: { score: true },
      _count: { movieId: true },
    }),
  ]);

  const stats = new Map(grouped.map((g) => [g.movieId, { sum: g._sum.score ?? 0, count: g._count.movieId }]));
  const top = rankByBase(candidates, stats, limit);
  if (top.length === 0) return [];

  const details = await db.movie.findMany({
    where: { id: { in: top.map((t) => t.id) } },
    select: {
      id: true,
      tmdbId: true,
      title: true,
      year: true,
      posterUrl: true,
      director: true,
      tmdbRating: true,
      genres: { select: { name: true } },
    },
  });
  const byId = new Map(details.map((m) => [m.id, m]));

  return top.flatMap(({ id }) => {
    const movie = byId.get(id);
    if (!movie) return [];
    const s = stats.get(id);
    return [
      {
        ...movie,
        genres: movie.genres.map((g) => g.name),
        realAvg: s && s.count > 0 ? parseFloat((s.sum / s.count).toFixed(1)) : null,
        realCount: s?.count ?? 0,
      },
    ];
  });
}
