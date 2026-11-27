import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { cache } from "react";
import {
  getSegmentConfig,
  ALL_SEGMENT_SLUGS,
  DEMOGRAPHIC_SEGMENTS,
} from "@/lib/segments";
import { getSegmentRanking } from "@/lib/segment-ranking";
import { buildCanonicalMoviePath } from "@/lib/slug";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Compartido por los metadatos y la página: una sola consulta por petición. */
const loadRanking = cache(async (slug: string) => {
  const config = getSegmentConfig(slug);
  return config ? getSegmentRanking(config) : [];
});

export async function generateStaticParams() {
  return ALL_SEGMENT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getSegmentConfig(slug);

  if (!config) {
    return { title: "Segmento no encontrado | CinePOV" };
  }

  const title = `${config.headline} | CinePOV`;
  const description = config.description;

  // Sin votos suficientes la página está vacía: que no se indexe hasta tener datos.
  const hasData = (await loadRanking(slug)).length > 0;

  return {
    title,
    description,
    ...(hasData ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function SegmentPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getSegmentConfig(slug);

  if (!config) {
    notFound();
  }

  const rankedMovies = await loadRanking(slug);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* 1. Cabecera del segmento */}
      <div className="space-y-3 text-center sm:text-left border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          Segmento Demográfico
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          {config.headline}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {config.description}
        </p>
      </div>

      {/* 2. Grid de películas */}
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
                      {movie.year} · {movie.genres.slice(0, 2).join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Nota de este Grupo
                      </span>
                      <span className="text-xl font-black text-primary">
                        {movie.segmentAvg}/10
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Votos del Segmento
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {movie.segmentCount} {movie.segmentCount === 1 ? "voto" : "votos"}
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
            Aún no hay suficientes votos verificados para este segmento. ¡Valora películas en la plataforma para formar parte del ranking!
          </p>
          <Link
            href="/explore"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all"
          >
            Explorar Catálogo
          </Link>
        </div>
      )}

      {/* 3. Enlazado cruzado a otros segmentos (SEO Interlinking) */}
      <div className="pt-10 border-t border-white/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Otros Grupos Demograficos
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DEMOGRAPHIC_SEGMENTS).map(([s, cfg]) => (
            <Link
              key={s}
              href={`/segment/${s}`}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border ${
                s === slug
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
