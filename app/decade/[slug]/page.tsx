import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { getTopMovies } from "@/lib/catalog-ranking-db";
import {
  getDecadeConfig,
  ALL_DECADE_SLUGS,
  DECADES_CONFIG,
} from "@/lib/decades";
import { buildCanonicalMoviePath } from "@/lib/slug";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_DECADE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getDecadeConfig(slug);

  if (!config) {
    return { title: "Década no encontrada | CinePOV" };
  }

  return {
    title: `${config.headline} según la Audiencia | CinePOV`,
    description: config.description,
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: `${config.headline} - CinePOV`,
      description: config.description,
      type: "website",
    },
  };
}

export default async function DecadePage({ params }: PageProps) {
  const { slug } = await params;
  const config = getDecadeConfig(slug);

  if (!config) {
    notFound();
  }

  // Las mejores de la década entre todas las del catálogo (ver lib/catalog-ranking.ts).
  const rankedMovies = await getTopMovies({ year: { gte: config.startYear, lte: config.endYear } }, 60);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* 1. Cabecera de la década */}
      <div className="space-y-3 text-center sm:text-left border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          Epoca Cinematografica · {config.startYear} - {config.endYear}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          {config.headline}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {config.description}
        </p>
      </div>

      {/* 2. Grid de películas de la época */}
      {rankedMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {rankedMovies.map((movie, index) => {
            const canonicalPath = buildCanonicalMoviePath(movie.tmdbId, movie.title);

            return (
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
                        href={canonicalPath}
                        className="hover:text-primary transition-colors"
                      >
                        {movie.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {movie.year} · {movie.director}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Nota CinePOV
                      </span>
                      <span className="text-xl font-black text-primary">
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
                    href={canonicalPath}
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
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/5">
          <p className="text-sm text-muted-foreground">
            Aún no hay títulos registrados de esta década. Explora el catálogo para añadir películas de los {config.label}.
          </p>
          <Link
            href="/explore"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all"
          >
            Buscar Películas
          </Link>
        </div>
      )}

      {/* 3. Enlazado cruzado a otras décadas (SEO Interlinking) */}
      <div className="pt-10 border-t border-white/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Otras Decadas Cinematograficas
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DECADES_CONFIG).map(([d, cfg]) => (
            <Link
              key={d}
              href={`/decade/${d}`}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border ${
                d === slug
                  ? "bg-primary border-primary text-white"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
              }`}
            >
              {cfg.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
