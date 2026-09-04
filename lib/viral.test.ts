import { describe, it, expect } from "vitest";
import { buildDemographicsPayload, type RatingRow } from "./demographics";
import { getTopDemographicContrast } from "./viral";

const YEAR = 2026;

function row(score: number, gender: string, birthYear: number, isArtificial = false): RatingRow {
  return { score, gender, birthYear, isArtificial };
}

function rows(n: number, score: number, gender: string, birthYear: number): RatingRow[] {
  return Array.from({ length: n }, () => row(score, gender, birthYear, false));
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
    expect(contrast?.labelA).toBe("Jovenes (18-34)");
    expect(contrast?.labelB).toBe("Mayores (55+)");
    expect(contrast?.difference).toBeGreaterThan(4);
  });
});
