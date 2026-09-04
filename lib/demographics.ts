/**
 * Núcleo de agregación demográfica de CinePOV.
 *
 * Dos principios rigen este módulo:
 *
 * 1. SEPARACIÓN REAL / ESTIMADO. Las valoraciones sintéticas de arranque
 *    (`isArtificial: true`) nunca se mezclan con las de personas reales en un
 *    mismo número. Se agregan por separado para que la interfaz pueda
 *    etiquetarlas y para que nunca contaminen contenido compartible ni informes.
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

/** Fila mínima necesaria para agregar. Mantener el `select` reducido a estos campos. */
export interface RatingRow {
  score: number;
  isArtificial: boolean;
  gender: string;
  birthYear: number;
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
  counts: { real: number; estimated: number; total: number };
  /** Máximo nivel desbloqueado con datos reales. La UI abre por defecto en este nivel. */
  maxLevel: GranularityLevel;
  progress: Record<Exclude<GranularityLevel, "global">, LevelProgress>;
  /** Agregados construidos SOLO con valoraciones de personas reales. */
  real: AggregatedBreakdown;
  /**
   * Agregados construidos SOLO con valoraciones sintéticas de arranque.
   * Nunca deben presentarse como opiniones de usuarios ni usarse en contenido
   * compartible, rankings públicos ni informes comerciales.
   */
  estimated: AggregatedBreakdown | null;
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

/** Convierte un año de nacimiento en su tramo de edad, o `null` si queda fuera. */
export function ageKeyFromBirthYear(birthYear: number, currentYear = new Date().getFullYear()): AgeKey | null {
  const age = currentYear - birthYear;
  if (age >= 18 && age <= 24) return "18_24";
  if (age >= 25 && age <= 34) return "25_34";
  if (age >= 35 && age <= 44) return "35_44";
  if (age >= 45 && age <= 54) return "45_54";
  if (age >= 55) return "55_plus";
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

function emptySegment(): Segment {
  return { avg: null, count: 0, missing: SEGMENT_MIN_VOTES };
}

function buildSegment(scores: number[], minVotes = SEGMENT_MIN_VOTES): Segment {
  const count = scores.length;
  if (count < minVotes) {
    return { avg: null, count, missing: minVotes - count };
  }
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return {
    avg: Math.round((sum / count) * 10) / 10,
    count,
    missing: 0,
  };
}

/**
 * Agrega un conjunto de valoraciones en todos los cortes demográficos.
 *
 * Función pura: no toca la base de datos, para poder probarla de forma aislada.
 * Las filas que llegan aquí deben ser homogéneas (todas reales o todas
 * sintéticas); mezclarlas rompería el principio de separación del módulo.
 */
export function aggregateBreakdown(rows: RatingRow[], currentYear = new Date().getFullYear()): AggregatedBreakdown {
  const globalScores: number[] = [];
  const genderScores = {} as Record<GenderKey, number[]>;
  const ageBroadScores = {} as Record<AgeBroadKey, number[]>;
  const ageScores = {} as Record<AgeKey, number[]>;
  const crossScores = {} as Record<GenderKey, Record<AgeKey, number[]>>;

  for (const g of GENDER_KEYS) {
    genderScores[g] = [];
    crossScores[g] = {} as Record<AgeKey, number[]>;
    for (const a of AGE_KEYS) crossScores[g][a] = [];
  }
  for (const b of AGE_BROAD_KEYS) ageBroadScores[b] = [];
  for (const a of AGE_KEYS) ageScores[a] = [];

  for (const row of rows) {
    globalScores.push(row.score);

    const gender = isGenderKey(row.gender) ? row.gender : null;
    if (gender) genderScores[gender].push(row.score);

    const ageKey = ageKeyFromBirthYear(row.birthYear, currentYear);
    if (ageKey) {
      ageScores[ageKey].push(row.score);
      ageBroadScores[ageBroadFromAgeKey(ageKey)].push(row.score);
      if (gender) crossScores[gender][ageKey].push(row.score);
    }
  }

  const byGender = {} as Record<GenderKey, Segment>;
  const cross = {} as Record<GenderKey, Record<AgeKey, Segment>>;
  for (const g of GENDER_KEYS) {
    byGender[g] = buildSegment(genderScores[g]);
    cross[g] = {} as Record<AgeKey, Segment>;
    for (const a of AGE_KEYS) cross[g][a] = buildSegment(crossScores[g][a]);
  }

  const byAgeBroad = {} as Record<AgeBroadKey, Segment>;
  for (const b of AGE_BROAD_KEYS) byAgeBroad[b] = buildSegment(ageBroadScores[b]);

  const byAgeRange = {} as Record<AgeKey, Segment>;
  for (const a of AGE_KEYS) byAgeRange[a] = buildSegment(ageScores[a]);

  return {
    // La nota global se muestra con un solo voto: no revela nada de nadie.
    global: buildSegment(globalScores, 1),
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

/** Construye la respuesta completa del endpoint de demografía a partir de las filas crudas. */
export function buildDemographicsPayload(
  movieId: string,
  rows: RatingRow[],
  currentYear = new Date().getFullYear()
): DemographicsPayload {
  const realRows = rows.filter((r) => !r.isArtificial);
  const estimatedRows = rows.filter((r) => r.isArtificial);

  const real = aggregateBreakdown(realRows, currentYear);
  const estimated = estimatedRows.length > 0 ? aggregateBreakdown(estimatedRows, currentYear) : null;
  const progress = computeProgress(real);

  return {
    movieId,
    counts: {
      real: realRows.length,
      estimated: estimatedRows.length,
      total: rows.length,
    },
    maxLevel: maxUnlockedLevel(progress),
    progress,
    real,
    estimated,
    thresholds: GRANULARITY_THRESHOLDS,
    segmentMinVotes: SEGMENT_MIN_VOTES,
  };
}

/**
 * Indica si una película tiene datos reales suficientes para aparecer en
 * contenido compartible o comercial (páginas virales, imágenes OG, informes).
 *
 * Regla vinculante de la sección 6.4 del plan: nunca se viraliza una estimación.
 */
export function isShareable(payload: DemographicsPayload): boolean {
  return payload.progress.gender.unlocked || payload.progress.age_broad.unlocked;
}
