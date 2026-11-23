import { Prisma } from "@/app/generated/prisma/client";
import {
  AGE_BROAD_RANGES,
  AGE_RANGES,
  type AgeBroadKey,
  type AgeKey,
  type AgeRange,
} from "./demographics";

/**
 * Qué valoraciones cuentan para cualquier número público: fichas, rankings,
 * contenido compartible, emails e informes. Son las de personas reales con el
 * email verificado (la verificación es la barrera básica contra el review
 * bombing).
 *
 * Las cuentas anonimizadas tras ejercer el derecho de supresión siguen
 * contando: el borrado de cuenta conserva sus valoraciones desvinculadas de la
 * identidad, precisamente para no perder los agregados.
 *
 * Es la única definición del proyecto. No copies el filtro: impórtalo.
 */
export const COUNTED_USER_WHERE = {
  emailVerified: { not: null },
} as const satisfies Prisma.UserWhereInput;

/**
 * La misma definición en SQL, para las consultas agregadas que Prisma no puede
 * expresar (agrupar por campos del usuario). Supone los alias `r` para
 * "Rating" y `u` para "User". Si cambias `countedRatingWhere`, cambia esto.
 */
export const COUNTED_RATING_SQL = Prisma.sql`r."isArtificial" = false AND u."emailVerified" IS NOT NULL`;

/** Filtro de valoraciones que cuentan, opcionalmente restringido a un segmento de usuarios. */
export function countedRatingWhere(user: Prisma.UserWhereInput = {}): Prisma.RatingWhereInput {
  return {
    isArtificial: false,
    user: { ...COUNTED_USER_WHERE, ...user },
  };
}

/** Traduce un tramo de edad a un filtro sobre el año de nacimiento. */
export function birthYearFilter(range: AgeRange, currentYear: number): Prisma.IntFilter {
  const youngestBirthYear = currentYear - range.min;
  if (range.max === null) return { lte: youngestBirthYear };
  return { gte: currentYear - range.max, lte: youngestBirthYear };
}

export interface SegmentFilter {
  gender?: string;
  ageKey?: AgeKey;
  ageBroad?: AgeBroadKey;
}

/** Filtro de usuarios de un segmento demográfico (género, tramo de edad o tramo amplio). */
export function segmentUserWhere(
  segment: SegmentFilter,
  currentYear = new Date().getFullYear()
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (segment.gender) where.gender = segment.gender;

  const range = segment.ageKey
    ? AGE_RANGES[segment.ageKey]
    : segment.ageBroad
      ? AGE_BROAD_RANGES[segment.ageBroad]
      : null;
  if (range) where.birthYear = birthYearFilter(range, currentYear);

  return where;
}
