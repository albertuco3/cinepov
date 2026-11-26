import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { ALL_GENRE_SLUGS } from "@/lib/genres";
import { ALL_SEGMENT_SLUGS } from "@/lib/segments";
import { ALL_DECADE_SLUGS } from "@/lib/decades";
import { ALL_BLOG_SLUGS } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site";
import { localesForPath, localizePath } from "@/lib/i18n/paths";

type SitemapEntry = MetadataRoute.Sitemap[number];

/**
 * Una entrada por idioma en el que existe la página, cada una con sus
 * alternativas `hreflang`. Las rutas se escriben sin prefijo.
 */
function localized(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.flatMap((entry: SitemapEntry) => {
    const path = entry.url;
    const locales = localesForPath(path);
    const languages = Object.fromEntries(locales.map((l) => [l, `${SITE_URL}${localizePath(path, l)}`]));
    return locales.map((l) => ({
      ...entry,
      url: languages[l],
      ...(locales.length > 1 ? { alternates: { languages } } : {}),
    }));
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // 1. Rutas públicas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: "/",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `/tonight`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `/polarizing`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `/metodologia`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `/privacidad`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `/terminos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `/aviso-legal`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Rutas dinámicas de géneros cinematográficos (SEO Programático)
  const genreRoutes: MetadataRoute.Sitemap = ALL_GENRE_SLUGS.map((slug) => ({
    url: `/genre/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 3. Rutas dinámicas de segmentos demográficos (SEO Programático)
  const segmentRoutes: MetadataRoute.Sitemap = ALL_SEGMENT_SLUGS.map((slug) => ({
    url: `/segment/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // 4. Rutas dinámicas de décadas cinematográficas (SEO Programático)
  const decadeRoutes: MetadataRoute.Sitemap = ALL_DECADE_SLUGS.map((slug) => ({
    url: `/decade/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // 5. Rutas dinámicas de artículos del blog de datos
  const blogRoutes: MetadataRoute.Sitemap = ALL_BLOG_SLUGS.map((slug) => ({
    url: `/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // 6. Rutas dinámicas de películas cacheadas en base de datos
  const movies = await db.movie.findMany({
    select: {
      tmdbId: true,
      cachedAt: true,
    },
    take: 5000,
    orderBy: { cachedAt: "desc" },
  });

  const movieRoutes: MetadataRoute.Sitemap = movies.flatMap((m) => [
    {
      url: `/movie/${m.tmdbId}`,
      lastModified: m.cachedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `/vs/${m.tmdbId}`,
      lastModified: m.cachedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ]);

  return localized([
    ...staticRoutes,
    ...genreRoutes,
    ...segmentRoutes,
    ...decadeRoutes,
    ...blogRoutes,
    ...movieRoutes,
  ]);
}
