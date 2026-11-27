# CinePOV — Tareas manuales

> Lo que requiere tu intervención directa: cuentas, paneles externos, datos personales o decisiones de producto. En el orden en que conviene hacerlas. Lo técnico que se puede hacer desde el repositorio ya está hecho.

**Última actualización:** 27 de noviembre de 2026

**Ya hecho:** repositorio en GitHub con CI, ramas `production` y `dev` en Neon (producción limpia), Vercel desplegando `main`, dominio `cinepov.com`, Resend con SPF, DKIM y DMARC, y URLs por idioma (`/es`, `/en`).

---

## 1. Catálogo corregido en producción

Seis películas del onboarding de producción eran otras (ids de TMDB equivocados). Si ya lo ejecutaste, sáltalo y dímelo para marcarlo.

1. En Neon, botón **Connect**, rama `production`: copia la cadena *pooled* y la directa.
2. En Git Bash, desde `D:\cinepov` (no cambia tu `.env`):
   ```bash
   DATABASE_URL="cadena pooled de production" DIRECT_URL="cadena directa de production" npm run db:seed
   ```
3. Debe terminar con "Catálogo listo: 50 de 50 películas". Es el seed seguro: solo crea o actualiza películas.

## 2. Copias de seguridad de la base

1. En <https://console.neon.tech>, proyecto → **Settings → Storage** (o **Backup & restore**): comprueba la ventana de *point-in-time restore* de la rama `production` (en el plan gratuito, unas horas; súbela si el plan lo permite).
2. Prueba una restauración: **Branches → Create branch**, rama padre `production`, opción **Past data** con una hora de hace un rato. Comprueba en las tablas que están los datos y borra la rama temporal.

## 3. Analítica y errores

1. **PostHog:** regístrate en <https://posthog.com> eligiendo la región **UE**, crea el proyecto y copia el *Project API Key*.
2. En Vercel → **Settings → Environment Variables** (Production): `NEXT_PUBLIC_POSTHOG_KEY` = esa clave y `NEXT_PUBLIC_POSTHOG_HOST` = `https://eu.i.posthog.com`. Luego **Deployments → … → Redeploy**.
3. En PostHog crea un **embudo** `signup_completed` → `onboarding_completed` → `demographics_viewed` y un panel de **retención** D1, D7 y D30.
4. **Sentry:** crea un proyecto Next.js en <https://sentry.io> y pásame el DSN; la integración la hago yo.

## 4. Google Search Console

1. En <https://search.google.com/search-console>, **Añadir propiedad → Dominio** → `cinepov.com`. Te dará un registro TXT.
2. Añádelo en Vercel: **Settings → Domains → cinepov.com → DNS Records → Add**, tipo `TXT`, nombre `@`, el valor que te dio Google. Vuelve a Search Console y pulsa **Verificar**.
3. **Sitemaps** → envía `https://www.cinepov.com/sitemap.xml`.
4. Opcional: en <https://www.bing.com/webmasters>, **Importar desde Google Search Console**.

## 5. Textos legales

Necesito los datos del titular: nombre o razón social, NIF, domicilio y email de contacto. Pásamelos y los pongo en el aviso legal, la privacidad y los términos (y entonces los traduzco al inglés). Si prefieres hacerlo tú, los marcadores están en `app/aviso-legal/page.tsx`, `app/privacidad/page.tsx` y `app/terminos/page.tsx`.

## 6. Comprobación de las tarjetas para redes

Pega estas URLs en el [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), el [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) y un mensaje de WhatsApp sin enviar:

- `https://www.cinepov.com/es/movie/27205` (tarjeta de la película)
- `https://www.cinepov.com/es` (tarjeta por defecto, nueva)

Comprueba que la imagen se ve entera, sin textos cortados. En el móvil, abre `https://www.cinepov.com/es/vs/27205` y prueba **Imagen para stories**: debería abrirse el menú de compartir con la imagen vertical.

## 7. Beta cerrada

1. Invita a las primeras 50–100 personas de confianza a `https://www.cinepov.com`.
2. Pídeles que se registren, verifiquen el email y valoren al menos 10 películas; con 5 ya ven su nota estimada.
3. Recoge lo que te cuenten desde **Sugerencias** (pie de página) y en `/admin/metrics` (entrando con tu cuenta).

## 8. Opcional

- Dominio `.es` como redirección y el handle `@cinepov` en X, TikTok, Instagram, Reddit, Bluesky y Product Hunt.
- CLI de GitHub (`winget install GitHub.cli` y `gh auth login`): con ella puedo seguir el CI sin el límite de consultas anónimas a la API de GitHub.

## 9. Decisiones de producto pendientes

- **Umbral de anonimato antes de reactivar lo social** ([R-14](./roadmap.md#r-14--umbral-de-anonimato)): hoy un grupo muestra su nota con 3 votos. Con perfiles y feed públicos conviene subirlo (5–10) y no enseñar recuentos por debajo. Sin prisa: lo social sigue apagado.
