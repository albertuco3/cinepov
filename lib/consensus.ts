/**
 * Algoritmo y utilidades para el "Modo Pareja / ¿Qué vemos esta noche?" (Fase 4.9).
 */

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
 * Construye la cláusula Prisma para filtrar un perfil demográfico.
 */
export function buildDemographicWhereClause(
  gender: string,
  ageBroad: string,
  currentYear: number
): any {
  const where: any = {
    emailVerified: { not: null },
    isAnonymized: false,
  };

  if (gender && gender !== "all") {
    where.gender = gender;
  }

  if (ageBroad && ageBroad !== "all") {
    if (ageBroad === "young") {
      // 18 a 34 años
      where.birthYear = {
        gte: currentYear - 34,
        lte: currentYear - 18,
      };
    } else if (ageBroad === "adult") {
      // 35 a 54 años
      where.birthYear = {
        gte: currentYear - 54,
        lte: currentYear - 35,
      };
    } else if (ageBroad === "senior") {
      // 55+ años
      where.birthYear = {
        lte: currentYear - 55,
      };
    }
  }

  return where;
}
