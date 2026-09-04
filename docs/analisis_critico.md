# CinePOV — Análisis Crítico: Preocupaciones y Soluciones
> Inventario honesto de todo lo que puede hacer fracasar este proyecto, con una solución concreta para cada punto.
**Fecha:** Julio 2026
**Versión:** 1.0
**Referencias:** [Plan de Proyecto](./plan_proyecto.md) · [Roadmap](./roadmap.md) · [Go-To-Market](./go_to_market.md)
---
## Cómo leer este documento
Cada preocupación sigue la misma estructura: **qué es**, **por qué importa**, **la solución** y **cómo saber que está resuelta**. No es una lista de quejas: cada punto tiene salida.

El orden es por gravedad, no por urgencia de calendario. Las del bloque A pueden matar el proyecto; las del bloque D solo pueden multarte.

| # | Preocupación | Gravedad | Estado |
|---|---|---|---|
| **A1** | La aritmética del cold start hace que el producto no funcione hasta ~5.000 usuarios | [Existencial] | Resuelto (Granularidad progresiva y corte de bots en imports) |
| **A2** | Los datos sintéticos se presentan como reales | [Existencial] | Resuelto (Separación real/estimado, metodología y UI transparente) |
| **A3** | No hay ninguna razón para volver la segunda semana | [Existencial] | Resuelto (Diario de visionados y desbloqueos comunitarios en UI) |
| **A4** | Los mejores canales de lanzamiento dan el peor perfil demográfico | [Grave] | Mitigado en estrategia GTM |
| **B1** | Letterboxd puede copiar la feature en un sprint | [Grave] | Mitigable (Foso defensivo de datos demográficos) |
| **B2** | El género como eje central es un pasivo reputacional | [Grave] | Resuelto (Prioridad generacional y matriz multidimensional) |
| **B3** | Riesgo de confundir el producto con el negocio | [Estratégica] | Documentado |
| **B4** | El foso de datos se puede regalar sin darse cuenta | [Estratégica] | Resuelto (Protección y rate limiting en API) |
| **B5** | Dependencia total de TMDB, con licencia no comercial | [Estratégica] | Documentado (Caché local activa) |
| **C1** | SQLite no persiste datos en Vercel | [Bloqueante] | Resuelto (PostgreSQL + Neon pooling + PrismaPg) |
| **C2** | Cero instrumentación analítica | [Grave] | Resuelto (PostHog cookieless + Vercel Analytics + CookieBanner + tracking) |
| **C3** | Un solo commit, sin remoto, sin tests, sin CI | [Grave] | Resuelto (Vitest con 34 tests, CI en GitHub Actions con Postgres) |
| **C4** | Sin rate limiting ni verificación real de cuentas | [Grave] | Resuelto (Rate limiting en DB y verificación email para agregados) |
| **C5** | Emails simulados y sin recuperación de contraseña | [Media] | Resuelto (Resend transaccional, verificación y recuperación activas) |
| **C6** | La agregación demográfica no escala en su forma actual | [Baja] | Mitigado (Agregación filtrada con select mínimo) |
| **D1** | No existe ningún documento legal | [Grave] | Resuelto (Privacidad, términos, aviso legal y banner) |
| **D2** | Derechos RGPD no implementados | [Grave] | Resuelto (Supresión/anonimización y exportación de datos) |
---
# BLOQUE A — Preocupaciones existenciales
---
## A1 — La aritmética del cold start
### Qué es
El producto necesita mucho más volumen del que el plan asume para cumplir su promesa. Las cuentas:

| Concepto | Número |
|---|---|
| Celdas del cruce género × edad (útiles en la práctica) | ~10 (2 géneros mayoritarios × 5 rangos) |
| Votos mínimos por celda para tener sentido estadístico | 10 |
| Votos reales necesarios **por película** | ~100 |
| Valoraciones por usuario (optimista, con onboarding + importación) | ~25 |
| Valoraciones necesarias para cubrir las 500 películas más conocidas | ~50.000 |
| Usuarios necesarios si la distribución fuera uniforme | ~2.000 |
| **Usuarios necesarios en la práctica** (la distribución nunca es uniforme: las 10 primeras acumulan miles de votos mientras la nº 500 tiene doce) | **5.000 – 10.000 activos** |

El objetivo del plan es de 500 usuarios en tres meses. Con 500 usuarios, el cruce género × edad no es información: es ruido.

### Por qué importa
Es un círculo vicioso: el producto no es útil hasta que es popular, y no puede hacerse popular sin ser útil. Este es el verdadero valle de la muerte del proyecto, y es mucho más profundo de lo que reconocen el plan y el roadmap.

**Los 5.000 bots no son una decisión desafortunada: son el síntoma de este problema.** Alguien se dio cuenta, con razón, de que el producto sin ellos está vacío. El problema no es el relleno, es el valle.

### Solución: granularidad progresiva
Dejar de tratar "el desglose demográfico" como una feature binaria que existe o no existe, y tratarlo como **una escalera de precisión que se desbloquea según los datos reales lo permiten**.

| Nivel | Requisito de datos reales | Qué se muestra |
|---|---|---|
| **0** | 5 votos reales | Solo nota global de CinePOV |
| **1** | 10 votos reales, ≥5 por género | **Hombres vs. mujeres.** Ya es un dato que nadie más da. |
| **2** | 30 votos reales | Añade 3 rangos de edad amplios (joven / adulto / mayor) |
| **3** | 60 votos reales | 5 rangos de edad completos |
| **4** | 100 votos reales, ≥10 por celda | Cruce completo género × edad |

**Puntos clave de la implementación:**
- La **vista por defecto** es siempre el nivel más alto que tenga datos sólidos. Nunca se abre en un nivel mayoritariamente vacío.
- El nivel siguiente es visible y **etiquetado como bloqueado, con su progreso**: *"Cruce completo: 43 de 100 valoraciones"*. Esto convierte cada carencia en una barra de progreso.
- Al desbloquear un nivel en una película, notificar a quienes la valoraron. Es una razón legítima para volver (ver A3).

**Por qué esto funciona mejor que rellenar:**
1. Con 500 usuarios el nivel 1 es **honesto y ya diferencial**. Nadie más te dice cómo valoran las mujeres una película.
2. El vacío deja de ser una vergüenza y se convierte en una llamada a la acción.
3. Elimina la necesidad estructural de los datos sintéticos, que es el origen de A2.
4. Es más creíble: un producto que muestra sus límites genera más confianza que uno que los tapa.

### Decisión de diseño: ¿mostrar u ocultar la matriz completa cuando está casi vacía?
**Mostrarla siempre. Ocultarla sería un error.** Pero el cómo lo cambia todo.

**Por qué mostrarla:**
- **La matriz completa *es* la propuesta de valor hecha visible.** Si el usuario nunca la ve, no entiende qué le espera ni por qué merece la pena contribuir. Ocultarla equivale a esconder la razón de existir del producto hasta que ya no haga falta convencer a nadie.
- **Un vacío bien diseñado es el mejor argumento de participación que tienes.** Nada motiva más que ver exactamente qué falta y saber que tú puedes rellenarlo.
- **Mostrar los límites genera confianza.** Un producto que dice "esto todavía no lo sé" es infinitamente más creíble que uno que siempre tiene una respuesta.

**Las tres condiciones para que funcione:**

**1. Nunca como vista por defecto si está mayoritariamente vacía.** La pestaña que se abre al entrar es siempre el nivel más alto con datos sólidos. La matriz completa es una pestaña *opt-in*, con la expectativa gestionada desde su propia etiqueta: *"Matriz completa · 43% cubierta"*.

**2. El vacío debe verse intencional, no roto.** Es la diferencia entre dos productos distintos:

| ❌ Parece un fallo | ✅ Parece un progreso |
|---|---|
| Celda gris con un guión | Celda con "faltan 7 votos" y un anillo de progreso |
| "Sin datos" | "Aún nadie de este grupo ha valorado esta película" |
| Todo el vacío igual | Las celdas cerca del umbral destacadas: "¡a 2 votos de desbloquearse!" |

La primera columna comunica *producto abandonado*. La segunda comunica *proyecto vivo en el que participo*. El coste de implementación es prácticamente el mismo.

**3. Convertir la escasez en exclusividad.** Cuando un usuario es el primero de su segmento en valorar una película, eso no es una carencia del producto: es un momento que merece celebrarse. *"Eres la primera mujer de 45-54 que valora esta película. Tu voto acaba de crear este dato."* Es cierto, es halagador, y es un incentivo mucho más potente que cualquier badge genérico. Aquí un voto vale más que en ninguna otra plataforma del mundo, y hay que decírselo.

> **Resumen:** ocultar el vacío soluciona un problema estético a cambio de renunciar al mejor mecanismo de captación de datos que tiene el producto. Muéstralo, pero diséñalo como una barra de progreso colectiva y no como un error.

### Complemento: usar datos demográficos reales de terceros
Existe una alternativa a inventar votos que **usa personas reales**: el dataset **MovieLens** de GroupLens (Universidad de Minnesota). Las versiones `ml-100k` y `ml-1m` incluyen **género, edad y ocupación declarados** de usuarios reales, con un millón de valoraciones sobre unas 3.900 películas.

| Ventaja | Detalle |
|---|---|
| **Son datos reales de personas reales** | No hay nada que ocultar ni que justificar. |
| **Es citable y hasta prestigioso** | *"Datos de arranque procedentes del dataset MovieLens de la Universidad de Minnesota"* es una frase que genera credibilidad, no sospecha. |
| **Cubre exactamente lo que necesitas** | Cine clásico y popular, que es la base del onboarding de las 50 esenciales. |
| **Es la idea original del plan, bien ejecutada** | El plan ya contemplaba "usar data pública de estudios demográficos como seed data de demostración". Los bots heurísticos fueron la implementación que se desvió de esa intención. |

**Limitaciones que hay que asumir con honestidad:**
- Solo cubre películas hasta aproximadamente el año 2000. Las versiones posteriores de MovieLens **eliminaron los datos demográficos** por privacidad, así que no hay equivalente moderno.
- Los datos son de hace más de veinte años: un veinteañero de 2002 no es un veinteañero de 2026. Debe etiquetarse como **dato histórico**, no como opinión actual. Curiosamente esto abre una feature interesante: comparar cómo ha cambiado la valoración de un clásico entre generaciones.
- **La licencia debe revisarse antes de usarla.** Permite investigación; el uso comercial requiere consultar a GroupLens. Es un trámite, no un impedimento, pero es obligatorio hacerlo.

### Cómo saber que está resuelto
- El porcentaje de películas populares con nivel 1 desbloqueado **con votos reales** supera el 60%.
- El porcentaje de valoraciones sintéticas tiende a cero y se puede publicar sin incomodidad.
- Un usuario nuevo ve un dato útil y verdadero en su primera sesión.
---
## A2 — Los datos sintéticos se presentan como reales
### Qué es
`GET /api/movies/[id]/demographics` no filtra por `isArtificial`. Los 80-150 votos generados por heurística en cada importación se agregan de forma indistinguible de las opiniones humanas. La plataforma presenta hoy salida de un algoritmo como opinión de personas.

### Por qué importa
Es el único riesgo del proyecto que **se agrava cuando el negocio va bien**. Cuanto más famosa sea la plataforma, más escrutinio recibe, y el titular *"la web de ratings demográficos se inventa los ratings demográficos"* es más compartible que tu propia propuesta de valor. La confianza en datos es binaria: no se recupera.

### Sobre la propuesta de usar una IA (DeepSeek) para generar votos más realistas
El instinto detrás de la idea es correcto — los votos heurísticos actuales son burdos — pero **la dirección es la equivocada, y empeora el problema en cinco frentes**:

**1. Mejora la falsificación, no resuelve la falsedad.** El problema nunca fue que los votos parecieran poco creíbles, sino que no son de nadie. Hacerlos indistinguibles de los reales no elimina el riesgo: lo esconde mejor, que es precisamente lo que convierte un error en un engaño.

**2. Empeora el titular.** Hoy la acusación sería "usa datos de relleno estadístico". Con un LLM pasa a ser **"usa inteligencia artificial para fabricar opiniones humanas falsas"**. La segunda frase es mucho más grave, más fácil de contar y más difícil de defender.

**3. Circularidad epistémica: es el fallo más grave.** Un LLM entrenado con internet no sabe qué opinan las mujeres de 22 años sobre Titanic. Sabe **qué se dice en internet sobre lo que opinan las mujeres de 22 años**. Es decir, devuelve el estereotipo cultural agregado.

> Tu producto existe para **comprobar con datos** si esos estereotipos son ciertos. Si rellenas los huecos con la salida de un LLM, construyes un espejo de prejuicios con estética de gráfico y lo presentas como evidencia. Es la peor versión posible del producto, y contradice frontalmente la sección 10 del plan sobre sesgo algorítmico.

**4. Destruye el foso.** Tu único activo no replicable es el dato real. Cualquiera puede pedirle a un LLM que invente lo mismo, en una tarde. Un dataset generado por IA tiene valor de mercado cero, lo que además elimina la vía B2B.

**5. Contamina el dataset de forma permanente.** Si mezclas millones de votos sintéticos verosímiles con los reales, ni tú mismo podrás separarlos con fiabilidad más adelante, ni para vender informes ni para entrenar recomendaciones.

### Usos de la IA que sí aportan aquí
La intuición de aprovechar un LLM barato es buena; solo hay que apuntarla a otro sitio:

| Uso | Valor |
|---|---|
| **Priorizar qué películas empujar en el onboarding** | Pedirle al modelo qué películas tienen más probabilidad de ser polarizantes, y usar esa lista para dirigir la captura de **votos reales** hacia donde generarán contenido viral. Usar el LLM para *conseguir* datos, no para inventarlos. |
| **Redactar el contenido editorial** | Convertir hallazgos de datos reales en artículos del blog. |
| **Traducciones de la interfaz** | Fase 3.5 del roadmap, i18n. |
| **Demo de la landing page** | Datos explícitamente ficticios y etiquetados como tales. Aquí inventar es legítimo porque nadie los confunde con reales. |
| **Moderación de reseñas** | Fase 5.1.3, clasificación de contenido ofensivo. |
| **Predicción declarada como predicción** | Ver más abajo. |

**La única forma defendible de que un modelo aporte un número donde no hay datos** es que no se presente como un voto, sino como una predicción explícita:

> *"Aún no tenemos datos de mujeres de 45-54 para esta película. Nuestro modelo estima un 7,2. ¿Nos ayudas a comprobarlo?"*

Esto es honesto, es interesante y crea un gancho de participación potente: la gente quiere refutar una predicción sobre su propio grupo. Pero exige tres condiciones sin excepción: **no cuenta como voto** en ningún agregado, **es visualmente inconfundible** con un dato real, y **desaparece** en cuanto hay datos. Y sigue arrastrando el problema del estereotipo, así que yo lo dejaría para una fase posterior y solo si la granularidad progresiva no basta.

### Solución
Aplicar íntegramente la sección 6.4 del plan y la Fase 3.2 del roadmap: separar `real` de `estimated` en la API, distinción visual obligatoria, etiquetado explícito, página pública de metodología, y exclusión total de los datos estimados de todo lo compartible y de todo lo vendible. Combinado con A1, la necesidad de datos sintéticos desaparece por sí sola.

### Cómo saber que está resuelto
- Un usuario técnico auditando la web llega a la misma conclusión que la página de metodología.
- Ningún contenido compartido contiene datos estimados.
- El porcentaje de votos sintéticos es público y decreciente.
---
## A3 — No hay ninguna razón para volver
### Qué es
Un usuario se registra, valora treinta películas en el onboarding, explora los desgloses, satisface su curiosidad… y no tiene ningún motivo para volver mañana. El plan fija como objetivo una retención a siete días superior al 25%, pero **no existe ningún mecanismo diseñado para producirla**.

### Por qué importa
Sin retención no hay acumulación de datos, y sin acumulación de datos A1 nunca se resuelve. Es el problema que hace que los otros dos no se puedan arreglar. Los competidores tienen respuesta a esto: Letterboxd es un diario de visionados con capa social, IMDb es la referencia del catálogo. CinePOV, hoy, es una curiosidad que se agota.

### Solución: cuatro mecanismos, en orden de coste/beneficio
**1. Notificar los desbloqueos (barato y muy potente).**
Cuando una película que valoraste alcanza el nivel siguiente de granularidad, se avisa: *"Ya hay datos suficientes en El Padrino: las mujeres de 25-34 lo valoran 1,4 puntos por encima de los hombres de tu edad."* Es una razón para volver que **nace del propio funcionamiento del producto** y mejora sola a medida que crece la base de usuarios.

**2. Convertir la valoración en un hábito con el diario de visionados.**
La gente ve películas todas las semanas. El acto natural recurrente no es "consultar datos", es "registrar lo que acabo de ver". Es la razón por la que Letterboxd retiene. Añadir la fecha de visionado a la valoración convierte una consulta puntual en un hábito semanal, y de paso alimenta el dataset de forma continua.

**3. Contenido nuevo con cadencia fija.**
El ranking de polarizantes de la semana, el desglose de los estrenos recientes, el email semanal de tu segmento (ya planificado, hoy simulado). Da una cita periódica sin necesidad de features nuevas.

**4. Recomendaciones personalizadas por segmento.**
*"Películas que gustan a la gente como tú y que aún no has visto."* Es la razón funcional más fuerte para volver, y está en la Fase 7. **Si la retención resulta ser el cuello de botella, esta tarea debe adelantarse por delante de todo lo social.**

### Cómo saber que está resuelto
- Retención D7 > 20% y D30 > 10%.
- Más del 30% de los usuarios registran al menos una valoración en semanas distintas a la del registro.
- Valoraciones por usuario creciendo con el tiempo, no congeladas en la cifra del onboarding.
---
## A4 — Los mejores canales de lanzamiento dan el peor perfil demográfico
### Qué es
Hacker News, Product Hunt y los subreddits técnicos son los canales más eficaces para lanzar un producto así, y son abrumadoramente hombres de 20 a 40 años con perfil técnico. Puedes conseguir 10.000 registros de ahí y seguir teniendo la celda "mujeres de 45-54" completamente vacía.

### Por qué importa
Tu producto no necesita usuarios, necesita usuarios **repartidos**. Un dataset con el 70% de sus votos en un único segmento no puede cumplir la promesa del producto por muchos usuarios que tenga, y refuerza el problema A1 en los segmentos que faltan justo cuando parece que todo va bien.

### Solución
- **Separar los objetivos de cada canal.** El lanzamiento técnico sirve para validación, feedback y ruido inicial. La salud demográfica del dataset viene de otro sitio: TikTok, Instagram, comunidades de cine generalistas, foros no técnicos, y el boca a boca del artefacto personal compartible.
- **Medir el equilibrio demográfico como métrica de primer nivel** desde el día uno, no como curiosidad. Ningún segmento debería superar el 40% del total.
- **Campañas dirigidas a los segmentos que faltan** cuando se detecte el desequilibrio: contenido específico sobre géneros cinematográficos con audiencia distinta al segmento dominante.
- **Aprovechar el sesgo como gancho honesto:** *"Tenemos muy pocos datos de mayores de 45. Si tienes más de 45 años, tu voto vale mucho más aquí que en ningún otro sitio."* Es verdad, y es una invitación más atractiva que un registro genérico.
- **Priorizar el nivel 1 de granularidad (hombres vs. mujeres)**, que es el que más rápido se equilibra, frente al cruce completo, que es el que más sufre el desequilibrio.

### Cómo saber que está resuelto
- Ningún segmento demográfico supera el 40% de la base de usuarios.
- Los cinco rangos de edad tienen representación de al menos el 8% cada uno.
---
# BLOQUE B — Preocupaciones estratégicas
---
## B1 — Letterboxd puede copiar la feature en un sprint
### Qué es
Si el concepto funciona, cualquier plataforma establecida puede implementar el desglose demográfico sobre cien millones de valoraciones existentes en unas semanas, y su versión será estadísticamente mejor que la tuya desde el primer día.

### Por qué importa
Tu foso solo es real si llegas antes **y** con escala suficiente. Es una carrera contra un reloj que no controlas.

### Solución
- **Ventaja genuina que tienes:** las plataformas grandes son **reticentes** a segmentar públicamente por género porque el riesgo reputacional para una marca establecida es desproporcionado. Ser pequeño te permite hacer algo que a ellos les da miedo hacer. Esa ventaja es real, aunque no eterna.
- **Ser el nombre de la categoría.** Si "CinePOV" se convierte en la forma de referirse a esto, una copia posterior parece justo eso. La marca y el contenido editorial son parte de la defensa, no adornos.
- **Complementar en lugar de competir.** El importador de Letterboxd ya existe y es la decisión estratégica correcta: te posiciona como capa de análisis sobre su ecosistema, no como su rival. Reduce la probabilidad de que te vean como amenaza.
- **Profundizar más de lo que a un generalista le interesa.** Polarización, afinidad entre segmentos, evolución temporal, informes para la industria. Nadie construye eso como feature secundaria.
- **Aceptarlo:** si Letterboxd lo implementa y funciona, habrás tenido razón sobre el problema. Ese escenario también es una salida (adquisición, o simplemente haber validado una tesis).

---
## B2 — El género como eje central es un pasivo reputacional
### Qué es
Un producto cuyo núcleo comunicativo es "hombres contra mujeres" tiene una probabilidad no trivial de que la conversación pública lo convierta en algo tóxico, independientemente de tus intenciones.

### Por qué importa
El público que atrae el conflicto identitario **contamina el propio dataset**: si tu base de usuarios se llena de gente que vota para ganar una discusión, los datos dejan de medir gustos cinematográficos.

### Solución
- **Poner la edad al frente y el género como capa secundaria.** La brecha generacional es casi igual de predictiva, igual de interesante y mucho menos inflamable. "Los boomers y la Gen Z no ven la misma película" es un titular fascinante y no ofende a nadie.
- **Tono de curiosidad, nunca de superioridad.** Ya documentado en el go-to-market: mostrar que dos grupos valoran distinto es un dato; insinuar que uno se equivoca es otra cosa.
- **Nunca ordenar los segmentos en un ranking de "acierto".** No existe la nota correcta.
- **Moderación desde el primer día** en cualquier función con texto libre, y no lanzar reseñas sin ella.
- **Vigilar la composición de la base de usuarios** como señal temprana de que el posicionamiento se está torciendo.

---
## B3 — Riesgo de confundir el producto con el negocio
### Qué es
Puede que la plataforma no sea el activo más valioso que estás construyendo. Puede que lo sea **la capacidad de generar permanentemente contenido que la gente quiere compartir** sobre un tema del que todo el mundo tiene opinión.

### Por qué importa
Si esa hipótesis es cierta, cambia las prioridades por completo. Y tiene una propiedad muy atractiva: **necesita muchos menos usuarios**. Un informe sobre las cincuenta películas más polarizantes solo requiere datos sólidos en cincuenta películas, no en cincuenta mil. Esquiva A1 casi por completo.

### Solución
No es una decisión que haya que tomar hoy, es una hipótesis que hay que **mantener viva y medir**:
- Instrumentar por separado el rendimiento del contenido (alcance, comparticiones, menciones) y el del producto (registros, retención).
- Si a los tres meses el contenido crece mucho más rápido que la plataforma, es una señal, no un fracaso.
- Explorar formatos de bajo coste en paralelo: una newsletter quincenal de datos de cine, una cuenta de vídeo corto.
- Mantener la vía B2B en el radar: un informe demográfico para una distribuidora tiene valor con un dataset modesto, y es donde el dinero está de verdad.
- La plataforma seguiría siendo necesaria: es la fábrica que produce el contenido. No es "o una cosa o la otra".

---
## B4 — El foso de datos se puede regalar sin darse cuenta
Ya documentado en la sección 1.4 del plan y en la Fase 7.4 del roadmap. **Resumen:** la API pública gratuita permitiría a un competidor construir su producto sobre tu dataset. La solución es rate limiting agresivo por tier, ausencia de endpoints de volcado masivo, y términos que prohíban explícitamente la reconstrucción del dataset.

---
## B5 — Dependencia total de TMDB con licencia no comercial
Ya documentado en el riesgo 7.5 del plan. **Resumen:** todo el catálogo depende de una API externa gratuita **para uso no comercial**, y la Fase 7 contempla monetizar. Solución: caché local agresiva (ya implementada), revisión de la licencia comercial como bloqueante previo a cobrar, atribución impecable, cola de importación ante picos, y alternativas identificadas manteniendo `tmdbId` desacoplado.

---
# BLOQUE C — Preocupaciones técnicas y de ejecución
---
## C1 — SQLite no persiste datos en Vercel
### Qué es
`lib/db.ts` usa `better-sqlite3` contra un fichero local, incluso en producción. El sistema de ficheros de las funciones serverless de Vercel es de solo lectura y efímero.

### Por qué importa
La web compilará y se verá perfecta, y **todas las escrituras se perderán** en el siguiente arranque en frío o despliegue. Un lanzamiento viral sobre esta configuración es un desastre irreversible: no hay segunda primera impresión.

### Solución
Fase 3.1 del roadmap: PostgreSQL gestionado (Neon o Vercel Postgres), adaptador de Prisma correspondiente, migraciones regeneradas, **connection pooling apto para serverless** (sin esto un pico de tráfico agota las conexiones), y copias de seguridad automáticas con una restauración verificada.

### Cómo saber que está resuelto
Registrar un usuario, forzar un redespliegue y comprobar que el usuario y sus valoraciones siguen ahí.

---
## C2 — Cero instrumentación analítica
### Qué es
No hay ninguna herramienta de analítica en el proyecto. Los KPIs de la sección 11 del plan no son medibles.

### Por qué importa
Sin saber dónde abandona la gente el registro o el onboarding, cada decisión de crecimiento es una apuesta. Y el umbral crítico —si la tasa de activación cae por debajo del 40% hay que parar el marketing y arreglar el embudo— **no se puede detectar sin datos**.

### Solución
Fase 3.3: Vercel Analytics más PostHog en modo *cookieless*, el esquema de eventos ya definido, el embudo de activación hasta el momento "aha", Sentry para errores con alertas, y Search Console conectado.

### Cómo saber que está resuelto
Puedes responder, mirando un panel: cuántos registros se completan, cuántos llegan al primer desglose demográfico, y en qué paso exacto se cae la gente.

---
## C3 — Un solo commit, sin remoto, sin tests, sin CI
### Qué es
El repositorio tiene un único commit (`Fases 0, 1 y 2`), solo la rama `dev`, y **no existe remoto**. No hay tests automatizados ni integración continua. Las pruebas viven como scripts manuales en `scratch/`.

### Por qué importa
Un fallo de disco borra el proyecto completo: no hay copia en ningún otro sitio. Y sin tests ni CI, cada cambio en el cálculo demográfico —que es el corazón del producto— se valida a ojo. Un error de agregación silencioso es especialmente peligroso porque **produce números plausibles pero falsos**, que es exactamente el fallo que nadie detecta hasta que es tarde.

### Solución
- Crear el repositorio remoto **hoy** (Fase 3.8). Es lo más urgente y lo más barato del documento.
- CI en GitHub Actions con lint, `tsc --noEmit` y build en cada push (Fase 3.9).
- Tests con Vitest centrados en lo que de verdad importa: **el cálculo de agregación demográfica**, el filtrado por `isArtificial`, la clasificación por rangos de edad, los umbrales mínimos y los parsers de importación. No hace falta cobertura amplia, hace falta cobertura del núcleo.
- Un test de extremo a extremo con Playwright para el flujo de registro, valoración y desglose.
- Commits pequeños a partir de ahora, siguiendo la convención que ya está documentada.

### Cómo saber que está resuelto
Puedes cambiar la lógica de agregación con la confianza de que un test fallará si rompes algo.

---
## C4 — Sin rate limiting ni verificación real de cuentas
### Qué es
No hay límite de peticiones en el registro ni en la creación de valoraciones, ni verificación de email efectiva antes de que un voto cuente para los agregados públicos.

### Por qué importa
El review bombing demográfico (riesgo 7.2 del plan) es más dañino aquí que en cualquier otra plataforma, porque permite destruir la credibilidad de un segmento concreto, que es justo el diferenciador. Y esto **llega con el tráfico**, no después: un lanzamiento viral sin defensas es una invitación abierta.

### Solución
Fase 3.6: rate limiting por IP con Upstash o Vercel KV, verificación de email obligatoria para que un voto entre en los agregados, umbral mínimo de antigüedad de cuenta, honeypot en formularios, cabeceras de seguridad HTTP, y alerta automática ante picos anómalos en un mismo segmento y película.

---
## C5 — Emails simulados y sin recuperación de contraseña
### Qué es
`lib/email.ts` escribe en `console.log`. No hay proveedor de envío. Y **no existe recuperación de contraseña**: un usuario que la olvide pierde la cuenta y sus valoraciones para siempre.

### Por qué importa
La recuperación de contraseña no es una feature, es un requisito. Y sin emails reales no hay verificación de cuentas (lo que rompe C4), ni email semanal (lo que rompe A3).

### Solución
Fase 3.7: integrar Resend, configurar el dominio con SPF, DKIM y DMARC (sin esto todo va a spam), plantillas bilingües, e implementar el flujo completo de restablecimiento de contraseña.

---
## C6 — La agregación demográfica no escala en su forma actual
### Qué es
El endpoint de demografía carga **todas** las valoraciones de una película con un `include` del usuario y agrega en memoria en JavaScript. Con cien valoraciones funciona; con cien mil por película, no.

### Por qué importa
Hoy no es un problema real y no merece optimización prematura. Pero conviene saber dónde está el techo: el problema aparecerá de golpe en la película más popular justo cuando llegue el pico de tráfico.

### Solución
Escalonada, como ya recoge el plan: primero mover la agregación a SQL con `GROUP BY` en lugar de en memoria (barato y suficiente para mucho tiempo), después vistas materializadas, después caché con TTL. Fase 6.1 y 6.2.

---
# BLOQUE D — Preocupaciones legales
---
## D1 — No existe ningún documento legal
No hay política de privacidad, ni términos y condiciones, ni aviso legal, ni banner de cookies. Con tráfico europeo y recogida de **datos personales de categoría demográfica**, los cuatro son obligatorios. Detalle completo en la sección 10.2 del plan y la Fase 3.4 del roadmap.

> Un agravante específico de este proyecto: presentar datos generados como opiniones reales podría considerarse práctica comercial engañosa, más allá del daño reputacional. Es otra razón para resolver A2.

## D2 — Derechos RGPD no implementados
No hay borrado de cuenta ni exportación de datos. Solución en la Fase 3.4, con una decisión de diseño relevante: al borrar la cuenta, **anonimizar** las valoraciones en lugar de eliminarlas (desvinculándolas del usuario y conservando solo los atributos demográficos agregados), documentándolo en la política de privacidad. Conserva el dataset y cumple la norma.

---
# Resumen: el camino crítico
Si tuviera que reducir todo este documento a una secuencia:

1. **Hoy mismo:** crear el repositorio remoto y registrar el dominio y los handles. Coste mínimo, pérdida irreversible.
2. **Antes de cualquier usuario:** PostgreSQL (C1), transparencia de datos (A2), legal (D1, D2), analítica (C2), defensas básicas (C4).
3. **Antes de buscar crecimiento:** granularidad progresiva (A1) y al menos un mecanismo de retención (A3). Traer tráfico a un producto que no activa ni retiene desperdicia la única oportunidad de causar buena impresión.
4. **Durante el crecimiento:** vigilar el equilibrio demográfico (A4) tanto como el volumen.
5. **En segundo plano:** mantener viva la hipótesis del contenido como producto (B3) y medirla.

> **La conclusión que importa:** ninguna de estas preocupaciones es un defecto de la idea. Son los problemas normales de un producto de datos colaborativos, y todos tienen solución conocida. El único que puede matar el proyecto sin remedio es A2, porque la confianza no se recupera. Y es, precisamente, el más fácil de arreglar: basta con decir la verdad.
