/**
 * URL pública del sitio, sin barra final. Es la única fuente para cualquier
 * enlace absoluto: sitemap, robots, URLs canónicas, imágenes OG y emails.
 *
 * Se normaliza porque `NEXTAUTH_URL` se escribe a mano: con una barra final,
 * concatenar "/ruta" producía "https://dominio//ruta" en el sitemap y en los
 * enlaces de los emails.
 */
export function normalizeSiteUrl(raw: string | undefined, fallback: string): string {
  const value = raw?.trim() || fallback;
  return value.replace(/\/+$/, "");
}

const FALLBACK = process.env.NODE_ENV === "production" ? "https://cinepov.com" : "http://localhost:3000";

export const SITE_URL = normalizeSiteUrl(process.env.NEXTAUTH_URL, FALLBACK);

/** Dominio sin protocolo, para mostrarlo en textos ("cinepov.com"). */
export const SITE_HOST = new URL(SITE_URL).host;
