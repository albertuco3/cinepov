/**
 * Mapeo y utilidades para las páginas de género (SEO Programático - Fase 4.6).
 */

export const GENRE_SLUG_MAP: Record<string, string> = {
  accion: "Acción",
  aventura: "Aventura",
  animacion: "Animación",
  comedia: "Comedia",
  crimen: "Crimen",
  documental: "Documental",
  drama: "Drama",
  familia: "Familia",
  fantasia: "Fantasía",
  historia: "Historia",
  terror: "Terror",
  musica: "Música",
  misterio: "Misterio",
  romance: "Romance",
  "ciencia-ficcion": "Ciencia ficción",
  suspense: "Suspense",
  belica: "Bélica",
  western: "Western",
};

export const ALL_GENRE_SLUGS = Object.keys(GENRE_SLUG_MAP);

export function getGenreNameFromSlug(slug: string): string | null {
  return GENRE_SLUG_MAP[slug.toLowerCase()] || null;
}

export function getGenreSlugFromName(name: string): string {
  const entry = Object.entries(GENRE_SLUG_MAP).find(
    ([, val]) => val.toLowerCase() === name.toLowerCase()
  );
  if (entry) return entry[0];

  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
