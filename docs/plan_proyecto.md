# 🎬 CinePOV — Plan de Proyecto Estratégico y Técnico
> *"La película no tiene un 7.2. Tiene un 8.6 para ti."*
**Fecha:** Julio 2026  
**Versión del documento:** 1.0  
**Estado:** Planificación estratégica — Pre-desarrollo
---
## 1. Visión del Producto
CinePOV es una plataforma web de calificación y descubrimiento de películas cuyo diferenciador central es **romper la tiranía de la nota media**. Mientras que plataformas como Filmaffinity, IMDb o Letterboxd muestran una única puntuación agregada, CinePOV permite a los usuarios **filtrar y segmentar las valoraciones por perfil demográfico** (edad y género), revelando cómo perciben realmente una película las personas con un perfil similar al suyo.
### 1.1 Problema que resuelve
- Una nota media de 6.8 puede esconder un 8.5 entre mujeres de 20-30 años y un 4.2 entre hombres de 50+. Esa información se pierde por completo en las plataformas actuales.
- Los usuarios toman decisiones de visionado basándose en métricas que no les representan.
- Las recomendaciones genéricas ignoran que la edad y el género son dos de los factores que más correlacionan con las preferencias cinematográficas.
### 1.2 Propuesta de valor única (UVP)
**"Descubre cómo valoran las películas las personas como tú."** CinePOV no te dice qué nota tiene una película; te dice qué nota le dan las personas de tu perfil demográfico.
### 1.3 Nombre y significado
**CinePOV** = Cine + POV (Point of View). El nombre comunica inmediatamente la propuesta: el cine desde tu punto de vista, no desde la media global.
---
## 2. Definición del MVP (Producto Mínimo Viable)
### 2.1 Hipótesis central a validar
> "Los usuarios valoran significativamente más la información de ratings segmentados por demografía que una nota media única, y esto influye en sus decisiones de visionado."
### 2.2 Funcionalidades críticas para el MVP (MUST HAVE)
| # | Funcionalidad | Justificación |
|---|---|---|
| 1 | **Registro con datos demográficos** | Sin edad y género no existe el producto. Es el pilar fundamental. |
| 2 | **Catálogo de películas** (vía API TMDB) | Necesitamos una base de datos de películas con pósters, sinopsis, reparto, etc. TMDB es gratuita y completa. |
| 3 | **Sistema de valoración** (1-10) | El acto de valorar es el core del producto. Escala 1-10 para compatibilidad mental con Filmaffinity/IMDb. |
| 4 | **Filtro demográfico en la ficha de película** | EL diferenciador. En cada ficha, poder ver la nota segmentada por género, por rango de edad, o cruzando ambos. |
| 5 | **Buscador de películas** | Funcionalidad básica para encontrar películas y poder valorarlas. |
| 6 | **Ficha de película** | Página individual con: info de TMDB + nota global + **desglose demográfico visual** (gráficos/barras). |
| 7 | **Perfil de usuario básico** | Lista de películas valoradas por el usuario. Mínimo para dar sensación de cuenta personal. |
| 8 | **Landing page con propuesta de valor** | Página de entrada que comunique el diferenciador de forma inmediata y atractiva. |
### 2.3 Funcionalidades diferidas (POST-MVP)
| Fase | Funcionalidad | Razón del aplazamiento |
|---|---|---|
| v1.1 | Reseñas escritas (texto) | Añade complejidad de moderación. La valoración numérica es suficiente para validar la hipótesis. |
| v1.1 | Rankings/Top listas por segmento | Depende de masa crítica de datos. |
| v1.2 | Sistema de recomendaciones ("Para personas como tú") | Requiere algoritmo de recomendación y volumen de datos. |
| v1.2 | Listas personalizadas (watchlist, favoritas) | Nice to have, no valida la hipótesis central. |
| v1.3 | Social features (seguir usuarios, feed de actividad) | Complejidad alta, no es core. |
| v1.3 | Comparador de películas por segmentos | Feature avanzada de visualización de datos. |
| v2.0 | App móvil nativa | Primero validar en web. |
| v2.0 | Integración con plataformas de streaming | Partnerships complejos. |
| v2.0 | Filtros adicionales (país, nivel educativo, etc.) | Más datos demográficos = más fricción en registro. Empezar con lo mínimo. |
### 2.4 Criterios de éxito del MVP
| Métrica | Objetivo (primeros 3 meses) |
|---|---|
| Usuarios registrados | 500+ |
| Valoraciones totales | 5.000+ |
| Tasa de registro completado (con datos demográficos) | > 70% |
| Usuarios que usan el filtro demográfico | > 40% de los visitantes de fichas |
| Retención a 7 días | > 25% |
---
## 3. Historias de Usuario del MVP
### HU-01: Registro con perfil demográfico
> **Como** visitante nuevo, **quiero** registrarme proporcionando mi edad y género de forma rápida y no invasiva, **para que** mis valoraciones se asocien a mi perfil demográfico y pueda ver recomendaciones relevantes para mí.
**Criterios de aceptación:**
- El registro solicita: email, contraseña, año de nacimiento (no fecha exacta, para reducir fricción), género (con opción "prefiero no decirlo").
- El proceso de registro no supera los 60 segundos.
- Se explica claramente por qué se piden estos datos y cómo se usan (transparencia).
- Opción de registro con Google/OAuth para reducir fricción.
---
### HU-02: Buscar y explorar películas
> **Como** usuario registrado, **quiero** buscar películas por título y explorar el catálogo, **para** encontrar películas que quiero valorar o sobre las que quiero consultar valoraciones demográficas.
**Criterios de aceptación:**
- Buscador con autocompletado por título.
- Resultados muestran póster, título, año y nota media global.
- Se puede acceder a la ficha completa de cada película.
---
### HU-03: Valorar una película
> **Como** usuario registrado, **quiero** puntuar una película del 1 al 10, **para** contribuir a la base de datos de valoraciones y ver cómo mi puntuación se compara con la de mi segmento demográfico.
**Criterios de aceptación:**
- Interfaz de valoración intuitiva (estrellas, slider o clicks numéricos).
- Se puede cambiar la valoración en cualquier momento.
- Tras valorar, se muestra feedback inmediato: "Tu nota: 8 | Media de tu segmento: 7.4".
- Solo se permite una valoración por usuario y película.
---
### HU-04: Ver desglose demográfico de una película (⭐ CORE)
> **Como** usuario cinéfilo de 28 años, **quiero** ver en la ficha de una película cómo la puntúan las personas de mi rango de edad y género vs. otros segmentos, **para** saber si probablemente me gustará basándome en personas similares a mí, no en la media global.
**Criterios de aceptación:**
- La ficha de película muestra la nota media global Y un desglose visual por:
  - Género (hombres / mujeres / otro)
  - Rango de edad (18-24, 25-34, 35-44, 45-54, 55+)
  - Cruce de ambos (ej: "Mujeres 25-34: 8.2")
- Se muestra el número de valoraciones por segmento (para indicar confianza estadística).
- Si un segmento tiene menos de N valoraciones (umbral mínimo), se indica visualmente que la muestra es pequeña.
- Visualización con gráfico de barras o heatmap intuitivo.
---
### HU-05: Consultar mi historial de valoraciones
> **Como** usuario registrado, **quiero** ver un listado de todas las películas que he valorado con mis puntuaciones, **para** llevar un registro de mi actividad y poder modificar valoraciones anteriores.
**Criterios de aceptación:**
- Página de perfil con lista de películas valoradas, ordenables por fecha o puntuación.
- Click en cualquier película lleva a su ficha.
- Se puede editar o eliminar una valoración desde el perfil.
---
### HU-06: Descubrir películas populares y tendencias
> **Como** usuario que no sabe qué ver, **quiero** explorar las películas más valoradas y las tendencias recientes, **para** descubrir contenido nuevo que pueda interesarme.
**Criterios de aceptación:**
- Página principal con secciones: "Populares esta semana", "Mejor valoradas", "Añadidas recientemente".
- Cada sección muestra al menos la nota global y, si hay datos suficientes, la nota del segmento del usuario logueado.
---
### HU-07: Entender la propuesta de valor al llegar
> **Como** visitante no registrado, **quiero** entender inmediatamente qué hace CinePOV diferente, **para** decidir si me interesa registrarme.
**Criterios de aceptación:**
- Landing page que explique el concepto en menos de 5 segundos de lectura.
- Ejemplo visual interactivo del filtro demográfico (puede ser con datos de demostración).
- Call-to-action claro hacia el registro.
- Diseño premium y moderno que transmita confianza.
---
## 4. Arquitectura y Stack Tecnológico
### 4.1 Visión general de la arquitectura
Se propone una **arquitectura cliente-servidor clásica con API REST**, optimizada para lecturas rápidas con agregaciones dinámicas. Para el MVP no se necesita microservicios ni infraestructura compleja.
```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│                 │       │                  │       │                 │
│   Frontend      │◄─────►│   Backend API    │◄─────►│   Base de Datos │
│   (Next.js)     │  REST │   (Next.js API   │       │  (PostgreSQL)   │
│                 │       │    Routes)       │       │                 │
└─────────────────┘       └──────┬───────────┘       └─────────────────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │   TMDB API   │
                          │  (películas) │
                          └──────────────┘
```
### 4.2 Stack recomendado y justificación
#### Frontend: **Next.js (App Router) + React**
| Aspecto | Justificación |
|---|---|
| **SSR/SSG** | Las fichas de películas se benefician de Server-Side Rendering para SEO y velocidad de carga. |
| **React** | Ecosistema maduro, abundancia de librerías de gráficos (Recharts, Chart.js) necesarias para la visualización demográfica. |
| **Full-stack** | Next.js permite tener el frontend y el backend (API Routes) en un solo proyecto, reduciendo complejidad operativa para el MVP. |
| **App Router** | Layouts compartidos, streaming, y Server Components reducen el JS enviado al cliente. |
#### Backend: **Next.js API Routes (Node.js)**
| Aspecto | Justificación |
|---|---|
| **Simplicidad** | Al usar Next.js para todo, eliminamos la necesidad de un servidor separado. Un solo deploy. |
| **TypeScript** | Tipado end-to-end entre frontend y backend, reduciendo bugs. |
| **Escalabilidad futura** | Si el proyecto crece, se puede extraer el backend a un servicio independiente (Node.js con Express/Fastify o incluso migrar a otro lenguaje). |
#### Base de datos: **PostgreSQL**
| Aspecto | Justificación |
|---|---|
| **Agregaciones complejas** | PostgreSQL es excelente para queries con GROUP BY, filtros combinados y funciones de ventana. El filtro demográfico se traduce directamente en queries de agregación. |
| **Índices parciales** | Permite crear índices específicos por combinaciones demográficas para optimizar las consultas más frecuentes. |
| **Vistas materializadas** | Para cachear las agregaciones demográficas pre-calculadas (nota media por segmento) y refrescarlas periódicamente, evitando recalcular en cada request. |
| **Madurez y soporte** | Base de datos relacional probada, con soporte excelente en todos los clouds. |
| **JSON nativo** | Si necesitamos flexibilidad en campos futuros. |
#### ORM: **Prisma**
| Aspecto | Justificación |
|---|---|
| **Type-safety** | Genera tipos TypeScript automáticamente desde el esquema de BD. |
| **Migraciones** | Sistema de migraciones integrado y fácil de usar. |
| **Compatibilidad** | Funciona perfectamente con PostgreSQL y Next.js. |
#### Autenticación: **NextAuth.js (Auth.js)**
| Aspecto | Justificación |
|---|---|
| **Integración nativa** | Diseñado específicamente para Next.js. |
| **OAuth** | Soporte out-of-the-box para Google, GitHub, etc. |
| **Sesiones** | Manejo de sesiones con JWT o base de datos. |
#### Hosting/Deploy: **Vercel**
| Aspecto | Justificación |
|---|---|
| **Deploy zero-config** | Next.js es de Vercel, el deploy es trivial. |
| **Edge functions** | Para APIs rápidas cerca del usuario. |
| **Free tier generoso** | Suficiente para MVP y validación. |
| **Base de datos** | Vercel Postgres (powered by Neon) incluido en free tier. |
#### Visualización de datos: **Recharts o Nivo**
| Aspecto | Justificación |
|---|---|
| **React-native** | Librerías de gráficos construidas para React. |
| **Gráficos de barras/heatmaps** | Exactamente lo que necesitamos para el desglose demográfico. |
| **Responsive** | Se adaptan al móvil, critical para UX. |
### 4.3 APIs externas
| API | Uso | Coste |
|---|---|---|
| **TMDB (The Movie Database)** | Catálogo de películas: títulos, sinopsis, pósters, reparto, géneros, año, etc. | Gratuita (con atribución). Requiere API key. |
### 4.4 Diagrama de flujo de la consulta demográfica
```
Usuario abre ficha de "Parásitos"
         │
         ▼
Frontend solicita GET /api/movies/{id}/ratings?groupBy=gender,ageRange
         │
         ▼
Backend consulta vista materializada "movie_demographic_ratings"
         │
         ▼
Retorna JSON con estructura:
  - global: { avg: 8.1, count: 1240 }
  - byGender: { M: {avg: 8.0, count: 680}, F: {avg: 8.3, count: 520} }
  - byAge: { "18-24": {avg: 8.4, count: 310}, "25-34": {avg: 8.2, count: 420}, ... }
  - byCross: { "M_18-24": {avg: 8.3, count: 170}, "F_25-34": {avg: 8.5, count: 190}, ... }
         │
         ▼
Frontend renderiza gráficos de barras + heatmap con los datos
```
---
## 5. Estructura de Datos Conceptual
### 5.1 Entidades principales
#### 🧑 **Usuarios (Users)**
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| email | String (único) | Email del usuario |
| password_hash | String | Contraseña hasheada (si no usa OAuth) |
| display_name | String | Nombre público del usuario |
| birth_year | Integer | Año de nacimiento (NO fecha completa → privacidad) |
| gender | Enum | "male", "female", "non_binary", "prefer_not_to_say" |
| created_at | Timestamp | Fecha de registro |
| avatar_url | String (nullable) | URL del avatar |
> **Decisión de diseño:** Se almacena `birth_year` en vez de fecha de nacimiento completa. El rango de edad se calcula dinámicamente. Esto reduce datos personales almacenados (menos exposición RGPD) y los rangos se actualizan automáticamente con el tiempo.
#### 🎬 **Películas (Movies)**
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador interno |
| tmdb_id | Integer (único) | ID en TMDB para sincronización |
| title | String | Título principal |
| original_title | String | Título original |
| year | Integer | Año de estreno |
| synopsis | Text | Sinopsis |
| poster_url | String | URL del póster (TMDB) |
| backdrop_url | String | URL de imagen de fondo |
| genres | Array de Strings | Géneros (drama, comedia, etc.) |
| director | String | Director principal |
| runtime | Integer | Duración en minutos |
| tmdb_rating | Float | Nota en TMDB (referencia) |
| cached_at | Timestamp | Última sincronización con TMDB |
> **Nota:** Los datos de TMDB se cachean localmente para no depender de la API en cada request y respetar rate limits.
#### ⭐ **Valoraciones (Ratings)**
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| user_id | UUID (FK) | Referencia al usuario |
| movie_id | UUID (FK) | Referencia a la película |
| score | Integer (1-10) | Puntuación del usuario |
| created_at | Timestamp | Fecha de la valoración |
| updated_at | Timestamp | Última modificación |
> **Restricción:** Índice único en (user_id, movie_id) → un usuario, una valoración por película.
> **Decisión de diseño clave:** La tabla de ratings NO almacena datos demográficos del usuario. Se hace JOIN con la tabla de usuarios en las consultas de agregación. Esto evita duplicación de datos y garantiza que si un usuario actualiza su perfil, los filtros reflejan el cambio automáticamente.
#### 📊 **Ratings Demográficos Pre-calculados (Movie_Demographic_Stats)** — Vista materializada
| Campo | Tipo | Descripción |
|---|---|---|
| movie_id | UUID (FK) | Referencia a la película |
| gender | Enum | Segmento de género |
| age_range | Enum | Segmento de edad ("18-24", "25-34", etc.) |
| avg_score | Float | Media de puntuaciones del segmento |
| count | Integer | Número de valoraciones del segmento |
| last_refreshed | Timestamp | Última actualización del cálculo |
> **Por qué una vista materializada:** Calcular la media por segmento demográfico en cada request sería costoso con muchas valoraciones. Pre-calcular y refrescar periódicamente (cada 5-15 min) escala mucho mejor. Para el MVP con pocas valoraciones, se podría calcular en tiempo real e introducir la vista materializada cuando el rendimiento lo requiera.
### 5.2 Rangos de edad propuestos
| Rango | Etiqueta |
|---|---|
| 13-17 | Adolescentes |
| 18-24 | Jóvenes adultos |
| 25-34 | Adultos jóvenes |
| 35-44 | Adultos |
| 45-54 | Adultos maduros |
| 55+ | Seniors |
> Se calcula dinámicamente como: `rango = f(año_actual - birth_year)`. No se almacena como dato fijo.
### 5.3 Índices críticos para rendimiento
- **ratings(movie_id)** → Búsquedas de todas las valoraciones de una película.
- **ratings(user_id)** → Perfil del usuario con su historial.
- **ratings(movie_id, user_id)** → Índice único, verificar si ya valoró.
- **users(gender, birth_year)** → Filtrado demográfico en JOINs.
- **movies(tmdb_id)** → Búsqueda rápida al sincronizar con TMDB.
---
## 6. Estrategia de Cold Start (Arranque en Frío)
El mayor riesgo del producto es el **problema del huevo y la gallina**: necesitamos valoraciones segmentadas para que el producto sea útil, pero necesitamos usuarios para tener valoraciones. Aquí van 3 estrategias concretas:
### 6.1 🎯 Estrategia 1: "Import Your Taste" — Importación de historial
**Concepto:** Permitir a los usuarios importar sus valoraciones desde otras plataformas (Letterboxd, IMDb, Filmaffinity) durante el registro.
**Ejecución:**
- Letterboxd permite exportar a CSV. Crear un importador que lea el CSV y mapee las películas vía TMDB ID.
- IMDb tiene export de ratings también en CSV.
- Filmaffinity no tiene export oficial, pero se puede ofrecer una extensión de navegador o bookmarklet simple.
**Beneficio:** Un usuario que importa 200 valoraciones de Letterboxd aporta 200 datos demográficos INMEDIATAMENTE, sin fricción. Es como si hubiera valorado 200 películas en CinePOV el primer día.
**Mensaje de marketing:** *"Trae tus valoraciones de Letterboxd y descubre qué piensan de esas películas las personas como tú."*
### 6.2 🎯 Estrategia 2: "Las 50 Esenciales" — Onboarding gamificado
**Concepto:** Durante el onboarding, presentar al usuario una selección curada de 50 películas icónicas muy conocidas y pedirle que valore rápidamente las que haya visto (interfaz tipo Tinder: swipe o click rápido).
**Ejecución:**
- Selección de ~50 películas con alta probabilidad de que el usuario las haya visto (blockbusters, clásicos modernos, hits de streaming).
- Interfaz de valoración rápida: mostrar póster → ¿la has visto? → si sí, puntúa del 1 al 10.
- Flujo rápido, no más de 3-5 minutos.
**Beneficio:** Cada nuevo usuario genera entre 10-30 valoraciones en su primer minuto de uso. Esto llena la base de datos rápidamente con películas populares, que son las primeras donde los filtros demográficos serán útiles.
**Mensaje:** *"Valora las películas que ya has visto y te mostraremos algo que nunca has podido ver: qué opinan de ellas las personas como tú."*
### 6.3 🎯 Estrategia 3: Campaña viral en redes — "La Guerra de Géneros Cinematográfica"
**Concepto:** Crear contenido viral en TikTok, Twitter/X e Instagram basado en las diferencias demográficas en las valoraciones, generando curiosidad y debate.
**Ejecución:**
- Crear una página pública `/batalla/{movie_id}` que muestre el contraste de valoraciones entre segmentos de forma visual y compartible.
- Posts como: *"Titanic: Nota media 7.8... pero si miras por género: Mujeres 18-24: 9.1 vs Hombres 18-24: 5.4. ¿Por qué? Descúbrelo en CinePOV"*.
- Publicar los contrastes más llamativos como carruseles de Instagram o TikToks cortos.
- Incluir un CTA que lleve a la plataforma: *"¿Quieres saber qué piensan de TUS películas favoritas las personas de tu edad? Regístrate en CinePOV."*
**Beneficio:** El formato "hombres vs. mujeres" o "Gen Z vs. Boomers" es inherentemente viral y genera debate. Cada debate = tráfico = registros = más datos.
> **Nota importante:** En las primeras semanas, antes de tener suficientes datos propios, se podría usar data pública de estudios demográficos sobre cine como "seed data" de demostración, dejando claro que son datos de ejemplo hasta que la comunidad genere los suyos.
---
## 7. Riesgos y Mitigaciones
### 7.1 🔴 Riesgo 1: Privacidad y RGPD — "¿Por qué me pides mi edad y género?"
**Severidad:** CRÍTICA  
**Probabilidad:** ALTA
**El problema:**
- Los datos demográficos son datos personales bajo RGPD.
- Los usuarios pueden ser reticentes a proporcionar género y edad.
- Almacenar estos datos conlleva obligaciones legales de protección, derecho al olvido, portabilidad, etc.
- Riesgo reputacional si hay una brecha de seguridad.
**Mitigaciones:**
| Acción | Detalle |
|---|---|
| **Minimización de datos** | Solo pedimos año de nacimiento (no fecha completa) y género. No pedimos nombre real, ubicación ni otros datos sensibles. |
| **Transparencia total** | Explicar en el registro EXACTAMENTE por qué se piden estos datos y cómo se usan: "Para mostrarte cómo puntúan películas personas de tu misma edad y género. Nunca se mostrarán asociados a tu perfil público." |
| **Anonimización en la presentación** | Los datos demográficos NUNCA se muestran a nivel individual. Solo se muestran como agregados estadísticos. Nadie puede ver "el usuario X es hombre de 28 años". |
| **Opción "prefiero no decirlo"** | Para género. Para edad, considerar si hacerla opcional (pero esto reduce la utilidad del producto). |
| **Cumplimiento RGPD** | Política de privacidad clara, consentimiento explícito, derecho de supresión implementado, DPO designado si procede. |
| **Umbral mínimo de anonimización** | No mostrar datos de un segmento si tiene menos de 5-10 valoraciones (evita identificación por descarte). |
---
### 7.2 🔴 Riesgo 2: Review Bombing Demográfico — "Los trolls atacan un segmento"
**Severidad:** ALTA  
**Probabilidad:** MEDIA
**El problema:**
- Grupos organizados podrían crear cuentas falsas con un perfil demográfico específico para inflar o hundir la nota de un segmento concreto.
- Ejemplo: una película controvertida podría recibir cientos de 1s de cuentas falsas que se registran como "mujeres 18-24", distorsionando deliberadamente ese segmento.
- Esto es MÁS dañino que el review bombing tradicional porque ataca un segmento específico, destruyendo la confianza en el diferenciador del producto.
**Mitigaciones:**
| Acción | Detalle |
|---|---|
| **Verificación de email obligatoria** | Barrera básica contra cuentas masivas. |
| **Rate limiting en registros** | Limitar registros por IP y por ventana temporal. |
| **Detección de anomalías** | Alertas automáticas si un segmento demográfico de una película recibe un volumen anormal de valoraciones en poco tiempo (ej: +50 valoraciones de "hombres 18-24" en una hora para una película antigua). |
| **Cuenta mínima para valorar** | Requerir que una cuenta tenga al menos X horas de antigüedad o Y valoraciones antes de que sus votos cuenten para los agregados públicos. |
| **Score de confianza del usuario** | Internamente, ponderar las valoraciones según la actividad del usuario. Un usuario con 200 valoraciones diversas pesa más que uno con 2 valoraciones extremas. |
| **Cuarentena de valoraciones** | Las valoraciones de cuentas nuevas se incluyen en los agregados con un delay (ej: 24h), dando tiempo a detectar patrones de bombing. |
---
### 7.3 🔴 Riesgo 3: Rendimiento de Base de Datos — "La consulta demográfica es lenta"
**Severidad:** ALTA  
**Probabilidad:** MEDIA-ALTA (a medida que crece)
**El problema:**
- La consulta core del producto requiere JOINs entre ratings y users, GROUP BY múltiples columnas, y cálculos de AVG.
- Con 1M de valoraciones y 50K usuarios, una query en tiempo real podría tardar segundos.
- Cada ficha de película necesita esta consulta. Si es lenta, la UX se destruye.
**Mitigaciones:**
| Fase | Acción | Detalle |
|---|---|---|
| **MVP** | Consultas en tiempo real | Con pocas valoraciones, es perfectamente viable. PostgreSQL maneja miles de registros con JOINs sin despeinarse. |
| **Crecimiento temprano** (10K+ ratings) | Índices optimizados | Índices compuestos en ratings(movie_id) + users(gender, birth_year). |
| **Crecimiento medio** (100K+ ratings) | Vistas materializadas | Pre-calcular movie_demographic_stats y refrescar cada 5-15 min con `REFRESH MATERIALIZED VIEW CONCURRENTLY`. |
| **Escala** (1M+ ratings) | Cache layer (Redis) | Cachear los resultados de agregación por película con TTL de 5-15 min. Invalidar al recibir nuevas valoraciones. |
| **Gran escala** (10M+) | Desnormalización + CQRS | Almacenar los stats demográficos directamente en un documento por película. Separar las escrituras (nueva valoración) de las lecturas (consulta de stats). |
**Decisión clave:** NO sobreingenierar desde el día 1. Empezar simple (queries directas), medir, y escalar cuando los datos lo justifiquen.
---
## 8. Roadmap de Fases
### Fase 0: Planificación y Setup (Semana 1-2)
- [ ] Definir stack definitivo y crear repositorio
- [ ] Configurar proyecto Next.js + PostgreSQL + Prisma
- [ ] Obtener API key de TMDB y probar integración
- [ ] Diseñar wireframes de las pantallas principales
- [ ] Definir esquema de base de datos (Prisma schema)
### Fase 1: MVP Core (Semana 3-6)
- [ ] Sistema de autenticación con datos demográficos
- [ ] Integración con TMDB (búsqueda, fichas)
- [ ] Sistema de valoración (crear, editar, eliminar)
- [ ] Ficha de película con desglose demográfico
- [ ] Buscador de películas
- [ ] Perfil de usuario con historial
- [ ] Landing page
### Fase 2: Engagement y Datos (Semana 7-9)
- [ ] Onboarding "50 Esenciales"
- [ ] Importador de CSV (Letterboxd/IMDb)
- [ ] Rankings y tops (global + por segmento)
- [ ] Página de exploración/descubrimiento
- [ ] Mejoras de UX basadas en feedback
### Fase 3: Social y Crecimiento (Semana 10-14)
- [ ] Reseñas escritas con moderación básica
- [ ] Listas personalizadas (watchlist, favoritos)
- [ ] Página compartible "/batalla/{movie}" para viralización
- [ ] SEO optimizado para fichas de películas
- [ ] Sistema de recomendaciones básico ("personas como tú también vieron...")
### Fase 4: Escala y Monetización (Semana 15+)
- [ ] Optimización de rendimiento (vistas materializadas, cache)
- [ ] PWA para experiencia móvil mejorada
- [ ] API pública para desarrolladores
- [ ] Explorar monetización: premium features, API, partnerships con plataformas de streaming
---
## 9. Ideas de Enriquecimiento
Más allá del MVP, estas funcionalidades podrían diferenciar aún más a CinePOV:
### 9.1 📊 "Tu Perfil Cinematográfico"
Una página que analiza las valoraciones del usuario y genera un perfil visual tipo infografía:
- Géneros favoritos y menos favoritos
- Década favorita
- Tu media vs. la media global vs. la de tu segmento
- "Eres un 15% más generoso que la media de tu segmento"
- Compartible en redes sociales
### 9.2 🔥 "Películas Polarizantes"
Ranking de películas con mayor diferencia de valoración entre segmentos demográficos. Ejemplo: "La La Land — Mayor brecha de género: Mujeres 8.7 vs Hombres 6.1". Este contenido es inherentemente viral.
### 9.3 🎯 "Afinidad con otros segmentos"
"Aunque eres hombre de 30, tus gustos se parecen un 78% a los de mujeres de 25-34 y solo un 45% a los de hombres de tu edad". Insight interesante y único.
### 9.4 📈 "Evolución temporal"
¿Cómo cambia la valoración de una película por segmento a lo largo del tiempo? ¿Los jóvenes de hoy valoran "El Padrino" igual que los jóvenes de hace 10 años?
### 9.5 🏆 "Premios CinePOV"
Premios anuales donde cada segmento demográfico vota por la mejor película del año. "Mejor película del 2026 según mujeres 25-34" vs "según hombres 45-54".
### 9.6 🤝 "Modo Pareja / Grupo"
"Soy hombre de 30, mi pareja es mujer de 28. ¿Qué película nos gustará a ambos esta noche?" Buscar películas con alta nota en ambos segmentos simultáneamente.
### 9.7 🧩 "Widget embebible"
Un widget que blogs de cine y medios puedan embeber en sus reviews: "Mira cómo puntúan esta película en CinePOV por demografía". Genera backlinks y tráfico.
---
## 10. Consideraciones Legales y Éticas
| Tema | Postura |
|---|---|
| **RGPD** | Cumplimiento obligatorio. Consentimiento explícito, derecho al olvido, DPA con proveedores. |
| **Sesgo algorítmico** | Los filtros demográficos pueden reforzar estereotipos. Siempre mostrar la nota global junto a la segmentada. Nunca presentar un segmento como "correcto" o "mejor". |
| **Inclusividad de género** | Ofrecer opciones no binarias. No hacer del género una dicotomía forzada. |
| **Menores de edad** | Si se permite 13-17, evaluar COPPA/regulación de menores. Considerar si el MVP debería ser solo 18+. |
| **Uso de datos de TMDB** | Atribución obligatoria según sus ToS. No cachear imágenes, usar sus URLs. |
---
## 11. Métricas Clave (KPIs)
### Métricas de producto
- **Tasa de conversión de registro** (visitante → registro completado con datos demográficos)
- **Valoraciones por usuario** (media)
- **Uso del filtro demográfico** (% de visitas a fichas que interactúan con los filtros)
- **Retención D1, D7, D30**
### Métricas de datos
- **Cobertura demográfica** (% de segmentos con ≥10 valoraciones por película popular)
- **Distribución de usuarios por segmento** (¿hay segmentos infrarepresentados?)
- **Varianza entre segmentos** (si todas las notas son iguales entre segmentos, el producto no aporta valor)
### Métricas técnicas
- **Tiempo de carga de ficha de película** (target: < 1s incluyendo datos demográficos)
- **Latencia P95 de API de ratings demográficos** (target: < 200ms)
- **Uptime** (target: 99.5% para MVP)
---
> **Próximo paso:** Revisar este plan, resolver cualquier duda o ajuste, y una vez aprobado, comenzar con la Fase 0 (setup del proyecto y diseño de wireframes).
