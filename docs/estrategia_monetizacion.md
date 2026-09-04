# CinePOV — Estrategia de Monetización y Modelo de Negocio

> Este documento define la estrategia integral de generación de ingresos de CinePOV, desglosando los canales B2C (consumidor final) y B2B (industria cinematográfica), las proyecciones financieras por volumen de usuarios y la hoja de ruta para alcanzar la sostenibilidad y rentabilidad del proyecto.

---

## 1. Tesis de Negocio y el "Foso Defensivo"

### 1.1 — El problema de la monetización en plataformas de cine
La mayoría de plataformas de recomendación y redes cinéfilas fracasan al monetizar porque recurren al modelo de publicidad genérica basada en impresiones (Google AdSense, banners programáticos). Este modelo presenta tres defectos estructurales:
1. **Rendimiento económico paupérrimo**: Requiere millones de visitas mensuales para generar unos pocos cientos de euros (CPM efectivo por debajo de 0,80 euros en audiencias de habla hispana).
2. **Degradación radical de la experiencia de usuario**: Llena la interfaz de elementos visuales invasivos, ralentiza la carga (CLS y LCP de Core Web Vitals) y espanta a la comunidad cinéfila más fiel.
3. **Pérdida de identidad de marca**: CinePOV se posiciona como una herramienta precisa de análisis y descubrimiento demográfico; un diseño lleno de anuncios abarata la percepción del producto.

### 1.2 — El verdadero foso: El dataset demográfico real
El activo estratégico no replicable de CinePOV no es la interfaz ni el catálogo de películas (ambos replicables en código o consumiendo TMDB). **El activo único es el dataset de calificaciones segmentadas por franja de edad y género.**

- Con 500 valoraciones, el cruce demográfico es una curiosidad comunitaria.
- Con 10.000 valoraciones reales, es una herramienta de descubrimiento superior a IMDb o FilmAffinity.
- Con más de 100.000 valoraciones reales, se convierte en un producto de inteligencia de mercado de alto valor para distribuidoras, productoras y salas de cine.

---

## 2. Vía 1: B2C — Modelo Freemium (CinePOV Pro y Supporter)

Inspirado en el modelo de suscripción de Letterboxd (donde la compañía genera millones de dólares al año sin recurrir a muros de pago cerrados ni frustrar a la comunidad abierta).

### 2.1 — Estructura de Niveles

#### Nivel CinePOV Base (100% Gratuito)
- Valorar películas del 1 al 10 y registrar fechas de visionado.
- Desglose demográfico estándar por género o por edad de forma separada.
- Consulta de rankings generales y por segmento.
- Modo Pareja básico (2 perfiles).
- Guardar películas en Watchlist y crear hasta 3 listas personalizadas.
- Escribir reseñas y participar en la comunidad.

#### Nivel CinePOV Pro (19,99 € / año o 2,49 € / mes)
- **Cruces demográficos avanzados**: Filtrar cualquier película por combinaciones complejas en tiempo real (ej. "Mujeres 18-24" vs. "Hombres 45-54").
- **Filtros demográficos en tu Watchlist**: Ordenar las películas que tienes pendientes según la nota media de tu grupo de edad o del segmento que tú elijas.
- **Filtro de joyas ocultas**: Descubrir películas poco conocidas con alta valoración dentro de tu colectivo generacional.
- **Modo Pareja extendido**: Consenso entre hasta 6 perfiles demográficos simultáneos (ideal para reuniones familiares o grupos de amigos).
- **Listas ilimitadas**: Sin restricción en el número de listas personalizadas creadas.
- **Insignia Pro en el perfil**: Distintivo visual visible junto al nombre en reseñas y perfil público.
- **Navegación 100% libre de patrocinios**: Experiencia puramente editorial y cinematográfica.

#### Nivel CinePOV Patron / Supporter (39,99 € / año)
- Todo lo incluido en CinePOV Pro.
- Distintivo exclusivo dorado de mecenas en la comunidad.
- Acceso beta prioritario a nuevas funcionalidades (series de TV, filtros por país).
- Posibilidad de cambiar el póster preferido de tus películas favoritas en tu perfil.
- Tu nombre incluido en la página de agradecimientos y créditos de la plataforma.

### 2.2 — Métricas y Unit Economics (B2C)
- **Tasa de conversión esperada**: En nichos de alta afinidad cultural y ocio (cine, música, lectura), la conversión a modelos de apoyo y funcionalidades premium oscila entre el **2,0% y el 4,5%** de los usuarios activos.
- **LTV (Lifetime Value) estimado**: Con una cuota anual de 19,99 € y una tasa de retención anual del 70%, el LTV por suscriptor de pago ronda los **45,00 €**.
- **Infraestructura técnica**: Integración a través de **Stripe Billing y Stripe Customer Portal**, delegando el cumplimiento de PCI-DSS, pasarelas de pago locales y gestión de facturas.

---

## 3. Vía 2: Afiliación de Plataformas de Streaming ("Dónde verla")

### 3.1 — El momento clave del embudo
El usuario consulta CinePOV para responder a una duda inmediata: *"¿Merece la pena ver esta película según personas como yo?"*.
Una vez convencido por la alta nota de su segmento, el siguiente paso natural es saber dónde está disponible en ese instante.

### 3.2 — Fuentes de ingresos por afiliación
1. **Transaccional (Alquiler y Compra)**:
   - Integración de enlaces directos a Apple TV, Rakuten TV y Amazon Prime Video.
   - CinePOV percibe entre un **5% y un 10% del importe** de cada alquiler o compra iniciada desde la plataforma (típicamente entre 0,20 € y 0,60 € por transacción).
2. **Suscripción (Nuevas Altas en Plataformas)**:
   - Acuerdos de afiliación con plataformas independientes y generalistas (ej. Filmin, Movistar Plus+, HBO Max, Disney+).
   - Por cada nuevo usuario que contrata una suscripción o periodo de prueba tras hacer clic en una recomendación de CinePOV, se devenga una comisión de captación (habitualmente entre **3,00 € y 10,00 € por usuario registrado**).
3. **Agregación vía JustWatch API**:
   - Para no mantener conectores individuales con cada servicio, se puede emplear el feed de JustWatch, repartiendo comisiones o monetizando los clics salientes cualificados.

---

## 4. Vía 3: El Gran Activo B2B — CinePOV Intelligence para la Industria

Este es el canal con mayor margen comercial y donde CinePOV aporta una ventaja competitiva insustituible para el sector audiovisual.

### 4.1 — El problema real de las distribuidoras y cines
- **Inversiones a ciegas**: Una distribuidora cinematográfica gasta decenas de miles de euros en promocionar un estreno en cines o plataformas de streaming. Frecuentemente segmentan la publicidad basándose en corazonadas o datos demográficos globales de taquilla que no explican la satisfacción real del espectador.
- **El sesgo de los agregadores clásicos**:
  - IMDb y FilmAffinity están dominados históricamente por varones de entre 25 y 45 años.
  - Rotten Tomatoes mezcla crítica profesional con audiencia sin granularidad de edad.
- Si una película recibe un 6,2 global, la distribuidora puede asumir que la campaña ha fracasado, ignorando que entre mujeres de 18 a 24 años la obra es un fenómeno con un 8,8.

### 4.2 — Catálogo de Productos B2B de CinePOV

#### Producto 1: Informes Demográficos por Título (Ad-hoc)
- Informe en PDF interactivo y dataset anonimizado entregado tras el estreno de una película.
- Análisis de brechas generacionales y de género.
- Comparativa de varianza frente a títulos similares del mismo género cinematográfico.
- **Precio de mercado**: Entre **1.500 € y 3.500 € por título analizado**.

#### Producto 2: Suscripción SaaS CinePOV Industry
- Acceso a un panel web profesional (`/industry`) para equipos de marketing de distribuidoras, festivales y agencias de medios.
- Consulta en tiempo real de curvas de evolución demográfica, matrices de polarización y tendencias semanales de interés por grupo generacional.
- Alertas inmediatas de recepción crítica antes del lanzamiento internacional en streaming.
- **Precio de suscripción**: Entre **250 € y 600 € al mes por distribuidora** (acceso de hasta 5 usuarios profesionales).

### 4.3 — Principios Éticos y Cumplimiento Normativo (RGPD) en B2B
- **Exclusión de datos sintéticos**: Los reportes B2B se generan **exclusivamente con valoraciones de personas reales** que cuenten con email verificado. Los votos artificiales de arranque quedan estrictamente fuera del cómputo.
- **K-Anonimato y agregación obligatoria**: Ningún reporte desglosa segmentos con menos de 25 valoraciones reales, impidiendo cualquier posibilidad de reidentificación o perfilado individual.
- **Cero comercialización de datos personales**: CinePOV vende análisis estadístico de mercado, jamás listas de correos, nombres o identificadores de usuario.

---

## 5. Vía 4: Licenciamiento de Widgets y Prensa Cultural

### 5.1 — El Widget Embebible (`/embed/movie/[id]`)
Desarrollado en la Fase 4.8 y adaptado con cabeceras de seguridad CSP:
- **Modo Editorial Abierto (Gratuito)**:
  - Cualquier bloguero, crítico o periodista puede incrustar el widget de contraste demográfico en su web de forma libre.
  - Incluye el logotipo y el enlace de retorno a CinePOV, funcionando como un potente motor de generación de backlinks y tráfico cualificado para SEO.
- **Modo CinePOV for Publishers (De pago: 49 € - 149 € / mes)**:
  - Destinado a portales de noticias de gran volumen (Sensacine, Fotogramas, Cinemanía, El País, elDiario.es).
  - Permite incrustar los módulos demográficos en marca blanca (sin logotipo externo) y con estilos CSS personalizados a la identidad gráfica del medio.

---

## 6. Proyecciones Financieras por Fases de Crecimiento

A continuación se detalla la evolución económica esperada en función del volumen de usuarios registrados activos:

| Métrica / Concepto | Fase 1: Arranque (1k - 3k usuarios) | Fase 2: Tracción (3k - 15k usuarios) | Fase 3: Consolidación (15k - 50k usuarios) | Fase 4: Escala (+100k usuarios) |
| :--- | :--- | :--- | :--- | :--- |
| **Coste Servidores / Infraestructura** | ~12 € / año | ~25 € / mes (300 €/año) | ~60 € / mes (720 €/año) | ~150 € / mes (1.800 €/año) |
| **Suscriptores CinePOV Pro (2,5%)** | 25 - 75 usuarios | 75 - 375 usuarios | 375 - 1.250 usuarios | +2.500 usuarios |
| **Ingresos B2C (Pro y Patron)** | 500 € - 1.500 € / año | 1.800 € - 8.000 € / año | 9.000 € - 28.000 € / año | +55.000 € / año |
| **Ingresos Afiliación Streaming** | 100 € - 300 € / año | 600 € - 2.000 € / año | 2.500 € - 7.000 € / año | +15.000 € / año |
| **Ingresos B2B / Prensa** | 0 € (fase de datos) | 1.500 € (primeros informes) | 8.000 € - 20.000 € / año | +40.000 € / año |
| **Ingreso Total Estimado Anual** | **600 € - 1.800 €** | **3.900 € - 11.500 €** | **19.500 € - 55.000 €** | **+110.000 € / año** |
| **Margen Operativo Bruto** | **+98%** | **+96%** | **+97%** | **+98%** |

> **Conclusión del modelo**: Al ser una aplicación serverless sin costes fijos pesados de personal ni almacén físico, el margen operativo se mantiene permanentemente por encima del 95%. El proyecto alcanza el umbral de rentabilidad (break-even) prácticamente desde su primer año de vida con apenas una decena de suscriptores Pro.

---

## 7. Requisitos Legales y Licenciamiento al Monetizar

Para ejecutar esta estrategia con total seguridad jurídica, se deben contemplar los siguientes dos hitos:

### 7.1 — Licencia Comercial de Metadatos (TMDB)
- **Situación actual**: La API de The Movie Database (TMDB) permite el uso gratuito para proyectos no comerciales o en fase de validación académica y de desarrollo.
- **Acción requerida al facturar**:
  - Al activar Stripe y empezar a cobrar cuotas Pro o contratos B2B, es necesario contactar con TMDB para adquirir su licencia comercial de datos o bien conectar con proveedores alternativos de catálogo comercial de metadatos (como The Numbers o Wikidata/OMDb comercial).
  - El coste de estas licencias se cubre íntegramente con los primeros ingresos de facturación.

### 7.2 — Cumplimiento Fiscal y Pasarela de Pagos
- Configuración de la cuenta de **Stripe** asociada a una persona física (autónomo) o jurídica (S.L.).
- Activación de **Stripe Tax** para el cálculo y liquidación automática del IVA intracomunitario según el país de residencia del comprador europeo.
