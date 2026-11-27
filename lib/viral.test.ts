import { describe, it, expect } from "vitest";
import { buildDemographicsPayload, ratingCell, type RatingCell } from "./demographics";
import { getNotableContrast, getTopDemographicContrast, isNotableGap } from "./viral";

const YEAR = 2026;

function row(score: number, gender: string, birthYear: number): RatingCell {
  return ratingCell(score, gender, birthYear);
}

function rows(n: number, score: number, gender: string, birthYear: number): RatingCell[] {
  return Array.from({ length: n }, () => row(score, gender, birthYear));
}

describe("getTopDemographicContrast", () => {
  it("devuelve null si la pelicula no tiene suficientes votos reales para ser compartible", () => {
    // Solo 2 votos
    const r = [row(8, "female", 2000), row(7, "male", 1990)];
    const payload = buildDemographicsPayload("m1", r, YEAR);
    expect(getTopDemographicContrast(payload)).toBeNull();
  });

  it("detecta la brecha de genero cuando esta desbloqueada y supera a otras", () => {
    // 10 mujeres jóvenes nota 9, 10 hombres jóvenes nota 6 (Total 20 votos reales)
    const r = [
      ...rows(10, 9, "female", 2000),
      ...rows(10, 6, "male", 2000),
    ];
    const payload = buildDemographicsPayload("m2", r, YEAR);
    const contrast = getTopDemographicContrast(payload);

    expect(contrast).not.toBeNull();
    expect(contrast?.type).toBe("gender");
    expect(contrast?.labelA).toBe("Mujeres");
    expect(contrast?.scoreA).toBe(9);
    expect(contrast?.labelB).toBe("Hombres");
    expect(contrast?.scoreB).toBe(6);
    expect(contrast?.difference).toBe(3);
    expect(contrast?.leadLabel).toBe("Mujeres");
  });

  it("prioriza la brecha generacional si la diferencia es mayor que la de genero", () => {
    // 6 mujeres jóvenes nota 9, 6 hombres jóvenes nota 8.8 (brecha genero 0.2)
    // 6 seniors hombres nota 3 (brecha generacional ~5.8)
    const r = [
      ...rows(6, 9, "female", 2002), // jovenes mujeres
      ...rows(6, 8.8, "male", 2002), // jovenes hombres
      ...rows(8, 3, "male", 1960),   // senior hombres
    ];
    const payload = buildDemographicsPayload("m3", r, YEAR);
    const contrast = getTopDemographicContrast(payload);

    expect(contrast).not.toBeNull();
    expect(contrast?.type).toBe("age_broad");
    expect(contrast?.labelA).toBe("Jóvenes (18-34)");
    expect(contrast?.labelB).toBe("Mayores (55+)");
    expect(contrast?.difference).toBeGreaterThan(4);
  });
});

describe("brechas reales", () => {
  const seg = (avg: number, count: number, variance: number) => ({ avg, count, missing: 0, variance });

  it("exige al menos un punto de diferencia", () => {
    expect(isNotableGap(seg(8, 50, 1), seg(7.2, 50, 1))).toBe(false);
    expect(isNotableGap(seg(8, 50, 1), seg(6.8, 50, 1))).toBe(true);
  });

  it("exige al menos cinco votos por grupo", () => {
    expect(isNotableGap(seg(9, 4, 0.5), seg(5, 40, 0.5))).toBe(false);
  });

  it("descarta las diferencias que pueden ser ruido de pocos votos muy dispersos", () => {
    // 1,5 puntos, pero con varianza 9 y 6 votos por grupo: z ≈ 0,87.
    expect(isNotableGap(seg(7.5, 6, 9), seg(6, 6, 9))).toBe(false);
  });

  it("marca como notable una brecha clara y la devuelve getNotableContrast", () => {
    const r = [
      ...rows(10, 9, "female", 2002),
      ...rows(10, 8, "male", 2002),
      ...rows(10, 5, "female", 1960),
      ...rows(10, 4, "male", 1960),
    ];
    const payload = buildDemographicsPayload("m4", r, YEAR);
    const notable = getNotableContrast(payload);
    expect(notable?.type).toBe("age_broad");
    expect(notable?.notable).toBe(true);
    expect(notable?.keyA).toBe("young");
  });

  it("sin brecha real, getNotableContrast devuelve null aunque haya datos", () => {
    const r = [
      ...rows(8, 7, "female", 2002),
      ...rows(8, 8, "male", 2002),
      ...rows(8, 7, "male", 1960),
      ...rows(8, 8, "female", 1960),
    ];
    const payload = buildDemographicsPayload("m5", r, YEAR);
    expect(getTopDemographicContrast(payload)).not.toBeNull();
    expect(getNotableContrast(payload)).toBeNull();
  });
});
