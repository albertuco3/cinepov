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

## 2. Resultados

_Pendiente de ejecutar._
