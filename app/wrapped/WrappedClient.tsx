"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import type { WrappedStats } from "@/lib/wrapped";
import { buildCanonicalMoviePath } from "@/lib/slug";

interface Props {
  stats: WrappedStats;
  userName: string;
}

export default function WrappedClient({ stats, userName }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 5;

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(totalSlides - 1, prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Mi año ${stats.year} en CinePOV: he visto ${stats.totalMovies} películas con una nota media de ${stats.averageScore}/10.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Mi año ${stats.year} en CinePOV`,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Resumen copiado al portapapeles");
      }
    } catch {
      // Ignorar cancelaciones
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-[580px] flex flex-col justify-between glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-[#101322] to-[#0a0c14] relative overflow-hidden shadow-2xl">
      {/* 1. Barra de historias superior */}
      <div className="flex gap-1.5 w-full mb-6">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <div
            key={idx}
            className="h-1 flex-1 rounded-full overflow-hidden bg-white/10 cursor-pointer"
            onClick={() => setCurrentSlide(idx)}
          >
            <div
              className={`h-full transition-all duration-300 ${
                idx <= currentSlide ? "bg-primary" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>

      {/* 2. Diapositivas dinámicas */}
      <div className="flex-1 flex flex-col justify-center text-center space-y-6 animate-fade-in py-4">
        {/* SLIDE 0: Portada */}
        {currentSlide === 0 && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full inline-block">
              Balance Anual {stats.year}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Tu Año en Cine
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {userName}, este ha sido tu recorrido cinematográfico en los últimos 365 días.
            </p>
            <div className="pt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-3xl font-black text-white block tabular-nums">
                  {stats.totalMovies}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Películas
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-3xl font-black text-primary block tabular-nums">
                  ~{stats.totalHoursEstimated}h
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Horas de Cine
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: El Calendario */}
        {currentSlide === 1 && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full inline-block">
              Ritmo de Visionados
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Tu Mes Más Cinéfilo
            </h2>
            <div className="py-6">
              <span className="text-4xl sm:text-6xl font-black accent-gradient block">
                {stats.mostActiveMonth}
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                Fue el periodo con mayor concentración de títulos calificados.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/80">
              Mantuviste un promedio constante a lo largo de los meses.
            </div>
          </div>
        )}

        {/* SLIDE 2: Extremos de Criterio */}
        {currentSlide === 2 && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full inline-block">
              Polaridad y Criterio
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Los Extremos de tu Año
            </h2>
            <div className="grid grid-cols-2 gap-4 text-left pt-2">
              {stats.highestRated && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block">
                    Tu Obra Cumbre
                  </span>
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md">
                    <Image
                      src={stats.highestRated.posterUrl}
                      alt={stats.highestRated.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-1 right-1 px-2 py-0.5 rounded-lg bg-black/80 font-black text-xs text-emerald-400">
                      {stats.highestRated.score}/10
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    {stats.highestRated.title}
                  </p>
                </div>
              )}

              {stats.lowestRated && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <span className="text-[10px] font-black uppercase text-red-400 block">
                    Tu Mayor Decepción
                  </span>
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md">
                    <Image
                      src={stats.lowestRated.posterUrl}
                      alt={stats.lowestRated.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-1 right-1 px-2 py-0.5 rounded-lg bg-black/80 font-black text-xs text-red-400">
                      {stats.lowestRated.score}/10
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    {stats.lowestRated.title}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SLIDE 3: Género Rey */}
        {currentSlide === 3 && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full inline-block">
              Inclinación Temática
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Tu Género Rey del Año
            </h2>
            <div className="py-8">
              <span className="text-4xl sm:text-5xl font-black text-primary block">
                {stats.favoriteGenre || "Cine Variado"}
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                Representó la mayor proporción de tus elecciones cinematográficas.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-muted-foreground">
              Tu nota media global este año ha sido de{" "}
              <strong className="text-white">{stats.averageScore}/10</strong>.
            </div>
          </div>
        )}

        {/* SLIDE 4: El Veredicto Demográfico y Resumen */}
        {currentSlide === 4 && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full inline-block">
              Impacto Demográfico
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Tu Huella en la Comunidad
            </h2>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tu Nota Media Anual:</span>
                <span className="font-black text-white text-base">{stats.averageScore}/10</span>
              </div>
              {stats.demographicComparison.segmentAvg && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Media Comunitaria:</span>
                  <span className="font-bold text-primary">{stats.demographicComparison.segmentAvg}/10</span>
                </div>
              )}
              <p className="text-xs text-white/90 pt-2 border-t border-white/5 leading-relaxed">
                {stats.demographicComparison.comparisonText}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleShare}
                className="w-full py-3 px-6 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Compartir Mi Año en Cine</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Navegación inferior */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="px-4 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          &larr; Anterior
        </button>

        <span className="text-[10px] text-muted-foreground font-mono">
          {currentSlide + 1} / {totalSlides}
        </span>

        {currentSlide < totalSlides - 1 ? (
          <button
            onClick={nextSlide}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer"
          >
            Siguiente &rarr;
          </button>
        ) : (
          <Link
            href="/profile"
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
          >
            Ver Mi Perfil
          </Link>
        )}
      </div>
    </div>
  );
}
