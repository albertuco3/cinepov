import { Locale, Dictionary, DEFAULT_LOCALE } from "./types";
import { es } from "./dictionaries/es";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = {
  es,
  en,
};

/**
 * Obtiene el diccionario tipado correspondiente al locale indicado.
 * Si el locale no está soportado, hace fallback al idioma por defecto (es).
 */
export function getDictionary(locale?: string | null): Dictionary {
  if (locale === "en") {
    return dictionaries.en;
  }
  return dictionaries[DEFAULT_LOCALE];
}
