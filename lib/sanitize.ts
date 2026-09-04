import DOMPurify from "isomorphic-dompurify";

/**
 * Saneado de las entradas de texto libre.
 *
 * React escapa el contenido al renderizar, así que el riesgo de XSS reflejado es
 * bajo. Esto es una segunda capa: evita almacenar contenido malicioso que
 * pudiera acabar en un contexto sin escapado (emails HTML, webhooks, informes,
 * o un futuro `dangerouslySetInnerHTML`).
 */

/**
 * Elimina cualquier etiqueta y devuelve solo texto plano, con los espacios
 * normalizados. Es lo que se aplica a nombres públicos y mensajes.
 */
export function sanitizeText(input: string): string {
  const withoutTags = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return withoutTags
    // Los caracteres de control invisibles se usan para suplantar nombres.
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sanea y recorta a una longitud máxima. */
export function sanitizeAndTruncate(input: string, maxLength: number): string {
  return sanitizeText(input).slice(0, maxLength);
}

export const LIMITS = {
  displayName: 40,
  feedbackMessage: 2000,
  reviewText: 2000,
  searchQuery: 120,
} as const;

/**
 * Valida un nombre público. Además de sanear, rechaza los nombres que solo
 * contienen signos y los que imitan cuentas del sistema.
 */
export function validateDisplayName(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof input !== "string") {
    return { ok: false, error: "El nombre público debe ser texto." };
  }

  const value = sanitizeAndTruncate(input, LIMITS.displayName);

  if (value.length < 2) {
    return { ok: false, error: "El nombre público debe tener al menos 2 caracteres." };
  }
  if (!/[\p{L}\p{N}]/u.test(value)) {
    return { ok: false, error: "El nombre público debe contener al menos una letra o un número." };
  }
  if (/^(cinepov|admin|administrador|moderador|soporte|bot)($|[\b_\W])/i.test(value)) {
    return { ok: false, error: "Ese nombre está reservado. Elige otro." };
  }

  return { ok: true, value };
}

/** Valida el mensaje del buzón de sugerencias. */
export function validateFeedbackMessage(
  input: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof input !== "string") {
    return { ok: false, error: "El mensaje debe ser texto." };
  }

  const value = sanitizeAndTruncate(input, LIMITS.feedbackMessage);

  if (value.length < 10) {
    return { ok: false, error: "Cuéntanos algo más: el mensaje debe tener al menos 10 caracteres." };
  }

  return { ok: true, value };
}
