/**
 * Métricas de la beta que dependen de la base de datos (PostHog mide el
 * embudo y la retención; esto mide la salud del dataset). Funciones puras;
 * la carga de datos está en la página /admin/metrics.
 *
 * Umbrales del análisis crítico (preocupación A4): ningún segmento debe
 * superar el 40 % de la base, y cada tramo de edad debe tener al menos un 8 %.
 */
import {
  AGE_KEYS,
  GENDER_KEYS,
  ageKeyFromBirthYear,
  isGenderKey,
  type AgeKey,
  type DemographicsPayload,
  type GenderKey,
  type GranularityLevel,
} from "./demographics";

export const MAX_SEGMENT_SHARE = 0.4;
export const MIN_AGE_SHARE = 0.08;

export interface Share {
  count: number;
  share: number;
}

export interface DemographicDistribution {
  total: number;
  byGender: Record<GenderKey, Share>;
  byAge: Record<AgeKey, Share>;
  cross: Record<GenderKey, Record<AgeKey, Share>>;
  /** Segmentos (género × edad) por encima del 40 %. */
  overrepresented: string[];
  /** Tramos de edad por debajo del 8 %. */
  underrepresentedAges: AgeKey[];
}

const share = (count: number, total: number): Share => ({ count, share: total ? count / total : 0 });

/** Distribución de un conjunto de personas por género, tramo de edad y su cruce. */
export function demographicDistribution(
  people: { gender: string; birthYear: number }[],
  currentYear = new Date().getFullYear()
): DemographicDistribution {
  const genderCount = Object.fromEntries(GENDER_KEYS.map((g) => [g, 0])) as Record<GenderKey, number>;
  const ageCount = Object.fromEntries(AGE_KEYS.map((a) => [a, 0])) as Record<AgeKey, number>;
  const crossCount = Object.fromEntries(
    GENDER_KEYS.map((g) => [g, Object.fromEntries(AGE_KEYS.map((a) => [a, 0]))])
  ) as Record<GenderKey, Record<AgeKey, number>>;

  for (const p of people) {
    const gender = isGenderKey(p.gender) ? p.gender : null;
    const age = ageKeyFromBirthYear(p.birthYear, currentYear);
    if (gender) genderCount[gender]++;
    if (age) ageCount[age]++;
    if (gender && age) crossCount[gender][age]++;
  }

  const total = people.length;
  const cross = Object.fromEntries(
    GENDER_KEYS.map((g) => [g, Object.fromEntries(AGE_KEYS.map((a) => [a, share(crossCount[g][a], total)]))])
  ) as Record<GenderKey, Record<AgeKey, Share>>;

  return {
    total,
    byGender: Object.fromEntries(GENDER_KEYS.map((g) => [g, share(genderCount[g], total)])) as Record<GenderKey, Share>,
    byAge: Object.fromEntries(AGE_KEYS.map((a) => [a, share(ageCount[a], total)])) as Record<AgeKey, Share>,
    cross,
    overrepresented: total
      ? GENDER_KEYS.flatMap((g) => AGE_KEYS.filter((a) => cross[g][a].share > MAX_SEGMENT_SHARE).map((a) => `${g}:${a}`))
      : [],
    underrepresentedAges: total ? AGE_KEYS.filter((a) => ageCount[a] / total < MIN_AGE_SHARE) : [],
  };
}

/** Cuántas películas tienen cada nivel de granularidad como nivel máximo desbloqueado. */
export function levelCoverage(payloads: DemographicsPayload[]): Record<GranularityLevel, number> {
  const coverage: Record<GranularityLevel, number> = { global: 0, age_broad: 0, gender: 0, age_full: 0, cross: 0 };
  for (const p of payloads) coverage[p.maxLevel]++;
  return coverage;
}

/** Mediana de una lista de números (0 si está vacía). */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
