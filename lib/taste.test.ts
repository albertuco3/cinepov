import { describe, it, expect } from "vitest";
import { TASTE, movieBase, predictScore, shrunkPearson, userBias, type CoRatingStats, type Neighbor } from "./taste";

function stats(pairs: [number, number][]): CoRatingStats {
  const s = { n: 0, sx: 0, sy: 0, sxy: 0, sxx: 0, syy: 0 };
  for (const [x, y] of pairs) {
    s.n++;
    s.sx += x;
    s.sy += y;
    s.sxy += x * y;
    s.sxx += x * x;
    s.syy += y * y;
  }
  return s;
}

describe("movieBase", () => {
  it("parte de la nota de TMDB cuando no hay votos", () => {
    expect(movieBase(0, 0, 8.2, 7)).toBeCloseTo(8.2);
  });

  it("se acerca a la media de CinePOV a medida que llegan votos", () => {
    const fewVotes = movieBase(5 * 4, 4, 8, 7); // 4 votos de 5
    const manyVotes = movieBase(5 * 400, 400, 8, 7);
    expect(fewVotes).toBeGreaterThan(7);
    expect(manyVotes).toBeCloseTo(5.07, 1);
  });

  it("usa la media global si no hay nota de TMDB", () => {
    expect(movieBase(0, 0, null, 6.5)).toBeCloseTo(6.5);
    expect(movieBase(0, 0, 0, 6.5)).toBeCloseTo(6.5);
  });
});

describe("userBias", () => {
  it("detecta a quien puntúa por encima de la base, con contracción", () => {
    const ratings: [string, number][] = [["a", 9], ["b", 9], ["c", 9], ["d", 9], ["e", 9]];
    // +2 en cada una, contraído: 10 / (5 + 5) = 1
    expect(userBias(ratings, () => 7)).toBeCloseTo(1);
  });

  it("es 0 sin valoraciones", () => {
    expect(userBias([], () => 7)).toBe(0);
  });
});

describe("shrunkPearson", () => {
  it("exige un mínimo de películas en común", () => {
    expect(shrunkPearson(stats([[8, 8], [6, 6], [9, 9]]))).toBeNull();
  });

  it("es positiva con gustos parecidos y negativa con gustos opuestos", () => {
    const same = shrunkPearson(stats([[9, 8], [3, 4], [7, 7], [5, 5], [8, 9]]))!;
    const opposite = shrunkPearson(stats([[9, 2], [3, 9], [7, 4], [5, 6], [8, 3]]))!;
    expect(same).toBeGreaterThan(0);
    expect(opposite).toBeLessThan(0);
  });

  it("contrae la similitud cuando hay pocas películas en común", () => {
    const pairs: [number, number][] = [[9, 9], [3, 3], [7, 7], [5, 5], [8, 8]];
    // Correlación perfecta, pero con 5 en común pesa 5 / 105.
    expect(shrunkPearson(stats(pairs))).toBeCloseTo(5 / (5 + TASTE.SIM_SHRINK));
  });

  it("es null si alguien pone la misma nota a todo", () => {
    expect(shrunkPearson(stats([[7, 9], [7, 3], [7, 6], [7, 5], [7, 8]]))).toBeNull();
  });
});

describe("predictScore", () => {
  const neighbor = (id: string, similarity: number, bias: number, ratings: [string, number][]): Neighbor => ({
    userId: id,
    similarity,
    bias,
    ratings: new Map(ratings),
  });

  it("sin vecinos que la hayan visto, predice base + sesgo personal", () => {
    expect(predictScore("m1", 7, 0.5, [])).toEqual({ score: 7.5, neighborCount: 0 });
  });

  it("los vecinos corrigen con lo que se desviaron de su propia línea base", () => {
    // Base 7; al vecino (sesgo 0) le encantó: 9 → corrección +2.
    const p = predictScore("m1", 7, 0, [neighbor("v", 0.3, 0, [["m1", 9]])]);
    expect(p).toEqual({ score: 9, neighborCount: 1 });
  });

  it("ignora a los vecinos con similitud no positiva", () => {
    const p = predictScore("m1", 7, 0, [neighbor("v", -0.4, 0, [["m1", 2]])]);
    expect(p).toEqual({ score: 7, neighborCount: 0 });
  });

  it("descuenta el sesgo del vecino: un 9 de quien lo puntúa todo alto dice menos", () => {
    const generous = predictScore("m1", 7, 0, [neighbor("v", 0.3, 2, [["m1", 9]])]);
    expect(generous.score).toBe(7);
  });

  it("se queda en la escala 1–10", () => {
    expect(predictScore("m1", 9.5, 2, []).score).toBe(10);
    expect(predictScore("m1", 1.5, -2, []).score).toBe(1);
  });

  it("usa como mucho K vecinos, los más parecidos", () => {
    const many = Array.from({ length: TASTE.K + 10 }, (_, i) => neighbor(`v${i}`, 0.1 + i / 1000, 0, [["m1", 8]]));
    expect(predictScore("m1", 7, 0, many).neighborCount).toBe(TASTE.K);
  });
});
