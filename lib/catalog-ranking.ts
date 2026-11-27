import { TASTE, movieBase } from "./taste";

/**
 * Orden de las listas "las mejores películas de…" (género, década).
 *
 * Usa la misma base que el motor de gusto: la nota de TMDB cuenta como
 * `TASTE.MOVIE_PRIOR` votos y los votos de CinePOV la van desplazando. Así un
 * único 10 no pone una película por encima de todas, y una película sin votos
 * aún puede aparecer por su nota de TMDB. Puro, para poder probarlo; la lectura
 * de datos está en `catalog-ranking-db.ts`.
 */
export interface RankCandidate {
  id: string;
  tmdbRating: number | null;
}

export interface VoteStats {
  sum: number;
  count: number;
}

export interface RankedId {
  id: string;
  score: number;
  count: number;
}

export function rankByBase(
  candidates: RankCandidate[],
  stats: Map<string, VoteStats>,
  limit: number,
  globalMean: number = TASTE.DEFAULT_MEAN
): RankedId[] {
  return candidates
    .map((c) => {
      const s = stats.get(c.id) ?? { sum: 0, count: 0 };
      return { id: c.id, score: movieBase(s.sum, s.count, c.tmdbRating, globalMean), count: s.count };
    })
    .sort((a, b) => b.score - a.score || b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}
