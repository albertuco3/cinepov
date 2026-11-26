/**
 * Saneado de las entradas de texto libre.
 *
 * Se guarda texto plano: sin etiquetas, pero sin escapar (un "&" sigue siendo
 * "&"). El escapado corresponde a quien inserta el texto en HTML: React lo hace
 * solo y los emails usan `escapeHtml` (lib/email.ts).
 *
 * No usa DOMPurify: en el servidor necesita jsdom, que en Vercel no carga
 * (las rutas que lo importaban devolvían un error 500 al arrancar), y además
 * devolvía el texto escapado ("Tom &amp; Jerry"), que luego se mostraba así.
 */

const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi;
const COMMENTS = /<!--[\s\S]*?-->/g;
const TAGS = /<\/?[a-z!][^<>]*>/gi;

/**
 * Quita las etiquetas HTML (y el contenido de script, style y similares).
 * Repite hasta que no queda ninguna, para que "<scr<script>ipt>" no
 * reconstruya una etiqueta al quitar la de dentro.
 */
export function stripTags(input: string): string {
  let out = input;
  let previous: string;
  do {
    previous = out;
    out = out.replace(DANGEROUS_BLOCKS, "").replace(COMMENTS, "").replace(TAGS, "");
  } while (out !== previous);
  return out;
}

/**
 * Elimina cualquier etiqueta y devuelve solo texto plano, con los espacios
 * normalizados. Es lo que se aplica a nombres públicos y mensajes.
 */
export function sanitizeText(input: string): string {
  return stripTags(input)
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
