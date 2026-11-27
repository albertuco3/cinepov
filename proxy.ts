import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/types";
import {
  EMBED_HEADER,
  LOCALE_HEADER,
  PATHNAME_HEADER,
  isEmbedPath,
  isLocalizablePath,
  localizePath,
  negotiateLocale,
  splitLocale,
} from "@/lib/i18n/paths";

/** Rutas que exigen sesión (y sus subrutas). */
const PROTECTED_PREFIXES = ["/profile", "/import", "/welcome", "/onboarding"];
/** Rutas en las que se fuerza completar el perfil y el onboarding. */
const ONBOARDING_CHECKED = new Set(["/", "/explore"]);

const ONE_YEAR = 60 * 60 * 24 * 365;

function isProtected(path: string) {
  return PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Middleware de CinePOV (en Next 16, `proxy`). Dos tareas:
 *
 * 1. Idioma en la URL. /es/... y /en/... se reescriben a la ruta interna sin
 *    prefijo, pasando el idioma en una cabecera. Una ruta sin prefijo
 *    redirige a la del idioma preferido (cookie, navegador o por defecto).
 * 2. Sesión y onboarding. Las rutas protegidas exigen sesión, y quien no ha
 *    completado su perfil o el onboarding vuelve a ellos.
 */
export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // El widget se incrusta en webs de terceros: sin cabecera, pie ni banners.
  if (isEmbedPath(pathname)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(EMBED_HEADER, "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (!isLocalizablePath(pathname)) return NextResponse.next();

  const { locale, rest } = splitLocale(pathname);
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;

  if (!locale) {
    const preferred = negotiateLocale(cookieLocale, req.headers.get("accept-language"));
    const url = req.nextUrl.clone();
    url.pathname = localizePath(pathname, preferred);
    return NextResponse.redirect(url);
  }

  const redirectTo = (path: string) => {
    const url = req.nextUrl.clone();
    url.pathname = localizePath(path, locale);
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (isProtected(rest) || ONBOARDING_CHECKED.has(rest)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      if (isProtected(rest)) {
        const url = req.nextUrl.clone();
        url.pathname = localizePath("/login", locale);
        url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
        return NextResponse.redirect(url);
      }
    } else {
      const profileComplete = Boolean(token.birthYear && token.gender);
      // Sin datos demográficos: a completar el perfil.
      if (!profileComplete && rest !== "/welcome") return redirectTo("/welcome");
      // Con perfil completo, /welcome ya no tiene sentido.
      if (profileComplete && rest === "/welcome") {
        return redirectTo(token.onboardingCompleted ? "/" : "/onboarding");
      }
      // Perfil completo sin onboarding: a la valoración rápida.
      if (profileComplete && !token.onboardingCompleted && rest !== "/onboarding") {
        return redirectTo("/onboarding");
      }
      // Onboarding ya hecho: no se repite.
      if (token.onboardingCompleted && rest === "/onboarding") return redirectTo("/");
    }
  }

  const requestHeaders = new Headers(req.headers);
  // Solo el middleware decide qué es el widget: no se acepta la marca desde fuera.
  requestHeaders.delete(EMBED_HEADER);
  requestHeaders.set(LOCALE_HEADER, locale);
  requestHeaders.set(PATHNAME_HEADER, rest);

  const url = req.nextUrl.clone();
  url.pathname = rest;
  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });

  // El idioma de la URL pasa a ser el preferido para las rutas sin prefijo.
  if (cookieLocale !== locale) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Todo salvo la API, los recursos de Next y los ficheros con extensión.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
