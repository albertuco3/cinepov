/**
 * Definición de segmentos demográficos programáticos (SEO Programático - Fase 4.6.2).
 */

export interface DemographicSegmentConfig {
  slug: string;
  label: string;
  headline: string;
  description: string;
  gender: "female" | "male" | "non_binary" | "all";
  ageBroad: "young" | "adult" | "senior" | "all";
}

export const DEMOGRAPHIC_SEGMENTS: Record<string, DemographicSegmentConfig> = {
  "mujeres-18-34": {
    slug: "mujeres-18-34",
    label: "Mujeres de 18 a 34 años",
    headline: "Las Mejores Películas según Mujeres de 18 a 34 años",
    description:
      "Descubre qué películas encabezan las valoraciones del público femenino joven. Datos agregados y verificados de la comunidad de CinePOV.",
    gender: "female",
    ageBroad: "young",
  },
  "hombres-18-34": {
    slug: "hombres-18-34",
    label: "Hombres de 18 a 34 años",
    headline: "Las Mejores Películas según Hombres de 18 a 34 años",
    description:
      "Descubre los títulos más aclamados por hombres jóvenes. Rankings generados exclusivamente con calificaciones contrastadas.",
    gender: "male",
    ageBroad: "young",
  },
  "mujeres-35-54": {
    slug: "mujeres-35-54",
    label: "Mujeres de 35 a 54 años",
    headline: "Las Mejores Películas según Mujeres de 35 a 54 años",
    description:
      "El criterio cinematográfico de las mujeres de mediana edad en CinePOV. Descubre qué películas logran la máxima puntuación en este grupo.",
    gender: "female",
    ageBroad: "adult",
  },
  "hombres-35-54": {
    slug: "hombres-35-54",
    label: "Hombres de 35 a 54 años",
    headline: "Las Mejores Películas según Hombres de 35 a 54 años",
    description:
      "Las películas imprescindibles para hombres entre 35 y 54 años. Filtro transparente de votos reales.",
    gender: "male",
    ageBroad: "adult",
  },
  "mujeres-55": {
    slug: "mujeres-55",
    label: "Mujeres de 55+ años",
    headline: "Las Mejores Películas según Mujeres Mayores de 55 años",
    description:
      "Las obras cinematográficas más valoradas por mujeres senior en CinePOV. Cine avalado por la experiencia.",
    gender: "female",
    ageBroad: "senior",
  },
  "hombres-55": {
    slug: "hombres-55",
    label: "Hombres de 55+ años",
    headline: "Las Mejores Películas según Hombres Mayores de 55 años",
    description:
      "El ranking del público masculino senior en CinePOV. Clásicos y cine contemporáneo con la mejor calificación.",
    gender: "male",
    ageBroad: "senior",
  },
  "jovenes-18-34": {
    slug: "jovenes-18-34",
    label: "Jóvenes (18-34 años)",
    headline: "Las Mejores Películas según Jóvenes de 18 a 34 años",
    description:
      "El consenso de la nueva generación cinéfila. Películas mejor calificadas por jóvenes de ambos géneros.",
    gender: "all",
    ageBroad: "young",
  },
  "seniors-55": {
    slug: "seniors-55",
    label: "Mayores (55+ años)",
    headline: "Las Mejores Películas según Mayores de 55 años",
    description:
      "El gusto cinematográfico de los espectadores mayores de 55 años en CinePOV.",
    gender: "all",
    ageBroad: "senior",
  },
};

export const ALL_SEGMENT_SLUGS = Object.keys(DEMOGRAPHIC_SEGMENTS);

export function getSegmentConfig(slug: string): DemographicSegmentConfig | null {
  return DEMOGRAPHIC_SEGMENTS[slug.toLowerCase()] || null;
}
