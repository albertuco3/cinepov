"use client";

import { useState } from "react";
import { useJson } from "@/lib/hooks/use-json";
import Image from "next/image";
import Link from "next/link";
import { type DemographicContrast } from "@/lib/viral";

interface PolarizingMovie {
  id: string;
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string;
  realCount: number;
  genderGap: number;
  ageGap: number;
  polarizationScore: number;
  contrast: DemographicContrast | null;
}

export default function PolarizingClient() {
  const [filter, setFilter] = useState<"all" | "gender" | "age">("all");
  const { data, loading } = useJson<{ movies: PolarizingMovie[] }>(`/api/movies/polarizing?type=${filter}`);
  const movies = data?.movies ?? [];

  return (
    <div className="space-y-6">
      {/* Selector de filtros */}
      <div className="flex gap-2 flex-wrap border-b border-white/5 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
            filter === "all"
              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
          }`}
        >
          Mayor Polarizacion Global
        </button>
        <button
          onClick={() => setFilter("gender")}
          className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
            filter === "gender"
              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
          }`}
        >
          Brecha de Genero (Mujeres vs Hombres)
        </button>
        <button
          onClick={() => setFilter("age")}
          className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
            filter === "age"
              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
          }`}
        >
          Brecha Generacional (Jovenes vs Mayores)
        </button>
      </div>

      {/* Grid de resultados */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-white/5 rounded-3xl" />
          <div className="h-44 bg-white/5 rounded-3xl" />
          <div className="h-44 bg-white/5 rounded-3xl" />
          <div className="h-44 bg-white/5 rounded-3xl" />
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex gap-4">
                {/* Póster */}
                <div className="relative h-24 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 shadow-md">
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[9px] font-black uppercase tracking-wider">
                      #{index + 1} · Brecha de {movie.polarizationScore} pts
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white leading-tight truncate">
                    <Link
                      href={`/movie/${movie.tmdbId}`}
                      className="hover:text-primary transition-colors"
                    >
                      {movie.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {movie.year} • {movie.realCount} votos verificados
                  </p>

                  {/* Detalle del contraste si existe */}
                  {movie.contrast && (
                    <div className="flex items-center gap-2 text-xs pt-1">
                      <span className="text-pink-400 font-bold">
                        {movie.contrast.labelA}: {movie.contrast.scoreA}
                      </span>
                      <span className="text-white/30 font-black">/</span>
                      <span className="text-blue-400 font-bold">
                        {movie.contrast.labelB}: {movie.contrast.scoreB}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <Link
                  href={`/vs/${movie.tmdbId}`}
                  className="flex-1 text-center py-2 px-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary/10"
                >
                  Ver Batalla Demografica
                </Link>
                <Link
                  href={`/movie/${movie.tmdbId}`}
                  className="py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-black uppercase tracking-wider border border-white/10 transition-all"
                >
                  Ficha
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/5">
          <h3 className="text-lg font-bold text-white">
            Sin peliculas polarizantes registradas todavia
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            A medida que mas personas de diferentes edades y generos califiquen las peliculas del catalogo, se identificaran automaticamente las mayores discrepancias aqui.
          </p>
          <Link
            href="/explore"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/10"
          >
            Explorar y Calificar
          </Link>
        </div>
      )}
    </div>
  );
}
