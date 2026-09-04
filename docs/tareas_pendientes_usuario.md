# CinePOV — Tareas Manuales Requeridas del Usuario

> Este documento recopila todas las acciones del roadmap y de la infraestructura que requieren intervención humana directa (pagos, creación de cuentas personales, registros de dominios, acceso a paneles externos o datos fiscales) y que no pueden ser ejecutadas por un agente de código en local.

---

## 1. Infraestructura y Base de Datos en la Nube

### 1.1 — Provisionar PostgreSQL Gestionado en Neon
- **Por qué no puedo hacerlo:** Requiere iniciar sesión con tu cuenta personal o crear una en [neon.tech](https://neon.tech).
- **Qué debes hacer:**
  1. Entra en Neon y crea un nuevo proyecto llamado `cinepov`.
  2. Selecciona la región más cercana a tu público principal (por ejemplo, `Frankfurt (eu-central-1)` si tu audiencia prioritaria es España/Europa).
  3. En el panel de control del proyecto, copia la cadena de conexión en modo **Pooled** (para `DATABASE_URL`) y en modo **Direct** (para `DIRECT_URL`).
  4. Pega ambas cadenas en tu archivo local `.env` sustituyendo los valores actuales.
  5. Una vez configuradas, avísame para ejecutar `npx prisma db push` y migrar el esquema a tu base de datos real.

### 1.2 — Configurar Variables en Vercel
- **Por qué no puedo hacerlo:** Requiere acceso al panel de administración de tu proyecto en Vercel.
- **Qué debes hacer:**
  1. En el panel de tu proyecto en Vercel, ve a **Settings** > **Environment Variables**.
  2. Añade las siguientes variables críticas:
     - `DATABASE_URL` (cadena con connection pooling de Neon).
     - `DIRECT_URL` (cadena de conexión directa de Neon).
     - `NEXTAUTH_SECRET` (cadena aleatoria de 32 caracteres generada con `openssl rand -base64 32`).
     - `NEXTAUTH_URL` (URL pública definitiva, ej. `https://cinepov.com`).
     - `TMDB_API_READ_ACCESS_TOKEN` (tu token de lectura de la API de TMDB).
     - `RESEND_API_KEY` (clave de API obtenida en Resend, ver sección 2.2).
     - `EMAIL_FROM` (ej. `CinePOV <hola@tudominio.com>`).
     - `NEXT_PUBLIC_POSTHOG_KEY` (clave pública de PostHog, ver sección 3.1).
     - `NEXT_PUBLIC_POSTHOG_HOST` (`https://eu.i.posthog.com`).
     - `CRON_SECRET` (clave aleatoria para proteger `/api/cron/weekly-trends`).

---

## 2. Dominio, Correo y DNS

### 2.1 — Registro del Dominio Definitivo
- **Por qué no puedo hacerlo:** Requiere pago con tarjeta y titularidad legal.
- **Qué debes hacer:**
  1. Comprar el dominio en un registrador (Cloudflare Registrar, Namecheap, DonDominio o Porkbun).
  2. Prioridad recomendada: `.com` como dominio principal y `.es` como redirección defensiva.
  3. Vincular el dominio a tu proyecto de Vercel en **Settings** > **Domains**.

### 2.2 — Configurar Proveedor de Correo (Resend)
- **Por qué no puedo hacerlo:** Requiere registrarse en [resend.com](https://resend.com) y configurar registros DNS en tu registrador de dominio.
- **Qué debes hacer:**
  1. Crea una cuenta gratuita en Resend.
  2. Añade tu dominio en la sección **Domains**.
  3. Resend te proporcionará 3 registros DNS (DKIM, SPF y DMARC). Añádelos en la zona DNS de tu dominio para que los correos no caigan en la carpeta de spam.
  4. Genera una API Key con permisos de envío y cópiala en tu variable `RESEND_API_KEY`.

---

## 3. Analítica, Rastreo y Observabilidad

### 3.1 — Proyecto en PostHog
- **Por qué no puedo hacerlo:** Requiere cuenta personal en la plataforma de analítica.
- **Qué debes hacer:**
  1. Regístrate en [posthog.com](https://posthog.com) seleccionando la región de la Unión Europea (EU Cloud).
  2. Crea un proyecto para CinePOV.
  3. Ve a **Project Settings** y copia el **Project API Key**.
  4. Pégalo en tu variable `NEXT_PUBLIC_POSTHOG_KEY`.

### 3.2 — Google Search Console y Bing Webmaster Tools
- **Por qué no puedo hacerlo:** Requiere demostrar que eres el propietario del dominio.
- **Qué debes hacer:**
  1. Da de alta tu dominio en [Google Search Console](https://search.google.com/search-console).
  2. Verifica la propiedad mediante registro DNS (TXT) en tu registrador.
  3. Una vez verificado, introduce la URL de tu sitemap: `https://tudominio.com/sitemap.xml`.
  4. Repite el proceso en Bing Webmaster Tools (puedes importar la configuración directamente desde Search Console con un solo clic).

### 3.3 — Canal de Alertas (Discord o Telegram)
- **Por qué no puedo hacerlo:** Requiere tu servidor o bot personal.
- **Qué debes hacer:**
  1. Si deseas recibir notificaciones de errores o registros masivos, crea un webhook en un canal privado de Discord o crea un bot con BotFather en Telegram.

---

## 4. Legalidad, RGPD y Datos Fiscales

### 4.1 — Completar Datos del Titular en Textos Legales
- **Por qué no puedo hacerlo:** Son tus datos personales o fiscales reales que la ley española y europea exigen mostrar.
- **Qué debes hacer:**
  - Revisa y sustituye los marcadores de posición en los siguientes tres archivos:
    1. `app/aviso-legal/page.tsx`: Nombre o razón social, CIF/NIF, domicilio social o de contacto, y correo de atención.
    2. `app/privacidad/page.tsx`: Identidad y datos de contacto del responsable del tratamiento de datos.
    3. `app/terminos/page.tsx`: Legislación aplicable y jurisdicción (por defecto Madrid/España).

---

## 5. Marca, Redes Sociales y Código Fuente

### 5.1 — Crear Repositorio Remoto en GitHub
- **Por qué no puedo hacerlo:** Requiere autenticación con tu cuenta de GitHub.
- **Qué debes hacer:**
  1. Crea un repositorio privado o público en tu cuenta de GitHub (ej. `github.com/tu-usuario/cinepov`).
  2. En tu terminal local, vincula el remoto y sube el código:
     ```bash
     git remote add origin https://github.com/tu-usuario/cinepov.git
     git branch -M main
     git push -u origin main
     ```
  3. Conecta este repositorio con Vercel para activar los despliegues continuos automáticos.

### 5.2 — Reserva de Nombres de Usuario (Handles)
- **Por qué no puedo hacerlo:** Requiere registro con teléfono/email en cada plataforma.
- **Qué debes hacer:**
  - Registra el nombre `@cinepov` (o variante consistente como `@cinepov_app` o `@cinepov_es`) en:
    - X (Twitter)
    - TikTok
    - Instagram
    - Reddit
    - YouTube
    - Bluesky
    - Product Hunt

---

## 6. Validación de Previsualización en Redes

### 6.1 — Comprobación de Tarjetas OpenGraph
- **Por qué no puedo hacerlo:** Requiere acceder con cuentas personales a las herramientas de depuración de redes sociales.
- **Qué debes hacer:**
  - Una vez desplegado el proyecto en tu dominio público, introduce la URL de una película (ej. `https://tudominio.com/movie/157336`) en:
    - [X Card Validator](https://cards-dev.twitter.com/validator)
    - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
    - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
  - Verifica que la imagen dinámica generada por CinePOV se visualiza con las dimensiones correctas (1200x630) y sin textos cortados.
