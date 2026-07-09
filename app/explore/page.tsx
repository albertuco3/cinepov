import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getTrendingMovies } from "@/lib/tmdb";

// Forzar renderizado dinámico para que los datos locales y las tendencias de TMDB se carguen frescas
export const revalidate = 0;

interface MovieItem {
  tmdbId: number;
  title: string;
  posterUrl: string;
  year: number;
  rating: string;
  ratingSource: "CinePOV" | "TMDB";
  votesCount?: number;
}

export default async function ExplorePage() {
  // 1. Obtener tendencias semanales de TMDB
  const trendingData = await getTrendingMovies();
  const trendingMovies: MovieItem[] = trendingData.slice(0, 6).map((m) => ({
    tmdbId: m.tmdbId,
    title: m.title,
    posterUrl: m.posterUrl,
    year: m.year,
    rating: m.tmdbRating ? m.tmdbRating.toFixed(1) : "—",
    ratingSource: "TMDB",
  }));

  // 2. Obtener añadidas recientemente en la BD local (con su nota media)
  const recentlyAddedDb = await db.movie.findMany({
    take: 6,
    orderBy: { cachedAt: "desc" },
    include: { ratings: true },
  });

  const recentlyAddedMovies: MovieItem[] = recentlyAddedDb.map((m) => {
    const votes = m.ratings.length;
    const avg = votes > 0
      ? (m.ratings.reduce((sum, r) => sum + r.score, 0) / votes).toFixed(1)
      : "—";

    return {
      tmdbId: m.tmdbId,
      title: m.title,
      posterUrl: m.posterUrl,
      year: m.year,
      rating: avg,
      ratingSource: "CinePOV",
      votesCount: votes,
    };
  });

  // 3. Obtener populares en CinePOV (con más votos)
  const popularDb = await db.movie.findMany({
    take: 20, // Pool inicial para poder ordenar por número de votos reales de la BD
    include: { ratings: true },
  });

  const popularMovies: MovieItem[] = popularDb
    .sort((a, b) => b.ratings.length - a.ratings.length)
    .slice(0, 6)
    .map((m) => {
      const votes = m.ratings.length;
      const avg = votes > 0
        ? (m.ratings.reduce((sum, r) => sum + r.score, 0) / votes).toFixed(1)
        : "—";

      return {
        tmdbId: m.tmdbId,
        title: m.title,
        posterUrl: m.posterUrl,
        year: m.year,
        rating: avg,
        ratingSource: "CinePOV",
        votesCount: votes,
      };
    });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Cabecera */}
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl text-gradient">
          Explorar Catálogo
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Busca tus películas preferidas o navega entre las tendencias y el contenido valorado por la comunidad CinePOV.
        </p>
      </div>

      {/* SECCIÓN 1: Tendencias Semanales (TMDB) */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-white/5 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            🔥 Tendencias Semanales
            <span className="text-[10px] uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-semibold tracking-wider">
              TMDB
            </span>
          </h2>
          <span className="text-xs text-muted-foreground">Actualizado hoy</span>
        </div>
        
        {trendingMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {trendingMovies.map((movie) => (
              <MovieCard key={movie.tmdbId} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 text-muted-foreground text-sm">
            No se pudieron cargar las tendencias en este momento.
          </div>
        )}
      </section>

      {/* SECCIÓN 2: Populares en CinePOV */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-white/5 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            ⭐ Populares de la Comunidad
            <span className="text-[10px] uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-semibold tracking-wider">
              CinePOV
            </span>
          </h2>
          <span className="text-xs text-muted-foreground">Por volumen de votos</span>
        </div>

        {popularMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {popularMovies.map((movie) => (
              <MovieCard key={movie.tmdbId} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 text-muted-foreground text-sm">
            Aún no hay películas populares en la comunidad. ¡Sé el primero en valorar una!
          </div>
        )}
      </section>

      {/* SECCIÓN 3: Añadidas Recientemente */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-white/5 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            🆕 Añadidas Recientemente
          </h2>
          <span className="text-xs text-muted-foreground">Últimas consultadas</span>
        </div>

        {recentlyAddedMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {recentlyAddedMovies.map((movie) => (
              <MovieCard key={movie.tmdbId} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 text-muted-foreground text-sm">
            No hay películas en el historial local todavía.
          </div>
        )}
      </section>
    </div>
  );
}

// Componente local interno MovieCard para renderizado limpio de tarjetas
function MovieCard({ movie }: { movie: MovieItem }) {
  const isCinePOV = movie.ratingSource === "CinePOV";

  return (
    <Link href={`/movie/${movie.tmdbId}`} className="group block space-y-3">
      {/* Contenedor del Póster */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-white/5 group-hover:border-white/20 interactive-transition">
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-w-[200px]) 100vw, 200px"
          className="object-cover group-hover:scale-105 interactive-transition"
        />
        {/* Badge Flotante de Nota */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#0f111a]/85 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1">
          <span className="text-[10px] text-yellow-400">★</span>
          <span className="text-xs font-black text-white">{movie.rating}</span>
        </div>
      </div>

      {/* Textos Informativos */}
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-semibold text-white group-hover:text-primary truncate interactive-transition">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{movie.year || "—"}</span>
          <span className={`text-[9px] uppercase font-bold tracking-wider ${isCinePOV ? 'text-primary' : 'text-cyan-400'}`}>
            {isCinePOV ? `${movie.votesCount} votos` : "TMDB"}
          </span>
        </div>
      </div>
    </Link>
  );
}
