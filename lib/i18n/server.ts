import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type Locale } from "./types";

function isLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as string[]).includes(value);
}

/** Primer idioma soportado de una cabecera Accept-Language ("en-GB,en;q=0.9,es;q=0.8"). */
export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const languages = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return languages.map((l) => l.lang).find(isLocale) ?? null;
}

/**
 * Idioma de la petición, resuelto en el servidor: la cookie elegida por el
 * usuario y, si no hay, el idioma del navegador. Decidirlo aquí evita que la
 * página se pinte en un idioma y cambie al otro al hidratarse.
 *
 * Es la única forma de obtener el idioma en el servidor: no leas la cookie a mano.
 */
export async function getRequestLocale(): Promise<Locale> {
  const cookieValue = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  if (isLocale(cookieValue)) return cookieValue;
  return localeFromAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
}
