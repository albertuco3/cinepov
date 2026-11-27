#!/usr/bin/env node
/**
 * Prueba de humo de un despliegue: comprueba que las rutas críticas responden
 * lo que deben. Solo hace peticiones de lectura o inválidas: no crea nada.
 *
 *   npm run smoke                              → https://www.cinepov.com
 *   npm run smoke -- https://otra-url.vercel.app
 */
const base = (process.argv[2] || "https://www.cinepov.com").replace(/\/+$/, "");

/** [método, ruta, estado esperado, comprobación opcional del cuerpo] */
const checks = [
  ["GET", "/", 307],
  ["GET", "/es", 200],
  ["GET", "/en", 200],
  ["GET", "/es/movie/27205", 200, (body) => body.includes('rel="canonical"')],
  ["GET", "/en/explore", 200],
  ["GET", "/es/metodologia", 200],
  ["GET", "/es/register", 200],
  ["GET", "/movie/27205/opengraph-image", 200],
  ["GET", "/sitemap.xml", 200, (body) => body.includes(`${base}/es`) && !body.includes("//es/")],
  ["GET", "/robots.txt", 200, (body) => body.includes(`${base}/sitemap.xml`)],
  ["GET", "/api/movies/27205/stats", 200],
  ["GET", "/api/movies/27205/demographics", 200],
  // Las rutas de formularios deben cargar (405 a un GET), no fallar al arrancar.
  ["GET", "/api/auth/register", 405],
  ["GET", "/api/ratings", 405],
  ["GET", "/api/feedback", 405],
  ["GET", "/api/auth/complete-profile", 405],
  // Un cuerpo vacío debe dar 400 (validación), no 500. No se usa el registro:
  // tiene límite de 5 intentos por hora y la prueba bloquearía tu propia IP.
  ["POST", "/api/auth/reset-password", 400],
  // Protegidas.
  ["POST", "/api/watchlist", 401],
  ["GET", "/es/profile", 307],
  ["GET", "/es/admin/metrics", 404],
  ["GET", "/api/admin/reports", 404],
  ["GET", "/api/cron/weekly-trends", 401],
];

let failures = 0;
for (const [method, path, expected, bodyCheck] of checks) {
  const init = { method, redirect: "manual", headers: { "accept-language": "es" } };
  if (method === "POST") {
    init.headers["content-type"] = "application/json";
    init.body = "{}";
  }
  let status = 0;
  let ok = false;
  try {
    const res = await fetch(base + path, init);
    status = res.status;
    ok = status === expected && (!bodyCheck || bodyCheck(await res.text()));
  } catch (err) {
    status = `error: ${err.message}`;
  }
  if (!ok) failures++;
  console.log(`${ok ? "OK   " : "FALLA"} ${method.padEnd(4)} ${path} → ${status}${ok ? "" : ` (esperado ${expected})`}`);
}

console.log(failures ? `\n${failures} comprobaciones fallidas en ${base}` : `\nTodo en orden en ${base}`);
process.exit(failures ? 1 : 0);
