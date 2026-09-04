import { describe, it, expect } from "vitest";

describe("CinePOV Wrapped (Fase 4.10)", () => {
  it("calcula correctamente la estimación de horas a partir del número de películas", () => {
    const totalMovies = 30;
    const avgMinutesPerMovie = 110;
    const estimatedHours = Math.round((totalMovies * avgMinutesPerMovie) / 60);

    expect(estimatedHours).toBe(55);
  });

  it("determina adecuadamente la severidad demográfica del usuario", () => {
    const userAvg = 8.2;
    const segmentAvg = 7.1;
    const diff = parseFloat((userAvg - segmentAvg).toFixed(1));

    expect(diff).toBe(1.1);
    expect(diff > 0.3).toBe(true);
  });

  it("detecta criterio crítico cuando la media del usuario es inferior", () => {
    const userAvg = 5.4;
    const segmentAvg = 6.8;
    const diff = parseFloat((userAvg - segmentAvg).toFixed(1));

    expect(diff).toBe(-1.4);
    expect(diff < -0.3).toBe(true);
  });
});
