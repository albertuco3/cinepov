# CinePOV — Tareas manuales

> Lo que requiere tu intervención directa: cuentas, pagos, paneles externos, datos personales o decisiones de producto. Están en el orden en que conviene hacerlas. Lo técnico que se pueda hacer desde el repositorio ya está hecho o preparado.

**Última actualización:** 23 de noviembre de 2026

---

## 1. Repositorio en GitHub (urgente)

Todo el trabajo vive en un único disco. Es lo más barato de esta lista y lo único irreversible si falla el disco.

1. Entra en <https://github.com/new>.
2. Nombre: `cinepov`. Visibilidad: **Private**. No marques README, `.gitignore` ni licencia (el repositorio ya los tiene).
3. Pulsa **Create repository**.
4. En una terminal, desde `D:\cinepov` (con la D mayúscula):
   ```bash
   git remote add origin https://github.com/TU_USUARIO/cinepov.git
   git branch main
   git push -u origin dev
   git push origin main
   ```
5. En GitHub, pestaña **Actions**: el CI debería ejecutarse sobre `dev` y terminar en verde.

**Opcional, pero acelera el trabajo:** instala la CLI de GitHub (`winget install GitHub.cli`) y ejecuta `gh auth login`. Así se puede seguir el CI y abrir pull requests desde el editor.

---

## 2. Bases de datos en Neon

El proyecto de Neon ya existe y tu `.env` apunta a él, pero contiene datos de desarrollo: 5.000 bots con 15.557 votos sintéticos y 10 usuarios de prueba. Se conservaría solo tu cuenta de Gmail.

1. **Rama de desarrollo.** En <https://console.neon.tech>, abre el proyecto → **Branches** → **Create branch**. Nombre: `dev`; rama padre: `production` (la rama por defecto; en proyectos antiguos de Neon se llama `main`); opción **Branch data and schema**.
2. Copia las dos cadenas de conexión de la rama `dev` (la *pooled* y la directa). Las usarás en tu `.env` local cuando la rama `production` quede reservada para producción (paso 4). Las encuentras con el botón **Connect**, eligiendo la rama `dev` y activando o desactivando *Connection pooling*.
3. **Limpieza de la rama `production`.** Con tu `.env` todavía apuntando a `production`, desde `D:\cinepov`:
   ```bash
   npm run db:remove-synthetic                               # modo de prueba: solo cuenta
   REMOVE_SYNTHETIC_CONFIRM=si npm run db:remove-synthetic   # borra de verdad
   npx prisma migrate resolve --applied 20261123000000_baseline
   ```
   El último comando no cambia ninguna tabla: registra que la base ya tiene el esquema de la migración base.
4. Cambia tu `.env` local a las cadenas de la rama `dev`. A partir de aquí, `production` solo la usa Vercel.
5. En las dos cadenas (la de `.env` y la de Vercel), cambia `sslmode=require` por `sslmode=verify-full`. Es lo que recomienda el driver de PostgreSQL y elimina el aviso de seguridad.
6. Si quieres datos de prueba en la rama `dev`:
   ```bash
   SEED_DEV_CONFIRM=borrar-y-rellenar npm run db:seed:dev
   ```
7. **Catálogo corregido en producción.** El onboarding de producción todavía muestra seis películas equivocadas. En Git Bash, desde `D:\cinepov`, con las dos cadenas de la rama `production` entre comillas (no cambia tu `.env`):
   ```bash
   DATABASE_URL="cadena pooled de production" DIRECT_URL="cadena directa de production" npm run db:seed
   ```
   Es el seed seguro: solo crea o actualiza películas y retira del onboarding las que sobran. Debe terminar con "Catálogo listo: 50 de 50 películas".
8. Activa en Neon las copias de seguridad (*point-in-time restore*) de la rama `production` y **prueba una restauración** en una rama temporal.

---

## 3. Vercel

1. Importa el repositorio de GitHub en <https://vercel.com/new>.
2. En **Settings → Environment Variables** (entorno *Production*), añade:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | Cadena *pooled* de la rama `production` de Neon, con `sslmode=verify-full` |
   | `DIRECT_URL` | Cadena directa de la rama `production`, con `sslmode=verify-full` |
   | `NEXTAUTH_SECRET` | Uno **nuevo**, distinto del de tu `.env`: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | La URL pública definitiva, p. ej. `https://cinepov.com` |
   | `TMDB_API_KEY` | Tu clave de la API de TMDB (v3) |
   | `RESEND_API_KEY` | Ver sección 5 |
   | `EMAIL_FROM` | P. ej. `CinePOV <hola@tudominio.com>` |
   | `NEXT_PUBLIC_POSTHOG_KEY` | Ver sección 6 |
   | `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` |
   | `CRON_SECRET` | Otro valor aleatorio: `openssl rand -base64 32`. Sin él, el email semanal no se envía |
   | `ADMIN_EMAILS` | Tu email (con la cuenta verificada en CinePOV) para entrar en `/admin/reports` |
   | `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` | Solo si activas el registro con Google |

   No añadas `NEXT_PUBLIC_SOCIAL_ENABLED`: lo social queda desactivado durante la beta.
3. Despliega. El email semanal ya está programado en `vercel.json` (lunes a las 9:00 UTC).
4. Cuando cambie el esquema de la base de datos, las migraciones se aplican a producción con `npm run db:deploy` (con las cadenas de la rama `production`), no desde el build de Vercel.

---

## 4. Dominio y presencia

1. Compra el dominio (`.com` principal y `.es` como redirección) en Cloudflare Registrar, Namecheap, DonDominio o Porkbun.
2. Vincúlalo en Vercel: **Settings → Domains**.
3. Reserva `@cinepov` (o una variante consistente) en X, TikTok, Instagram, Reddit, YouTube, Bluesky y Product Hunt.

---

## 5. Email (Resend)

1. Crea una cuenta en <https://resend.com> y añade tu dominio en **Domains**.
2. Copia los registros DNS que te da (SPF, DKIM y DMARC) en la zona DNS de tu dominio. Sin ellos, los correos van a spam.
3. Genera una API key con permiso de envío y ponla en `RESEND_API_KEY` en Vercel.

---

## 6. Analítica y errores

1. **PostHog:** regístrate en <https://posthog.com> eligiendo la región UE, crea el proyecto y copia el *Project API Key* en `NEXT_PUBLIC_POSTHOG_KEY`.
2. En PostHog, crea:
   - un **embudo**: `signup_completed` → `onboarding_completed` → `demographics_viewed`;
   - un panel de **retención** D1, D7 y D30.
3. **Sentry:** crea un proyecto Next.js en <https://sentry.io> y pásame el DSN; la integración en el código la hago yo.

---

## 7. Google Search Console

Espera a decidir las URLs por idioma (sección 9) antes de enviar el sitemap.

1. Da de alta el dominio en <https://search.google.com/search-console> y verifícalo con un registro TXT en el DNS.
2. Envía `https://tudominio.com/sitemap.xml`.
3. Importa la propiedad en Bing Webmaster Tools.

---

## 8. Textos legales

Sustituye los marcadores de posición (nombre o razón social, NIF, domicilio y email de contacto) en:

1. `app/aviso-legal/page.tsx`
2. `app/privacidad/page.tsx`
3. `app/terminos/page.tsx` (legislación aplicable y jurisdicción)

---

## 9. Decisiones de producto pendientes

1. **Reposicionamiento.** La validación con MovieLens no sostiene la hipótesis central: el segmento demográfico mejora la predicción un 0,4 % y el gusto propio un 7,2 %. Detalle y propuesta en [validacion_movielens.md](./validacion_movielens.md).
2. ~~URLs por idioma~~: decidido y hecho (`/es/…` y `/en/…`).

---

## 10. Comprobación de las tarjetas para redes

Con el proyecto ya desplegado en tu dominio, pega la URL de una película (p. ej. `https://tudominio.com/movie/157336`) en:

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- Un mensaje de WhatsApp y un post de X sin publicar

Comprueba que la imagen se ve a 1200×630 y sin textos cortados.
