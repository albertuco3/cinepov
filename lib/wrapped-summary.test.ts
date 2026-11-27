import { describe, it, expect } from "vitest";
import { comparisonText, summarizeYear, type WrappedRating } from "./wrapped-summary";

let id = 0;
function rating(score: number, date: string, opts: { runtime?: number; genres?: string[]; watched?: string } = {}): WrappedRating {
  id++;
  return {
    score,
    createdAt: new Date(date),
    watchedAt: opts.watched ? new Date(opts.watched) : null,
    movieId: `m${id}`,
    movie: {
      tmdbId: id,
      title: `Película ${id}`,
      year: 2000,
      posterUrl: "",
      runtime: opts.runtime ?? 120,
      genres: (opts.genres ?? ["Drama"]).map((name) => ({ name })),
    },
  };
}

describe("summarizeYear", () => {
  it("sin valoraciones devuelve null", () => {
    expect(summarizeYear([], 2026)).toBeNull();
  });

  it("resume solo el año pedido, usando la fecha de visionado si existe", () => {
    const ratings = [
      rating(9, "2026-03-10"),
      rating(5, "2026-03-20"),
      rating(7, "2025-12-01", { watched: "2026-03-01" }), // vista en 2026
      rating(2, "2025-05-01"), // de otro año
    ];
    const s = summarizeYear(ratings, 2026)!;
    expect(s.year).toBe(2026);
    expect(s.totalMovies).toBe(3);
    expect(s.averageScore).toBe(7);
    expect(s.highestRated?.score).toBe(9);
    expect(s.lowestRated?.score).toBe(5);
    expect(s.mostActiveMonth).toBe("Marzo");
  });

  it("con menos de dos valoraciones en el año usa todo el historial", () => {
    const ratings = [rating(8, "2026-01-05"), rating(6, "2024-06-01"), rating(4, "2023-02-01")];
    const s = summarizeYear(ratings, 2026)!;
    expect(s.totalMovies).toBe(3);
    expect(s.year).toBe(2026); // el año de la valoración más reciente
  });

  it("calcula las horas con la duración real, y 110 minutos si falta", () => {
    const ratings = [rating(8, "2026-01-01", { runtime: 90 }), rating(8, "2026-01-02", { runtime: 0 })];
    expect(summarizeYear(ratings, 2026)!.totalHoursEstimated).toBe(Math.round((90 + 110) / 60));
  });

  it("elige el género más visto", () => {
    const ratings = [
      rating(8, "2026-01-01", { genres: ["Terror", "Drama"] }),
      rating(8, "2026-01-02", { genres: ["Terror"] }),
    ];
    expect(summarizeYear(ratings, 2026)!.favoriteGenre).toBe("Terror");
  });
});

describe("comparisonText", () => {
  it("distingue generoso, exigente y alineado con la comunidad", () => {
    expect(comparisonText(10, 1.1)).toContain("más generoso");
    expect(comparisonText(10, -1.4)).toContain("más exigente");
    expect(comparisonText(10, 0.2)).toContain("alineamiento");
    expect(comparisonText(10, null)).toBe("Has calificado 10 películas este año.");
  });
});
