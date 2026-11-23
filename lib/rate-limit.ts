import { db } from "./db";

/**
 * Limitación de peticiones por acción e identificador.
 *
 * El contador se persiste en base de datos en lugar de en memoria porque en un
 * entorno serverless cada instancia es efímera e independiente: un contador en
 * memoria se reinicia constantemente y no limita nada real.
 *
 * El coste de una escritura por petición es aceptable en los endpoints que
 * protegemos (registro, autenticación, restablecimiento, importación), que son
 * de bajo volumen y alto riesgo.
 */

export interface RateLimitRule {
  /** Peticiones permitidas dentro de la ventana. */
  limit: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
  /** Bloqueo adicional al superar el límite. Si se omite, solo se espera a que pase la ventana. */
  blockMs?: number;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const RATE_LIMITS = {
  /** Registro: la barrera principal contra la creación masiva de cuentas para manipular segmentos. */
  register: { limit: 5, windowMs: HOUR, blockMs: HOUR },
  /** Autenticación: protección contra fuerza bruta de contraseñas. */
  login: { limit: 10, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  /** Restablecimiento de contraseña: evita usarlo como canal de spam por email. */
  password_reset: { limit: 3, windowMs: HOUR, blockMs: HOUR },
  /** Reenvío de verificación de email. */
  resend_verification: { limit: 3, windowMs: HOUR },
  /** Valoraciones: un humano no vota 60 películas por minuto. */
  rating: { limit: 60, windowMs: MINUTE },
  /** Importación: cada importación consume cuota de la API de TMDB. */
  import: { limit: 3, windowMs: HOUR },
  /** Buzón de sugerencias. */
  feedback: { limit: 5, windowMs: HOUR },
  /** Denuncias de reseñas: evita el abuso masivo de reportes. */
  review_report: { limit: 5, windowMs: HOUR },
} satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Segundos que debe esperar el cliente. Se envía en la cabecera Retry-After. */
  retryAfterSeconds: number;
}

/**
 * Extrae la IP del cliente de las cabeceras del proxy.
 *
 * Detrás de Vercel, `x-forwarded-for` es fiable porque lo reescribe la propia
 * plataforma. En local suele venir vacío, y en ese caso se agrupan todas las
 * peticiones bajo una misma clave, que es el comportamiento deseado en
 * desarrollo.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // El primer valor de la lista es el cliente original.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Comprueba y consume una unidad de cuota.
 *
 * Ante un fallo de base de datos permite la petición: es preferible dejar pasar
 * tráfico legítimo a caer del todo por un problema en un mecanismo de defensa.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<RateLimitResult> {
  const rule: RateLimitRule = RATE_LIMITS[action];
  const key = `${action}:${identifier}`;
  const now = new Date();

  try {
    const existing = await db.rateLimit.findUnique({ where: { key } });

    if (existing?.blockedUntil && existing.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1000),
      };
    }

    const windowExpired = !existing || now.getTime() - existing.windowStart.getTime() >= rule.windowMs;

    if (windowExpired) {
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now, blockedUntil: null },
        update: { count: 1, windowStart: now, blockedUntil: null },
      });
      return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
    }

    if (existing.count >= rule.limit) {
      const blockedUntil = rule.blockMs ? new Date(now.getTime() + rule.blockMs) : null;
      await db.rateLimit.update({ where: { key }, data: { blockedUntil } });

      const retryMs = blockedUntil
        ? rule.blockMs!
        : rule.windowMs - (now.getTime() - existing.windowStart.getTime());

      return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil(retryMs / 1000) };
    }

    const updated = await db.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: Math.max(0, rule.limit - updated.count),
      retryAfterSeconds: 0,
    };
  } catch (error) {
    console.error(`[RateLimit] Fallo al comprobar la cuota de "${key}":`, error);
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
  }
}

/**
 * Respuesta estándar de cuota superada, con la cabecera Retry-After que esperan
 * los clientes HTTP.
 */
export function rateLimitResponse(result: RateLimitResult, message?: string): Response {
  return new Response(
    JSON.stringify({
      error:
        message ||
        `Has realizado demasiados intentos. Vuelve a probar en ${Math.ceil(result.retryAfterSeconds / 60)} minutos.`,
      retryAfter: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

/**
 * Restablece el contador de una clave, por ejemplo tras un inicio de sesión correcto.
 */
export async function resetRateLimit(action: RateLimitAction, identifier: string): Promise<void> {
  const key = `${action}:${identifier}`;
  try {
    await db.rateLimit.deleteMany({ where: { key } });
  } catch {
    // Silencio si falla el borrado
  }
}

/**
 * Elimina contadores caducados. Conviene invocarlo desde una tarea programada
 * para que la tabla no crezca de forma indefinida.
 */
export async function pruneRateLimits(olderThanMs = 24 * HOUR): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const { count } = await db.rateLimit.deleteMany({
    where: { windowStart: { lt: cutoff }, blockedUntil: null },
  });
  return count;
}
