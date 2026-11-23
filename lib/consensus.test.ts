import { describe, it, expect } from "vitest";
import { computeConsensusScore, buildDemographicWhereClause } from "./consensus";

describe("lib/consensus", () => {
  it("computeConsensusScore premia el acuerdo mutuo de notas altas", () => {
    // Si ambos dan un 9.0, el consenso es 9.0
    expect(computeConsensusScore(9.0, 9.0)).toBe(9.0);
    // Si dan 8.5 y 8.5, el consenso es 8.5
    expect(computeConsensusScore(8.5, 8.5)).toBe(8.5);
  });

  it("computeConsensusScore penaliza fuertemente las discrepancias", () => {
    // 10 y 4 da 4.0 porque no hay consenso
    expect(computeConsensusScore(10.0, 4.0)).toBe(4.0);
    // 8.0 y 6.0 da 6.0
    expect(computeConsensusScore(8.0, 6.0)).toBe(6.0);
  });

  it("buildDemographicWhereClause genera los filtros de edad y género adecuados", () => {
    const clause = buildDemographicWhereClause("female", "young", 2026);
    expect(clause.gender).toBe("female");
    expect(clause.birthYear).toEqual({ gte: 1992, lte: 2008 });
  });

  it("buildDemographicWhereClause maneja valores 'all'", () => {
    const clause = buildDemographicWhereClause("all", "all", 2026);
    expect(clause.gender).toBeUndefined();
    expect(clause.birthYear).toBeUndefined();
    expect(clause.emailVerified).toEqual({ not: null });
  });
});
