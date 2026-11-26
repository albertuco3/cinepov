import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { getOrCreateMovie } from "@/lib/movies";
import { getMovieDemographics } from "@/lib/movie-demographics";
import { parseMovieParam } from "@/lib/slug";
import { getTopDemographicContrast } from "@/lib/viral";
import BattleShareBar from "@/components/BattleShareBar";

interface BattlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BattlePageProps): Promise<Metadata> {
  const { id } = await params;
  const { tmdbId } = parseMovieParam(id);
  if (!tmdbId) {
    return { title: "Batalla no encontrada | CinePOV" };
  }

  const movie = await getOrCreateMovie(tmdbId);
  if (!movie) {
    return { title: "Batalla no encontrada | CinePOV" };
  }

  const title = `Batalla Demográfica: ${movie.title} (${movie.year}) - CinePOV`;
  const description = `Mira cómo se divide la audiencia en ${movie.title}. Comparativa directa entre géneros y generaciones basada en votos verificados.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: `/movie/${tmdbId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Batalla demográfica de ${movie.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/movie/${tmdbId}/opengraph-image`],
    },
  };
}

export default async function BattlePage({ params }: BattlePageProps) {
  const { id } = await params;
  const { tmdbId } = parseMovieParam(id);

  if (!tmdbId) {
    return notFound();
  }

  const movie = await getOrCreateMovie(tmdbId);
  if (!movie) {
    return notFound();
  }

  const payload = await getMovieDemographics(movie.id);
  const contrast = getTopDemographicContrast(payload);

  const globalAvg = payload.real.global.avg !== null ? payload.real.global.avg.toFixed(1) : null;

  const contrastSummaryText = contrast
    ? `${contrast.labelA}: ${contrast.scoreA}/10 frente a ${contrast.labelB}: ${contrast.scoreB}/10 (Brecha de ${contrast.difference} puntos)`
    : null;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Link href="/" className="hover:text-white transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <Link href={`/movie/${movie.tmdbId}`} className="hover:text-white transition-colors">
          {movie.title}
        </Link>
        <span>/</span>
        <span className="text-white">Batalla Demográfica</span>
      </nav>

      {/* 2. Tarjeta Principal de la Batalla */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 relative overflow-hidden space-y-8 shadow-2xl">
        {/* Cabecera con cartel y título */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left border-b border-white/5 pb-6">
          <div className="relative h-32 w-22 rounded-2xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 shadow-lg">
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="88px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
              Batalla Demográfica Oficial
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {movie.title} ({movie.year})
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {globalAvg
                ? `Nota media global en CinePOV: ${globalAvg}/10 basada en ${payload.counts.real} votos verificados.`
                : "Acumulando votos verificados en la comunidad."}
            </p>
          </div>
        </div>

        {/* Bloque Central de Confrontación */}
        {contrast ? (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-primary-light uppercase tracking-widest block">
                {contrast.title}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Una discrepancia de {contrast.difference} puntos
              </h2>
              <p className="text-xs text-muted-foreground">
                {contrast.leadLabel} valoran esta película notablemente por encima del otro grupo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
              {/* Lado A */}
              <div className="glass-panel p-6 rounded-3xl border border-pink-500/20 bg-pink-500/5 text-center space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-pink-400 block">
                  {contrast.labelA}
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl sm:text-6xl font-black text-white">
                    {contrast.scoreA}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">/10</span>
                </div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {contrast.countA} valoraciones contrastadas
                </span>
              </div>

              {/* Distintivo VS */}
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[#0d101d] border border-white/20 flex items-center justify-center text-xs font-black text-white/80 shadow-lg">
                  VS
                </div>
              </div>

              {/* Lado B */}
              <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 text-center space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400 block">
                  {contrast.labelB}
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl sm:text-6xl font-black text-white">
                    {contrast.scoreB}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">/10</span>
                </div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {contrast.countB} valoraciones contrastadas
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 space-y-3 bg-white/2 rounded-3xl border border-white/5 p-6">
            <h2 className="text-lg font-bold text-white">
              Recopilando datos demográficos
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Esta película aún no ha alcanzado los umbrales de valoraciones verificadas para mostrar una batalla concluyente. ¡Sé el primero de tu grupo en valorarla!
            </p>
          </div>
        )}

        {/* 3. Barra de Compartición */}
        <div className="border-t border-white/5 pt-6 space-y-3 text-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Comparte esta batalla en tus redes
          </span>
          <BattleShareBar
            movieId={movie.id}
            tmdbId={movie.tmdbId}
            movieTitle={movie.title}
            contrastText={contrastSummaryText}
          />
        </div>

        {/* 4. Llamada a la Acción contextual */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-black text-white">
              ¿Coincides con tu grupo demográfico?
            </h3>
            <p className="text-xs text-muted-foreground">
              Entra en la ficha completa para calificarla y descubrir que piensan personas con tu misma edad y género.
            </p>
          </div>
          <Link
            href={`/movie/${movie.tmdbId}`}
            className="px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 shadow-lg shadow-primary/20 cursor-pointer"
          >
            Votar en CinePOV
          </Link>
        </div>
      </div>
    </div>
  );
}
