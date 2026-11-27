# CinePOV — Roadmap

> Documento vivo. Ordena el trabajo por **hitos con criterio de salida**, no por fases con semanas.

**Última actualización:** 23 de noviembre de 2026 (tarde)
**Referencias:** [Plan de proyecto](./plan_proyecto.md) · [Análisis crítico](./analisis_critico.md) · [Go-to-market](./go_to_market.md) · [Tareas manuales](./tareas_pendientes_usuario.md) · [Validación con MovieLens](./validacion_movielens.md)

---

## Cómo leer este roadmap

- **Hitos, no fases.** Un hito termina cuando se cumple su criterio de salida, no cuando pasan unas semanas.
- **Una casilla solo se marca cuando está comprobada.** Si algo depende de producción, se marca cuando funciona en producción, no cuando el código existe. Lo hecho en código y comprobado en local se marca con *(código)* hasta que se compruebe en producción.
- **Dos reglas de prioridad:**
  1. Hasta el lanzamiento público no entra nada que no esté en el camino del lanzamiento.
  2. Después, gana la tarea que produzca más valoraciones reales por unidad de esfuerzo.
- **Sin orden fijo después del lanzamiento.** Lo que antes eran las fases 5, 6 y 7 se activa por las puertas de decisión del [Hito 3](#hito-3--lo-que-digan-los-datos).
- **Referencias antiguas.** Si otro documento cita "Fase 3.2" o similar, la tabla de correspondencia del [Historial](#historial) indica dónde está ahora.

---

## Estado real a 23 de noviembre de 2026

| Aspecto | Estado |
|---|---|
| Código | Fases 0–5 de la numeración anterior construidas. Bloqueantes de la auditoría de noviembre corregidos en código (ver [1.2](#12-bloqueantes-encontrados-en-la-auditoría-de-noviembre)). |
| Calidad | `tsc` sin errores, lint sin errores ni avisos, 85 tests en verde, `next build` correcto. |
| Repositorio | En GitHub (privado), con `main` y `dev`. CI en verde. |
| Base de datos | Neon con dos ramas: `production` (limpia: sin bots ni usuarios de prueba, migración base registrada) y `dev` (copia del estado anterior, para desarrollo). |
| Producción | Desplegado en <https://www.cinepov.com> desde `main`, con emails reales (Resend). Faltan PostHog y Sentry. |
| Usuarios reales | 0. |
| Hipótesis central | **No validada** con MovieLens: ver [En paralelo](#en-paralelo--validar-la-hipótesis-con-movielens). Requiere una decisión antes del lanzamiento público. |

---

## Hito 0 — Proteger el trabajo (hoy)

- [x] Crear el repositorio remoto **privado** y subir `main` y `dev`.
- [x] Dejar de versionar `dev.db`, `prisma/dev.db` y `ratings.csv`. Si el repositorio llega a ser público, purgarlos también del historial.
- [x] Commitear el trabajo pendiente en commits pequeños, con la convención del README.
- [x] Dejar el lint en verde ([R-01](#r-01--lint-en-verde)).

**Criterio de salida:** el CI de GitHub Actions pasa en verde sobre `dev`. **Cumplido el 26 de noviembre de 2026.**

---

## Hito 1 — Beta cerrada (50–100 personas)

**Objetivo:** que personas reales completen el recorrido entero en producción y poder medirlo. Es una beta con gente de confianza, no un lanzamiento.

### 1.1 Infraestructura y legal

Pasos detallados en [tareas_pendientes_usuario.md](./tareas_pendientes_usuario.md).

- [ ] Aplicar en producción el catálogo corregido (`npm run db:seed` con las cadenas de la rama `production`): seis películas del onboarding eran otras.
- [x] Separar bases de datos: rama `dev` de Neon para desarrollo (el `.env` local apunta a ella) y `production` solo para producción.
- [x] Retirar de la base de producción los votos sintéticos, los bots y los usuarios de prueba (15.557 votos y 5.010 usuarios borrados).
- [x] Registrar la migración base en la rama `production` de Neon.
- [x] Proyecto en Vercel desplegando `main`, con `ADMIN_EMAILS`, `CRON_SECRET`, `NEXTAUTH_URL` y un `NEXTAUTH_SECRET` nuevo.
- [x] Dominio `cinepov.com` en Vercel (DNS de Vercel; `cinepov.com` redirige a `www.cinepov.com`) y `NEXTAUTH_URL` actualizada. Comprobado el 27 de noviembre: sitemap, canónicas, `hreflang` e imágenes OG usan el dominio nuevo.
- [ ] Dominio `.es` defensivo y handles en redes.
- [x] Resend con SPF, DKIM y DMARC en `cinepov.com`. Comprobado el 27 de noviembre: el email de restablecimiento llega a la bandeja de entrada desde `hola@cinepov.com`.
- [ ] PostHog en la región UE.
- [ ] Copias de seguridad automáticas y **una restauración probada**.
- [x] Documentar el despliegue y el rollback: [despliegue.md](./despliegue.md), con `npm run smoke` para comprobar cada despliegue.
- [ ] Rellenar los datos del titular en los textos legales.
- [ ] Registro interno de actividades de tratamiento (RGPD).

### 1.2 Bloqueantes encontrados en la auditoría de noviembre

Todos corregidos en código; se marcan del todo al comprobarse en producción.

- [ ] *(código)* **Panel de administración** solo para emails de `ADMIN_EMAILS` con el email verificado; al resto se le responde 404.
- [ ] *(código)* **Edad mínima de 18 años** en registro, bienvenida y edición de perfil, con declaración explícita (el año de nacimiento no basta para garantizarla).
- [ ] *(código)* **Votos sintéticos retirados de todo lo público:** núcleo de agregación, API, interfaz, portada, metodología y textos legales. El decaimiento de bots ha desaparecido. La base de producción ya está limpia.
- [ ] *(código)* **Sin datos personales en los logs**, y en producción el simulador de email ya no imprime enlaces de verificación ni de restablecimiento de contraseña.
- [ ] *(código)* **Una sola definición de "voto que cuenta"** ([R-02](#r-02--una-sola-definición-de-voto-que-cuenta)).
- [ ] *(código)* **Creación de películas sin condiciones de carrera** ([R-03](#r-03--creación-de-películas-sin-condiciones-de-carrera)).
- [ ] *(código)* **Sin polling** en la ficha ni en las notificaciones ([R-05](#r-05--quitar-el-polling-de-la-ficha)).

Encontrados y corregidos durante el trabajo de este hito:

- [ ] *(código)* **El cron del email semanal no comprobaba `CRON_SECRET`:** cualquiera podía disparar el envío masivo. Ahora exige el secreto, envía solo a emails verificados y calcula una consulta por segmento en lugar de una por usuario. Añadido `vercel.json` con la programación semanal.
- [ ] *(código)* **Las reseñas mostraban el género y la edad de su autor** junto a su nombre, contra lo que promete el registro.
- [ ] *(código)* **El seed borraba todas las tablas.** Un `npm run db:seed` contra producción habría eliminado a todos los usuarios. Ahora es solo de catálogo e idempotente; los datos de prueba están en `seed-dev`, con doble salvaguarda.
- [ ] *(código)* **Las migraciones solo creaban 7 de las 13 tablas.** Sustituidas por una migración base que coincide con el esquema y con la base real; el CI aplica migraciones y falla si se desvían del esquema.
- [ ] *(código)* **Las recomendaciones presentaban la nota de TMDB como opinión del segmento** (y un perfil inventado de "mujer de 28" si faltaban datos). Ahora se etiqueta la procedencia y no se inventa perfil. Sus enlaces llevaban a la película equivocada.
- [ ] *(código)* **`parseMovieParam` convertía un UUID en un id de TMDB** ("07bb…" → película 7).
- [ ] *(código)* **Seis películas del onboarding eran otras** por ids de TMDB equivocados (*The Lone Ranger* en lugar de *Parásitos*, *Hocus Pocus* en lugar de *Torrente*…). Catálogo comprobado contra TMDB; el seed retira del onboarding las que salen de la lista. Falta aplicarlo en producción (1.1).
- [ ] *(código)* **El `NEXTAUTH_SECRET` de `.env.example` era el mismo que el de `.env`.** Nunca se versionó; ahora el ejemplo lleva un marcador y sí se versiona.
- [x] **Las imágenes OG daban error 500 en todas las películas** (Satori exige `display: flex` en cualquier `div` cuyo contenido no sea una cadena). Corregido y comprobado en producción; la tarjeta tiene tests que reproducen la regla y generan PNG reales.
- [x] **Las rutas de registro, perfil, sugerencias y valoraciones daban un error 500 en Vercel** (DOMPurify arrastraba jsdom, que no carga allí). Sustituido por un saneado propio sin dependencias; de paso, los textos ya no se guardan escapados ("Tom &amp; Jerry") y los emails escapan al construir su HTML.
- [x] **Nadie sabía que su email estaba sin verificar** (y por tanto que sus votos no contaban): ahora un aviso bajo la cabecera lo explica y permite reenviar el email. La sesión lleva `emailVerified` y se refresca sola al verificar.
- [x] **El sitemap, `robots.txt`, las URLs canónicas y los enlaces de los emails salían con `//`** si `NEXTAUTH_URL` llevaba barra final. Ahora todo sale de `lib/site.ts`. Comprobado en producción.

### 1.3 Medición

- [ ] Embudo de activación: visita → registro → verificación de email → onboarding → primer desglose visto.
- [ ] Retención D1, D7 y D30.
- [x] Distribución demográfica de las personas verificadas, con alertas del 40 % y el 8 %: `/admin/metrics`.
- [x] Cobertura de los niveles de desglose en el onboarding y las películas más valoradas: `/admin/metrics`.
- [ ] Sentry con alertas, y un canal (Discord o Telegram) para errores críticos.

### 1.4 URLs por idioma

- [x] Decidido: rutas con prefijo `/es/…` y `/en/…`. El middleware reescribe a las rutas internas sin duplicar el árbol; sin prefijo se redirige según la cookie o el navegador. Cada página declara canónica y `hreflang`, y el sitemap lista cada URL en sus idiomas. Comprobado en producción el 26 de noviembre.
- [ ] Muchas páginas existen solo en español (legales, metodología, blog, polarizantes, década, género, segmento, wrapped, listas, perfiles, `/vs/`). Su versión `/en/` apunta la canónica a `/es/`. Al traducir una, añadirla a `TRANSLATED_ROUTES` en `lib/i18n/paths.ts` (Hito 2).

### 1.5 Superficie de la beta

- [x] Ocultar tras un flag el feed, los seguidores, las notificaciones y las reseñas (`NEXT_PUBLIC_SOCIAL_ENABLED`, desactivado por defecto). Las API correspondientes responden 404 y no se guarda texto de reseña.
- [x] Las secciones que dependen de datos reales tienen estados vacíos que explican qué falta; corregidas además unas 130 cadenas sin tildes.

### 1.6 Prueba de humo en producción

- [x] Rutas públicas comprobadas en producción el 26 de noviembre: páginas en 200, administración y social en 404, cron sin secreto en 401, perfil redirige al login, cabeceras de seguridad presentes.
- [ ] Registro → verificación de email → valoración → desglose, en móvil y escritorio (necesita Resend).
- [ ] Registrar un usuario, redesplegar y comprobar que sigue ahí.
- [x] Recuperación de contraseña de principio a fin en producción (además verifica el email).
- [x] Borrado de cuenta de principio a fin (probado sobre `dev`). Corregido de paso: los votos "conservados" dejaban de contar y quedaban reseñas, listas y pendientes de la persona.
- [x] Ningún secreto en el repositorio ni en el bundle del cliente (comprobado el 27 de noviembre).
- [ ] Accesibilidad básica (contraste, teclado, lector de pantalla) y textos de error en ambos idiomas.

**Criterio de salida:** al menos 50 usuarios reales verificados han completado el recorrido, el embudo y la D7 se leen en un panel, y ha pasado una semana sin errores críticos en Sentry.

---

## En paralelo — Validar la hipótesis con MovieLens

- [x] Umbrales fijados y versionados antes de ver los datos.
- [x] Brechas: solo el **15,6 %** de las películas tiene una brecha relevante de género o edad (umbral: 33 %). Las de género, un 2,1 %.
- [x] Poder predictivo: la media del segmento mejora la predicción un **0,4 %**; el sesgo personal, un **7,2 %**.
- [x] Resultados y lectura en [validacion_movielens.md](./validacion_movielens.md).
- [x] **Reposicionamiento decidido (27 de noviembre):** la utilidad es la nota estimada por gusto; el desglose demográfico pasa a ser contenido, con la edad por delante.
- [x] Motor "gente que puntúa como tú" (`lib/taste.ts`, `lib/taste-db.ts`), elegido con MovieLens (sección 4 de la validación): nota estimada en la ficha y recomendaciones por gusto antes que por segmento.
- [x] Lema conservado (ahora lo respalda el motor) y textos de portada, cómo funciona, recomendaciones y metadatos reescritos.
- [ ] Destacar en la ficha y en la portada solo las películas con una brecha real ("cuando hay brecha, es noticia").
- [ ] Ajustar el motor con datos propios cuando haya volumen (umbral de vecinos, orden de las recomendaciones con pocos vecinos).
- [ ] Revisar la licencia de GroupLens antes de publicar nada derivado de estos datos.

---

## Hito 2 — Lanzamiento público

Plan de ejecución en [go_to_market.md](./go_to_market.md). Depende de la decisión de reposicionamiento.

- [ ] Validar las imágenes OG en los depuradores de X, Facebook, LinkedIn y WhatsApp.
- [ ] Botón "descargar imagen" en `/vs/` y formato vertical para stories.
- [ ] Core Web Vitals (LCP < 2,5 s, INP < 200 ms, CLS < 0,1), lazy loading y `sizes` en los pósters.
- [ ] Enviar el sitemap a Search Console y vigilar la cobertura de indexación.
- [ ] Texto introductorio con datos reales en las páginas de género, década y segmento.
- [ ] Documentación del widget para blogs y medios.
- [ ] Traducir las páginas que solo existen en español, empezando por los textos legales, y añadirlas a `TRANSLATED_ROUTES`.
- [ ] Imagen OG estática de respaldo y tono de voz de la marca.
- [ ] Antes de reactivar lo social: decidir el umbral de anonimato ([R-14](#r-14--umbral-de-anonimato)) y cómo filtrar reseñas por segmento sin revelar el segmento de cada autor.
- [ ] Reactivar feed, seguidores y reseñas cuando haya densidad (umbral a fijar con los datos de la beta).
- [ ] Refactorización pendiente: resto de [R-10](#r-10--helpers-para-las-rutas-de-api).

**Criterio de salida:** los objetivos del MVP del plan (500 usuarios y 5.000 valoraciones reales), con el K-factor y la tasa de compartición medidos.

---

## Hito 3 — Lo que digan los datos

Aquí no hay orden fijo. Cada línea de trabajo se activa cuando su señal lo pide:

| Señal | Umbral | Acción |
|---|---|---|
| Activación (registro → primer desglose) | < 40 % | Parar el marketing y arreglar el embudo. |
| Retención D7 | < 20 % | Filtrado colaborativo "gente con tus gustos" (antigua 7.1) y notificaciones de desbloqueo. La validación con MovieLens ya apunta a adelantarlo. |
| Distribución demográfica | algún segmento > 40 % | Campañas dirigidas a los segmentos que faltan (preocupación A4). |
| Contenido frente a plataforma | el contenido crece más rápido que los registros | Hipótesis B3: newsletter, blog de datos, vídeo corto. |
| Latencia p95 del desglose | > 200 ms | Vistas materializadas y caché (antiguas 6.1 y 6.2). La agregación ya se hace en SQL. |
| Alertas de review bombing | se disparan | Antiabuso avanzado (antigua 6.4). |
| Volumen de valoraciones reales | el que fije el análisis de umbral B2B | Explorar informes B2B (antigua 7.5). Antes de cobrar, licencia comercial de TMDB. |

### Aparcado (sin fecha)

Series de TV, traducciones regionales y nuevos idiomas, API pública, monetización B2C, PWA con modo sin conexión y notificaciones push, panel de administración completo, y predicciones declaradas para segmentos sin datos. Solo salen de aquí con una señal del Hito 3 que lo justifique.

---

## Refactorización

| ID | Qué | Estado |
|---|---|---|
| [R-01](#r-01--lint-en-verde) | Lint en verde | Hecho |
| [R-02](#r-02--una-sola-definición-de-voto-que-cuenta) | Una sola definición de "voto que cuenta" | Hecho |
| [R-03](#r-03--creación-de-películas-sin-condiciones-de-carrera) | Creación de películas sin condiciones de carrera | Hecho |
| [R-04](#r-04--logger-sin-datos-personales) | Logs sin datos personales | Hecho (sin logger con niveles) |
| [R-05](#r-05--quitar-el-polling-de-la-ficha) | Quitar el polling | Hecho |
| [R-06](#r-06--un-único-cargador-de-demografía-por-película) | Un único cargador de demografía | Hecho |
| [R-07](#r-07--resolver-el-identificador-de-película-en-un-solo-sitio) | Resolver el identificador de película en un solo sitio | Hecho |
| [R-08](#r-08--agregar-en-sql-no-en-memoria) | Agregar en SQL | Hecho |
| [R-09](#r-09--rankings-calculados-sobre-subconjuntos-arbitrarios) | Rankings sobre subconjuntos arbitrarios | Hecho |
| [R-10](#r-10--helpers-para-las-rutas-de-api) | Helpers para las rutas de API | Parcial |
| [R-11](#r-11--partir-los-componentes-gigantes) | Partir los componentes gigantes | Al tocarlos |
| [R-12](#r-12--derivar-los-tipos-de-i18n) | Derivar los tipos de i18n | Al tocarlos |
| [R-13](#r-13--tests-que-no-prueban-código) | Tests que no prueban código | Pendiente |
| [R-14](#r-14--umbral-de-anonimato) | Umbral de anonimato | Decisión antes de reactivar lo social |

### R-01 — Lint en verde

Hecho: 0 errores y 0 avisos. Los `catch (err: any)` usan `errorMessage()` de `lib/errors.ts`, las respuestas de TMDB están tipadas, y los `setState` dentro de efectos se resolvieron sin silenciar la regla: el hook `useJson` (`lib/hooks/use-json.ts`), que además descarta respuestas obsoletas; estado fijado en los manejadores de eventos; y `useSyncExternalStore` para el consentimiento de cookies.

### R-02 — Una sola definición de "voto que cuenta"

Hecho: `lib/rating-filters.ts` (`countedRatingWhere`, `COUNTED_USER_WHERE`, `segmentUserWhere` y su gemelo SQL `COUNTED_RATING_SQL`). Los tramos de edad viven una sola vez en `AGE_RANGES` de `lib/demographics.ts`. Decisión aplicada: las cuentas anonimizadas siguen contando en los agregados (no en las reseñas).

### R-03 — Creación de películas sin condiciones de carrera

Hecho: `getOrCreateMovie` usa `upsert` y relee si choca con un índice único. Las valoraciones también usan `upsert`.

### R-04 — Logger sin datos personales

Hecho en lo esencial: no se registran emails (`maskEmail` para los errores de envío). Queda opcional un logger con niveles si los logs crecen.

### R-05 — Quitar el polling de la ficha

Hecho: la ficha y las notificaciones se refrescan al volver a la pestaña, no cada 15 o 60 segundos.

### R-06 — Un único cargador de demografía por película

Hecho: `lib/movie-demographics.ts` (`getMovieDemographics`, `getManyMovieDemographics`, `getMostRatedMovieIds`).

### R-07 — Resolver el identificador de película en un solo sitio

Hecho: `resolveMovieId` en `lib/movies.ts` (UUID primero, luego id de TMDB con o sin slug). `/vs/` usa `parseMovieParam` como el resto.

### R-08 — Agregar en SQL, no en memoria

Hecho: el núcleo agrega celdas (género × año de nacimiento con suma y recuento) que devuelve una consulta `GROUP BY`; verificado contra la base real (278 celdas, 0 diferencias frente al cálculo fila a fila). Consenso y recomendaciones usan `groupBy` de Prisma.

### R-09 — Rankings calculados sobre subconjuntos arbitrarios

Hecho: polarizantes parte de las películas con más votos; consenso y recomendaciones agregan sobre todas.

### R-10 — Helpers para las rutas de API

Parcial: `lib/auth-guards.ts` tiene `requireUser()`, `requireAdmin()` y `getAdminUser()`; de momento solo los usan las rutas de administración. Queda migrar el resto de rutas y validar todos los cuerpos con `lib/schemas.ts`.

### R-11 — Partir los componentes gigantes

`components/UserProfileClient.tsx` (unas 1.400 líneas) y `components/MovieDemographics.tsx`. Hacerlo al tocarlos.

### R-12 — Derivar los tipos de i18n

`lib/i18n/types.ts` mantiene a mano una interfaz paralela a `es.ts` y `en.ts`. Sustituirla por `export type Dictionary = typeof es` y `en satisfies Dictionary`.

### R-13 — Tests que no prueban código

`lib/wrapped.test.ts` recalcula aritmética en línea y no importa `lib/wrapped.ts`: pasaría aunque el código estuviera roto. Revisar los tests con el mismo patrón y sustituirlos por tests de las funciones reales.

### R-14 — Umbral de anonimato

Un segmento muestra su nota con 3 votos (`SEGMENT_MIN_VOTES`), y la matriz enseña el recuento de cada celda aunque no llegue al mínimo. El plan hablaba de 5–10. Con el feed y los perfiles públicos activos, alguien podría deducir el segmento de una persona viendo que una celda pasa de 0 a 1 justo cuando esa persona valora. Decidir antes de reactivar lo social: subir el mínimo y no mostrar recuentos por debajo de él.

---

## Notas de desarrollo

- **Windows y la letra de unidad:** ejecuta las herramientas desde `D:\cinepov`, no desde `d:\cinepov`. Con la minúscula, Node carga algunos módulos dos veces: Vitest falla con `Cannot read properties of undefined (reading 'config')` y los fragmentos `Prisma.sql` dejan de reconocerse en scripts con `tsx`. En CI (Linux) no ocurre.
- **Seeds:** `npm run db:seed` solo crea el catálogo y es seguro en cualquier base. La rama `dev` de Neon tiene datos de prueba con todos los niveles de la escalera de granularidad. `npm run db:seed:dev` borra todos los usuarios y crea datos de prueba; se niega a ejecutarse en producción y exige `SEED_DEV_CONFIRM=borrar-y-rellenar`.
- **Migraciones:** el esquema se cambia con `prisma migrate dev` (contra la base de desarrollo), nunca con `db push` contra producción. El CI aplica las migraciones y comprueba que reflejan el esquema.
- **Idiomas:** usa `Link` de `@/components/LocaleLink` (nunca `next/link`), `useLocalePath()` para `router.push` y `localizePath()` en los `redirect()` de servidor. El idioma en servidor siempre con `getRequestLocale()`.
- **CI:** `.github/workflows/ci.yml` ejecuta typecheck, lint, tests, migraciones y build contra PostgreSQL 16 en cada push y PR a `main` y `dev`.

---

## Historial

Construido en código entre julio y septiembre de 2026, con la numeración anterior.

| Fase anterior | Qué se construyó |
|---|---|
| 0 — Setup | Next.js (App Router), TypeScript estricto, Prisma, integración y caché de TMDB, sistema de diseño. |
| 1 — MVP core | Registro demográfico (credenciales y Google), búsqueda, ficha, valoraciones de 1 a 10, desglose por género, edad y cruce, perfil y landing. |
| 2 — Engagement | Onboarding "50 esenciales", importadores de Letterboxd e IMDb, rankings por segmento, hitos y emails de bienvenida y semanal. |
| 3 — Preparación (parte de código) | PostgreSQL con PrismaPg, granularidad progresiva, `/metodologia`, eventos de analítica y banner de cookies, textos legales en español, borrado y exportación de cuenta, i18n por cookie, rate limiting, cabeceras de seguridad, honeypot, validación con zod, Resend con verificación de email y recuperación de contraseña, CI y tests. |
| 4 — Motor viral y SEO | Imágenes OG, `/vs/`, polarizantes, perfil cinematográfico, sitemap, robots, slugs, JSON-LD, páginas de género, década y segmento, blog, widget, modo pareja (`/tonight`) y wrapped. |
| 5 — Social | Reseñas con filtro por segmento y moderación, watchlist, listas, perfiles públicos, seguidores, feed y notificaciones (ocultos tras un flag durante la beta). |
| 6 y 7 (parcial) | Manifest y navegación inferior en móvil; recomendaciones por segmento. |

### Correspondencia de lo pendiente

| Numeración anterior | Dónde está ahora |
|---|---|
| 3.1 (infraestructura), 3.7 (DNS de email), 3.8 (marca y remoto) | Hito 0 y Hito 1.1 |
| 3.2 (pendientes) | Resuelto: votos sintéticos retirados (Hito 1.2) |
| 3.3 (embudo, retención, Sentry) | Hito 1.3 |
| 3.4 (edad mínima, registro de tratamiento) | Hito 1.2 y 1.1 |
| 3.5 (`hreflang`) | Hito 1.4 |
| 3.9 (checklist final) | Hito 1.6 |
| 4.x (pendientes) | Hito 2 |
| 6.x | Hito 3 |
| 7.1 (filtrado colaborativo) | Hito 3, o antes según la decisión de reposicionamiento |
| 7.2 a 7.5 | Aparcado |

---

> **Siguiente paso:** desplegar en Vercel (Hito 1.1). En paralelo, decidir el reposicionamiento que pide la validación con MovieLens.
