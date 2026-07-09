"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Genre {
  id: string;
  name: string;
}

interface UserSegment {
  gender: string;
  birthYear: number | null;
}

interface MovieRankingItem {
  rank: number;
  id: string;
  title: string;
  year: number;
  posterUrl: string;
  director: string;
  genres: string[];
  avgScore: number;
  ratingCount: number;
  globalAvgScore: number;
  globalRatingCount: number;
  deviation: number;
}

interface RankingsClientProps {
  availableGenres: Genre[];
  currentUserSegment: UserSegment | null;
  initialGenreId?: string;
}

export default function RankingsClient({
  availableGenres,
  currentUserSegment,
  initialGenreId = "all",
}: RankingsClientProps) {
  // 1. Determinar el segmento demográfico inicial del usuario
  const getInitialGender = () => {
    if (currentUserSegment?.gender) return currentUserSegment.gender;
    return "all";
  };

  const getInitialAgeRange = () => {
    if (!currentUserSegment?.birthYear) return "all";
    const currentYear = new Date().getFullYear();
    const age = currentYear - currentUserSegment.birthYear;
    if (age >= 18 && age <= 24) return "18_24";
    if (age >= 25 && age <= 34) return "25_34";
    if (age >= 35 && age <= 44) return "35_44";
    if (age >= 45 && age <= 54) return "45_54";
    if (age >= 55) return "55_plus";
    return "all";
  };

  // 2. Estados de los filtros
  const [gender, setGender] = useState(getInitialGender());
  const [ageRange, setAgeRange] = useState(getInitialAgeRange());
  const [selectedGenreId, setSelectedGenreId] = useState(initialGenreId);
  const [selectedDecade, setSelectedDecade] = useState("all");
  const [page, setPage] = useState(1);

  // Estados de datos y carga
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movies, setMovies] = useState<MovieRankingItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sincronizar el género seleccionado en la URL en caliente (Fase 2.4.2)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (selectedGenreId === "all") {
        url.searchParams.delete("genreId");
      } else {
        url.searchParams.set("genreId", selectedGenreId);
      }
      window.history.pushState({}, "", url.toString());
    }
  }, [selectedGenreId]);

  // 3. Efecto para cargar los rankings cuando cambian los filtros
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          gender,
          ageRange,
          genreId: selectedGenreId,
          decade: selectedDecade,
          page: String(page),
        });

        const response = await fetch(`/api/movies/rankings?${queryParams.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al cargar los rankings.");
        }

        setMovies(data.results);
        setTotalResults(data.totalResults);
        setTotalPages(Math.ceil(data.totalResults / data.pageSize));
      } catch (err: any) {
        setError(err.message || "Error al recuperar datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [gender, ageRange, selectedGenreId, selectedDecade, page]);

  // Resetear página a 1 si cambia cualquier filtro
  const handleFilterChange = (setter: Function, value: string) => {
    setter(value);
    setPage(1);
  };

  const isDemographicActive = gender !== "all" || ageRange !== "all";

  // Retornar descripción amigable del segmento actual
  const getSegmentLabel = () => {
    const genderLabels: Record<string, string> = {
      all: "Todos los géneros",
      male: "Hombres",
      female: "Mujeres",
      non_binary: "No Binarios",
    };

    const ageLabels: Record<string, string> = {
      all: "todas las edades",
      "18_24": "de 18-24 años",
      "25_34": "de 25-34 años",
      "35_44": "de 35-44 años",
      "45_54": "de 45-54 años",
      "55_plus": "de 55+ años",
    };

    const gText = genderLabels[gender];
    const aText = ageLabels[ageRange];
    
    if (gender === "all" && ageRange === "all") return "Público Global";
    return `${gText} ${aText}`;
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-8">
      {/* Cabecera */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">
          Rankings Demográficos
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Descubre las películas mejor valoradas. Rompe la tiranía de la nota media global filtrando por el segmento demográfico que desees.
        </p>
      </div>

      {/* PANEL DE FILTROS */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
        
        {/* Filtros Demográficos (Diferenciadores) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Filtros Demográficos (Segmento de Opinión)
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Género del Segmento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70">Género del Votante</label>
              <div className="grid grid-cols-4 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                {[
                  { value: "all", label: "Todos" },
                  { value: "male", label: "Hombres" },
                  { value: "female", label: "Mujeres" },
                  { value: "non_binary", label: "N.B." }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleFilterChange(setGender, item.value)}
                    className={`py-1.5 text-[10px] sm:text-xs font-bold rounded-lg interactive-transition cursor-pointer ${
                      gender === item.value
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rango de Edad del Segmento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70">Edad del Votante</label>
              <select
                value={ageRange}
                onChange={(e) => handleFilterChange(setAgeRange, e.target.value)}
                className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-primary/50 cursor-pointer h-[38px]"
              >
                <option value="all">Todas las edades</option>
                <option value="18_24">Menores y jóvenes (18-24 años)</option>
                <option value="25_34">Adultos jóvenes (25-34 años)</option>
                <option value="35_44">Adultos medios (35-44 años)</option>
                <option value="45_54">Maduros (45-54 años)</option>
                <option value="55_plus">Séniors (55+ años)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-white/5" />

        {/* Filtros Cinematográficos Clásicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Géneros de la Película */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Género Cinematográfico
            </label>
            <select
              value={selectedGenreId}
              onChange={(e) => handleFilterChange(setSelectedGenreId, e.target.value)}
              className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="all">Todos los géneros de cine</option>
              {availableGenres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          {/* Década de Estreno */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Década de Lanzamiento
            </label>
            <select
              value={selectedDecade}
              onChange={(e) => handleFilterChange(setSelectedDecade, e.target.value)}
              className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="all">Todas las décadas</option>
              <option value="2020s">Años 2020s (Recientes)</option>
              <option value="2010s">Años 2010s</option>
              <option value="2000s">Años 2000s</option>
              <option value="1990s">Años 90s</option>
              <option value="1980s">Años 80s</option>
            </select>
          </div>
        </div>

      </div>

      {/* LISTADO DE RANKINGS */}
      <div className="space-y-4">
        
        {/* Cabecera del Listado */}
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Top para: <span className="text-white normal-case font-black">{getSegmentLabel()}</span>
          </h2>
          <span className="text-xs text-muted-foreground font-semibold">
            {totalResults} {totalResults === 1 ? "película encontrada" : "películas encontradas"}
          </span>
        </div>

        {/* Estado de carga */}
        {loading ? (
          <div className="glass-panel p-20 rounded-3xl text-center space-y-4 border border-white/5">
            <div className="flex items-center justify-center space-x-2 py-2">
              <div className="w-3.5 h-3.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3.5 h-3.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3.5 h-3.5 bg-primary rounded-full animate-bounce"></div>
            </div>
            <p className="text-xs text-muted-foreground">Calculando estadísticas demográficas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl text-sm text-center">
            {error}
          </div>
        ) : movies.length === 0 ? (
          <div className="glass-panel p-20 rounded-3xl text-center space-y-3 border border-white/5">
            <svg className="h-10 w-10 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-bold text-white">Sin resultados</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              No hay películas suficientes en la base de datos que tengan un mínimo de 3 valoraciones hechas por el segmento de votantes seleccionado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Lista de películas */}
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-white/10 interactive-transition flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden group"
              >
                {/* Elemento de Posición y Ficha Principal */}
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full">
                  
                  {/* Puesto del Ranking */}
                  <div className="flex-shrink-0 text-center sm:w-12">
                    <span className={`text-3xl sm:text-4xl font-black tracking-tight block ${
                      movie.rank === 1
                        ? "text-yellow-400 font-extrabold text-glow"
                        : movie.rank === 2
                        ? "text-slate-300 font-extrabold"
                        : movie.rank === 3
                        ? "text-amber-600 font-extrabold"
                        : "text-white/40"
                    }`}>
                      {movie.rank}º
                    </span>
                  </div>

                  {/* Póster */}
                  <div className="relative h-28 w-20 rounded-2xl overflow-hidden bg-white/5 border border-white/5 shadow-md flex-shrink-0">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-[1.03] interactive-transition"
                      unoptimized
                    />
                  </div>

                  {/* Detalles de Película */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white truncate leading-tight group-hover:text-primary transition-colors">
                      <Link href={`/movie/${movie.id}`}>
                        {movie.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {movie.year} • Dirección: {movie.director}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1">
                      {movie.genres.map((genreName, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-muted-foreground"
                        >
                          {genreName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Calificaciones y Desviaciones */}
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end w-full md:w-auto gap-4 md:gap-1.5 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  
                  {/* Calificación del Segmento */}
                  <div className="text-left md:text-right">
                    <div className="flex items-baseline gap-1 md:justify-end">
                      <span className="text-2xl font-black text-white">{movie.avgScore}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                      {movie.ratingCount} {movie.ratingCount === 1 ? "voto" : "votos"} en segmento
                    </span>
                  </div>

                  {/* Comparativa con Desviación */}
                  {isDemographicActive && (
                    <div className="flex items-center gap-2 md:justify-end">
                      
                      {/* Badge de Desviación */}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-tight ${
                        movie.deviation > 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : movie.deviation < 0
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "bg-white/5 text-muted-foreground border border-white/5"
                      }`}>
                        {movie.deviation > 0 ? `+${movie.deviation}` : movie.deviation} vs. global
                      </span>

                      {/* Tooltip/Texto descriptivo discreto */}
                      <span className="hidden lg:inline text-[9px] font-bold text-muted-foreground">
                        {movie.deviation > 0
                          ? "Gusta más aquí"
                          : movie.deviation < 0
                          ? "Gusta menos aquí"
                          : "Nota idéntica"}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            ))}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="pt-6 flex justify-center items-center gap-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed interactive-transition"
                >
                  Anterior
                </button>
                <span className="text-xs text-muted-foreground font-semibold">
                  Página {page} de {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed interactive-transition"
                >
                  Siguiente
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
