import { describe, it, expect } from "vitest";
import {
  getDecadeLabel,
  computeScoreHistogram,
  computeGenreStats,
  computeFavoriteDecade,
  computeDemographicTwin,
  buildCinematicProfile,
  type UserRatedMovie,
  type SegmentMovieAverage,
} from "./cinematic-profile";

describe("lib/cinematic-profile", () => {
  it("getDecadeLabel clasifica correctamente las décadas", () => {
    expect(getDecadeLabel(1994)).toBe("Años 90");
    expect(getDecadeLabel(1982)).toBe("Años 80");
    expect(getDecadeLabel(2008)).toBe("Años 2000");
    expect(getDecadeLabel(2019)).toBe("Años 2010");
    expect(getDecadeLabel(2023)).toBe("Años 2020");
  });

  it("computeScoreHistogram genera la frecuencia de notas del 1 al 10", () => {
    const ratings = [{ score: 8 }, { score: 8 }, { score: 10 }, { score: 4 }];
    const hist = computeScoreHistogram(ratings);
    expect(hist[8]).toBe(2);
    expect(hist[10]).toBe(1);
    expect(hist[4]).toBe(1);
    expect(hist[1]).toBe(0);
  });

  it("computeGenreStats extrae top y bottom géneros por nota media", () => {
    const movies: UserRatedMovie[] = [
      { id: "1", score: 9, year: 2010, genres: ["Ciencia ficción", "Drama"] },
      { id: "2", score: 8, year: 2012, genres: ["Ciencia ficción", "Acción"] },
      { id: "3", score: 4, year: 2015, genres: ["Terror"] },
      { id: "4", score: 5, year: 2020, genres: ["Comedia"] },
    ];
    const { topGenres, bottomGenres } = computeGenreStats(movies);
    expect(topGenres[0].genre).toBe("Drama");
    expect(topGenres[0].avgScore).toBe(9.0);
    expect(topGenres[1].genre).toBe("Ciencia ficción");
    expect(topGenres[1].avgScore).toBe(8.5);
    expect(bottomGenres[0].genre).toBe("Terror");
  });

  it("computeFavoriteDecade selecciona la década con mejor media y volumen", () => {
    const movies: UserRatedMovie[] = [
      { id: "1", score: 9, year: 1994, genres: ["Drama"] },
      { id: "2", score: 10, year: 1999, genres: ["Ciencia ficción"] },
      { id: "3", score: 6, year: 2015, genres: ["Comedia"] },
    ];
    const favorite = computeFavoriteDecade(movies);
    expect(favorite?.decadeLabel).toBe("Años 90");
    expect(favorite?.avgScore).toBe(9.5);
  });

  it("computeDemographicTwin identifica con precisión el segmento más afín", () => {
    const userRatings: UserRatedMovie[] = [
      { id: "m1", score: 9, year: 2010, genres: ["Drama"] },
      { id: "m2", score: 8, year: 2012, genres: ["Acción"] },
      { id: "m3", score: 4, year: 2015, genres: ["Terror"] },
    ];

    // Segmento A (Mujeres 25-34) tiene notas muy similares: 8.9, 7.9, 4.2
    // Segmento B (Hombres 45-54) tiene notas muy dispares: 5.0, 5.0, 9.0
    const averages: SegmentMovieAverage[] = [
      { segmentKey: "fem_25_34", segmentLabel: "Mujeres 25-34", movieId: "m1", avgScore: 8.9 },
      { segmentKey: "fem_25_34", segmentLabel: "Mujeres 25-34", movieId: "m2", avgScore: 7.9 },
      { segmentKey: "fem_25_34", segmentLabel: "Mujeres 25-34", movieId: "m3", avgScore: 4.2 },

      { segmentKey: "male_45_54", segmentLabel: "Hombres 45-54", movieId: "m1", avgScore: 5.0 },
      { segmentKey: "male_45_54", segmentLabel: "Hombres 45-54", movieId: "m2", avgScore: 5.0 },
      { segmentKey: "male_45_54", segmentLabel: "Hombres 45-54", movieId: "m3", avgScore: 9.0 },
    ];

    const twin = computeDemographicTwin(userRatings, averages);
    expect(twin).not.toBeNull();
    expect(twin?.segmentKey).toBe("fem_25_34");
    expect(twin?.segmentLabel).toBe("Mujeres 25-34");
    expect(twin?.affinityPercentage).toBeGreaterThanOrEqual(95);
  });

  it("buildCinematicProfile ensambla el perfil completo con métricas de generosidad", () => {
    const userRatings: UserRatedMovie[] = [
      { id: "m1", score: 8, year: 2010, genres: ["Drama"], globalAvg: 7.0 },
      { id: "m2", score: 9, year: 2012, genres: ["Drama"], globalAvg: 7.0 },
      { id: "m3", score: 7, year: 2015, genres: ["Acción"], globalAvg: 7.0 },
    ];

    const profile = buildCinematicProfile(userRatings);
    expect(profile.totalRatings).toBe(3);
    expect(profile.averageScore).toBe(8.0);
    expect(profile.generosity.globalAvg).toBe(7.0);
    expect(profile.generosity.diff).toBe(1.0);
    expect(profile.generosity.label).toContain("más generoso");
  });
});
