# Validación de la hipótesis central con MovieLens

> **Hipótesis del plan:** la nota que da tu segmento demográfico (género × edad) dice algo útil sobre si te gustará una película.
>
> Este documento se escribió en dos tiempos: primero el diseño y los umbrales de decisión (fijados antes de ver ningún dato, para que el resultado no pueda influir en ellos) y después los resultados.

## 1. Diseño (fijado antes de ver los datos)

**Datos.** `ml-1m` de GroupLens: 1.000.209 valoraciones (escala 1–5) de 6.040 usuarios sobre unas 3.900 películas, con género y edad declarados, recogidas hacia el año 2000. Uso interno de investigación; no se versionan ni se publican datos derivados sin revisar antes la licencia.

**Preparación.**
- Se excluyen los menores de 18 (igual que en el producto).
- La escala 1–5 se multiplica por 2 para hablar en la escala 1–10 de CinePOV.
- Tramos de edad de MovieLens → tramos de CinePOV: 18–24, 25–34, 35–44, 45–55 (aprox. 45–54) y 56+ (aprox. 55+).

**Pregunta 1: ¿con qué frecuencia hay brechas?**
- Brecha de género: |media de mujeres − media de hombres|, en películas con al menos 30 votos de cada género.
- Brecha de edad: máximo − mínimo entre los tramos con al menos 30 votos, en películas con al menos dos tramos así.
- Una brecha es **relevante** si es de 1,0 puntos o más (escala 1–10) **y** estadísticamente distinguible del azar (|z| ≥ 1,96 con el error estándar de Welch; en la brecha de edad, entre los dos tramos extremos).

**Pregunta 2: ¿predice la media del segmento mejor que la media global?**
Se separa al azar el 10 % de las valoraciones como prueba (semilla fija) y se mide el error cuadrático medio (RMSE) al predecir cada valoración de prueba con:
- **M1, media de la película.** Lo que muestran IMDb o Filmaffinity.
- **M2, media del segmento.** Media de la película entre las personas del mismo género y tramo de edad, con contracción hacia la media de la película (k = 10) para no premiar segmentos con dos votos. Es la promesa de CinePOV.
- **M3, media de la película + sesgo personal.** Cuánto se desvía esa persona, de media, de la nota de las películas que ha valorado (k = 5). Es lo más simple que aprende de tus gustos y no de tu demografía.
- **M4, M2 + sesgo personal.** Lo que aporta la demografía encima de lo personal.

**Umbrales de decisión.**

| Resultado | Umbral | Decisión |
|---|---|---|
| Brechas frecuentes | ≥ 33 % de las películas elegibles con brecha relevante de género o de edad | Condición para seguir con el plan |
| La media del segmento predice mejor | M2 reduce el RMSE de M1 en un 2 % o más | Condición para presentar el desglose como utilidad ("un 8,6 para ti") |
| Lo personal pesa más que lo demográfico | La mejora de M3 sobre M1 es más del doble que la de M2 sobre M1 | Refuerza adelantar "gente con tus gustos" |

| Brechas frecuentes | Segmento predice ≥ 2 % | Qué hacemos |
|---|---|---|
| Sí | Sí | Seguir con el plan tal cual. |
| Sí | No | El desglose es un gancho de contenido, no una utilidad. Adelantar "gente con tus gustos" al Hito 2 y revisar el lema. |
| No | — | Replantear la propuesta de valor antes del lanzamiento público. |

**Limitaciones asumidas de antemano.** Datos de hace más de 20 años, de usuarios mayoritariamente estadounidenses y de una web de recomendaciones (no una muestra representativa); escala 1–5 más gruesa que la 1–10; tramos de edad que no coinciden exactamente. El resultado orienta, no demuestra.

## 2. Resultados (23 de noviembre de 2026)

Datos tras excluir menores: 5.818 usuarios y 972.998 valoraciones. Checksum del fichero comprobado contra el MD5 publicado por GroupLens.

### Pregunta 1: brechas

| Corte | Películas elegibles | Con brecha relevante (≥ 1,0 y significativa) | Brecha mediana |
|---|---|---|---|
| Género | 1.790 | 38 (**2,1 %**) | 0,28 puntos |
| Edad (tramo más alto − más bajo) | 1.888 | 285 (**15,1 %**) | 0,57 puntos |
| Género o edad | 2.014 | 314 (**15,6 %**) | — |

### Pregunta 2: poder predictivo (RMSE sobre 97.309 valoraciones de prueba, escala 1–10)

| Modelo | RMSE | Frente a M1 |
|---|---|---|
| M0, media global | 2,2246 | −14,22 % |
| M1, media de la película | 1,9476 | — |
| M2, media del segmento | 1,9398 | **+0,40 %** |
| M3, película + sesgo personal | 1,8073 | **+7,21 %** |
| M4, segmento + sesgo personal | 1,7997 | +7,59 % |

### Aplicación de los umbrales

| Umbral | Resultado | ¿Se cumple? |
|---|---|---|
| ≥ 33 % de películas con brecha relevante | 15,6 % | **No** |
| M2 mejora a M1 en ≥ 2 % | 0,40 % | **No** |
| Mejora personal > 2 × mejora del segmento | 7,21 % frente a 0,40 % (unas 18 veces) | **Sí** |

**Decisión según la tabla fijada de antemano: replantear la propuesta de valor antes del lanzamiento público.**

### Análisis posterior (no prerregistrado; solo orienta)

Sensibilidad al umbral de brecha:

| Umbral | Género | Edad |
|---|---|---|
| 0,5 puntos | 18,1 % | 42,4 % |
| 1,0 puntos | 2,1 % | 15,1 % |
| 1,5 puntos | 0,1 % | 2,4 % |

Las mayores brechas significativas son sobre todo **generacionales** (*Happy Gilmore*: +2,5 entre 18–24 y 45–55; *Fly Away Home*, *Los Goonies*, *Spaceballs*), y las de género son pocas y concentradas (*Newsies*, *Dirty Dancing*, *El bueno, el feo y el malo*).

## 3. Lectura

1. **Como utilidad general, el desglose demográfico no se sostiene en estos datos.** En la mayoría de películas los grupos coinciden en medio punto o menos. Saber tu segmento mejora la predicción de tu nota un 0,4 %; saber cómo puntúas tú, un 7,2 %. El lema "La película no tiene un 7,2. Tiene un 8,6 para ti" promete algo que la demografía no da.
2. **Como contenido, sí hay material.** En torno al 15 % de las películas tiene una brecha generacional real de un punto o más. Son pocas, pero son las que generan conversación: encaja con la hipótesis B3 del análisis crítico (el contenido como producto).
3. **La edad pesa unas siete veces más que el género.** Refuerza la decisión de la preocupación B2: edad al frente y género como capa secundaria.
4. **Lo que sí predice es el gusto propio.** Incluso el modelo personal más simple supera con creces al segmento; el filtrado colaborativo ("gente con tus gustos") debería mejorar todavía más.

**Propuesta para decidir** (la decisión es del equipo, no de este documento):
- Utilidad: recomendaciones por gustos propios (filtrado colaborativo), alimentadas por los importadores de Letterboxd e IMDb.
- Contenido: el desglose demográfico como capa de curiosidad, destacando solo las películas con brecha real ("cuando hay brecha, es noticia"), con la edad por delante.
- Revisar el lema y la landing antes del lanzamiento público.

**Recordatorio de limitaciones:** datos de hacia el año 2000, usuarios mayoritariamente estadounidenses de una web de recomendaciones, escala 1–5. Los datos reales de CinePOV pueden diferir; esta validación conviene repetirla con los datos propios cuando haya volumen.

## 4. Motor "gente que puntúa como tú" (27 de noviembre de 2026)

Tras decidir el reposicionamiento, se probó con los mismos datos qué motor de recomendación por gustos implementar. Muestra de 400 usuarios con al menos 40 valoraciones; se aparta el 20 % de las de cada uno como prueba (14.980 predicciones).

| Modelo | Historial completo | Solo 20 valoraciones (como tras el onboarding) |
|---|---|---|
| M1, media de la película | — | — |
| M2, media del segmento demográfico | +0,63 % | +0,40 % |
| M3, película + sesgo personal | +7,65 % | +5,70 % |
| Vecinos fijos (tus 30 usuarios más parecidos) | **−0,93 %** | −0,08 % |
| **Vecinos por película sobre M3** (elegido) | **+9,74 %** | **+6,40 %** |

Mejora del RMSE frente a M1.

- La variante ingenua (vecinos fijos) predice **peor** que la media: pocos de tus 30 vecinos han visto cada película concreta. Se descarta.
- La elegida es la estándar en la literatura (*KNN baseline*): predice con M3 y lo corrige con la desviación de los 40 usuarios más parecidos **entre quienes han valorado esa película** (Pearson sobre películas en común, contraído con 100, mínimo 5 en común).
- Con pocos usuarios no hay vecinos y queda M3, que sigue siendo unas 10 veces mejor que el segmento demográfico. Para que M3 funcione desde el primer día, la media de cada película parte de la nota de TMDB y se va ajustando con los votos de CinePOV.
