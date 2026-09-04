/**
 * Módulo de seguridad y protección contra abusos en CinePOV (Fase 3.6).
 * Incluye validación de campos trampa (honeypot) para formularios
 * y detección estadística de ráfagas coordinadas (review bombing).
 */

/**
 * Valida un campo trampa invisible (honeypot).
 * Los bots completan automáticamente todos los inputs del DOM, mientras que los humanos no los ven ni rellenan.
 * @param honeypotValue Valor del campo enviado por el formulario
 * @returns true si el valor está limpio (humano), false si fue rellenado por un bot
 */
export function validateHoneypot(honeypotValue?: string | null): boolean {
  if (!honeypotValue) return true;
  // Si contiene cualquier texto o espacio, es un bot
  return honeypotValue.trim().length === 0;
}

export interface ReviewBombingDetectionResult {
  isAnomaly: boolean;
  burstCount: number;
  extremeRatio: number;
  details?: string;
}

/**
 * Evalúa si se está produciendo un patrón anómalo de valoraciones extremas coordinadas (review bombing)
 * para una película en una ventana deslizante de 15 minutos.
 *
 * Criterios técnicos de alerta:
 * 1. Mínimo de 6 valoraciones en los últimos 15 minutos sobre la misma película.
 * 2. Más del 75% de esas valoraciones tienen notas extremas (1, 2, 9 o 10).
 * 3. Desviación marcada hacia el mismo extremo (ej. bombardeo masivo de notas 1).
 */
export async function checkReviewBombingAnomaly(
  movieId: string,
  newScore: number
): Promise<ReviewBombingDetectionResult> {
  try {
    const { db } = await import("@/lib/db");
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentRatings = await db.rating.findMany({
      where: {
        movieId,
        isArtificial: false,
        createdAt: { gte: fifteenMinutesAgo },
      },
      select: { score: true },
    });

    const scores = [...recentRatings.map((r) => r.score), newScore];
    const burstCount = scores.length;

    // Solo evaluar a partir de una masa crítica reciente
    if (burstCount < 6) {
      return { isAnomaly: false, burstCount, extremeRatio: 0 };
    }

    const extremeScores = scores.filter((s) => s <= 2 || s >= 9);
    const extremeRatio = extremeScores.length / burstCount;

    // Si más del 75% son notas extremas en 15 minutos, es un pico sospechoso
    if (extremeRatio >= 0.75) {
      const lowScores = scores.filter((s) => s <= 2).length;
      const highScores = scores.filter((s) => s >= 9).length;
      const isTargetedNegatively = lowScores / burstCount >= 0.6;
      const isTargetedPositively = highScores / burstCount >= 0.6;

      if (isTargetedNegatively || isTargetedPositively) {
        const direction = isTargetedNegatively ? "negativo (boicot)" : "positivo (inflado)";
        const details = `Alerta de review bombing ${direction}: ${burstCount} valoraciones en 15 min (${(extremeRatio * 100).toFixed(0)}% extremas)`;
        
        console.warn(`[ANTIABUSO] Película ${movieId}: ${details}`);

        return {
          isAnomaly: true,
          burstCount,
          extremeRatio,
          details,
        };
      }
    }

    return { isAnomaly: false, burstCount, extremeRatio };
  } catch (error) {
    console.error("Error al comprobar patrón de review bombing:", error);
    return { isAnomaly: false, burstCount: 0, extremeRatio: 0 };
  }
}
