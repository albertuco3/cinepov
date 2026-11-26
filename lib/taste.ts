/**
 * Motor "gente que puntúa como tú": predice la nota que le darías a una
 * película. Funciones puras; la lectura de la base de datos está en
 * `lib/taste-db.ts`.
 *
 * Es un KNN sobre una línea base (validado con MovieLens, ver
 * docs/validacion_movielens.md, sección 4):
 *
 *   predicción = base de la película + tu sesgo personal
 *              + corrección de los vecinos que la han valorado
 *
 * - Base de la película: parte de la nota de TMDB y se ajusta con los votos de
 *   CinePOV, para que funcione desde el primer día.
 * - Sesgo personal: cuánto te desvías, de media, de la base de lo que valoras.
 * - Vecinos: los más parecidos a ti (Pearson sobre películas en común) entre
 *   quienes han valorado esa película. Corrigen la predicción con cuánto se
 *   desviaron ellos de su propia línea base.
 */

export const TASTE = {
  /** Votos "virtuales" de la nota de TMDB en la base de cada película. */
  MOVIE_PRIOR: 10,
  /** Contracción del sesgo personal: con pocas valoraciones pesa poco. */
  USER_SHRINK: 5,
  /** Contracción de la similitud según el número de películas en común. */
  SIM_SHRINK: 100,
  /** Películas en común mínimas para considerar a alguien vecino. */
  MIN_OVERLAP: 5,
  /** Vecinos que se usan para cada película. */
  K: 40,
  /** Valoraciones mínimas para estimar la nota de alguien. */
  MIN_OWN_RATINGS: 5,
  /** Nota media por defecto si no hay datos (escala 1–10). */
  DEFAULT_MEAN: 7,
} as const;

/** Base de una película: la nota de TMDB como punto de partida, ajustada con los votos de CinePOV. */
export function movieBase(sum: number, count: number, tmdbRating: number | null, globalMean: number): number {
  const prior = tmdbRating && tmdbRating > 0 ? tmdbRating : globalMean;
  return (sum + TASTE.MOVIE_PRIOR * prior) / (count + TASTE.MOVIE_PRIOR);
}

/** Sesgo personal: desviación media frente a la base de las películas valoradas, contraída hacia 0. */
export function userBias(ratings: Iterable<[string, number]>, base: (movieId: string) => number): number {
  let sum = 0;
  let n = 0;
  for (const [movieId, score] of ratings) {
    sum += score - base(movieId);
    n++;
  }
  return sum / (n + TASTE.USER_SHRINK);
}

export interface CoRatingStats {
  /** Películas en común. */
  n: number;
  /** Sumas de mis notas (x) y las suyas (y) sobre esas películas. */
  sx: number;
  sy: number;
  sxy: number;
  sxx: number;
  syy: number;
}

/** Correlación de Pearson sobre las películas en común, contraída por su número. `null` si no es calculable. */
export function shrunkPearson({ n, sx, sy, sxy, sxx, syy }: CoRatingStats): number | null {
  if (n < TASTE.MIN_OVERLAP) return null;
  const cov = sxy - (sx * sy) / n;
  const varX = sxx - (sx * sx) / n;
  const varY = syy - (sy * sy) / n;
  if (varX <= 0 || varY <= 0) return null;
  return (cov / Math.sqrt(varX * varY)) * (n / (n + TASTE.SIM_SHRINK));
}

export interface Neighbor {
  userId: string;
  similarity: number;
  bias: number;
  ratings: Map<string, number>;
}

export interface Prediction {
  /** Nota estimada (escala 1–10, un decimal). */
  score: number;
  /** Vecinos que la han valorado y han entrado en la corrección. */
  neighborCount: number;
}

/** Nota estimada de una película para alguien con sesgo `bias`, dada la base y sus vecinos. */
export function predictScore(movieId: string, base: number, bias: number, neighbors: Neighbor[]): Prediction {
  const raters = neighbors
    .filter((n) => n.similarity > 0 && n.ratings.has(movieId))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TASTE.K);

  let num = 0;
  let den = 0;
  for (const n of raters) {
    num += n.similarity * (n.ratings.get(movieId)! - (base + n.bias));
    den += n.similarity;
  }

  const raw = base + bias + (den > 0 ? num / den : 0);
  return { score: Math.round(Math.min(10, Math.max(1, raw)) * 10) / 10, neighborCount: raters.length };
}
