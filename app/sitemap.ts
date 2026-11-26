import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { ALL_GENRE_SLUGS } from "@/lib/genres";
import { ALL_SEGMENT_SLUGS } from "@/lib/segments";
import { ALL_DECADE_SLUGS } from "@/lib/decades";
import { ALL_BLOG_SLUGS } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // 1. Rutas públicas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tonight`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/polarizing`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/metodologia`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/aviso-legal`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Rutas dinámicas de géneros cinematográficos (SEO Programático)
  const genreRoutes: MetadataRoute.Sitemap = ALL_GENRE_SLUGS.map((slug) => ({
    url: `${baseUrl}/genre/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 3. Rutas dinámicas de segmentos demográficos (SEO Programático)
  const segmentRoutes: MetadataRoute.Sitemap = ALL_SEGMENT_SLUGS.map((slug) => ({
    url: `${baseUrl}/segment/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // 4. Rutas dinámicas de décadas cinematográficas (SEO Programático)
  const decadeRoutes: MetadataRoute.Sitemap = ALL_DECADE_SLUGS.map((slug) => ({
    url: `${baseUrl}/decade/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // 5. Rutas dinámicas de artículos del blog de datos
  const blogRoutes: MetadataRoute.Sitemap = ALL_BLOG_SLUGS.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
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
      url: `${baseUrl}/movie/${m.tmdbId}`,
      lastModified: m.cachedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vs/${m.tmdbId}`,
      lastModified: m.cachedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ]);

  return [
    ...staticRoutes,
    ...genreRoutes,
    ...segmentRoutes,
    ...decadeRoutes,
    ...blogRoutes,
    ...movieRoutes,
  ];
}
