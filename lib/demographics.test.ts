import { describe, it, expect } from "vitest";
import {
  GRANULARITY_THRESHOLDS,
  SEGMENT_MIN_VOTES,
  aggregateBreakdown,
  ageBroadFromAgeKey,
  ageKeyFromBirthYear,
  buildDemographicsPayload,
  computeProgress,
  isShareable,
  maxUnlockedLevel,
  ratingCell,
  type RatingCell,
} from "./demographics";

/**
 * El cálculo demográfico es el corazón del producto y su modo de fallo más
 * peligroso es silencioso: un error de agregación produce números plausibles
 * pero falsos, que nadie detecta hasta que es tarde.
 */

const YEAR = 2026;

/** Una valoración individual, como celda de un voto. */
function row(score: number, gender: string, birthYear: number): RatingCell {
  return ratingCell(score, gender, birthYear);
}

/** Genera `n` valoraciones idénticas, para alcanzar umbrales con comodidad. */
function rows(n: number, score: number, gender: string, birthYear: number): RatingCell[] {
  return Array.from({ length: n }, () => row(score, gender, birthYear));
}

describe("ageKeyFromBirthYear", () => {
  it("clasifica cada tramo por su límite inferior y superior", () => {
    expect(ageKeyFromBirthYear(2008, YEAR)).toBe("18_24"); // 18 años
    expect(ageKeyFromBirthYear(2002, YEAR)).toBe("18_24"); // 24 años
    expect(ageKeyFromBirthYear(2001, YEAR)).toBe("25_34"); // 25 años
    expect(ageKeyFromBirthYear(1992, YEAR)).toBe("25_34"); // 34 años
    expect(ageKeyFromBirthYear(1991, YEAR)).toBe("35_44"); // 35 años
    expect(ageKeyFromBirthYear(1982, YEAR)).toBe("35_44"); // 44 años
    expect(ageKeyFromBirthYear(1981, YEAR)).toBe("45_54"); // 45 años
    expect(ageKeyFromBirthYear(1972, YEAR)).toBe("45_54"); // 54 años
    expect(ageKeyFromBirthYear(1971, YEAR)).toBe("55_plus"); // 55 años
    expect(ageKeyFromBirthYear(1940, YEAR)).toBe("55_plus");
  });

  it("descarta a los menores de 18 en lugar de asignarlos al tramo más bajo", () => {
    expect(ageKeyFromBirthYear(2009, YEAR)).toBeNull(); // 17 años
    expect(ageKeyFromBirthYear(2020, YEAR)).toBeNull();
  });

  it("recalcula el tramo al avanzar el año, sin almacenar la edad", () => {
    expect(ageKeyFromBirthYear(2002, 2026)).toBe("18_24"); // 24 años
    expect(ageKeyFromBirthYear(2002, 2027)).toBe("25_34"); // 25 años
  });
});

describe("ageBroadFromAgeKey", () => {
  it("agrupa los cinco tramos en tres generaciones", () => {
    expect(ageBroadFromAgeKey("18_24")).toBe("young");
    expect(ageBroadFromAgeKey("25_34")).toBe("young");
    expect(ageBroadFromAgeKey("35_44")).toBe("adult");
    expect(ageBroadFromAgeKey("45_54")).toBe("adult");
    expect(ageBroadFromAgeKey("55_plus")).toBe("senior");
  });
});

describe("aggregateBreakdown", () => {
  it("calcula la media global con un único voto", () => {
    const result = aggregateBreakdown([row(8, "male", 1995)], YEAR);
    expect(result.global.avg).toBe(8);
    expect(result.global.count).toBe(1);
  });

  it("redondea las medias a un decimal", () => {
    const result = aggregateBreakdown([row(7, "male", 1995), row(8, "male", 1995), row(8, "male", 1995)], YEAR);
    // 23 / 3 = 7.666...
    expect(result.byGender.male.avg).toBe(7.7);
  });

  it("oculta la nota de un segmento por debajo del mínimo e indica cuántos votos faltan", () => {
    const result = aggregateBreakdown([row(9, "female", 1995), row(9, "female", 1995)], YEAR);
    expect(result.byGender.female.avg).toBeNull();
    expect(result.byGender.female.count).toBe(2);
    expect(result.byGender.female.missing).toBe(SEGMENT_MIN_VOTES - 2);
  });

  it("cuenta a quien no declara género en la nota global pero en ningún segmento", () => {
    const result = aggregateBreakdown(rows(4, 6, "prefer_not_to_say", 1995), YEAR);
    expect(result.global.count).toBe(4);
    expect(result.global.avg).toBe(6);
    expect(result.byGender.male.count).toBe(0);
    expect(result.byGender.female.count).toBe(0);
    expect(result.byGender.non_binary.count).toBe(0);
    // Sí debe contar en los cortes por edad: la edad la ha declarado.
    expect(result.byAgeRange["25_34"].count).toBe(4);
  });

  it("excluye del todo a los menores de 18, incluso de la nota global", () => {
    const result = aggregateBreakdown([...rows(3, 10, "male", 2015), ...rows(3, 5, "male", 1995)], YEAR);
    // Los tres votos de menores sí entran en la global (han votado), pero no en tramos de edad.
    expect(result.global.count).toBe(6);
    expect(result.byAgeRange["25_34"].count).toBe(3);
    const totalPorTramo = Object.values(result.byAgeRange).reduce((acc, s) => acc + s.count, 0);
    expect(totalPorTramo).toBe(3);
  });

  it("reparte correctamente el cruce género × edad", () => {
    const result = aggregateBreakdown(
      [...rows(3, 9, "female", 2005), ...rows(3, 4, "male", 2005), ...rows(3, 7, "female", 1980)],
      YEAR
    );
    expect(result.cross.female["18_24"].avg).toBe(9);
    expect(result.cross.male["18_24"].avg).toBe(4);
    expect(result.cross.female["45_54"].avg).toBe(7);
    expect(result.cross.male["45_54"].count).toBe(0);
  });

  it("agrega la vista por generación sumando los tramos que la componen", () => {
    const result = aggregateBreakdown([...rows(3, 8, "male", 2005), ...rows(3, 6, "male", 1995)], YEAR);
    // 18-24 y 25-34 se agrupan en "young": (8*3 + 6*3) / 6 = 7
    expect(result.byAgeBroad.young.avg).toBe(7);
    expect(result.byAgeBroad.young.count).toBe(6);
    expect(result.byAgeBroad.adult.count).toBe(0);
  });
});

describe("agregación por celdas", () => {
  it("da el mismo resultado con celdas agregadas que con votos sueltos", () => {
    // La base de datos devuelve celdas (suma y recuento por género y año);
    // los tests construyen votos sueltos. Ambos caminos deben coincidir.
    const loose = [...rows(4, 9, "female", 1995), ...rows(2, 6, "female", 1995), ...rows(3, 7, "male", 1980)];
    const grouped: RatingCell[] = [
      { gender: "female", birthYear: 1995, sum: 4 * 9 + 2 * 6, count: 6 },
      { gender: "male", birthYear: 1980, sum: 3 * 7, count: 3 },
    ];
    expect(aggregateBreakdown(grouped, YEAR)).toEqual(aggregateBreakdown(loose, YEAR));
  });

  it("informa del número de valoraciones del payload", () => {
    const payload = buildDemographicsPayload("movie-1", [{ gender: "male", birthYear: 1995, sum: 32, count: 4 }], YEAR);
    expect(payload.counts).toEqual({ real: 4 });
    expect(payload.real.global.avg).toBe(8);
  });
});

describe("computeProgress y escalera de granularidad", () => {
  it("no desbloquea nada sin datos", () => {
    const progress = computeProgress(aggregateBreakdown([], YEAR));
    expect(maxUnlockedLevel(progress)).toBe("global");
  });

  it("desbloquea la vista por generación al alcanzar su umbral con dos generaciones viables", () => {
    const data = [
      ...rows(5, 8, "male", 2005), // young
      ...rows(5, 6, "male", 1980), // adult
    ];
    const progress = computeProgress(aggregateBreakdown(data, YEAR));
    expect(data.length).toBeGreaterThanOrEqual(GRANULARITY_THRESHOLDS.age_broad.minTotal);
    expect(progress.age_broad.unlocked).toBe(true);
  });

  it("no desbloquea un nivel si todos los votos caen en un único segmento", () => {
    // Volumen más que suficiente, pero solo hay un grupo: no hay nada que comparar.
    const progress = computeProgress(aggregateBreakdown(rows(200, 8, "male", 1995), YEAR));
    expect(progress.gender.unlocked).toBe(false);
    expect(progress.age_broad.unlocked).toBe(false);
  });

  it("desbloquea el género con dos géneros suficientemente representados", () => {
    const progress = computeProgress(
      aggregateBreakdown([...rows(10, 8, "male", 1995), ...rows(10, 6, "female", 1995)], YEAR)
    );
    expect(progress.gender.unlocked).toBe(true);
    expect(maxUnlockedLevel(progress)).not.toBe("global");
  });

  it("informa de cuántas valoraciones faltan para el nivel siguiente", () => {
    const progress = computeProgress(aggregateBreakdown(rows(6, 8, "male", 1995), YEAR));
    expect(progress.cross.current).toBe(6);
    expect(progress.cross.required).toBe(GRANULARITY_THRESHOLDS.cross.minTotal);
    expect(progress.cross.missing).toBe(GRANULARITY_THRESHOLDS.cross.minTotal - 6);
  });

  it("nunca devuelve un valor negativo de votos restantes", () => {
    const progress = computeProgress(
      aggregateBreakdown([...rows(300, 8, "male", 1995), ...rows(300, 6, "female", 1980)], YEAR)
    );
    expect(progress.age_broad.missing).toBe(0);
    expect(progress.cross.missing).toBe(0);
  });

  it("respeta el orden de la escalera: el cruce es el último en desbloquearse", () => {
    const data = [
      ...rows(15, 8, "male", 2005),
      ...rows(15, 7, "female", 2005),
      ...rows(15, 6, "male", 1980),
      ...rows(15, 9, "female", 1980),
    ];
    const progress = computeProgress(aggregateBreakdown(data, YEAR));
    expect(progress.age_broad.unlocked).toBe(true);
    expect(progress.gender.unlocked).toBe(true);
    // 60 valoraciones: por encima de age_full pero por debajo del umbral del cruce.
    expect(data.length).toBeLessThan(GRANULARITY_THRESHOLDS.cross.minTotal);
    expect(progress.cross.unlocked).toBe(false);
    expect(maxUnlockedLevel(progress)).toBe("age_full");
  });
});

describe("isShareable", () => {
  it("considera compartible una película con la brecha por generación desbloqueada", () => {
    const payload = buildDemographicsPayload(
      "m",
      [...rows(6, 9, "female", 2005), ...rows(6, 5, "female", 1980)],
      YEAR
    );
    expect(isShareable(payload)).toBe(true);
  });

  it("no considera compartible una película casi vacía", () => {
    const payload = buildDemographicsPayload("m", rows(2, 8, "male", 1995), YEAR);
    expect(isShareable(payload)).toBe(false);
  });
});
