/**
 * Núcleo de agregación demográfica de CinePOV.
 *
 * Dos principios rigen este módulo:
 *
 * 1. SOLO DATOS REALES. Aquí solo llegan valoraciones que cuentan (personas
 *    reales con el email verificado, ver `lib/rating-filters.ts`). No existen
 *    estimaciones ni votos sintéticos: donde no hay datos, se muestra el
 *    progreso hacia tenerlos.
 *
 * 2. GRANULARIDAD PROGRESIVA. El desglose no es una feature binaria: es una
 *    escalera de precisión que se desbloquea según los datos REALES lo permiten.
 *    Con pocos votos se muestra la brecha por edad; el cruce completo llega
 *    cuando existe. El nivel bloqueado se muestra con su progreso, nunca oculto.
 */

export const GENDER_KEYS = ["male", "female", "non_binary"] as const;
export const AGE_KEYS = ["18_24", "25_34", "35_44", "45_54", "55_plus"] as const;
export const AGE_BROAD_KEYS = ["young", "adult", "senior"] as const;

export type GenderKey = (typeof GENDER_KEYS)[number];
export type AgeKey = (typeof AGE_KEYS)[number];
export type AgeBroadKey = (typeof AGE_BROAD_KEYS)[number];

/** Niveles de la escalera de granularidad, en orden de desbloqueo. */
export type GranularityLevel = "global" | "age_broad" | "gender" | "age_full" | "cross";

/**
 * Umbrales de valoraciones REALES necesarias para desbloquear cada nivel.
 *
 * El orden no es arbitrario: la brecha por edad amplia se desbloquea antes que
 * la de género porque se equilibra más rápido y es menos inflamable
 * reputacionalmente (ver preocupación B2 del análisis crítico).
 */
export const GRANULARITY_THRESHOLDS: Record<
  Exclude<GranularityLevel, "global">,
  { minTotal: number; minPerSegment: number }
> = {
  age_broad: { minTotal: 10, minPerSegment: 3 },
  gender: { minTotal: 20, minPerSegment: 5 },
  age_full: { minTotal: 50, minPerSegment: 5 },
  cross: { minTotal: 100, minPerSegment: 8 },
};

/** Umbral mínimo de valoraciones para que un segmento individual muestre su nota. */
export const SEGMENT_MIN_VOTES = 3;

/**
 * Votos agregados de un género y un año de nacimiento: suma de notas y número
 * de votos. Es exactamente lo que devuelve un `groupBy` de la base de datos,
 * así que el volumen de datos que viaja no depende del número de valoraciones
 * (como mucho, géneros × años de nacimiento).
 */
export interface RatingCell {
  gender: string;
  birthYear: number;
  sum: number;
  count: number;
}

/** Una valoración individual como celda de un solo voto. */
export function ratingCell(score: number, gender: string, birthYear: number): RatingCell {
  return { gender, birthYear, sum: score, count: 1 };
}

export interface Segment {
  avg: number | null;
  count: number;
  /** Votos que faltan para alcanzar el umbral mínimo del segmento. */
  missing: number;
}

export interface AggregatedBreakdown {
  global: Segment;
  byGender: Record<GenderKey, Segment>;
  byAgeBroad: Record<AgeBroadKey, Segment>;
  byAgeRange: Record<AgeKey, Segment>;
  cross: Record<GenderKey, Record<AgeKey, Segment>>;
}

export interface LevelProgress {
  unlocked: boolean;
  current: number;
  required: number;
  /** Valoraciones reales que faltan para desbloquear el nivel. */
  missing: number;
}

export interface DemographicsPayload {
  movieId: string;
  counts: { real: number };
  /** Máximo nivel desbloqueado. La UI abre por defecto en este nivel. */
  maxLevel: GranularityLevel;
  progress: Record<Exclude<GranularityLevel, "global">, LevelProgress>;
  /** Agregados de valoraciones de personas reales verificadas. */
  real: AggregatedBreakdown;
  thresholds: typeof GRANULARITY_THRESHOLDS;
  segmentMinVotes: number;
}

export const AGE_RANGE_LABELS: Record<AgeKey, string> = {
  "18_24": "18-24",
  "25_34": "25-34",
  "35_44": "35-44",
  "45_54": "45-54",
  "55_plus": "55+",
};

export const AGE_BROAD_LABELS: Record<AgeBroadKey, string> = {
  young: "18-34",
  adult: "35-54",
  senior: "55+",
};

export const GENDER_LABELS: Record<GenderKey, string> = {
  male: "Hombres",
  female: "Mujeres",
  non_binary: "No binarios",
};

/** Edades (inclusivas) de un tramo. `max: null` significa sin tope. */
export interface AgeRange {
  min: number;
  max: number | null;
}

/** Única definición de los tramos de edad. Los filtros de base de datos se derivan de aquí. */
export const AGE_RANGES: Record<AgeKey, AgeRange> = {
  "18_24": { min: 18, max: 24 },
  "25_34": { min: 25, max: 34 },
  "35_44": { min: 35, max: 44 },
  "45_54": { min: 45, max: 54 },
  "55_plus": { min: 55, max: null },
};

/** Tramos amplios: cada uno agrupa tramos completos de `AGE_RANGES`. */
export const AGE_BROAD_RANGES: Record<AgeBroadKey, AgeRange> = {
  young: { min: 18, max: 34 },
  adult: { min: 35, max: 54 },
  senior: { min: 55, max: null },
};

/** Convierte un año de nacimiento en su tramo de edad, o `null` si queda fuera. */
export function ageKeyFromBirthYear(birthYear: number, currentYear = new Date().getFullYear()): AgeKey | null {
  const age = currentYear - birthYear;
  for (const key of AGE_KEYS) {
    const { min, max } = AGE_RANGES[key];
    if (age >= min && (max === null || age <= max)) return key;
  }
  return null;
}

export function ageBroadFromAgeKey(ageKey: AgeKey): AgeBroadKey {
  if (ageKey === "18_24" || ageKey === "25_34") return "young";
  if (ageKey === "35_44" || ageKey === "45_54") return "adult";
  return "senior";
}

export function isGenderKey(gender: string): gender is GenderKey {
  return (GENDER_KEYS as readonly string[]).includes(gender);
}

export function isAgeKey(value: string): value is AgeKey {
  return (AGE_KEYS as readonly string[]).includes(value);
}

export function isAgeBroadKey(value: string): value is AgeBroadKey {
  return (AGE_BROAD_KEYS as readonly string[]).includes(value);
}

function emptySegment(): Segment {
  return { avg: null, count: 0, missing: SEGMENT_MIN_VOTES };
}

interface Accumulator {
  sum: number;
  count: number;
}

const newAccumulator = (): Accumulator => ({ sum: 0, count: 0 });

function addTo(acc: Accumulator, cell: RatingCell) {
  acc.sum += cell.sum;
  acc.count += cell.count;
}

function buildSegment({ sum, count }: Accumulator, minVotes = SEGMENT_MIN_VOTES): Segment {
  if (count < minVotes) {
    return { avg: null, count, missing: minVotes - count };
  }
  return {
    avg: Math.round((sum / count) * 10) / 10,
    count,
    missing: 0,
  };
}

/**
 * Agrega un conjunto de celdas en todos los cortes demográficos.
 *
 * Función pura: no toca la base de datos, para poder probarla de forma aislada.
 */
export function aggregateBreakdown(cells: RatingCell[], currentYear = new Date().getFullYear()): AggregatedBreakdown {
  const globalAcc = newAccumulator();
  const genderAcc = {} as Record<GenderKey, Accumulator>;
  const ageBroadAcc = {} as Record<AgeBroadKey, Accumulator>;
  const ageAcc = {} as Record<AgeKey, Accumulator>;
  const crossAcc = {} as Record<GenderKey, Record<AgeKey, Accumulator>>;

  for (const g of GENDER_KEYS) {
    genderAcc[g] = newAccumulator();
    crossAcc[g] = {} as Record<AgeKey, Accumulator>;
    for (const a of AGE_KEYS) crossAcc[g][a] = newAccumulator();
  }
  for (const b of AGE_BROAD_KEYS) ageBroadAcc[b] = newAccumulator();
  for (const a of AGE_KEYS) ageAcc[a] = newAccumulator();

  for (const cell of cells) {
    addTo(globalAcc, cell);

    const gender = isGenderKey(cell.gender) ? cell.gender : null;
    if (gender) addTo(genderAcc[gender], cell);

    const ageKey = ageKeyFromBirthYear(cell.birthYear, currentYear);
    if (ageKey) {
      addTo(ageAcc[ageKey], cell);
      addTo(ageBroadAcc[ageBroadFromAgeKey(ageKey)], cell);
      if (gender) addTo(crossAcc[gender][ageKey], cell);
    }
  }

  const byGender = {} as Record<GenderKey, Segment>;
  const cross = {} as Record<GenderKey, Record<AgeKey, Segment>>;
  for (const g of GENDER_KEYS) {
    byGender[g] = buildSegment(genderAcc[g]);
    cross[g] = {} as Record<AgeKey, Segment>;
    for (const a of AGE_KEYS) cross[g][a] = buildSegment(crossAcc[g][a]);
  }

  const byAgeBroad = {} as Record<AgeBroadKey, Segment>;
  for (const b of AGE_BROAD_KEYS) byAgeBroad[b] = buildSegment(ageBroadAcc[b]);

  const byAgeRange = {} as Record<AgeKey, Segment>;
  for (const a of AGE_KEYS) byAgeRange[a] = buildSegment(ageAcc[a]);

  return {
    // La nota global se muestra con un solo voto: no revela nada de nadie.
    global: buildSegment(globalAcc, 1),
    byGender,
    byAgeBroad,
    byAgeRange,
    cross,
  };
}

export function emptyBreakdown(): AggregatedBreakdown {
  const byGender = {} as Record<GenderKey, Segment>;
  const cross = {} as Record<GenderKey, Record<AgeKey, Segment>>;
  for (const g of GENDER_KEYS) {
    byGender[g] = emptySegment();
    cross[g] = {} as Record<AgeKey, Segment>;
    for (const a of AGE_KEYS) cross[g][a] = emptySegment();
  }
  const byAgeBroad = {} as Record<AgeBroadKey, Segment>;
  for (const b of AGE_BROAD_KEYS) byAgeBroad[b] = emptySegment();
  const byAgeRange = {} as Record<AgeKey, Segment>;
  for (const a of AGE_KEYS) byAgeRange[a] = emptySegment();

  return {
    global: { avg: null, count: 0, missing: 1 },
    byGender,
    byAgeBroad,
    byAgeRange,
    cross,
  };
}

/**
 * Calcula qué niveles de granularidad están desbloqueados con los datos reales.
 *
 * Un nivel exige dos condiciones: volumen total suficiente y que al menos dos
 * segmentos del nivel superen su mínimo. Lo segundo evita el caso degenerado de
 * "desbloqueado" con todos los votos concentrados en un único segmento, que
 * daría una comparación sin nada con lo que comparar.
 */
export function computeProgress(
  real: AggregatedBreakdown
): Record<Exclude<GranularityLevel, "global">, LevelProgress> {
  const total = real.global.count;

  const countViable = (segments: Segment[], minPerSegment: number) =>
    segments.filter((s) => s.count >= minPerSegment).length;

  const build = (
    level: Exclude<GranularityLevel, "global">,
    viableSegments: number
  ): LevelProgress => {
    const { minTotal } = GRANULARITY_THRESHOLDS[level];
    const unlocked = total >= minTotal && viableSegments >= 2;
    return {
      unlocked,
      current: total,
      required: minTotal,
      missing: Math.max(0, minTotal - total),
    };
  };

  const crossSegments = GENDER_KEYS.flatMap((g) => AGE_KEYS.map((a) => real.cross[g][a]));

  return {
    age_broad: build(
      "age_broad",
      countViable(AGE_BROAD_KEYS.map((b) => real.byAgeBroad[b]), GRANULARITY_THRESHOLDS.age_broad.minPerSegment)
    ),
    gender: build(
      "gender",
      countViable(GENDER_KEYS.map((g) => real.byGender[g]), GRANULARITY_THRESHOLDS.gender.minPerSegment)
    ),
    age_full: build(
      "age_full",
      countViable(AGE_KEYS.map((a) => real.byAgeRange[a]), GRANULARITY_THRESHOLDS.age_full.minPerSegment)
    ),
    cross: build("cross", countViable(crossSegments, GRANULARITY_THRESHOLDS.cross.minPerSegment)),
  };
}

/** Devuelve el nivel más alto desbloqueado, que es el que la UI abre por defecto. */
export function maxUnlockedLevel(
  progress: Record<Exclude<GranularityLevel, "global">, LevelProgress>
): GranularityLevel {
  if (progress.cross.unlocked) return "cross";
  if (progress.age_full.unlocked) return "age_full";
  if (progress.gender.unlocked) return "gender";
  if (progress.age_broad.unlocked) return "age_broad";
  return "global";
}

/** Construye la respuesta completa del endpoint de demografía a partir de las celdas agregadas. */
export function buildDemographicsPayload(
  movieId: string,
  cells: RatingCell[],
  currentYear = new Date().getFullYear()
): DemographicsPayload {
  const real = aggregateBreakdown(cells, currentYear);
  const progress = computeProgress(real);

  return {
    movieId,
    counts: { real: real.global.count },
    maxLevel: maxUnlockedLevel(progress),
    progress,
    real,
    thresholds: GRANULARITY_THRESHOLDS,
    segmentMinVotes: SEGMENT_MIN_VOTES,
  };
}

/**
 * Indica si una película tiene datos suficientes para aparecer en contenido
 * compartible o comercial (páginas virales, imágenes OG, informes): al menos
 * una comparación desbloqueada, para no viralizar ruido.
 */
export function isShareable(payload: DemographicsPayload): boolean {
  return payload.progress.gender.unlocked || payload.progress.age_broad.unlocked;
}
