"use client";

import { useJson } from "@/lib/hooks/use-json";
import Link from "@/components/LocaleLink";
import Image from "next/image";
import { useSession } from "next-auth/react";
import WatchlistButton from "@/components/WatchlistButton";
import { useI18n } from "@/lib/i18n/client";

interface RecommendedMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string;
  year: number;
  genres: string[];
  cohortRating: number;
  cohortVotes: number;
  affinityScore: number | null;
  source: "taste" | "segment" | "tmdb";
  inWatchlist: boolean;
  taglineReason: string;
}

interface RecommendationsData {
  cohortName: string;
  gender: string;
  ageRange: string;
  userRatingsCount: number;
  averageAffinity: number | null;
  tasteNeighbors: number;
  recommendations: RecommendedMovie[];
}

export default function RecommendationsPage() {
  const { dict } = useI18n();
  const t = dict.recommendations;
  const { status } = useSession();
  const { data, loading, error } = useJson<RecommendationsData>(
    status === "authenticated" ? "/api/recommendations?limit=18" : null
  );

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-80 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-96 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
              <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t.unauthenticatedTitle}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            {t.unauthenticatedDesc}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm interactive-transition"
            >
              {t.loginCta}
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm interactive-transition"
            >
              {t.registerCta}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">{t.errorTitle}</h2>
        <p className="text-sm text-muted-foreground">{error || t.errorFallback}</p>
        <Link href="/" className="inline-block px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold">
          {t.backToHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Cabecera y Colectivo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
            <span>{t.yourCohort} {data.cohortName}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        {/* Indicador global de afinidad */}
        <div className="glass-panel px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {data.tasteNeighbors > 0 ? t.tasteNeighborsLabel : t.cohortAffinity}
            </span>
            <span className="text-2xl font-black text-white">
              {data.tasteNeighbors > 0
                ? data.tasteNeighbors
                : data.averageAffinity !== null
                  ? `${data.averageAffinity}%`
                  : "—"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            POV
          </div>
        </div>
      </div>

      {/* Grid de Películas Recomendadas */}
      {data.recommendations.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
          <h3 className="text-lg font-bold text-white">{t.noRecommendationsTitle}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t.noRecommendationsDesc}
          </p>
          <Link href="/explore" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold">
            {t.exploreAll}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {data.recommendations.map((movie) => (
            <div
              key={movie.id}
              className="group flex flex-col glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/10"
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] w-full bg-white/5 overflow-hidden">
                <Link href={`/movie/${movie.tmdbId}`}>
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs text-muted-foreground">
                      {t.noPoster}
                    </div>
                  )}
                </Link>

                {/* Badge de afinidad en esquina superior */}
                {movie.affinityScore !== null && (
                  <div className="absolute top-2 left-2 bg-[#0a0a0f]/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-white">
                    {movie.affinityScore}% {t.affinityBadge}
                  </div>
                )}

                {/* Botón rápido de Watchlist en esquina superior derecha */}
                <div className="absolute top-2 right-2">
                  <WatchlistButton
                    movieId={movie.id}
                    initialInWatchlist={movie.inWatchlist}
                    isLoggedIn={true}
                  />
                </div>

                {/* Calificación de cohorte en esquina inferior */}
                <div
                  className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-xs font-black shadow-md ${
                    movie.source === "tmdb" ? "bg-cyan-600/90 text-white" : "bg-primary/95 text-white"
                  }`}
                >
                  {movie.source === "tmdb" && <span className="mr-1 text-[9px] font-bold opacity-80">TMDB</span>}
                  {movie.source === "taste" && <span className="mr-1 text-[9px] font-bold opacity-80">{t.yourScoreBadge}</span>}
                  {movie.cohortRating.toFixed(1)}
                </div>
              </div>

              {/* Información de la película */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <Link href={`/movie/${movie.tmdbId}`}>
                    <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 hover:text-primary transition-colors">
                      {movie.title}
                    </h3>
                  </Link>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {movie.year}
                    {movie.genres.length > 0 ? ` · ${movie.genres[0]}` : ""}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-primary/90 font-medium line-clamp-1">
                    {movie.taglineReason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
