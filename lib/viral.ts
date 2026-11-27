import {
  AGE_BROAD_LABELS,
  type AgeBroadKey,
  type DemographicsPayload,
  type GenderKey,
  type Segment,
  isShareable,
} from "./demographics";

/**
 * Brechas entre grupos. "Cuando hay brecha, es noticia": solo se destaca una
 * diferencia si es real, con el mismo criterio que la validación con MovieLens
 * (docs/validacion_movielens.md): al menos un punto, al menos cinco votos por
 * grupo y que no se explique por azar (z de Welch ≥ 1,96).
 */
export const NOTABLE_GAP = {
  MIN_DIFFERENCE: 1.0,
  MIN_VOTES: 5,
  MIN_Z: 1.96,
} as const;

export type ContrastGroupKey = GenderKey | AgeBroadKey;

export interface DemographicContrast {
  type: "gender" | "age_broad";
  title: string;
  keyA: ContrastGroupKey;
  labelA: string;
  scoreA: number;
  countA: number;
  keyB: ContrastGroupKey;
  labelB: string;
  scoreB: number;
  countB: number;
  difference: number;
  leadLabel: string;
  /** Si la diferencia es una brecha real y no ruido de pocos votos. */
  notable: boolean;
}

const LABELS: Record<ContrastGroupKey, string> = {
  female: "Mujeres",
  male: "Hombres",
  non_binary: "No binarios",
  young: `Jóvenes (${AGE_BROAD_LABELS.young})`,
  adult: `Adultos (${AGE_BROAD_LABELS.adult})`,
  senior: `Mayores (${AGE_BROAD_LABELS.senior})`,
};

/** Si la diferencia entre dos grupos es una brecha real según `NOTABLE_GAP`. */
export function isNotableGap(a: Segment, b: Segment): boolean {
  if (a.avg === null || b.avg === null) return false;
  if (a.count < NOTABLE_GAP.MIN_VOTES || b.count < NOTABLE_GAP.MIN_VOTES) return false;
  const difference = Math.abs(a.avg - b.avg);
  if (difference < NOTABLE_GAP.MIN_DIFFERENCE) return false;
  if (a.variance === null || b.variance === null) return false;
  const standardError = Math.sqrt(a.variance / a.count + b.variance / b.count);
  // Sin dispersión en ninguno de los dos grupos, la diferencia es exacta.
  if (standardError === 0) return true;
  return difference / standardError >= NOTABLE_GAP.MIN_Z;
}

function contrast(
  type: DemographicContrast["type"],
  title: string,
  keyA: ContrastGroupKey,
  a: Segment,
  keyB: ContrastGroupKey,
  b: Segment
): DemographicContrast | null {
  if (a.avg === null || b.avg === null || a.count < 3 || b.count < 3) return null;
  return {
    type,
    title,
    keyA,
    labelA: LABELS[keyA],
    scoreA: a.avg,
    countA: a.count,
    keyB,
    labelB: LABELS[keyB],
    scoreB: b.avg,
    countB: b.count,
    difference: parseFloat(Math.abs(a.avg - b.avg).toFixed(1)),
    leadLabel: a.avg >= b.avg ? LABELS[keyA] : LABELS[keyB],
    notable: isNotableGap(a, b),
  };
}

/**
 * La mayor diferencia entre grupos de una película (generacional o de género),
 * con su indicador `notable`. Devuelve null si la película no tiene datos
 * suficientes para compartir: nunca se viraliza un dato no sólido.
 *
 * Las brechas reales van primero; entre ellas, y entre las que no lo son, gana
 * la mayor diferencia. La edad va antes que el género cuando empatan.
 */
export function getTopDemographicContrast(payload: DemographicsPayload): DemographicContrast | null {
  if (!isShareable(payload)) return null;

  const { byAgeBroad: age, byGender: gender } = payload.real;
  const candidates = [
    contrast("age_broad", "Brecha generacional", "young", age.young, "senior", age.senior),
    contrast("age_broad", "Brecha generacional", "young", age.young, "adult", age.adult),
    contrast("age_broad", "Brecha generacional", "adult", age.adult, "senior", age.senior),
    contrast("gender", "Brecha de género", "female", gender.female, "male", gender.male),
  ].filter((c): c is DemographicContrast => c !== null);

  if (candidates.length === 0) return null;
  candidates.sort((x, y) => Number(y.notable) - Number(x.notable) || y.difference - x.difference);
  return candidates[0];
}

/** La brecha real más llamativa de una película, o null si no la hay. */
export function getNotableContrast(payload: DemographicsPayload): DemographicContrast | null {
  const top = getTopDemographicContrast(payload);
  return top?.notable ? top : null;
}
