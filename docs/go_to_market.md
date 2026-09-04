# 📣 CinePOV — Estrategia de Go-To-Market
> *Cómo pasar de cero a conocido sin presupuesto de publicidad.*
**Fecha:** Julio 2026
**Versión:** 1.0
**Referencias:** [Plan de Proyecto](./plan_proyecto.md) · [Roadmap](./roadmap.md)
---
## 0. Por qué existe este documento
El plan de proyecto define **qué** construir y el roadmap define **en qué orden**. Ninguno de los dos responde a la pregunta que decide si el proyecto vive o muere: **cómo llega la gente**.

Un producto de datos colaborativos tiene una particularidad brutal: sin usuarios no hay datos, y sin datos el producto no cumple su promesa. La distribución no es una fase posterior al desarrollo, es parte del producto. Este documento la trata como tal.

**Premisa de partida:** presupuesto de adquisición pagada = 0 €. Todo el crecimiento debe ser orgánico, viral o ganado. Eso no es una limitación menor: obliga a que el producto genere su propia distribución, que es exactamente lo que los datos demográficos permiten.

---
## 1. La ventaja injusta: el producto genera su propio contenido viral

La mayoría de los productos tienen que *inventar* razones para que alguien hable de ellos. CinePOV no: sus propios datos son el contenido.

> *"Titanic tiene un 7.8. Pero las mujeres de 18-24 le dan un 9.1 y los hombres de 18-24 un 5.4."*

Esa frase tiene todo lo que un contenido necesita para propagarse:
- **Sorpresa**: contradice el número único que todos aceptaban.
- **Identidad**: el lector se ubica inmediatamente en un bando.
- **Conflicto**: invita a discutir sin necesidad de insultar a nadie.
- **Especificidad**: números concretos, no opiniones.
- **Coste marginal cero**: cada nueva película genera un contenido nuevo automáticamente.

**Consecuencia estratégica:** la estrategia de contenido no es un trabajo de redacción, es un trabajo de *consulta a la base de datos*. Una herramienta interna que liste automáticamente las películas con mayor varianza entre segmentos es, literalmente, un generador de material viral.

### 1.1 El riesgo gemelo
El mismo mecanismo funciona en contra. Un dato demográfico llamativo invita a que alguien lo audite, y hoy los votos sintéticos se presentan como reales (ver riesgo 7.4 del plan). **Nada se viraliza hasta que la Fase 3.2 esté completa.** Un lanzamiento viral con datos cuestionables no es un éxito arriesgado, es un fracaso acelerado.

### 1.2 La línea ética que no se cruza
El contenido de "hombres vs. mujeres" y "Gen Z vs. boomers" es viral porque roza el conflicto identitario. Hay una diferencia entre *mostrar un dato* y *azuzar una guerra*:

| Aceptable | Inaceptable |
|---|---|
| "Las mujeres de 18-24 valoran Titanic un 9,1; los hombres de esa edad, un 5,4." | "Los hombres no entienden Titanic." |
| "Estas son las 10 películas que más dividen por generación." | Framing de un segmento como equivocado, inculto o con mal gusto. |
| Curiosidad, datos, preguntas abiertas. | Burla, superioridad, estereotipos. |

El tono es siempre **curiosidad, nunca superioridad**. Un producto que se hace famoso por ser divisivo atrae al público equivocado y contamina el propio dataset.

---
## 2. El bucle viral

El crecimiento sostenible no viene de una campaña, viene de un bucle que se repite. Hay que definirlo explícitamente para poder medirlo y optimizarlo.

```
                    ┌──────────────────────────────┐
                    │  1. LLEGADA                  │
                    │  SEO, red social, enlace      │
                    │  compartido, boca a boca      │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  2. GANCHO (sin registro)    │
                    │  Ve el desglose de una peli   │
                    │  que le importa. "Anda."      │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  3. REGISTRO                 │
                    │  "¿Y cuál es MI nota?"        │
                    │  Fricción mínima, 60 seg      │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  4. AHA (activación)         │
                    │  Onboarding 50 esenciales →   │
                    │  ve su segmento en sus pelis  │
                    │  ⏱ objetivo: < 4 minutos      │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  5. ARTEFACTO PERSONAL       │
                    │  Perfil cinematográfico:      │
                    │  algo que habla de ÉL         │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  6. COMPARTICIÓN             │
                    │  Comparte porque le retrata,  │
                    │  no por hacer un favor        │
                    └──────────────┬───────────────┘
                                   │
                                   └────► vuelve a 1 (con sus amigos)
```

### 2.1 Los dos motores, y por qué hacen falta los dos
| Motor | Mecanismo | Velocidad | Durabilidad |
|---|---|---|---|
| **Viral** | Compartición social de artefactos | Rápido, a picos | Frágil: se apaga al dejar de alimentarlo |
| **SEO** | Indexación de fichas y páginas programáticas | Lento, 3-6 meses de maduración | Compuesto: crece solo y no se apaga |

El motor viral da los picos que traen la primera masa crítica de datos. El motor SEO da la base que sostiene el crecimiento cuando el pico pasa. **Un lanzamiento viral sin SEO es un fuego artificial**: 20.000 visitas en un día y 200 al mes siguiente. Por eso ambos son Fase 4 y se ejecutan en paralelo.

### 2.2 K-factor: la métrica que gobierna todo
```
K = (artefactos compartidos por usuario) × (registros por artefacto compartido)
```
- **K < 1**: cada cohorte de usuarios trae menos que ella misma. El crecimiento se apaga sin inyección externa de tráfico.
- **K = 1**: crecimiento sostenido.
- **K > 1**: crecimiento exponencial.

**Objetivos realistas:** K ≈ 0,4 el primer trimestre, K ≈ 0,7 el segundo. K > 1 es aspiracional y muy poco frecuente.

**Las dos palancas del K y cómo se accionan:**
1. **Más comparticiones por usuario** → hacer el artefacto personal irresistible y fácil de compartir. Botón nativo, imagen descargable, formato vertical para stories.
2. **Más conversión por visita compartida** → la página de destino debe dar valor **antes** de pedir el registro. Un muro de registro mata el bucle: quien llega desde un enlace compartido no tiene ninguna razón para confiar todavía.

> **Regla de oro:** las páginas virales (`/vs/`, `/polarizing`, fichas) son **públicas y completas sin registro**. El registro se pide para responder a la pregunta *"¿y cuál es mi nota?"*, que solo surge después de haber visto el valor.

### 2.3 El momento "aha" es la métrica más importante del embudo
El usuario no se engancha al registrarse. Se engancha cuando ve, por primera vez, cómo la gente como él valora una película que le importa. Todo el diseño del onboarding debe minimizar el tiempo hasta ese instante.

- **Objetivo:** menos de 4 minutos desde la llegada.
- **Tasa de activación objetivo:** más del 60% de los registros llegan al "aha".
- **Palanca principal:** el onboarding de las 50 esenciales ya existe y funciona. La instrumentación de la Fase 3.3 dirá dónde se cae la gente.

---
## 3. Fase de pre-lanzamiento (2-3 semanas antes)

El error clásico es lanzar a un público que no existe. Estas semanas se solapan con la Fase 3 del roadmap y su objetivo es tener gente esperando el día D.

### 3.1 Construir en público
- Publicar el desarrollo en X/Twitter y en Bluesky con capturas reales del producto.
- El ángulo que funciona: *"estoy construyendo lo que IMDb no te enseña"*. Producto concreto, no promesas.
- Compartir los hallazgos de los datos antes del lanzamiento: son interesantes por sí mismos y validan el concepto.
- **Hablar abiertamente del problema del cold start y de cómo se resuelve.** Convierte la mayor vulnerabilidad del proyecto en credibilidad técnica, y desactiva la crítica antes de que se formule.
- Publicar en `r/SideProject`, `r/webdev` e `Indie Hackers`: audiencias receptivas y buen feedback técnico.

### 3.2 Lista de espera
- Página de captura de email en la home con la propuesta de valor y una demo real.
- Incentivo honesto: acceso anticipado y badge de fundador.
- **Objetivo:** 300-500 emails antes del día D. Es la diferencia entre lanzar con tracción visible y lanzar al vacío.
- Un solo email de aviso el día del lanzamiento, con un enlace directo a la acción, no a la home.

### 3.3 Semilla de credibilidad
- 20-50 usuarios reales invitados (amigos, comunidades de cine, foros) para que las películas más populares tengan votos **reales** en varios segmentos.
- Sin esto, el día del lanzamiento la portada muestra datos estimados, que es exactamente lo que no puede pasar en un momento de máximo escrutinio.

### 3.4 Assets preparados con antelación
Nada de esto se improvisa el día del lanzamiento:
- [ ] Vídeo demo de 60 segundos: problema → producto → "wow" (indispensable para Product Hunt y para X)
- [ ] GIF de 15 segundos del filtro demográfico en acción
- [ ] 10 capturas de contrastes demográficos reales y llamativos, listas para publicar
- [ ] Página `/about` con la historia del proyecto
- [ ] Página `/metodologia` publicada y pulida (será lo primero que audite el público técnico)
- [ ] Textos del lanzamiento redactados para cada canal (el mismo texto en todos funciona mal)
- [ ] Respuestas preparadas a las 10 objeciones previsibles (ver sección 7)

---
## 4. Día del lanzamiento

### 4.1 Coordinación
Un martes, miércoles o jueves. Nunca en fin de semana. Publicar en Product Hunt a las 00:01 hora del Pacífico, que es cuando empieza su día de ranking.

**Orden de ejecución:**
1. **Product Hunt** (00:01 PT). Estar disponible todo el día para responder cada comentario. La interacción del fundador pesa mucho.
2. **Hacker News** (Show HN), unas horas después, cuando ya haya algo de tracción. Título descriptivo y sin marketing. La audiencia de HN es exigente y técnica: **la página de metodología es lo que va a decidir la conversación**.
3. **Reddit**, escalonado a lo largo del día y de los días siguientes, nunca todo a la vez.
4. **X/Twitter**: hilo con el hallazgo de datos más llamativo, con el producto como respuesta a la pregunta que plantea.
5. **Email a la lista de espera**.

### 4.2 Reddit: el canal de mayor potencial y mayor riesgo
Reddit puede traer decenas de miles de visitas o un baneo permanente. La diferencia está en el enfoque.

**Subreddits objetivo:** `r/movies` (enorme, reglas estrictas), `r/Letterboxd`, `r/TrueFilm`, `r/dataisbeautiful`, `r/cine` y `r/PeliculasyMas` en español, `r/InternetIsBeautiful`.

**Reglas que no se negocian:**
- **Nunca postear un enlace promocional en seco.** Se postea el *hallazgo*, con los datos en el propio post, y el enlace como fuente secundaria.
- Leer las reglas de cada subreddit. `r/movies` prohíbe la autopromoción directa.
- Participar en la comunidad antes de publicar. Una cuenta nueva que solo publica su producto se detecta al instante.
- `r/dataisbeautiful` es la mejor puerta de entrada: una visualización buena del contraste demográfico es contenido nativo de ese subreddit, no publicidad.
- Responder a todos los comentarios, incluidos los hostiles, con datos y sin defensividad.

### 4.3 Hacker News
- Título: descriptivo, sin superlativos ni emoji. Algo del estilo *"Show HN: Movie ratings broken down by age and gender"*.
- Primer comentario del autor explicando la motivación, la implementación y **el problema del cold start con total honestidad**.
- Esperar escrutinio técnico y de privacidad. Es una audiencia especialmente sensible a la recogida de datos demográficos: tener listas la política de privacidad y la justificación de la minimización de datos.
- Un solo intento: si no coge tracción, no se reintenta el mismo mes.

---
## 5. Canales sostenidos (después del día D)

Un lanzamiento es un pico. El crecimiento es lo que se hace las 50 semanas siguientes.

### 5.1 Prioridad de canales por relación impacto/esfuerzo
| Prioridad | Canal | Por qué | Esfuerzo |
|---|---|---|---|
| **1** | **SEO programático** | El único canal que compone. Cientos de páginas indexables generadas a partir de datos que ya existen. | Alto al principio, casi nulo después |
| **2** | **TikTok / Reels / Shorts** | El formato "adivina la nota por segmento" es nativo del formato vertical y el algoritmo premia el contenido nuevo sin necesitar audiencia previa. | Medio y continuo |
| **3** | **X/Twitter de cine** | Comunidad cinéfila muy activa y con alta propensión a citar datos. | Bajo |
| **4** | **Reddit sostenido** | Aportar hallazgos con regularidad, no promocionar. | Bajo, requiere tacto |
| **5** | **Creadores y medios de cine** | Ofrecer datos exclusivos sobre una película de actualidad. Un youtuber de cine mencionando el dato vale más que cualquier anuncio. | Medio |
| **6** | **Widget embebible** | Coloca la marca en blogs de cine y genera backlinks de calidad (combustible del SEO). | Bajo tras implementarlo |

### 5.2 El formato de vídeo corto que hay que explotar
El más eficaz y el más fácil de producir en serie:

> **"Adivina la nota"** — Se muestra el póster de una película muy conocida. *"¿Qué nota crees que le dan las mujeres de 18 a 24? ¿Y los hombres de 45 o más?"* Pausa de suspense. Revelación de los dos números con el contraste en pantalla. Cierre: *"En CinePOV puedes ver la nota de gente como tú."*

Funciona porque el espectador responde mentalmente, se compromete con su respuesta y quiere saber si acertó. Es replicable indefinidamente: hay una película nueva cada día.

**Otros formatos con buen rendimiento:**
- "La película que más divide a hombres y mujeres de la historia"
- "Le pregunté a 5.000 personas por El Padrino y los boomers no ganaron"
- Reacción a un contraste inesperado en una película de estreno reciente

### 5.3 Calendario de contenido sostenible
Un ritmo mantenido gana a un ritmo intenso e insostenible:
- **Diario:** una interacción o respuesta en X, sin necesidad de publicar contenido propio.
- **3 por semana:** un vídeo corto vertical.
- **Semanal:** un hallazgo de datos publicado en X y en Reddit cuando encaje de forma natural.
- **Quincenal:** un artículo del blog de datos, pensado para ser citado.
- **Reactivo:** ante cada estreno relevante, publicar su desglose demográfico en las primeras 48 horas. **Este es el canal más infravalorado**: el interés de búsqueda de un estreno es máximo justo cuando nadie más tiene ese dato.

### 5.4 Momentos de calendario que hay que aprovechar
El cine tiene una agenda predecible. Preparar el contenido con antelación:
- **Óscars** (marzo): "Cómo votaría cada generación los Óscars de este año". Máxima atención mediática del año sobre el cine.
- **Estrenos grandes**: desglose demográfico en las primeras 48 horas.
- **Diciembre**: "Tu año en cine", el wrap anual (Fase 4.10).
- **Halloween**: terror y brecha generacional.
- **Aniversarios redondos** de películas icónicas: "30 años de Titanic: cómo ha cambiado quién la ama".

---
## 6. Métricas de crecimiento y umbrales de decisión

### 6.1 Cuadro de mando
| Métrica | Cómo se mide | Objetivo T1 | Objetivo T2 |
|---|---|---|---|
| Usuarios registrados | PostHog | 500 | 2.500 |
| Valoraciones **reales** | BD (`isArtificial: false`) | 15.000 | 100.000 |
| Tasa de activación (llegan al "aha") | Embudo PostHog | > 55% | > 65% |
| Tiempo hasta el "aha" | PostHog | < 5 min | < 4 min |
| K-factor | Comparticiones × conversión | > 0,3 | > 0,6 |
| Retención D7 | Cohortes PostHog | > 20% | > 28% |
| Páginas indexadas | Search Console | > 2.000 | > 10.000 |
| % de tráfico orgánico | PostHog | > 15% | > 35% |
| % de valoraciones sintéticas | BD | < 60% | < 25% |
| Segmento más grande | BD | < 50% del total | < 40% |

### 6.2 Umbrales de decisión
Definidos de antemano para no racionalizar los resultados a posteriori:

| Si… | Entonces… |
|---|---|
| La tasa de activación está por debajo del 40% | El problema es el onboarding, no la adquisición. **Parar el marketing** y arreglar el embudo. Traer tráfico a un producto que no activa es quemar la única oportunidad de causar buena impresión. |
| El K-factor se estanca por debajo de 0,2 | El artefacto compartible no es lo bastante bueno. Rediseñar el perfil cinematográfico antes de invertir más en canales. |
| La retención D7 está por debajo del 15% | Falta razón para volver. Priorizar recomendaciones personalizadas (Fase 7.1) por encima de features sociales. |
| Un segmento supera el 50% de los usuarios | El producto está fallando a su promesa. Campaña específica dirigida a los segmentos infrarrepresentados. |
| El tráfico orgánico no crece a los 4 meses | Problema de SEO técnico o de indexación, no de contenido. Auditar Search Console. |
| Las valoraciones sintéticas no bajan | El producto no está capturando datos reales al ritmo necesario. Es la señal más grave posible: cuestiona la viabilidad del modelo. |

---
## 7. Objeciones previsibles y respuestas preparadas

Tenerlas escritas antes del lanzamiento evita improvisar mal bajo presión.

| Objeción | Respuesta |
|---|---|
| *"¿Por qué me pedís mi género y mi edad?"* | Son los únicos dos datos que hacen funcionar el producto. Solo pedimos el año de nacimiento, no la fecha. Nunca se muestran asociados a tu perfil, solo en agregados. Explicado en la política de privacidad. |
| *"Esto refuerza estereotipos."* | Mostramos siempre la nota global junto a la segmentada y nunca presentamos un segmento como el correcto. El dato descriptivo de que dos grupos valoran distinto no es un juicio sobre ninguno de los dos. |
| *"¿De dónde salen estos datos? Parecen inventados."* | Página de metodología pública, con el desglose de qué es dato real y qué es estimación de arranque, visible en cada visualización. **Esta respuesta solo es defendible si la Fase 3.2 está completa.** |
| *"Ya existe Letterboxd."* | Letterboxd es una red social de cine excelente. No te dice cómo valora tu película la gente de tu edad y tu género. Somos complementarios: puedes importar tus valoraciones desde allí. |
| *"La muestra es demasiado pequeña para ser fiable."* | Correcto, y por eso mostramos el número de valoraciones de cada segmento y ocultamos los que no alcanzan el umbral mínimo. La transparencia sobre la incertidumbre es parte del producto. |
| *"¿Y la gente no binaria o la que no lo dice?"* | Opción disponible siempre, y sus valoraciones cuentan en el global. No forzamos una dicotomía. |
| *"¿Vais a vender mis datos?"* | Nunca datos individuales. El modelo B2B, si llega, será de agregados anonimizados, y está explicado en los términos. |
| *"¿Qué pasa si borro mi cuenta?"* | Tus valoraciones se anonimizan y se desvinculan de ti. Puedes exportar todos tus datos antes. |

---
## 8. Errores a evitar

Aprendidos de otros productos de datos colaborativos:

1. **Lanzar sin persistencia real de datos.** El bloqueante de la Fase 3.1. Un lanzamiento viral sobre una base de datos que se borra es un desastre irreversible: no hay segunda primera impresión.
2. **Poner un muro de registro en las páginas virales.** Mata el bucle en el paso 2. Quien llega desde un enlace no tiene aún razón para registrarse.
3. **Gastar el lanzamiento antes de tener el producto listo.** Product Hunt y Hacker News son cartuchos de un solo uso. No se disparan sobre un producto a medias.
4. **Perseguir el volumen ignorando la distribución demográfica.** 10.000 usuarios del mismo perfil producen un producto peor que 4.000 repartidos.
5. **Convertirse en el producto de las guerras de género.** Trae tráfico y destruye la marca y el dataset.
6. **Construir features en lugar de distribución.** Con el MVP ya funcional, cada semana dedicada a una feature nueva en vez de a conseguir usuarios es una semana sin datos.
7. **No medir.** Sin la instrumentación de la Fase 3.3, todo lo anterior es intuición.
8. **Descuidar el SEO por ser lento.** El coste de retrasarlo no se recupera nunca: es el único canal cuyo valor se acumula.

---
## 9. Resumen ejecutivo: qué hacer, en qué orden

| Orden | Acción | Depende de |
|---|---|---|
| 1 | Registrar dominio y reservar los handles de todas las redes | Nada. Hacer hoy. |
| 2 | Migrar a PostgreSQL | Fase 3.1 |
| 3 | Resolver la transparencia de los datos de arranque + página de metodología | Fase 3.2 |
| 4 | Instrumentar analítica y definir el embudo de activación | Fase 3.3 |
| 5 | Legal: privacidad, términos, cookies, borrado de cuenta | Fase 3.4 |
| 6 | Bilingüe inglés/español | Fase 3.5 |
| 7 | Construir en público + lista de espera (en paralelo con lo anterior) | Sección 3 |
| 8 | Imágenes OG dinámicas y SEO técnico | Fase 4.1, 4.5 |
| 9 | Página `/vs/` y polarizantes | Fase 4.2, 4.3 |
| 10 | Perfil cinematográfico compartible | Fase 4.4 |
| 11 | **Lanzamiento coordinado** | Todo lo anterior |
| 12 | Canales sostenidos y calendario de contenido | Sección 5 |

> **La conclusión más importante de este documento:** el producto ya funciona. Lo que falta para que sea famoso no es más código de features, es **persistencia de datos, honestidad, medición y distribución**. Las Fases 3 y 4 del roadmap son exactamente eso, y en ese orden.
