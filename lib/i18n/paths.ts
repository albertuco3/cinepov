import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./types";

/**
 * URLs con prefijo de idioma: /es/... y /en/...
 *
 * Las rutas reales de la app no llevan prefijo (app/movie/[id], app/explore…):
 * el middleware (proxy.ts) recibe /es/movie/1, fija el idioma y reescribe
 * internamente a /movie/1. Así cada idioma tiene su propia URL indexable y
 * `hreflang` funciona, sin duplicar el árbol de rutas.
 */

/** Cabeceras que fija el middleware al reescribir /es/... y /en/... */
export const LOCALE_HEADER = "x-cinepov-locale";
export const PATHNAME_HEADER = "x-cinepov-pathname";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as string[]).includes(value);
}

/** Separa el prefijo de idioma: "/en/movie/1" → { locale: "en", rest: "/movie/1" }. */
export function splitLocale(pathname: string): { locale: Locale | null; rest: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (match && isLocale(match[1])) {
    return { locale: match[1], rest: match[2] || "/" };
  }
  return { locale: null, rest: pathname };
}

/**
 * Rutas que nunca llevan prefijo: la API, los recursos de Next, el widget
 * embebible (sus URLs las copian terceros), las imágenes OG generadas y
 * cualquier fichero con extensión (sitemap.xml, robots.txt, iconos…).
 */
export function isLocalizablePath(pathname: string): boolean {
  if (/^\/(api|_next|embed)(\/|$)/.test(pathname)) return false;
  if (/\/(opengraph-image|twitter-image)(-\w+)?$/.test(pathname)) return false;
  const lastSegment = pathname.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return false;
  return true;
}

/**
 * Añade el prefijo de idioma a un enlace interno. Deja intactos los enlaces
 * externos, las anclas, las rutas no localizables y los que ya lo llevan.
 */
export function localizePath(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;

  const cut = href.search(/[?#]/);
  const pathname = cut === -1 ? href : href.slice(0, cut);
  const suffix = cut === -1 ? "" : href.slice(cut);

  if (!isLocalizablePath(pathname) || splitLocale(pathname).locale) return href;
  return `/${locale}${pathname === "/" ? "" : pathname}${suffix}`;
}

/** Misma página en otro idioma: "/es/movie/1?x=1" → "/en/movie/1?x=1". */
export function swapLocale(href: string, locale: Locale): string {
  const cut = href.search(/[?#]/);
  const pathname = cut === -1 ? href : href.slice(0, cut);
  const suffix = cut === -1 ? "" : href.slice(cut);
  return localizePath(splitLocale(pathname).rest + suffix, locale);
}

/**
 * Rutas con la interfaz traducida a todos los idiomas. El resto existe solo en
 * español (textos legales, metodología, blog, polarizantes…): su versión /en/
 * se sirve, pero no se declara como traducción y su canónica apunta a /es/.
 * Al traducir una página, añádela aquí.
 */
export const TRANSLATED_ROUTES = [
  "/",
  "/explore",
  "/rankings",
  "/movie",
  "/tonight",
  "/recommendations",
  "/onboarding",
  "/welcome",
  "/login",
  "/register",
];

/** Idiomas en los que existe una ruta sin prefijo ("/movie/1" → ["es", "en"]). */
export function localesForPath(path: string): Locale[] {
  const translated = TRANSLATED_ROUTES.some((r) => (r === "/" ? path === "/" : path === r || path.startsWith(`${r}/`)));
  return translated ? [...SUPPORTED_LOCALES] : ["es"];
}

/** Primer idioma soportado de una cabecera Accept-Language ("en-GB,en;q=0.9,es;q=0.8"). */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
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

/** Idioma preferido de quien llega sin prefijo: cookie elegida, navegador o el de por defecto. */
export function negotiateLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
