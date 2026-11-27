/**
 * Cálculo puro del resumen anual (sin base de datos), para poder probarlo.
 * La lectura de datos está en `lib/wrapped.ts`.
 */

export interface WrappedMovie {
  tmdbId: number;
  title: string;
  score: number;
  year: number;
  posterUrl: string;
}

export interface WrappedStats {
  year: number;
  totalMovies: number;
  totalHoursEstimated: number;
  averageScore: number;
  highestRated: WrappedMovie | null;
  lowestRated: WrappedMovie | null;
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
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Duración que se supone cuando TMDB no da la de una película. */
const DEFAULT_RUNTIME_MINUTES = 110;

/** Lo que el resumen necesita de cada valoración. */
export interface WrappedRating {
  score: number;
  createdAt: Date;
  watchedAt: Date | null;
  movieId: string;
  movie: {
    tmdbId: number;
    title: string;
    year: number;
    posterUrl: string;
    runtime: number;
    genres: { name: string }[];
  };
}

export type YearSummary = Omit<WrappedStats, "demographicComparison"> & { movieIds: string[] };

const toWrappedMovie = (r: WrappedRating): WrappedMovie => ({
  tmdbId: r.movie.tmdbId,
  title: r.movie.title,
  score: r.score,
  year: r.movie.year,
  posterUrl: r.movie.posterUrl,
});

/**
 * Resumen del año de un usuario a partir de sus valoraciones (ordenadas de la
 * más reciente a la más antigua). Si en el año pedido tiene menos de dos, usa
 * todo su historial. Devuelve null si no hay valoraciones.
 */
export function summarizeYear(ratings: WrappedRating[], year: number): YearSummary | null {
  if (ratings.length === 0) return null;

  let selected = ratings.filter((r) => (r.watchedAt ?? r.createdAt).getFullYear() === year);
  let effectiveYear = year;
  if (selected.length < 2) {
    selected = ratings;
    effectiveYear = ratings[0].createdAt.getFullYear();
  }

  const totalMinutes = selected.reduce((sum, r) => sum + (r.movie.runtime > 0 ? r.movie.runtime : DEFAULT_RUNTIME_MINUTES), 0);
  const averageScore = parseFloat((selected.reduce((sum, r) => sum + r.score, 0) / selected.length).toFixed(1));

  const byScore = [...selected].sort((a, b) => b.score - a.score);

  const genreCounts = new Map<string, number>();
  for (const r of selected) {
    for (const g of r.movie.genres) genreCounts.set(g.name, (genreCounts.get(g.name) ?? 0) + 1);
  }
  const favoriteGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const monthCounts = new Array<number>(12).fill(0);
  for (const r of selected) monthCounts[(r.watchedAt ?? r.createdAt).getMonth()]++;
  const topMonth = monthCounts.indexOf(Math.max(...monthCounts));

  return {
    year: effectiveYear,
    totalMovies: selected.length,
    totalHoursEstimated: Math.round(totalMinutes / 60),
    averageScore,
    highestRated: toWrappedMovie(byScore[0]),
    lowestRated: toWrappedMovie(byScore[byScore.length - 1]),
    favoriteGenre,
    mostActiveMonth: MONTH_NAMES[topMonth],
    movieIds: selected.map((r) => r.movieId),
  };
}

/** Texto que compara la nota media del usuario con la de la comunidad en las mismas películas. */
export function comparisonText(totalMovies: number, diff: number | null): string {
  if (diff === null) return `Has calificado ${totalMovies} películas este año.`;
  if (diff > 0.3) return `Has sido un cinéfilo más generoso que la media comunitaria (+${diff} puntos por encima).`;
  if (diff < -0.3) {
    return `Has tenido un criterio más exigente y crítico que la media de la comunidad (${diff} puntos por debajo).`;
  }
  return "Tu criterio ha estado en perfecto alineamiento con la media de la comunidad.";
}
