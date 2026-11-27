import { describe, it, expect } from "vitest";
import { rankByBase } from "./catalog-ranking";

describe("rankByBase", () => {
  it("un único 10 no supera a una película con mejor nota de TMDB", () => {
    const ranked = rankByBase(
      [
        { id: "clasico", tmdbRating: 8.6 },
        { id: "un-voto", tmdbRating: 6.0 },
      ],
      new Map([["un-voto", { sum: 10, count: 1 }]]),
      10
    );
    expect(ranked.map((r) => r.id)).toEqual(["clasico", "un-voto"]);
  });

  it("muchos votos de CinePOV acaban pesando más que la nota de TMDB", () => {
    const ranked = rankByBase(
      [
        { id: "querida", tmdbRating: 7.0 },
        { id: "tmdb", tmdbRating: 8.0 },
      ],
      new Map([["querida", { sum: 9.5 * 100, count: 100 }]]),
      10
    );
    expect(ranked[0]).toMatchObject({ id: "querida", count: 100 });
  });

  it("sin nota de TMDB parte de la media global", () => {
    const [only] = rankByBase([{ id: "sin-tmdb", tmdbRating: null }], new Map(), 1, 6.5);
    expect(only.score).toBe(6.5);
  });

  it("corta al límite y desempata de forma estable", () => {
    const candidates = [
      { id: "b", tmdbRating: 7 },
      { id: "a", tmdbRating: 7 },
      { id: "c", tmdbRating: 5 },
    ];
    expect(rankByBase(candidates, new Map(), 2).map((r) => r.id)).toEqual(["a", "b"]);
  });
});
