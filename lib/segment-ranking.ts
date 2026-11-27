import { db } from "./db";
import { buildDemographicWhereClause } from "./consensus";
import { SEGMENT_MIN_VOTES } from "./demographics";
import { countedRatingWhere } from "./rating-filters";
import type { DemographicSegmentConfig } from "./segments";

export interface SegmentRankedMovie {
  id: string;
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string;
  director: string;
  genres: string[];
  segmentAvg: number;
  segmentCount: number;
}

function segmentWhere(config: DemographicSegmentConfig, currentYear: number) {
  return countedRatingWhere(buildDemographicWhereClause(config.gender, config.ageBroad, currentYear));
}

/**
 * Las películas mejor valoradas por un segmento, agregadas en la base de datos.
 *
 * Solo entran películas con al menos `SEGMENT_MIN_VOTES` votos del segmento: el
 * mismo umbral de anonimato que la ficha. Con un único voto, la lista revelaría
 * la nota que ha puesto una persona concreta.
 */
export async function getSegmentRanking(
  config: DemographicSegmentConfig,
  limit = 30,
  currentYear = new Date().getFullYear()
): Promise<SegmentRankedMovie[]> {
  const grouped = await db.rating.groupBy({
    by: ["movieId"],
    where: segmentWhere(config, currentYear),
    _avg: { score: true },
    _count: { movieId: true },
    having: { movieId: { _count: { gte: SEGMENT_MIN_VOTES } } },
    orderBy: [{ _avg: { score: "desc" } }, { _count: { movieId: "desc" } }],
    take: limit,
  });
  if (grouped.length === 0) return [];

  const movies = await db.movie.findMany({
    where: { id: { in: grouped.map((g) => g.movieId) } },
    select: {
      id: true,
      tmdbId: true,
      title: true,
      year: true,
      posterUrl: true,
      director: true,
      genres: { select: { name: true } },
    },
  });
  const byId = new Map(movies.map((m) => [m.id, m]));

  return grouped.flatMap((g) => {
    const movie = byId.get(g.movieId);
    if (!movie) return [];
    return [
      {
        ...movie,
        genres: movie.genres.map((genre) => genre.name),
        segmentAvg: parseFloat((g._avg.score ?? 0).toFixed(1)),
        segmentCount: g._count.movieId,
      },
    ];
  });
}

/** Si el segmento tiene al menos una película que mostrar (para el sitemap y `noindex`). */
export async function segmentHasRanking(config: DemographicSegmentConfig, currentYear = new Date().getFullYear()) {
  const any = await db.rating.groupBy({
    by: ["movieId"],
    where: segmentWhere(config, currentYear),
    having: { movieId: { _count: { gte: SEGMENT_MIN_VOTES } } },
    orderBy: { movieId: "asc" },
    take: 1,
  });
  return any.length > 0;
}
