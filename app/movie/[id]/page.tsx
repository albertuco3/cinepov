import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getMovieLocalized } from "@/lib/movies";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import MovieRatingSection from "@/components/MovieRatingSection";
import MovieDemographics from "@/components/MovieDemographics";
import MovieReviewsSection from "@/components/MovieReviewsSection";
import WatchlistButton from "@/components/WatchlistButton";
import MovieEmbedModal from "@/components/MovieEmbedModal";
import AddToListButton from "@/components/AddToListButton";
import { getSimilarMovies } from "@/lib/tmdb";
import { parseMovieParam, buildCanonicalMoviePath } from "@/lib/slug";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, Locale } from "@/lib/i18n/types";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const { tmdbId } = parseMovieParam(id);
  if (!tmdbId) {
    return { title: "Pelicula no encontrada | CinePOV" };
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale) || DEFAULT_LOCALE;
  const movie = await getMovieLocalized(tmdbId, locale);
  if (!movie) {
    return { title: locale === "en" ? "Movie not found | CinePOV" : "Pelicula no encontrada | CinePOV" };
  }

  const title = locale === "en"
    ? `${movie.title} (${movie.year}) | Ratings by Age & Gender - CinePOV`
    : `${movie.title} (${movie.year}) | Notas por Edad y Género - CinePOV`;
  const description = locale === "en"
    ? `Discover how ${movie.title} is rated by men and women across different generations on CinePOV. Verified demographic breakdown and cohort comparisons.`
    : `Descubre cómo valoran ${movie.title} mujeres y hombres de distintas generaciones en CinePOV. Desglose demográfico verificado y comparativa por segmento.`;
  const baseUrl = process.env.NEXTAUTH_URL || "https://cinepov.com";
  const canonicalUrl = `${baseUrl}${buildCanonicalMoviePath(movie.tmdbId, movie.title)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "video.movie",
      siteName: "CinePOV",
      locale: locale === "en" ? "en_US" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const { tmdbId } = parseMovieParam(id);

  if (!tmdbId) {
    return notFound();
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale) || DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  // 1. Obtener la película localizada (español o inglés)
  const movie = await getMovieLocalized(tmdbId, locale);

  if (!movie) {
    return notFound();
  }

  // 2. Calcular la nota media y votos en CinePOV.
  // Las valoraciones reales y las estimaciones de arranque se agregan por
  // separado: la "nota CinePOV" solo puede reflejar votos de personas.
  const [realAgg, estimatedAgg] = await Promise.all([
    db.rating.aggregate({
      where: {
        movieId: movie.id,
        isArtificial: false,
        user: { emailVerified: { not: null } },
      },
      _avg: { score: true },
      _count: { score: true },
    }),
    db.rating.aggregate({
      where: { movieId: movie.id, isArtificial: true },
      _avg: { score: true },
      _count: { score: true },
    }),
  ]);

  const ratingCount = realAgg._count.score;
  const avgRating = realAgg._avg.score !== null ? realAgg._avg.score.toFixed(1) : null;
  const estimatedCount = estimatedAgg._count.score;
  const estimatedAvg = estimatedAgg._avg.score !== null ? estimatedAgg._avg.score.toFixed(1) : null;

  // 3. Buscar la valoración previa del usuario logueado y estado de watchlist
  const session = await getServerSession(authOptions);
  const [userRating, inWatchlist] = await Promise.all([
    session?.user?.id
      ? db.rating.findUnique({
          where: {
            userId_movieId: {
              userId: session.user.id,
              movieId: movie.id,
            },
          },
        })
      : null,
    session?.user?.id
      ? db.watchlist
          .findUnique({
            where: {
              userId_movieId: {
                userId: session.user.id,
                movieId: movie.id,
              },
            },
          })
          .then((res) => !!res)
      : false,
  ]);

  // 4. Calcular compatibilidad con el segmento del usuario (Fase 2.4.2)
  let compatibilityScore: number | null = null;
  let compatibilityCount = 0;
  let userSegmentLabel = "";

  if (session?.user) {
    const gender = session.user.gender;
    const birthYear = session.user.birthYear;

    if (gender && birthYear) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      let ageRange = "all";
      let ageLabel = "";

      const yearsSuffix = locale === "en" ? "years old" : "años";
      if (age >= 18 && age <= 24) { ageRange = "18_24"; ageLabel = `18-24 ${yearsSuffix}`; }
      else if (age >= 25 && age <= 34) { ageRange = "25_34"; ageLabel = `25-34 ${yearsSuffix}`; }
      else if (age >= 35 && age <= 44) { ageRange = "35_44"; ageLabel = `35-44 ${yearsSuffix}`; }
      else if (age >= 45 && age <= 54) { ageRange = "45_54"; ageLabel = `45-54 ${yearsSuffix}`; }
      else if (age >= 55) { ageRange = "55_plus"; ageLabel = `55+ ${yearsSuffix}`; }

      const genderLabels: Record<string, string> = {
        male: locale === "en" ? "Men" : "Hombres",
        female: locale === "en" ? "Women" : "Mujeres",
        non_binary: locale === "en" ? "Non-Binary" : "No Binarios",
        prefer_not_to_say: locale === "en" ? "Others" : "Otros",
      };

      const genderLabel = genderLabels[gender] || (locale === "en" ? "Users" : "Usuarios");
      userSegmentLabel = `${genderLabel} ${ageLabel}`;

      // Configurar el filtro de edad de nacimiento
      const ageFilter: any = {};
      if (ageRange === "18_24") ageFilter.birthYear = { gte: currentYear - 24, lte: currentYear - 18 };
      else if (ageRange === "25_34") ageFilter.birthYear = { gte: currentYear - 34, lte: currentYear - 25 };
      else if (ageRange === "35_44") ageFilter.birthYear = { gte: currentYear - 44, lte: currentYear - 35 };
      else if (ageRange === "45_54") ageFilter.birthYear = { gte: currentYear - 54, lte: currentYear - 45 };
      else if (ageRange === "55_plus") ageFilter.birthYear = { lte: currentYear - 55 };

      const segmentRatings = await db.rating.findMany({
        where: {
          movieId: movie.id,
          isArtificial: false,
          user: {
            gender,
            emailVerified: { not: null },
            ...ageFilter,
          },
        },
        select: {
          score: true,
        },
      });

      compatibilityCount = segmentRatings.length;
      if (compatibilityCount >= 3) {
        const sum = segmentRatings.reduce((s, r) => s + r.score, 0);
        compatibilityScore = parseFloat((sum / compatibilityCount).toFixed(1));
      }
    }
  }

  // 5. Obtener películas similares de la API de TMDB en el idioma actual
  const similarMovies = await getSimilarMovies(movie.tmdbId, locale === "en" ? "en-US" : "es-ES");

  // Formatear duración a formato legible (ej. 148 min -> 2h 28m)
  const formatRuntime = (minutes: number) => {
    if (!minutes) return locale === "en" ? "Unknown runtime" : "Duración desconocida";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    dateCreated: `${movie.year}`,
    image: movie.posterUrl,
    description: movie.synopsis || undefined,
    director: movie.director ? { "@type": "Person", name: movie.director } : undefined,
    ...(ratingCount > 0 && avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            bestRating: "10",
            worstRating: "1",
            ratingCount: ratingCount,
          },
        }
      : {}),
  };

  return (
    <div className="relative min-h-screen pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Backdrop Hero Background */}
      {movie.backdropUrl && (
        <div className="absolute top-0 left-0 w-full h-[60vh] -z-10 overflow-hidden">
          <Image
            src={movie.backdropUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover opacity-15 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 md:pt-10">
        {/* Breadcrumbs de navegación */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
          <Link href="/" className="hover:text-white transition-colors cursor-pointer">
            {dict.nav.home}
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-white transition-colors cursor-pointer">
            {dict.movie.catalog}
          </Link>
          {movie.genres.length > 0 && (
            <>
              <span>/</span>
              <Link
                href={`/rankings?genreId=${movie.genres[0].id}`}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {movie.genres[0].name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-white truncate max-w-[200px]">{movie.title}</span>
        </nav>

        {/* 2. Grid Principal Ficha */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-12 items-start">
          {/* Columna Izquierda: Póster */}
          <div className="mx-auto md:mx-0 w-full max-w-[280px] aspect-[2/3] relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5">
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="(max-w-[280px]) 100vw, 280px"
              priority
              className="object-cover"
            />
          </div>

          {/* Columna Derecha: Información */}
          <div className="space-y-6">
            {/* Título, Año y Título Original */}
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-gradient tracking-tight">
                {movie.title}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {movie.originalTitle !== movie.title && `${movie.originalTitle} • `}
                {movie.year} • {formatRuntime(movie.runtime)}
              </p>
            </div>

            {/* Géneros y enlace a Batalla */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              {movie.genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/rankings?genreId=${genre.id}`}
                  className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-semibold text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20 interactive-transition cursor-pointer"
                >
                  {genre.name}
                </Link>
              ))}
              <Link
                href={`/vs/${movie.tmdbId}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary-light hover:text-white hover:bg-primary transition-all ml-1"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {dict.movie.demographicBattle}
              </Link>
              <WatchlistButton
                movieId={movie.id}
                initialInWatchlist={inWatchlist}
                isLoggedIn={!!session?.user}
              />
              <MovieEmbedModal
                tmdbId={movie.tmdbId}
                movieTitle={movie.title}
              />
              <AddToListButton
                movieId={movie.id}
                movieTitle={movie.title}
                isLoggedIn={!!session?.user}
              />
            </div>

            {/* Sección de calificaciones y votación reactiva */}
            <MovieRatingSection
              movieId={movie.id}
              initialAvgRating={avgRating}
              initialRatingCount={ratingCount}
              initialEstimatedAvg={estimatedAvg}
              initialEstimatedCount={estimatedCount}
              tmdbRating={movie.tmdbRating}
              userScore={userRating ? userRating.score : null}
              initialWatchedAt={userRating?.watchedAt ? userRating.watchedAt.toISOString() : null}
            />

            {/* Indicador de compatibilidad demográfica (Fase 2.4.2) */}
            {session?.user && (
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    {dict.movie.affinityWithYourCohort}
                  </span>
                  {compatibilityScore !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary-light border border-primary/20 text-[9px] font-black uppercase tracking-wider">
                      {dict.movie.highAffinity}
                    </span>
                  )}
                </div>
                {compatibilityScore !== null ? (
                  <p className="text-xs sm:text-sm text-white/95 leading-normal font-semibold">
                    {dict.movie.affinityAccordingTo} (<span className="text-primary-light font-black">{userSegmentLabel}</span>), {locale === "en" ? "this movie is rated" : "esta película es un"}{" "}
                    <span className="text-white font-black text-sm bg-black/40 border border-white/5 px-2 py-0.5 rounded-lg inline-block mx-1">
                      {compatibilityScore} / 10
                    </span>{" "}
                    ({compatibilityCount} {compatibilityCount === 1 ? (locale === "en" ? "vote" : "voto") : (locale === "en" ? "votes" : "votos")})
                  </p>
                ) : compatibilityCount === 0 ? (
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    {locale === "en" ? (
                      <>
                        No one from your cohort (<span className="text-white font-medium">{userSegmentLabel}</span>) has rated this movie yet.{" "}
                        <span className="text-primary-light font-bold">Your vote will create this insight from scratch.</span>
                      </>
                    ) : (
                      <>
                        Nadie de tu segmento (<span className="text-white font-medium">{userSegmentLabel}</span>) ha valorado todavía esta película.{" "}
                        <span className="text-primary-light font-bold">Tu voto crearía este dato desde cero.</span>
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    {locale === "en" ? (
                      <>
                        <span className="text-white font-black">{3 - compatibilityCount}</span>{" "}
                        {3 - compatibilityCount === 1 ? "more rating" : "more ratings"} from your cohort (
                        <span className="text-white font-medium">{userSegmentLabel}</span>) {dict.movie.votesMissingForAffinity}
                      </>
                    ) : (
                      <>
                        Faltan <span className="text-white font-black">{3 - compatibilityCount}</span>{" "}
                        {3 - compatibilityCount === 1 ? "valoración" : "valoraciones"} de tu segmento (
                        <span className="text-white font-medium">{userSegmentLabel}</span>) {dict.movie.votesMissingForAffinity}
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Sinopsis */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-wide">{dict.movie.synopsis}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {movie.synopsis}
              </p>
            </div>

            {/* Ficha Técnica Básica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5 text-sm">
              <div>
                <span className="text-muted-foreground font-medium block">{dict.movie.director}</span>
                <span className="text-white font-semibold">{movie.director}</span>
              </div>
              {movie.cast && (
                <div>
                  <span className="text-muted-foreground font-medium block">{dict.movie.cast}</span>
                  <span className="text-white font-medium block leading-normal">
                    {movie.cast}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Bloque del Filtro Demográfico interactivo real */}
        <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {dict.movie.statsAndBreakdown}
          </h2>
          <MovieDemographics
            movieId={movie.id}
            userGender={session?.user?.gender || null}
            userBirthYear={session?.user?.birthYear || null}
          />
        </div>

        {/* 4. Sección de Reseñas de la Comunidad con filtro demográfico (Fase 5.1) */}
        <MovieReviewsSection
          movieId={movie.id}
          hasUserSegment={Boolean(session?.user?.gender || session?.user?.birthYear)}
        />

        {/* 5. Sección de Películas Similares (Fase 2.4.2) */}
        {similarMovies.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/5 space-y-6">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {dict.movie.similarMovies}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {similarMovies.map((similar) => (
                <Link
                  key={similar.tmdbId}
                  href={`/movie/${similar.tmdbId}`}
                  className="glass-panel p-3 rounded-2xl border border-white/5 hover:border-white/10 hover:scale-[1.03] transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white/5 border border-white/5 shadow-md flex-shrink-0">
                      <Image
                        src={similar.posterUrl}
                        alt={similar.title}
                        fill
                        sizes="(max-w-[120px]) 100vw, 120px"
                        className="object-cover group-hover:scale-105 interactive-transition"
                        unoptimized
                      />
                    </div>
                    <h3 className="text-xs font-black text-white leading-snug group-hover:text-primary transition-colors truncate">
                      {similar.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold block pt-1">
                    {similar.year}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
