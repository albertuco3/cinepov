/**
 * Lógica de negocio y cálculo estadístico para "Tu Perfil Cinematográfico"
 * y el algoritmo de "Tu Gemelo Demográfico" (Fase 4.4).
 */

export interface UserRatedMovie {
  id: string;
  score: number;
  year: number;
  genres: string[];
  globalAvg?: number | null;
}

export interface SegmentMovieAverage {
  segmentKey: string;
  segmentLabel: string;
  movieId: string;
  avgScore: number;
}

export interface GenreStat {
  genre: string;
  avgScore: number;
  count: number;
}

export interface DecadeStat {
  decadeLabel: string;
  avgScore: number;
  count: number;
}

export interface DemographicTwinResult {
  segmentKey: string;
  segmentLabel: string;
  affinityPercentage: number;
  moviesCompared: number;
  description: string;
}

export interface CinematicProfileData {
  totalRatings: number;
  averageScore: number;
  histogram: Record<number, number>;
  topGenres: GenreStat[];
  bottomGenres: GenreStat[];
  favoriteDecade: DecadeStat | null;
  generosity: {
    userAvg: number;
    globalAvg: number | null;
    diff: number | null;
    label: string;
  };
  twinSegment: DemographicTwinResult | null;
}

/**
 * Agrupa el año en etiqueta de década legible.
 */
export function getDecadeLabel(year: number): string {
  const decadeStart = Math.floor(year / 10) * 10;
  if (decadeStart === 2000) return "Años 2000";
  if (decadeStart === 2010) return "Años 2010";
  if (decadeStart === 2020) return "Años 2020";
  return `Años ${decadeStart % 100}`;
}

/**
 * Calcula el histograma de frecuencias de puntuaciones (1 a 10).
 */
export function computeScoreHistogram(ratings: { score: number }[]): Record<number, number> {
  const histogram: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
  };

  for (const r of ratings) {
    if (r.score >= 1 && r.score <= 10) {
      histogram[r.score] = (histogram[r.score] || 0) + 1;
    }
  }

  return histogram;
}

/**
 * Calcula las estadísticas por género (top y bottom).
 */
export function computeGenreStats(ratings: UserRatedMovie[]): {
  topGenres: GenreStat[];
  bottomGenres: GenreStat[];
} {
  const map = new Map<string, { total: number; count: number }>();

  for (const r of ratings) {
    for (const g of r.genres) {
      const current = map.get(g) || { total: 0, count: 0 };
      current.total += r.score;
      current.count += 1;
      map.set(g, current);
    }
  }

  const allGenres: GenreStat[] = Array.from(map.entries()).map(([genre, data]) => ({
    genre,
    avgScore: parseFloat((data.total / data.count).toFixed(1)),
    count: data.count,
  }));

  // Ordenar por nota media descendente; en empate, mayor número de votos
  allGenres.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.count - a.count;
  });

  const topGenres = allGenres.slice(0, 3);
  const bottomGenres = allGenres.length > 3 ? [...allGenres].reverse().slice(0, 3) : [];

  return { topGenres, bottomGenres };
}

/**
 * Determina la década favorita por promedio y volumen.
 */
export function computeFavoriteDecade(ratings: UserRatedMovie[]): DecadeStat | null {
  if (ratings.length === 0) return null;

  const map = new Map<string, { total: number; count: number }>();

  for (const r of ratings) {
    const label = getDecadeLabel(r.year);
    const cur = map.get(label) || { total: 0, count: 0 };
    cur.total += r.score;
    cur.count += 1;
    map.set(label, cur);
  }

  const list: DecadeStat[] = Array.from(map.entries()).map(([decadeLabel, data]) => ({
    decadeLabel,
    avgScore: parseFloat((data.total / data.count).toFixed(1)),
    count: data.count,
  }));

  list.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.count - a.count;
  });

  return list[0] || null;
}

/**
 * Algoritmo del "Gemelo Demográfico":
 * Compara las puntuaciones del usuario con las medias de cada segmento demográfico
 * en las mismas películas para encontrar la mayor afinidad estadística.
 */
export function computeDemographicTwin(
  ratings: UserRatedMovie[],
  segmentMovieAverages: SegmentMovieAverage[]
): DemographicTwinResult | null {
  if (ratings.length < 3) {
    return null;
  }

  const userScoresByMovie = new Map<string, number>();
  for (const r of ratings) {
    userScoresByMovie.set(r.id, r.score);
  }

  // Agrupar medias de segmento por clave
  const segments = new Map<
    string,
    { label: string; diffs: number[]; count: number }
  >();

  for (const item of segmentMovieAverages) {
    const userScore = userScoresByMovie.get(item.movieId);
    if (userScore !== undefined) {
      let seg = segments.get(item.segmentKey);
      if (!seg) {
        seg = { label: item.segmentLabel, diffs: [], count: 0 };
        segments.set(item.segmentKey, seg);
      }
      seg.diffs.push(Math.abs(userScore - item.avgScore));
      seg.count += 1;
    }
  }

  let bestMatch: DemographicTwinResult | null = null;
  let lowestMae = Infinity;

  for (const [key, data] of segments.entries()) {
    // Requerir al menos 3 coincidencias de películas con el segmento
    if (data.count < 3) continue;

    const mae = data.diffs.reduce((a, b) => a + b, 0) / data.count;
    // Escala de 0 a 9 (diferencia máxima posible entre 1 y 10)
    const affinity = Math.max(0, Math.min(100, Math.round((1 - mae / 9) * 100)));

    if (mae < lowestMae) {
      lowestMae = mae;
      bestMatch = {
        segmentKey: key,
        segmentLabel: data.label,
        affinityPercentage: affinity,
        moviesCompared: data.count,
        description: `Tus valoraciones coinciden en un ${affinity}% con las de ${data.label}.`,
      };
    }
  }

  return bestMatch;
}

/**
 * Ensambla el perfil cinematográfico completo.
 */
export function buildCinematicProfile(
  ratings: UserRatedMovie[],
  segmentMovieAverages: SegmentMovieAverage[] = []
): CinematicProfileData {
  const totalRatings = ratings.length;
  const userSum = ratings.reduce((sum, r) => sum + r.score, 0);
  const userAvg = totalRatings > 0 ? parseFloat((userSum / totalRatings).toFixed(1)) : 0;

  const histogram = computeScoreHistogram(ratings);
  const { topGenres, bottomGenres } = computeGenreStats(ratings);
  const favoriteDecade = computeFavoriteDecade(ratings);

  // Comparación con media global
  const ratedWithGlobal = ratings.filter((r) => typeof r.globalAvg === "number");
  let globalAvg: number | null = null;
  let diff: number | null = null;
  let generosityLabel = "Sin datos suficientes";

  if (ratedWithGlobal.length > 0) {
    const globalSum = ratedWithGlobal.reduce((sum, r) => sum + (r.globalAvg || 0), 0);
    globalAvg = parseFloat((globalSum / ratedWithGlobal.length).toFixed(1));
    diff = parseFloat((userAvg - globalAvg).toFixed(1));

    if (diff >= 0.5) {
      generosityLabel = `Eres un ${Math.round((diff / globalAvg) * 100)}% más generoso que la media (+${diff} pts)`;
    } else if (diff <= -0.5) {
      generosityLabel = `Eres un ${Math.abs(Math.round((diff / globalAvg) * 100))}% más exigente que la media (${diff} pts)`;
    } else {
      generosityLabel = "Criterio alineado con el consenso de la comunidad";
    }
  }

  const twinSegment = computeDemographicTwin(ratings, segmentMovieAverages);

  return {
    totalRatings,
    averageScore: userAvg,
    histogram,
    topGenres,
    bottomGenres,
    favoriteDecade,
    generosity: {
      userAvg,
      globalAvg,
      diff,
      label: generosityLabel,
    },
    twinSegment,
  };
}
