/**
 * Configuración y utilidades para las páginas de década (SEO Programático - Fase 4.6.3).
 */

export interface DecadeConfig {
  slug: string;
  label: string;
  startYear: number;
  endYear: number;
  headline: string;
  description: string;
}

export const DECADES_CONFIG: Record<string, DecadeConfig> = {
  "1960s": {
    slug: "1960s",
    label: "Años 60",
    startYear: 1960,
    endYear: 1969,
    headline: "Las Mejores Películas de los Años 60",
    description:
      "La década revolucionaria del cine: desde el nacimiento del cine moderno hasta las obras cumbres del suspense y la ciencia ficción.",
  },
  "1970s": {
    slug: "1970s",
    label: "Años 70",
    startYear: 1970,
    endYear: 1979,
    headline: "Las Mejores Películas de los Años 70",
    description:
      "La edad de oro del Nuevo Hollywood, obras maestras autorales y clásicos inmortales del thriller y el drama.",
  },
  "1980s": {
    slug: "1980s",
    label: "Años 80",
    startYear: 1980,
    endYear: 1989,
    headline: "Las Mejores Películas de los Años 80",
    description:
      "El cine de culto, las grandes sagas de aventuras, la fantasía y la ciencia ficción que marcaron a toda una generación.",
  },
  "1990s": {
    slug: "1990s",
    label: "Años 90",
    startYear: 1990,
    endYear: 1999,
    headline: "Las Mejores Películas de los Años 90",
    description:
      "La década dorada del cine independiente, la eclosión de los efectos digitales revolucionarios y los dramas más aclamados de la historia.",
  },
  "2000s": {
    slug: "2000s",
    label: "Años 2000",
    startYear: 2000,
    endYear: 2009,
    headline: "Las Mejores Películas de los Años 2000",
    description:
      "El cambio de milenio, las grandes trilogías modernas y el cine que redefinió el espectáculo cinematográfico.",
  },
  "2010s": {
    slug: "2010s",
    label: "Años 2010",
    startYear: 2010,
    endYear: 2019,
    headline: "Las Mejores Películas de los Años 2010",
    description:
      "Una década de maestría visual, diversidad de voces cinematográficas y consagración del cine internacional.",
  },
  "2020s": {
    slug: "2020s",
    label: "Años 2020",
    startYear: 2020,
    endYear: 2029,
    headline: "Las Mejores Películas de los Años 2020",
    description:
      "El cine actual y contemporáneo: los estrenos más destacados de la presente década clasificados por consenso demográfico.",
  },
};

export const ALL_DECADE_SLUGS = Object.keys(DECADES_CONFIG);

export function getDecadeConfig(slug: string): DecadeConfig | null {
  return DECADES_CONFIG[slug.toLowerCase()] || null;
}
