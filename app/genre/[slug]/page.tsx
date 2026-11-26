import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { db } from "@/lib/db";
import { countedRatingWhere } from "@/lib/rating-filters";
import {
  getGenreNameFromSlug,
  ALL_GENRE_SLUGS,
  GENRE_SLUG_MAP,
} from "@/lib/genres";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_GENRE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const genreName = getGenreNameFromSlug(slug);

  if (!genreName) {
    return { title: "Género no encontrado | CinePOV" };
  }

  return {
    title: `Las Mejores Películas de ${genreName} | CinePOV`,
    description: `Descubre las mejores películas de ${genreName.toLowerCase()} según diferentes grupos demográficos. Rankings de hombres, mujeres y diferentes generaciones.`,
    openGraph: {
      title: `Películas de ${genreName} - CinePOV`,
      description: `El ranking demográfico de ${genreName.toLowerCase()}.`,
      type: "website",
    },
  };
}

export default async function GenrePage({ params }: PageProps) {
  const { slug } = await params;
  const genreName = getGenreNameFromSlug(slug);

  if (!genreName) {
    notFound();
  }

  // 1. Buscar películas del género en la base de datos
  const genre = await db.genre.findUnique({
    where: { name: genreName },
    include: {
      movies: {
        take: 30,
        orderBy: { cachedAt: "desc" },
        include: {
          ratings: {
            where: countedRatingWhere(),
            select: { score: true },
          },
        },
      },
    },
  });

  const movies = (genre?.movies || []).map((m) => {
    const realCount = m.ratings.length;
    const realAvg =
      realCount > 0
        ? parseFloat((m.ratings.reduce((sum, r) => sum + r.score, 0) / realCount).toFixed(1))
        : null;

    return {
      id: m.id,
      tmdbId: m.tmdbId,
      title: m.title,
      year: m.year,
      posterUrl: m.posterUrl,
      director: m.director,
      tmdbRating: m.tmdbRating,
      realAvg,
      realCount,
    };
  });

  // Ordenar preferentemente por nota real de la comunidad si hay votos, o por tmdbRating
  movies.sort((a, b) => {
    if (a.realAvg !== null && b.realAvg !== null) return b.realAvg - a.realAvg;
    if (a.realAvg !== null) return -1;
    if (b.realAvg !== null) return 1;
    return (b.tmdbRating || 0) - (a.tmdbRating || 0);
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* 1. Cabecera de la categoría */}
      <div className="space-y-3 text-center sm:text-left border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          Género Cinematográfico
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Mejores Películas de {genreName}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Explora los títulos más destacados de {genreName.toLowerCase()}. Descubre cómo cambia la recepción de cada película según la edad y el género del espectador.
        </p>
      </div>

      {/* 2. Grid de películas */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className="glass-panel p-4 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white font-black text-xs">
                    #{index + 1}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-white truncate">
                    <Link
                      href={`/movie/${movie.tmdbId}`}
                      className="hover:text-primary transition-colors"
                    >
                      {movie.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {movie.year} · Dir. {movie.director}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Nota CinePOV
                    </span>
                    <span className="text-lg font-black text-primary">
                      {movie.realAvg ? `${movie.realAvg}/10` : "Pendiente"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Votos Reales
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {movie.realCount} votos
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Link
                  href={`/movie/${movie.tmdbId}`}
                  className="flex-1 text-center py-2 px-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all"
                >
                  Ficha
                </Link>
                <Link
                  href={`/vs/${movie.tmdbId}`}
                  className="py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-black uppercase tracking-wider border border-white/10 transition-all"
                >
                  Batalla
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/5">
          <p className="text-sm text-muted-foreground">
            Aún no hay títulos registrados en este género. Explora el buscador global para añadir películas de {genreName}.
          </p>
          <Link
            href="/explore"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all"
          >
            Buscar Películas
          </Link>
        </div>
      )}

      {/* 3. Enlazado interno de géneros (SEO Interlinking) */}
      <div className="pt-10 border-t border-white/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Otros Generos Cinematograficos
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GENRE_SLUG_MAP).map(([s, name]) => (
            <Link
              key={s}
              href={`/genre/${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                s === slug
                  ? "bg-primary border-primary text-white"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
              }`}
            >
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
