"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RatingWidget from "./RatingWidget";
import { useI18n } from "@/lib/i18n/client";

interface MovieRatingSectionProps {
  movieId: string;
  initialAvgRating: string | null;
  initialRatingCount: number;
  initialEstimatedAvg: string | null;
  initialEstimatedCount: number;
  tmdbRating: number | null;
  userScore: number | null;
  initialWatchedAt?: string | null;
}

export default function MovieRatingSection({
  movieId,
  initialAvgRating,
  initialRatingCount,
  initialEstimatedAvg,
  initialEstimatedCount,
  tmdbRating,
  userScore,
  initialWatchedAt,
}: MovieRatingSectionProps) {
  const { dict } = useI18n();
  const [avgRating, setAvgRating] = useState<string | null>(initialAvgRating);
  const [ratingCount, setRatingCount] = useState<number>(initialRatingCount);
  const [estimatedAvg, setEstimatedAvg] = useState<string | null>(initialEstimatedAvg);
  const [estimatedCount, setEstimatedCount] = useState<number>(initialEstimatedCount);

  // Polleo Inteligente a intervalos (cada 15s) de estadísticas globales de la película
  useEffect(() => {
    const fetchStats = async () => {
      // Solo consultar si la pestaña del navegador está activa y enfocada
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch(`/api/movies/${movieId}/stats`);
        if (!response.ok) return;

        const data = await response.json();

        if (data.avgRating !== avgRating || data.ratingCount !== ratingCount) {
          setAvgRating(data.avgRating);
          setRatingCount(data.ratingCount);
        }
        if (data.estimated) {
          setEstimatedAvg(data.estimated.avgRating);
          setEstimatedCount(data.estimated.ratingCount);
        }
      } catch (err) {
        console.error("Error en polleo de estadísticas de película:", err);
      }
    };

    const intervalId = setInterval(fetchStats, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [movieId, avgRating, ratingCount]);

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

      {/*
        Estimación de arranque. Se presenta con tratamiento visual deliberadamente
        distinto (borde discontinuo, tipografía menor, color atenuado) para que
        nunca pueda confundirse con la nota real, y enlaza a la metodología.
      */}
      {estimatedCount > 0 && estimatedAvg && (
        <div className="max-w-sm mx-auto md:mx-0 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400/90">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {dict.movie.bootstrapEstimate}
            </span>
            <span className="text-sm font-bold text-amber-200/80 tabular-nums">{estimatedAvg}/10</span>
          </div>
          <p className="text-[10px] leading-relaxed text-amber-100/50">
            {estimatedCount} {dict.movie.bootstrapEstimateDesc}{" "}
            <Link href="/metodologia" className="underline decoration-dotted hover:text-amber-200 transition-colors">
              {dict.movie.howItWorks}
            </Link>
          </p>
        </div>
      )}

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
