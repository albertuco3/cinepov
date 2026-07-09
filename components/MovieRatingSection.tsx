"use client";

import { useState, useEffect } from "react";
import RatingWidget from "./RatingWidget";

interface MovieRatingSectionProps {
  movieId: string;
  initialAvgRating: string | null;
  initialRatingCount: number;
  tmdbRating: number | null;
  userScore: number | null;
}

export default function MovieRatingSection({
  movieId,
  initialAvgRating,
  initialRatingCount,
  tmdbRating,
  userScore,
}: MovieRatingSectionProps) {
  const [avgRating, setAvgRating] = useState<string | null>(initialAvgRating);
  const [ratingCount, setRatingCount] = useState<number>(initialRatingCount);

  // Polleo Inteligente a intervalos (cada 15s) de estadísticas globales de la película
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStats = async () => {
      // Solo consultar si la pestaña del navegador está activa y enfocada
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch(`/api/movies/${movieId}/stats`);
        if (!response.ok) return;

        const data = await response.json();
        
        // Actualizar estados locales si hay diferencias
        if (data.avgRating !== avgRating || data.ratingCount !== ratingCount) {
          setAvgRating(data.avgRating);
          setRatingCount(data.ratingCount);
        }
      } catch (err) {
        console.error("Error en polleo de estadísticas de película:", err);
      }
    };

    intervalId = setInterval(fetchStats, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [movieId, avgRating, ratingCount]);

  const handleRatingUpdated = (newAvg: string | null, newCount: number) => {
    setAvgRating(newAvg);
    setRatingCount(newCount);
  };

  return (
    <div className="space-y-6">
      {/* Caja de Calificaciones Cruzadas */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto md:mx-0 bg-white/5 border border-white/5 p-4 rounded-2xl">
        {/* Nota CinePOV */}
        <div className="text-center border-r border-white/5">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
            Nota CinePOV
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-violet-400 transition-all duration-300">
              {avgRating || "—"}
            </span>
            {avgRating && <span className="text-xs text-muted-foreground">/10</span>}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 transition-all duration-300">
            {ratingCount} {ratingCount === 1 ? "voto" : "votos"}
          </p>
        </div>

        {/* Nota TMDB */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
            Nota Global TMDB
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-cyan-400">
              {tmdbRating ? tmdbRating.toFixed(1) : "—"}
            </span>
            {tmdbRating && <span className="text-xs text-muted-foreground">/10</span>}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Referencia externa
          </p>
        </div>
      </div>

      {/* Widget interactivo de votación */}
      <div className="max-w-lg">
        <RatingWidget
          movieId={movieId}
          initialScore={userScore}
          onRatingUpdated={handleRatingUpdated}
        />
      </div>
    </div>
  );
}
