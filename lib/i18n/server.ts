import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE_NAME, type Locale } from "./types";
import { LOCALE_HEADER, PATHNAME_HEADER, isLocale, localesForPath, localizePath, negotiateLocale } from "./paths";
import { SITE_URL } from "@/lib/site";

/**
 * Idioma de la petición, resuelto en el servidor. Manda el prefijo de la URL
 * (que el middleware pasa en una cabecera); si no lo hay, la cookie elegida
 * por el usuario y, en último lugar, el idioma del navegador.
 *
 * Es la única forma de obtener el idioma en el servidor: no leas la cookie a mano.
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromUrl = headerStore.get(LOCALE_HEADER);
  if (isLocale(fromUrl)) return fromUrl;
  const cookieValue = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  return negotiateLocale(cookieValue, headerStore.get("accept-language"));
}

/** Ruta de la página actual sin prefijo de idioma ("/movie/1"), según el middleware. */
export async function getRequestPathname(): Promise<string | null> {
  return (await headers()).get(PATHNAME_HEADER);
}

/** `redirect()` a una ruta interna en el idioma de la petición. */
export async function localizedRedirect(path: string): Promise<never> {
  redirect(localizePath(path, await getRequestLocale()));
}

/**
 * Canónica y alternativas por idioma de una ruta sin prefijo, para los
 * metadatos. Solo se declaran los idiomas en los que la página está traducida;
 * si se pide en otro, la canónica apunta a la versión que existe. `x-default`
 * es la raíz sin prefijo, que redirige según el idioma de quien llega.
 */
export function localeAlternates(path: string, locale: Locale) {
  const available = localesForPath(path);
  const languages = Object.fromEntries(
    available.map((l) => [l, `${SITE_URL}${localizePath(path, l)}`])
  ) as Partial<Record<Locale, string>>;
  const canonicalLocale = available.includes(locale) ? locale : available[0];
  return {
    canonical: languages[canonicalLocale]!,
    languages: { ...languages, "x-default": `${SITE_URL}${path === "/" ? "" : path}` },
  };
}
