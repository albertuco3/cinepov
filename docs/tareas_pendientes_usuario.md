# CinePOV — Tareas manuales

> Lo que requiere tu intervención directa: cuentas, paneles externos, datos personales o decisiones de producto. En el orden en que conviene hacerlas. Lo técnico que se puede hacer desde el repositorio ya está hecho.

**Última actualización:** 28 de noviembre de 2026

**Ya hecho:** repositorio en GitHub con CI, ramas `production` y `dev` en Neon (producción limpia), Vercel desplegando `main`, dominio `cinepov.com` con el DNS en Vercel, Resend con SPF, DKIM y DMARC, URLs por idioma (`/es`, `/en`) y catálogo corregido en producción (28 de noviembre).

> **Dónde están los registros DNS:** en Vercel, la pestaña **Domains** del panel general (la de arriba, junto a *Projects*; no la de *Settings* del proyecto) → `cinepov.com` → **DNS Records**.

---

## 1. Copias de seguridad de la base (10 minutos)

Neon guarda el historial de cambios y deja crear una rama con los datos de un momento pasado. En el plan gratuito, el historial dura **6 horas**; en Launch, hasta 7 días.

**Comprobar el historial:**

1. Entra en <https://console.neon.tech> y abre el proyecto de CinePOV.
2. Menú de la izquierda → **Settings** → **Instant restore**.
3. Mira cuánto historial hay. En el plan gratuito no se puede pasar de 6 horas; déjalo al máximo.

**Probar una restauración, sin tocar producción:**

1. Menú de la izquierda → **Branches** → **New branch** (o *Create branch*).
2. **Parent branch:** `production`.
3. En las opciones de datos, elige **Past data** (o *Point in time*) y pon una hora de hace 30–60 minutos.
4. Nombre: `prueba-restauracion`. Pulsa **Create**. Si te ofrece crear un *compute*, acéptalo.
5. Menú de la izquierda → **Tables**. Arriba, elige la rama `prueba-restauracion` y comprueba que en `User`, `Movie` y `Rating` están los datos.
6. Vuelve a **Branches**, abre `prueba-restauracion` → menú **⋯** → **Delete**. Asegúrate de borrar esta y no `production`.

Si algún día hay que restaurar de verdad, avísame antes de tocar nada: se hace con **Restore** sobre `production` y lo preparamos juntos.

## 2. Analítica con PostHog (15 minutos)

La web solo carga PostHog si el visitante acepta las cookies.

**Crear la cuenta:**

1. Entra en <https://eu.posthog.com/signup>. Es la región **UE**; compruébalo, porque luego no se puede cambiar.
2. Regístrate. Cuando pregunte qué productos usar, marca **Product analytics** y salta el resto.
3. Si te enseña un fragmento de código, no hace falta instalar nada: ya está en la web. Copia solo la clave que empieza por `phc_`. Si no la ves, la tienes en **Settings → Project → General → Project API key**.

**Ponerla en Vercel:**

1. <https://vercel.com> → proyecto `cinepov` → **Settings → Environment Variables**.
2. **Add new:** Key `NEXT_PUBLIC_POSTHOG_KEY`, Value la clave `phc_…`, Environment solo **Production**. Guarda.
3. Otra: Key `NEXT_PUBLIC_POSTHOG_HOST`, Value `https://eu.i.posthog.com`, solo **Production**. Guarda.
4. **Deployments** → el primero de la lista (el de *Production*) → **⋯** → **Redeploy** → **Redeploy**. Hace falta porque estas variables se meten en el código al compilar.

**Comprobar que llegan datos:**

1. Cuando termine el despliegue (1–2 minutos), abre <https://www.cinepov.com> en una ventana de incógnito y acepta las cookies.
2. En PostHog → **Activity** (o *Live events*): en un minuto debe aparecer un `$pageview`.

**Embudo de activación:**

1. PostHog → **Product analytics** → **+ New insight** → pestaña **Funnel**.
2. Pasos, en este orden: `signup_completed`, `onboarding_completed`, `demographics_viewed`. Los eventos solo aparecen en el desplegable cuando han ocurrido una vez; si no salen, regístrate tú con un email nuevo y completa el onboarding.
3. **Save** con el nombre "Activación" y **Add to dashboard** → crea uno nuevo llamado "CinePOV".

**Retención:**

1. **+ New insight** → pestaña **Retention**.
2. Primer evento: `signup_completed`. Evento de vuelta: `$pageview`.
3. Periodo: **Day**. Mira las columnas *Day 1*, *Day 7* y *Day 30*.
4. **Save** como "Retención" y añádelo al mismo dashboard.

## 3. Errores con Sentry (10 minutos)

1. Entra en <https://sentry.io/signup/>. Al crear la organización, en **Data Storage Location** elige **European Union (EU)**. Tampoco se puede cambiar después.
2. **Create project** → plataforma **Next.js** → deja las alertas por defecto → nombre `cinepov` → **Create Project**.
3. Sáltate el asistente de instalación. Lo que necesito es el **DSN**: está en **Settings → Projects → cinepov → Client Keys (DSN)**, y es una URL del tipo `https://…@o….ingest.de.sentry.io/…`. No es secreto (acaba en el navegador de todos los visitantes), así que me lo puedes pegar en el chat.
4. Pásame también el *slug* de la organización: aparece en la URL, `https://<slug>.sentry.io/`.
5. **Token para subir los source maps** (este sí es secreto, no me lo pases): **Settings → Developer Settings → Organization Tokens** (o *Auth Tokens*) → **Create New Token** → nombre `vercel` → **Create**. Cópialo y ponlo en Vercel → **Settings → Environment Variables** como `SENTRY_AUTH_TOKEN`, solo en **Production**. No hace falta redesplegar todavía: lo hago yo al integrarlo.

## 4. Google Search Console (10 minutos más la espera del DNS)

1. Entra en <https://search.google.com/search-console> con tu cuenta de Google.
2. Selector de propiedades (arriba a la izquierda) → **Añadir propiedad** → recuadro de la izquierda, **Dominio** → escribe `cinepov.com` (sin `www` ni `https`) → **Continuar**.
3. Google te muestra un registro TXT del tipo `google-site-verification=…`. Pulsa **Copiar**. No cierres esa ventana.
4. En otra pestaña, Vercel → pestaña **Domains** del panel general → `cinepov.com` → **DNS Records** → **Add**:
   - **Name:** vacío (es el dominio raíz). Si no te deja dejarlo vacío, pon `@`.
   - **Type:** `TXT`.
   - **Value:** lo que copiaste de Google.
   - Guarda.
5. Vuelve a Search Console y pulsa **Verificar**. Si falla, espera 10–15 minutos y repite; es la propagación del DNS.
6. Ya dentro de la propiedad, menú de la izquierda → **Sitemaps** → escribe `https://www.cinepov.com/sitemap.xml` → **Enviar**. El estado debe pasar a *Correcto* en unos minutos u horas.
7. Opcional, para Bing: <https://www.bing.com/webmasters> → inicia sesión → **Importar** desde Google Search Console. Así no hay que verificar otra vez.

## 5. Textos legales

La ley española (LSSI, art. 10, y RGPD) exige que el aviso legal y la privacidad identifiquen al titular. Mándame por el chat:

- Nombre completo o razón social.
- NIF (o CIF si es empresa).
- Domicilio. Tiene que ser una dirección postal; un apartado de correos no vale.
- Email de contacto para usuarios y para ejercer derechos RGPD (puede ser tu Gmail o uno del dominio).
- Si es una sociedad: datos del Registro Mercantil.

Con eso relleno `app/aviso-legal`, `app/privacidad` y `app/terminos` y los traduzco al inglés.

## 6. Tarjetas para redes y botón de stories (10 minutos)

Comprueba con estas dos URLs:

- `https://www.cinepov.com/es/movie/27205` (tarjeta de una película)
- `https://www.cinepov.com/es` (tarjeta por defecto)

1. **Facebook:** <https://developers.facebook.com/tools/debug/> (con tu cuenta de Facebook) → pega la URL → **Depurar**. Si sale una vista previa antigua, pulsa **Volver a extraer**. Mira la imagen de la vista previa.
2. **LinkedIn:** <https://www.linkedin.com/post-inspector/> → pega la URL → **Inspect**.
3. **WhatsApp:** abre el chat contigo mismo (o cualquiera), pega la URL y espera a que aparezca la vista previa. No hace falta enviarlo.
4. En todos, la imagen debe verse entera, con el título y la nota legibles y sin textos cortados. Si algo falla, mándame una captura.

**Botón de stories, en el móvil:**

1. Abre `https://www.cinepov.com/es/vs/27205` en el navegador del móvil (Safari en iPhone, Chrome en Android).
2. Pulsa **Imagen para stories**.
3. Debe abrirse el menú de compartir del sistema con una imagen vertical. Elige Instagram → **Historia** (o guárdala en la galería) y mira que se vea bien.
4. Dime qué pasó y con qué móvil. Si en vez del menú se descarga la imagen, también me sirve saberlo.

## 7. Beta cerrada

1. Haz una lista de 50–100 personas de confianza que vean cine con frecuencia, a ser posible variadas en edad y género (las comparativas por grupo necesitan votos de todos).
2. Mándales la invitación por WhatsApp o email. Plantilla:

   > ¡Hola! Estoy probando CinePOV, una web que te dice qué nota le darías tú a una película antes de verla, según gente con tus gustos. ¿Me ayudas? Regístrate en https://www.cinepov.com, confirma el email que te llega y puntúa al menos 10 películas que hayas visto (con 5 ya empiezas a ver tus predicciones). Si algo falla o se te ocurre una mejora, usa el botón "Sugerencias" del pie de la web. ¡Gracias!

3. Importante: el email hay que verificarlo. Sin verificar, sus votos no cuentan en las medias.
4. A la semana, manda un recordatorio a quien no haya entrado.
5. **Seguimiento:**
   - **Métricas:** `https://www.cinepov.com/es/admin/metrics`, con tu cuenta. Si te da 404, tu email no está en `ADMIN_EMAILS` en Vercel o no lo has verificado.
   - **Sugerencias:** de momento solo se ven en Neon → **Tables** → rama `production` → tabla `Feedback`.
   - **Embudo y retención:** en PostHog (punto 2).

## 8. Opcional

- **CLI de GitHub**, para que pueda seguir el CI sin el límite de consultas anónimas a la API de GitHub:
  1. En PowerShell: `winget install --id GitHub.cli`.
  2. Cierra y vuelve a abrir VS Code, para que encuentre el comando.
  3. En el terminal: `gh auth login` → **GitHub.com** → **HTTPS** → *Authenticate Git with your GitHub credentials?* **Yes** → **Login with a web browser**.
  4. Copia el código de 8 caracteres, pulsa Enter, pégalo en la página que se abre y pulsa **Authorize**.
  5. Comprueba con `gh auth status`.
- **Dominio `.es`:** cómpralo en Namecheap; en Vercel → proyecto → **Settings → Domains** → **Add** `cinepov.es` y elige redirigir a `www.cinepov.com`.
- **Handles `@cinepov`** en X, TikTok, Instagram, Reddit, Bluesky y Product Hunt, aunque sea solo para reservarlos.

## 9. Decisiones de producto pendientes

- **Umbral de anonimato antes de reactivar lo social** ([R-14](./roadmap.md#r-14--umbral-de-anonimato)): hoy un grupo muestra su nota con 3 votos. Con perfiles y feed públicos conviene subirlo (5–10) y no enseñar recuentos por debajo. Sin prisa: lo social sigue apagado.
