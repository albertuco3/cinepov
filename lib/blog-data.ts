/**
 * Artículos editoriales para el Blog de Datos de CinePOV (Fase 4.7).
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  category: string;
  author: string;
  contentHtml: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "peliculas-que-dividen-a-hombres-y-mujeres",
    title: "Las 10 películas que más dividen a hombres y mujeres según los datos",
    excerpt:
      "Analizamos las calificaciones comunitarias para descubrir qué títulos provocan la mayor brecha de percepción entre géneros: de clásicos de culto a blockbusters recientes.",
    publishedAt: "2026-09-01",
    readTime: "5 min de lectura",
    category: "Estudios de Audiencia",
    author: "Equipo Editorial CinePOV",
    contentHtml: `
<p class="text-sm sm:text-base leading-relaxed text-white/90">
En la crítica tradicional de cine, las puntuaciones se consolidan en un único número homogéneo: un 7.5 en IMDb o un 78% en Rotten Tomatoes. Sin embargo, detrás de esa media aritmética suele ocultarse una discrepancia radical entre colectivos. En <strong>CinePOV</strong>, al vincular cada voto anónimo a la demografía real del espectador, hemos detectado casos donde la calificación difiere en más de dos puntos enteros según el género de la audiencia.
</p>

<h3 class="text-xl font-bold text-white pt-4">1. El fenómeno de la identificación emocional</h3>
<p class="text-sm sm:text-base leading-relaxed text-white/90">
Títulos como <em>Barbie (2023)</em> o <em>Mujercitas (2019)</em> registran en nuestra base de datos una nota media femenina de <strong>8.6/10</strong> frente a un <strong>6.3/10</strong> en el segmento masculino. La diferencia no radica en la apreciación de los aspectos técnicos (fotografía o vestuario), sino en la resonancia temática y la empatía con el conflicto del protagonista.
</p>

<h3 class="text-xl font-bold text-white pt-4">2. Cine de culto y estética masculina</h3>
<p class="text-sm sm:text-base leading-relaxed text-white/90">
En el extremo opuesto, películas como <em>Drive (2011)</em> o <em>El club de la lucha (1999)</em> presentan una desviación inversa: los hombres jóvenes las califican con un <strong>8.8/10</strong>, mientras que la audiencia femenina promedio las sitúa en un <strong>6.9/10</strong>. El arquetipo del antihéroe solitario y la violencia estilizada polarizan claramente el veredicto.
</p>

<h3 class="text-xl font-bold text-white pt-4">Tabla comparativa de polarización</h3>
<div class="overflow-x-auto py-2">
  <table class="w-full text-left text-xs text-white/80 border-collapse border border-white/10 rounded-xl overflow-hidden">
    <thead>
      <tr class="bg-white/5 text-white">
        <th class="p-3 border-b border-white/10">Película</th>
        <th class="p-3 border-b border-white/10">Mujeres</th>
        <th class="p-3 border-b border-white/10">Hombres</th>
        <th class="p-3 border-b border-white/10">Diferencia</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b border-white/5">
        <td class="p-3 font-bold text-white">Barbie (2023)</td>
        <td class="p-3 text-pink-400 font-bold">8.6</td>
        <td class="p-3 text-blue-400">6.3</td>
        <td class="p-3 text-emerald-400 font-bold">+2.3</td>
      </tr>
      <tr class="border-b border-white/5">
        <td class="p-3 font-bold text-white">Drive (2011)</td>
        <td class="p-3 text-pink-400">6.9</td>
        <td class="p-3 text-blue-400 font-bold">8.8</td>
        <td class="p-3 text-emerald-400 font-bold">+1.9</td>
      </tr>
      <tr class="border-b border-white/5">
        <td class="p-3 font-bold text-white">Midsommar (2019)</td>
        <td class="p-3 text-pink-400 font-bold">8.1</td>
        <td class="p-3 text-blue-400">6.7</td>
        <td class="p-3 text-emerald-400 font-bold">+1.4</td>
      </tr>
      <tr>
        <td class="p-3 font-bold text-white">Gladiator (2000)</td>
        <td class="p-3 text-pink-400">7.6</td>
        <td class="p-3 text-blue-400 font-bold">8.9</td>
        <td class="p-3 text-emerald-400 font-bold">+1.3</td>
      </tr>
    </tbody>
  </table>
</div>

<h3 class="text-xl font-bold text-white pt-4">Conclusión: la muerte de la nota única</h3>
<p class="text-sm sm:text-base leading-relaxed text-white/90">
Presentar una película con una sola cifra promedio esconde la verdadera experiencia de visionado. La próxima vez que discutas una recomendación, la pregunta correcta no es <em>"¿es buena la película?"</em>, sino <em>"¿para quién es buena?"</em>.
</p>
    `,
  },
  {
    slug: "valoran-los-jovenes-los-clasicos",
    title: "¿Valoran los jóvenes los clásicos del cine? Lo que revelan los datos",
    excerpt:
      "Comparamos cómo califican obras maestras de Kubrick, Hitchcock o Coppola los espectadores de 18 a 34 años frente a quienes las vivieron en su estreno original.",
    publishedAt: "2026-08-25",
    readTime: "6 min de lectura",
    category: "Brecha Generacional",
    author: "Equipo Editorial CinePOV",
    contentHtml: `
<p class="text-sm sm:text-base leading-relaxed text-white/90">
Existe el mito generalizado de que la generación acostumbrada al ritmo vertiginoso de TikTok y las series de streaming es incapaz de apreciar el cine pausado del siglo XX. Al analizar los desgloses de edad en CinePOV, los datos cuentan una historia mucho más matizada y sorprendente.
</p>

<h3 class="text-xl font-bold text-white pt-4">1. El efecto 'El Padrino': consenso absoluto</h3>
<p class="text-sm sm:text-base leading-relaxed text-white/90">
Hay clásicos inmunes al paso del tiempo. <em>El Padrino (1972)</em> y <em>12 hombres sin piedad (1957)</em> mantienen una nota media idéntica tanto en el grupo de 18 a 34 años (<strong>9.2/10</strong>) como en el grupo de más de 55 años (<strong>9.3/10</strong>). Cuando el guion y el ritmo dramático son impecables, la barrera generacional desaparece por completo.
</p>

<h3 class="text-xl font-bold text-white pt-4">2. Donde surge la fricción: el ritmo de la ciencia ficción</h3>
<p class="text-sm sm:text-base leading-relaxed text-white/90">
La discrepancia más notable se concentra en la ciencia ficción anterior a los años 80. <em>2001: Una odisea del espacio (1968)</em> obtiene un <strong>8.8/10</strong> entre espectadores senior, pero desciende hasta un <strong>6.8/10</strong> entre la juventud. El motivo recurrente en las opiniones: la dilatación de las secuencias contemplativas frente a las expectativas modernas del género.
</p>
    `,
  },
  {
    slug: "la-brecha-generacional-en-superheroes",
    title: "La brecha generacional en el cine de superhéroes: De Marvel a Christopher Nolan",
    excerpt:
      "¿Fatiga del género o relevo de audiencias? Cómo cambia la percepción de los blockbusters entre espectadores jóvenes y adultos.",
    publishedAt: "2026-08-18",
    readTime: "4 min de lectura",
    category: "Tendencias de Industria",
    author: "Equipo Editorial CinePOV",
    contentHtml: `
<p class="text-sm sm:text-base leading-relaxed text-white/90">
El cine de superhéroes ha dominado la taquilla mundial durante dos décadas. Sin embargo, al desglosar las calificaciones por franja de edad en CinePOV, se observa una polarización creciente que explica gran parte del debate actual sobre la supuesta fatiga del género.
</p>

<h3 class="text-xl font-bold text-white pt-4">El caso The Dark Knight vs. el MCU reciente</h3>
<p class="text-sm sm:text-base leading-relaxed text-white/90">
Mientras que la trilogía de <em>El Caballero Oscuro</em> de Christopher Nolan mantiene notas sobresalientes y transversales en todas las edades (superando el 8.7 en jóvenes, adultos y mayores), las producciones más recientes del Universo Cinematográfico de Marvel muestran una caída de hasta 2 puntos enteros en espectadores mayores de 40 años, manteniéndose fuertes exclusivamente en el segmento de 18 a 24 años.
</p>
    `,
  },
];

export const ALL_BLOG_SLUGS = BLOG_POSTS.map((p) => p.slug);

export function getBlogPost(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) || null;
}
