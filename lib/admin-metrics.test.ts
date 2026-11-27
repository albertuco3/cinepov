import { describe, it, expect } from "vitest";
import { buildDemographicsPayload, ratingCell } from "./demographics";
import { demographicDistribution, levelCoverage, median } from "./admin-metrics";

const YEAR = 2026;

describe("demographicDistribution", () => {
  it("reparte por género, edad y cruce, con su proporción", () => {
    const d = demographicDistribution(
      [
        { gender: "female", birthYear: 2000 }, // 26 → 25_34
        { gender: "female", birthYear: 1960 }, // 66 → 55_plus
        { gender: "male", birthYear: 2000 },
        { gender: "male", birthYear: 1980 }, // 46 → 45_54
      ],
      YEAR
    );
    expect(d.total).toBe(4);
    expect(d.byGender.female).toEqual({ count: 2, share: 0.5 });
    expect(d.byAge["25_34"]).toEqual({ count: 2, share: 0.5 });
    expect(d.cross.male["45_54"]).toEqual({ count: 1, share: 0.25 });
  });

  it("señala segmentos por encima del 40 % y tramos de edad por debajo del 8 %", () => {
    const people = [
      ...Array.from({ length: 6 }, () => ({ gender: "male", birthYear: 2000 })),
      ...Array.from({ length: 4 }, () => ({ gender: "female", birthYear: 1990 })),
    ];
    const d = demographicDistribution(people, YEAR);
    expect(d.overrepresented).toEqual(["male:25_34"]);
    expect(d.underrepresentedAges).toEqual(["18_24", "45_54", "55_plus"]);
  });

  it("cuenta en el total a quien no declara género, aunque no entre en ningún segmento", () => {
    const d = demographicDistribution([{ gender: "prefer_not_to_say", birthYear: 1990 }], YEAR);
    expect(d.total).toBe(1);
    expect(d.byGender.male.count + d.byGender.female.count + d.byGender.non_binary.count).toBe(0);
    expect(d.byAge["35_44"].count).toBe(1);
  });

  it("sin personas no da alertas ni divide entre cero", () => {
    const d = demographicDistribution([], YEAR);
    expect(d.byGender.male.share).toBe(0);
    expect(d.overrepresented).toEqual([]);
    expect(d.underrepresentedAges).toEqual([]);
  });
});

describe("levelCoverage", () => {
  it("cuenta películas por nivel máximo desbloqueado", () => {
    const empty = buildDemographicsPayload("a", [], YEAR);
    const some = buildDemographicsPayload(
      "b",
      [...Array.from({ length: 6 }, () => ratingCell(8, "male", 2005)), ...Array.from({ length: 6 }, () => ratingCell(6, "male", 1980))],
      YEAR
    );
    const coverage = levelCoverage([empty, some]);
    expect(coverage.global).toBe(1);
    expect(coverage[some.maxLevel]).toBeGreaterThanOrEqual(1);
  });
});

describe("median", () => {
  it("calcula la mediana", () => {
    expect(median([])).toBe(0);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});
