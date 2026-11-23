# CinePOV — Roadmap

> Documento vivo. Ordena el trabajo por **hitos con criterio de salida**, no por fases con semanas.

**Última actualización:** 23 de noviembre de 2026
**Referencias:** [Plan de proyecto](./plan_proyecto.md) · [Análisis crítico](./analisis_critico.md) · [Go-to-market](./go_to_market.md) · [Tareas manuales](./tareas_pendientes_usuario.md)

---

## Cómo leer este roadmap

- **Hitos, no fases.** Un hito termina cuando se cumple su criterio de salida, no cuando pasan unas semanas.
- **Una casilla solo se marca cuando está comprobada.** Si algo depende de producción, se marca cuando funciona en producción, no cuando el código existe. Lo que está construido pero sin comprobar vive en el [Historial](#historial), no en casillas marcadas.
- **Dos reglas de prioridad:**
  1. Hasta el lanzamiento público no entra nada que no esté en el camino del lanzamiento.
  2. Después, gana la tarea que produzca más valoraciones demográficas reales por unidad de esfuerzo.
- **Sin orden fijo después del lanzamiento.** Lo que antes eran las fases 5, 6 y 7 se activa por las puertas de decisión del [Hito 3](#hito-3--lo-que-digan-los-datos).
- **Referencias antiguas.** Si otro documento cita "Fase 3.2" o similar, la tabla de correspondencia del [Historial](#historial) indica dónde está ahora.

---

## Estado real a 23 de noviembre de 2026

| Aspecto | Estado |
|---|---|
| Código | Fases 0–5 de la numeración anterior construidas (unas 40 páginas). Ver [Historial](#historial). |
| Tipos | `tsc --noEmit` pasa. |
| Tests | 82 tests en 13 ficheros, todos pasan. En Windows hay una trampa, ver [Notas de desarrollo](#notas-de-desarrollo). |
| Lint | **73 errores y 18 avisos.** El CI fallaría en el primer push. |
| Repositorio | **Sin remoto.** Todo el trabajo vive en un único disco. |
| Producción | **Sin desplegar.** Neon, Vercel, dominio, Resend y PostHog pendientes. |
| Usuarios reales | 0. |
| Bloqueantes nuevos | Panel de administración sin autorización, edad mínima de 6 años y votos sintéticos en las 50 películas del onboarding. Ver [Hito 1.2](#12-bloqueantes-encontrados-en-la-auditoría-de-noviembre). |

> **Corrección respecto a la versión anterior:** estaban marcadas como hechas tareas que no lo están: Neon provisionado y variables configuradas en Vercel (antigua 3.1), Search Console verificado (3.3) y CI configurado (3.9; el fichero existe, pero nunca se ha ejecutado porque no hay remoto).

---

## Hito 0 — Proteger el trabajo (hoy)

- [ ] Crear el repositorio remoto **privado** y subir `main` y `dev`.
- [ ] Dejar de versionar `dev.db`, `prisma/dev.db` y `ratings.csv` (`git rm --cached` y `.gitignore`). Si el repositorio llega a ser público, purgarlos también del historial.
- [ ] Commitear el trabajo pendiente en commits pequeños, con la convención del README.
- [ ] Dejar el lint en verde ([R-01](#r-01--lint-en-verde)).

**Criterio de salida:** el CI de GitHub Actions pasa en verde sobre `dev`.

---

## Hito 1 — Beta cerrada (50–100 personas)

**Objetivo:** que personas reales completen el recorrido entero en producción y poder medirlo. Es una beta con gente de confianza, no un lanzamiento.

### 1.1 Infraestructura y legal

Pasos detallados en [tareas_pendientes_usuario.md](./tareas_pendientes_usuario.md).

- [ ] PostgreSQL en Neon, con conexión pooled y directa.
- [ ] Proyecto en Vercel con todas las variables de entorno.
- [ ] Dominio definitivo (`.com` y `.es` defensivo) y handles en redes.
- [ ] Resend con SPF, DKIM y DMARC en el dominio.
- [ ] PostHog en la región UE.
- [ ] Copias de seguridad automáticas y **una restauración probada**.
- [ ] Documentar el despliegue y el rollback.
- [ ] Rellenar los datos del titular en los textos legales.
- [ ] Registro interno de actividades de tratamiento (RGPD).

### 1.2 Bloqueantes encontrados en la auditoría de noviembre

- [ ] **Autorización del panel de administración.** [`/api/admin/reports`](../app/api/admin/reports/route.ts#L13) y [`/admin/reports`](../app/admin/reports/page.tsx#L16) solo comprueban que haya sesión. Cualquier usuario registrado puede ver los emails de quien reporta y moderar o borrar reseñas. Añadir un rol (campo `role` en `User` o lista `ADMIN_EMAILS`) y un helper `requireAdmin()` ([R-10](#r-10--helpers-para-las-rutas-de-api)).
- [ ] **Edad mínima de 18 años.** [`MAX_BIRTH_YEAR = currentYear - 6`](../lib/schemas.ts#L6) permite registrarse a niños de 6 años. Ajustar la validación, el selector del formulario, la política de privacidad y los términos.
- [ ] **Retirar los votos sintéticos de todo lo público** (la "alternativa aceptable" de la sección 6.4 del plan). La inyección en importaciones nuevas ya está cortada, pero los votos de bots siguen en las 50 esenciales ([prisma/seed.ts:393](../prisma/seed.ts#L393)), que son las del onboarding. El momento "aha" de cada usuario nuevo se apoya hoy en sesgos escritos a mano ([prisma/seed.ts:19](../prisma/seed.ts#L19)).
  - [ ] Separar el seed de desarrollo (con bots) del de producción (solo catálogo).
  - [ ] Eliminar el decaimiento de votos sintéticos en [app/api/ratings/route.ts:127](../app/api/ratings/route.ts#L127).
  - [ ] Eliminar la rama `estimated` del payload, de la API de estadísticas, de `MovieDemographics.tsx` y del contador de la portada ([app/page.tsx:209](../app/page.tsx#L209)), y la convención `email startsWith "bot."` ([app/page.tsx:24](../app/page.tsx#L24)).
  - [ ] Reescribir `/metodologia` en torno a la granularidad progresiva.
  - [ ] Mantener la demo de la landing con datos ficticios etiquetados como tales.
  - Con esto dejan de hacer falta la métrica de % de votos sintéticos y el plan de comunicación de crisis (pendientes de la antigua 3.2).
- [ ] **Sin datos personales en los logs** ([R-04](#r-04--logger-sin-datos-personales)).
- [ ] **Una sola definición de "voto que cuenta"** ([R-02](#r-02--una-sola-definición-de-voto-que-cuenta)). Hoy hay números públicos que incluyen votos sin verificar.
- [ ] **Creación de películas sin condiciones de carrera** ([R-03](#r-03--creación-de-películas-sin-condiciones-de-carrera)). El primer pico viral sobre una película nueva es justo el caso que hoy falla.
- [ ] **Quitar el polling de la ficha** ([R-05](#r-05--quitar-el-polling-de-la-ficha)).

### 1.3 Medición

- [ ] Embudo de activación: visita → registro → verificación de email → onboarding → primer desglose visto.
- [ ] Retención D1, D7 y D30.
- [ ] Distribución demográfica de los usuarios reales: ningún segmento por encima del 40% (preocupación A4). Antes estaba enterrada en el panel de administración de la antigua Fase 6.
- [ ] Cobertura: porcentaje de películas populares con cada nivel de granularidad desbloqueado con votos reales.
- [ ] Sentry con alertas, y un canal (Discord o Telegram) para errores críticos.

### 1.4 Decisión: URLs por idioma (antes de que Google indexe)

El idioma se guarda en una cookie y las URLs son las mismas en los dos idiomas. Googlebot rastrea sin cookies y sin `Accept-Language`, así que indexará solo el idioma por defecto, que hoy es **español** ([lib/i18n/types.ts:8](../lib/i18n/types.ts#L8)), mientras el plan apuesta por el SEO en inglés. Además, `hreflang` no se puede implementar sin URLs distintas por idioma.

- [ ] Elegir:
  - **A (recomendada):** rutas con prefijo (`/en/…`, `/es/…`) y `hreflang`. Más trabajo ahora, ningún coste después.
  - **B:** SEO en un solo idioma, con `DEFAULT_LOCALE` en el idioma que se quiera indexar.
- [ ] Aplicar la decisión **antes** de enviar el sitemap a Search Console. Cambiar URLs ya indexadas cuesta tráfico.

### 1.5 Superficie de la beta

- [ ] Ocultar tras un flag el feed, los seguidores y las reseñas hasta que haya densidad. Una capa social vacía transmite abandono (el mismo argumento de los estados vacíos en la preocupación A1).
- [ ] Comprobar que las secciones de la portada que dependen de datos reales (polarizantes, tendencias) muestran progreso, no huecos.

### 1.6 Prueba de humo en producción

- [ ] Registro → verificación de email → valoración → desglose, en móvil y escritorio.
- [ ] Registrar un usuario, redesplegar y comprobar que sigue ahí.
- [ ] Recuperación de contraseña y borrado de cuenta de principio a fin.
- [ ] Ningún secreto en el repositorio ni en el bundle del cliente.
- [ ] Accesibilidad básica (contraste, teclado, lector de pantalla) y textos de error en ambos idiomas.

**Criterio de salida:** al menos 50 usuarios reales verificados han completado el recorrido, el embudo y la D7 se leen en un panel, y ha pasado una semana sin errores críticos en Sentry.

---

## En paralelo — Validar la hipótesis con MovieLens

La hipótesis central del plan es que la nota de tu segmento predice si te gustará una película. Se puede contrastar sin un solo usuario con el dataset `ml-1m` de GroupLens: un millón de valoraciones (escala 1–5) con género y edad declarados, recogidas hacia el año 2000.

- [ ] Fijar los umbrales de decisión **antes** de ver los resultados y anotarlos aquí.
- [ ] Medir qué porcentaje de películas con datos suficientes tiene una brecha de 1 punto o más (en escala 1–10) entre géneros y entre rangos de edad.
- [ ] Medir el poder predictivo: error al predecir la nota de una persona con (a) la media global, (b) la media de su segmento y (c) la media de usuarios con gustos parecidos.
- [ ] Documentar resultados y decisión en `docs/validacion_movielens.md`.
- [ ] Revisar la licencia de GroupLens antes de publicar nada derivado de estos datos.

| Resultado | Qué hacemos |
|---|---|
| Brechas frecuentes, y la media del segmento predice mejor que la global | Seguir con el plan. |
| Brechas frecuentes, pero poco poder predictivo | El desglose es un gancho de contenido, no una utilidad. Adelantar "gente con tus gustos" (filtrado colaborativo) al Hito 2. |
| Pocas brechas | Replantear la propuesta de valor antes del lanzamiento público. |

---

## Hito 2 — Lanzamiento público

Plan de ejecución en [go_to_market.md](./go_to_market.md). El motor viral (antigua Fase 4) ya está construido; queda cerrarlo:

- [ ] Validar las imágenes OG en los depuradores de X, Facebook, LinkedIn y WhatsApp.
- [ ] Botón "descargar imagen" en `/vs/` y formato vertical para stories.
- [ ] Core Web Vitals (LCP < 2,5 s, INP < 200 ms, CLS < 0,1), lazy loading y `sizes` en los pósters.
- [ ] Enviar el sitemap a Search Console y vigilar la cobertura de indexación.
- [ ] Texto introductorio con datos reales en las páginas de género, década y segmento.
- [ ] Documentación del widget para blogs y medios.
- [ ] Textos legales en inglés (hoy privacidad, términos y aviso legal solo existen en español).
- [ ] Imagen OG estática de respaldo y tono de voz de la marca.
- [ ] Reactivar feed, seguidores y reseñas cuando haya densidad (umbral a fijar con los datos de la beta).
- [ ] Refactorizaciones R-06 a R-10, antes de que el volumen las haga urgentes.

**Criterio de salida:** los objetivos del MVP del plan (500 usuarios y 5.000 valoraciones reales), con el K-factor y la tasa de compartición medidos.

---

## Hito 3 — Lo que digan los datos

Aquí no hay orden fijo. Cada línea de trabajo se activa cuando su señal lo pide:

| Señal | Umbral | Acción |
|---|---|---|
| Activación (registro → primer desglose) | < 40% | Parar el marketing y arreglar el embudo. |
| Retención D7 | < 20% | Filtrado colaborativo "gente con tus gustos" (antigua 7.1) y notificaciones de desbloqueo. |
| Distribución demográfica | algún segmento > 40% | Campañas dirigidas a los segmentos que faltan (preocupación A4). |
| Contenido frente a plataforma | el contenido crece más rápido que los registros | Hipótesis B3: newsletter, blog de datos, vídeo corto. |
| Latencia p95 del desglose | > 200 ms | [R-08](#r-08--agregar-en-sql-no-en-memoria) si no está hecho; después vistas materializadas y caché (antiguas 6.1 y 6.2). |
| Alertas de review bombing | se disparan | Antiabuso avanzado (antigua 6.4). |
| Volumen de valoraciones reales | el que fije el análisis de umbral B2B | Explorar informes B2B (antigua 7.5). Antes de cobrar, licencia comercial de TMDB. |

### Aparcado (sin fecha)

Series de TV, traducciones regionales y nuevos idiomas, API pública, monetización B2C, PWA con modo sin conexión y notificaciones push, panel de administración completo, y predicciones declaradas para segmentos sin datos. Solo salen de aquí con una señal del Hito 3 que lo justifique.

---

## Refactorización

Oportunidades detectadas en la auditoría de noviembre, ordenadas por cuándo conviene hacerlas.

| ID | Qué | Cuándo |
|---|---|---|
| [R-01](#r-01--lint-en-verde) | Lint en verde | Hito 0 |
| [R-02](#r-02--una-sola-definición-de-voto-que-cuenta) | Una sola definición de "voto que cuenta" | Hito 1 |
| [R-03](#r-03--creación-de-películas-sin-condiciones-de-carrera) | Creación de películas sin condiciones de carrera | Hito 1 |
| [R-04](#r-04--logger-sin-datos-personales) | Logger sin datos personales | Hito 1 |
| [R-05](#r-05--quitar-el-polling-de-la-ficha) | Quitar el polling de la ficha | Hito 1 |
| [R-06](#r-06--un-único-cargador-de-demografía-por-película) | Un único cargador de demografía por película | Hito 2 |
| [R-07](#r-07--resolver-el-identificador-de-película-en-un-solo-sitio) | Resolver el identificador de película en un solo sitio | Hito 2 |
| [R-08](#r-08--agregar-en-sql-no-en-memoria) | Agregar en SQL, no en memoria | Hito 2, junto con R-06 |
| [R-09](#r-09--rankings-calculados-sobre-subconjuntos-arbitrarios) | Rankings calculados sobre subconjuntos arbitrarios | Hito 2 |
| [R-10](#r-10--helpers-para-las-rutas-de-api) | Helpers para las rutas de API | Hito 2 (`requireAdmin` en Hito 1) |
| [R-11](#r-11--partir-los-componentes-gigantes) | Partir los componentes gigantes | Al tocarlos |
| [R-12](#r-12--derivar-los-tipos-de-i18n) | Derivar los tipos de i18n | Al tocarlos |

### R-01 — Lint en verde

73 errores: 59 `no-explicit-any` (concentrados en `lib/tmdb.ts`, `prisma/seed.ts`, `UserProfileClient.tsx` y los importadores), 11 `react-hooks/set-state-in-effect`, 2 `react/no-unescaped-entities` y 1 `no-unsafe-function-type`. Tipar las respuestas de TMDB (con tipos o con zod) elimina la mayor parte. Los `set-state-in-effect` suelen esconder renders dobles: revisarlos uno a uno en vez de silenciarlos.

### R-02 — Una sola definición de "voto que cuenta"

El filtro `isArtificial: false, user: { emailVerified: { not: null } }` está copiado en unos 15 ficheros, y no todas las copias coinciden:

- [app/explore/page.tsx:53](../app/explore/page.tsx#L53), [app/api/movies/rankings/route.ts:124](../app/api/movies/rankings/route.ts#L124) (la media global con la que se compara el ranking del segmento) y [app/api/cron/weekly-trends/route.ts:75](../app/api/cron/weekly-trends/route.ts#L75) incluyen votos sin verificar.
- [lib/consensus.ts:38](../lib/consensus.ts#L38) excluye las cuentas anonimizadas y el resto no, cuando la decisión de diseño del borrado de cuenta es conservar esas valoraciones en los agregados.

Propuesta: `lib/queries/ratings.ts` con una constante `COUNTED_RATING_WHERE` (y su variante por segmento) usada en todas partes y cubierta por un test. Al retirar los votos sintéticos (Hito 1.2), el filtro se simplifica.

### R-03 — Creación de películas sin condiciones de carrera

[`getOrCreateMovie`](../lib/movies.ts#L12) hace `findUnique` y después `create`. Si llegan dos peticiones a la vez para una película nueva, la segunda choca con el índice único, la función devuelve `null` y la página da 404. Usar `upsert`, o capturar el error `P2002` y releer. De paso, quitar el `console.log` que se ejecuta en cada acierto de caché.

### R-04 — Logger sin datos personales

Hay 20 `console.log`, y varios escriben emails en los logs de Vercel: [app/api/ratings/route.ts:121](../app/api/ratings/route.ts#L121), [:153](../app/api/ratings/route.ts#L153), [:232](../app/api/ratings/route.ts#L232) y [app/api/auth/complete-profile/route.ts:40](../app/api/auth/complete-profile/route.ts#L40). Sustituirlos por un logger pequeño con niveles que nunca registre emails.

### R-05 — Quitar el polling de la ficha

[components/MovieRatingSection.tsx:60](../components/MovieRatingSection.tsx#L60) pide las estadísticas cada 15 segundos en cada pestaña abierta, para un número que solo cambia cuando alguien vota. Además de consultas inútiles, impide que Neon escale a cero y consume horas de cómputo del plan gratuito. Refrescar tras el voto propio y al volver a la pestaña.

### R-06 — Un único cargador de demografía por película

La secuencia "`findMany` → convertir a `RatingRow` → `buildDemographicsPayload`" se repite en la API de demografía, la ficha, `/vs/`, `/embed/`, la imagen OG, la API de desbloqueos, polarizantes y consenso. Extraer `getMovieDemographics(movieId)` en `lib/`, y derivar la versión compartible del payload con `isShareable`.

### R-07 — Resolver el identificador de película en un solo sitio

Las API de demografía, estadísticas y reseñas repiten la comprobación `/^\d+$/` seguida de un `findUnique`; [`/vs/`](../app/vs/%5Bid%5D/page.tsx#L17) usa `parseInt` y el resto de páginas usa [`parseMovieParam`](../lib/slug.ts#L25). Unificar en un `resolveMovie(param)` en `lib/movies.ts`.

### R-08 — Agregar en SQL, no en memoria

Hoy las páginas cargan todas las valoraciones de una película (o de 60–100 películas) para calcular medias en JavaScript. Propuesta: un `groupBy` de Prisma por `gender` y `birthYear` con `_sum` y `_count`, que devuelve como mucho unas 250 filas por película sea cual sea el volumen, y que `buildDemographicsPayload` acepte esas celdas en lugar de filas sueltas. `lib/demographics.ts` sigue siendo puro y testeable, y el mismo contrato servirá después para una vista materializada. Conviene hacerlo junto con R-06 para tocar ese código una sola vez.

### R-09 — Rankings calculados sobre subconjuntos arbitrarios

[Polarizantes](../app/api/movies/polarizing/route.ts#L46), [consenso](../app/api/movies/consensus/route.ts#L62) y [recomendaciones](../lib/recommendations.ts#L140) hacen `take` sin `orderBy`. En cuanto haya más de 100 películas con votos, "las más polarizantes" se calcularán sobre un subconjunto arbitrario que puede cambiar entre peticiones. Ordenar por número de votos reales antes de cortar, o calcular sobre todas con R-08.

### R-10 — Helpers para las rutas de API

35 ficheros repiten `getServerSession`, la respuesta 401, el `try/catch` y el JSON de error, y la validación con zod solo cubre parte de los endpoints. Extraer `requireUser()`, `requireAdmin()` y `handleApiError()`, y validar todos los cuerpos con `lib/schemas.ts`. `requireAdmin()` hace falta ya en el Hito 1.

### R-11 — Partir los componentes gigantes

`components/UserProfileClient.tsx` tiene 1.402 líneas y 23 `useState`: partirlo por pestañas (valoraciones, watchlist, listas, ajustes, zona peligrosa) y cargar los datos de cada pestaña al abrirla. `components/MovieDemographics.tsx` (640 líneas) se puede partir por vista. Hacerlo al tocarlos, no como proyecto aparte.

### R-12 — Derivar los tipos de i18n

`lib/i18n/types.ts` mantiene a mano una interfaz de 398 líneas en paralelo a `es.ts` y `en.ts`, así que cada texto nuevo se escribe en tres sitios. Sustituirla por `export type Dictionary = typeof es` y `en satisfies Dictionary`. El test de paridad se mantiene.

---

## Notas de desarrollo

- **Vitest en Windows:** si se ejecuta desde `d:\cinepov` (unidad en minúscula), todos los ficheros fallan con `Cannot read properties of undefined (reading 'config')`, probablemente porque Vitest carga su módulo dos veces por la diferencia de mayúsculas en la ruta. Desde `D:\cinepov` pasan los 82 tests. En CI (Linux) no ocurre.
- **CI:** `.github/workflows/ci.yml` ejecuta typecheck, lint, tests y build contra PostgreSQL 16 en cada push y PR a `main` y `dev`.

---

## Historial

Construido en código entre julio y septiembre de 2026, con la numeración anterior. Que esté aquí significa que el código existe, no que esté comprobado en producción.

| Fase anterior | Qué se construyó |
|---|---|
| 0 — Setup | Next.js (App Router), TypeScript estricto, Prisma, integración y caché de TMDB, sistema de diseño. |
| 1 — MVP core | Registro demográfico (credenciales y Google), búsqueda, ficha, valoraciones de 1 a 10, desglose por género, edad y cruce, perfil y landing. |
| 2 — Engagement | Onboarding "50 esenciales", importadores de Letterboxd e IMDb, rankings por segmento, hitos y emails de bienvenida y semanal. |
| 3 — Preparación (parte de código) | PostgreSQL con PrismaPg, granularidad progresiva y separación real/estimado, `/metodologia`, eventos de analítica y banner de cookies, textos legales en español, borrado y exportación de cuenta, i18n por cookie, rate limiting, cabeceras de seguridad, honeypot, validación con zod, Resend con verificación de email y recuperación de contraseña, CI y tests. |
| 4 — Motor viral y SEO | Imágenes OG, `/vs/`, polarizantes, perfil cinematográfico, sitemap, robots, slugs, JSON-LD, páginas de género, década y segmento, blog, widget, modo pareja (`/tonight`) y wrapped. |
| 5 — Social | Reseñas con filtro por segmento y moderación, watchlist, listas, perfiles públicos, seguidores, feed y notificaciones. |
| 6 y 7 (parcial) | Manifest y navegación inferior en móvil; recomendaciones por segmento y afinidad. |

### Correspondencia de lo pendiente

| Numeración anterior | Dónde está ahora |
|---|---|
| 3.1 (infraestructura), 3.7 (DNS de email), 3.8 (marca y remoto) | Hito 0 y Hito 1.1 |
| 3.2 (pendientes) | Hito 1.2, retirada de votos sintéticos |
| 3.3 (embudo, retención, Sentry) | Hito 1.3 |
| 3.4 (edad mínima, registro de tratamiento) | Hito 1.2 y 1.1 |
| 3.5 (`hreflang`) | Hito 1.4 |
| 3.9 (checklist final) | Hito 1.6 |
| 4.x (pendientes) | Hito 2 |
| 6.x | Hito 3 y R-08 |
| 7.1 (filtrado colaborativo) | Hito 3, o Hito 2 si lo pide la validación con MovieLens |
| 7.2 a 7.5 | Aparcado |

---

> **Siguiente paso:** Hito 0. Crear el remoto privado y dejar el lint en verde es trabajo de una tarde, y hasta entonces todo el proyecto depende de un solo disco.
