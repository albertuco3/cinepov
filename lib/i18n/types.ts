/**
 * Tipos e interfaces para el sistema de internacionalización (i18n) de CinePOV (Fase 3.5).
 * Soporta bilingüismo en Español (es) e Inglés (en).
 */

import type { es } from "./dictionaries/es";

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";
export const SUPPORTED_LOCALES: Locale[] = ["es", "en"];
export const LOCALE_COOKIE_NAME = "cinepov_locale";

/**
 * Forma de los textos de la interfaz. Se deriva del diccionario español, que es
 * la referencia: una clave nueva se añade allí y el inglés no compila hasta que
 * la tenga (y tampoco admite claves que el español no tenga).
 */
export type Dictionary = typeof es;
