/**
 * Algoritmo y utilidades para el "Modo Pareja / ¿Qué vemos esta noche?" (Fase 4.9).
 */
import type { Prisma } from "@/app/generated/prisma/client";
import { isAgeBroadKey } from "./demographics";
import { COUNTED_USER_WHERE, segmentUserWhere } from "./rating-filters";

export interface DemographicProfileQuery {
  gender: string; // "all" | "female" | "male" | "non_binary"
  ageBroad: string; // "all" | "young" | "adult" | "senior"
}

/**
 * Calcula la nota de consenso entre dos puntuaciones demográficas.
 *
 * Fórmula:
 * Media aritmética penalizada por la discrepancia absoluta entre ambas notas:
 * Consenso = ((A + B) / 2) - (|A - B| / 2) = min(A, B)
 *
 * De este modo, para que una película obtenga una nota alta de consenso,
 * ambos segmentos DEBEN haberla valorado positivamente. Si uno la califica con 9
 * y el otro con 4, la nota resultante se penaliza fuertemente.
 */
export function computeConsensusScore(scoreA: number, scoreB: number): number {
  const avg = (scoreA + scoreB) / 2;
  const gap = Math.abs(scoreA - scoreB);
  const consensus = avg - gap / 2;
  return parseFloat(Math.max(1, Math.min(10, consensus)).toFixed(1));
}

/**
 * Filtro de usuarios de un perfil demográfico ("all" desactiva cada eje),
 * restringido a los usuarios cuyas valoraciones cuentan.
 */
export function buildDemographicWhereClause(
  gender: string,
  ageBroad: string,
  currentYear: number
): Prisma.UserWhereInput {
  return {
    ...COUNTED_USER_WHERE,
    ...segmentUserWhere(
      {
        gender: gender && gender !== "all" ? gender : undefined,
        ageBroad: isAgeBroadKey(ageBroad) ? ageBroad : undefined,
      },
      currentYear
    ),
  };
}
