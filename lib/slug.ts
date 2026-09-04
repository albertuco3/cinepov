/**
 * Utilidades para slugs amigables en URLs (SEO Técnico - Fase 4.5.3).
 */

/**
 * Convierte un título en un slug limpio para URLs.
 */
export function slugify(text: string): string {
  if (!text) return "";

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos y diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres no alfanuméricos por guion
    .replace(/^-+|-+$/g, ""); // Eliminar guiones iniciales y finales
}

/**
 * Parsea el parámetro de ruta de una película, admitiendo:
 * - "157336" (ID puro)
 * - "157336-interstellar" (ID compuesto con slug)
 */
export function parseMovieParam(param: string): { tmdbId: number | null; slug?: string } {
  if (!param) return { tmdbId: null };

  const match = param.match(/^(\d+)(?:-(.*))?$/);
  if (!match) {
    // Si no empieza por dígitos, intentamos parseInt por si acaso
    const num = parseInt(param, 10);
    return isNaN(num) ? { tmdbId: null } : { tmdbId: num };
  }

  const tmdbId = parseInt(match[1], 10);
  const slug = match[2] || undefined;

  return {
    tmdbId: isNaN(tmdbId) ? null : tmdbId,
    slug,
  };
}

/**
 * Construye la ruta canónica amigable de una película.
 */
export function buildCanonicalMoviePath(tmdbId: number, title?: string): string {
  if (!title) return `/movie/${tmdbId}`;
  const slug = slugify(title);
  return slug ? `/movie/${tmdbId}-${slug}` : `/movie/${tmdbId}`;
}
