"use client";

import { useState, useEffect } from "react";
import RatingWidget from "./RatingWidget";
import { useI18n } from "@/lib/i18n/client";

interface MovieRatingSectionProps {
  movieId: string;
  initialAvgRating: string | null;
  initialRatingCount: number;
  tmdbRating: number | null;
  userScore: number | null;
  initialWatchedAt?: string | null;
}

export default function MovieRatingSection({
  movieId,
  initialAvgRating,
  initialRatingCount,
  tmdbRating,
  userScore,
  initialWatchedAt,
}: MovieRatingSectionProps) {
  const { dict } = useI18n();
  const [avgRating, setAvgRating] = useState<string | null>(initialAvgRating);
  const [ratingCount, setRatingCount] = useState<number>(initialRatingCount);

  // La nota solo cambia cuando alguien vota. En vez de preguntar cada pocos
  // segundos (lo que además impide que la base de datos escale a cero), se
  // refresca tras el voto propio y al volver a la pestaña.
  useEffect(() => {
    const refreshOnReturn = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/movies/${movieId}/stats`);
        if (!response.ok) return;
        const data = await response.json();
        setAvgRating(data.avgRating);
        setRatingCount(data.ratingCount);
      } catch {
        // Si falla, se conserva la última nota conocida.
      }
    };

    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => document.removeEventListener("visibilitychange", refreshOnReturn);
  }, [movieId]);

  const handleRatingUpdated = (newAvg: string | null, newCount: number) => {
    setAvgRating(newAvg);
    setRatingCount(newCount);
  };

  return (
    <div className="space-y-4">
      {/* Caja de Calificaciones Cruzadas */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto md:mx-0 bg-white/5 border border-white/5 p-4 rounded-2xl">
        {/* Nota CinePOV: solo valoraciones de personas reales */}
        <div className="text-center border-r border-white/5">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
            {dict.movie.cinepovScore}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-violet-400 transition-all duration-300">
              {avgRating || "—"}
            </span>
            {avgRating && <span className="text-xs text-muted-foreground">/10</span>}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 transition-all duration-300">
            {ratingCount === 0
              ? dict.movie.noVotesYet
              : `${ratingCount} ${ratingCount === 1 ? dict.movie.realVote : dict.movie.realVotes}`}
          </p>
        </div>

        {/* Nota TMDB */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
            {dict.movie.tmdbScore}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-cyan-400">
              {tmdbRating ? tmdbRating.toFixed(1) : "—"}
            </span>
            {tmdbRating && <span className="text-xs text-muted-foreground">/10</span>}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{dict.movie.externalRef}</p>
        </div>
      </div>

      {/* Widget interactivo de votación */}
      <div className="max-w-lg pt-2">
        <RatingWidget
          movieId={movieId}
          initialScore={userScore}
          initialWatchedAt={initialWatchedAt}
          onRatingUpdated={handleRatingUpdated}
        />
      </div>
    </div>
  );
}
