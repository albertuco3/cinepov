import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getOrCreateMovie } from "@/lib/movies";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import MovieRatingSection from "@/components/MovieRatingSection";
import MovieDemographics from "@/components/MovieDemographics";
import { getSimilarMovies } from "@/lib/tmdb";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const tmdbId = parseInt(id, 10);

  if (isNaN(tmdbId)) {
    return notFound();
  }

  // 1. Obtener o crear la película en caché local
  const movie = await getOrCreateMovie(tmdbId);

  if (!movie) {
    return notFound();
  }

  // 2. Calcular la nota media y votos en CinePOV
  const ratings = await db.rating.findMany({
    where: { movieId: movie.id },
  });

  const ratingCount = ratings.length;
  const avgRating = ratingCount > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratingCount).toFixed(1)
    : null;

  // 3. Buscar la valoración previa del usuario logueado
  const session = await getServerSession(authOptions);
  const userRating = session?.user?.id
    ? await db.rating.findUnique({
        where: {
          userId_movieId: {
            userId: session.user.id,
            movieId: movie.id,
          },
        },
      })
    : null;

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

      if (age >= 18 && age <= 24) { ageRange = "18_24"; ageLabel = "18-24 años"; }
      else if (age >= 25 && age <= 34) { ageRange = "25_34"; ageLabel = "25-34 años"; }
      else if (age >= 35 && age <= 44) { ageRange = "35_44"; ageLabel = "35-44 años"; }
      else if (age >= 45 && age <= 54) { ageRange = "45_54"; ageLabel = "45-54 años"; }
      else if (age >= 55) { ageRange = "55_plus"; ageLabel = "55+ años"; }

      const genderLabels: Record<string, string> = {
        male: "Hombres",
        female: "Mujeres",
        non_binary: "No Binarios",
        prefer_not_to_say: "Otros",
      };

      const genderLabel = genderLabels[gender] || "Usuarios";
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
          user: {
            gender,
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

  // 5. Obtener películas similares de la API de TMDB (Fase 2.4.2)
  const similarMovies = await getSimilarMovies(movie.tmdbId);

  // Formatear duración a formato legible (ej. 148 min -> 2h 28m)
  const formatRuntime = (minutes: number) => {
    if (!minutes) return "Duración desconocida";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="relative min-h-screen pb-16">
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
        {/* Breadcrumbs de navegación (Fase 2.4.2) */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
          <Link href="/" className="hover:text-white transition-colors cursor-pointer">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-white transition-colors cursor-pointer">
            Catálogo
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

            {/* Géneros */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {movie.genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/rankings?genreId=${genre.id}`}
                  className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-semibold text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20 interactive-transition cursor-pointer"
                >
                  {genre.name}
                </Link>
              ))}
            </div>

            {/* Sección de calificaciones y votación reactiva */}
            <MovieRatingSection
              movieId={movie.id}
              initialAvgRating={avgRating}
              initialRatingCount={ratingCount}
              tmdbRating={movie.tmdbRating}
              userScore={userRating ? userRating.score : null}
            />

            {/* Indicador de compatibilidad demográfica (Fase 2.4.2) */}
            {session?.user && (
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Afinidad con tu Segmento
                  </span>
                  {compatibilityScore !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary-light border border-primary/20 text-[9px] font-black uppercase tracking-wider">
                      ¡Alta Afinidad!
                    </span>
                  )}
                </div>
                {compatibilityScore !== null ? (
                  <p className="text-xs sm:text-sm text-white/95 leading-normal font-semibold">
                    Según personas como tú (<span className="text-primary-light font-black">{userSegmentLabel}</span>), esta película es un{" "}
                    <span className="text-white font-black text-sm bg-black/40 border border-white/5 px-2 py-0.5 rounded-lg inline-block mx-1">
                      {compatibilityScore} / 10 ⭐
                    </span>{" "}
                    ({compatibilityCount} {compatibilityCount === 1 ? "voto" : "votos"})
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    Aún no hay suficientes votos de tu segmento (<span className="text-white font-medium">{userSegmentLabel}</span>) para calcular la afinidad (mínimo 3 valoraciones).
                  </p>
                )}
              </div>
            )}

            {/* Sinopsis */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-wide">Sinopsis</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {movie.synopsis}
              </p>
            </div>

            {/* Ficha Técnica Básica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5 text-sm">
              <div>
                <span className="text-muted-foreground font-medium block">Dirección</span>
                <span className="text-white font-semibold">{movie.director}</span>
              </div>
              {movie.cast && (
                <div>
                  <span className="text-muted-foreground font-medium block">Reparto principal</span>
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
            Estadísticas y Desglose Demográfico
          </h2>
          <MovieDemographics
            movieId={movie.id}
            userGender={session?.user?.gender || null}
            userBirthYear={session?.user?.birthYear || null}
          />
        </div>

        {/* 4. Sección de Películas Similares (Fase 2.4.2) */}
        {similarMovies.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/5 space-y-6">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Películas Similares
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
