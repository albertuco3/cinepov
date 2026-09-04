import { describe, it, expect } from "vitest";
import {
  getAgeKeyFromBirthYear,
  getAgeRangeLabel,
  getGenderLabel,
  calculateAffinityScore,
} from "./recommendations";

describe("Motor de recomendaciones demográficas (lib/recommendations.ts)", () => {
  it("determina el rango de edad correcto a partir del año de nacimiento", () => {
    const currentYear = 2026;
    expect(getAgeKeyFromBirthYear(2004, currentYear)).toBe("18_24");
    expect(getAgeKeyFromBirthYear(1996, currentYear)).toBe("25_34");
    expect(getAgeKeyFromBirthYear(1986, currentYear)).toBe("35_44");
    expect(getAgeKeyFromBirthYear(1976, currentYear)).toBe("45_54");
    expect(getAgeKeyFromBirthYear(1960, currentYear)).toBe("55_plus");
  });

  it("devuelve etiquetas legibles para la cohorte demográfica", () => {
    expect(getGenderLabel("female")).toBe("Mujeres");
    expect(getGenderLabel("male")).toBe("Hombres");
    expect(getGenderLabel("non_binary")).toBe("Comunidad no binaria");

    expect(getAgeRangeLabel("18_24")).toBe("18 a 24 años");
    expect(getAgeRangeLabel("25_34")).toBe("25 a 34 años");
    expect(getAgeRangeLabel("55_plus")).toBe("más de 55 años");
  });

  it("calcula el porcentaje de afinidad estadística de forma coherente", () => {
    // Película con nota 9.0 y 5 votos
    const highAffinity = calculateAffinityScore(9.0, 5);
    expect(highAffinity).toBeGreaterThanOrEqual(85);
    expect(highAffinity).toBeLessThanOrEqual(98);

    // Película con nota media 6.0 sin votos en segmento
    const lowAffinity = calculateAffinityScore(6.0, 0);
    expect(lowAffinity).toBe(75);

    // No debe superar el 98% ni bajar del 60%
    expect(calculateAffinityScore(10, 20)).toBeLessThanOrEqual(98);
    expect(calculateAffinityScore(2, 5)).toBeGreaterThanOrEqual(60);
  });
});
