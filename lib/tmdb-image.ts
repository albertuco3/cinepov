/**
 * Tamaños de imagen que sirve TMDB. Las URLs guardadas apuntan a `w500` (pósters)
 * u `original` (fondos); para miniaturas basta pedir una más pequeña al mismo
 * CDN: un póster en `w185` pesa unos 20 KB frente a 130 KB en `w500`.
 */
export type TmdbImageSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "w1280" | "original";

const TMDB_SIZE_SEGMENT = /(image\.tmdb\.org\/t\/p\/)(?:w\d+|original)\//;

/**
 * La misma imagen de TMDB en otro tamaño. Las URLs que no son de TMDB se
 * devuelven tal cual. Elige un ancho de al menos el doble del que se pinta, para
 * pantallas de alta densidad.
 */
export function tmdbImage(url: string, size: TmdbImageSize): string {
  return url.replace(TMDB_SIZE_SEGMENT, `$1${size}/`);
}
