"use client";

import { errorMessage } from "@/lib/errors";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/client";

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
  const { dict } = useI18n();
  const t = dict.rankings;

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
      } catch (err) {
        setError(errorMessage(err) || "Error al recuperar datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [gender, ageRange, selectedGenreId, selectedDecade, page]);

  // Resetear página a 1 si cambia cualquier filtro
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const isDemographicActive = gender !== "all" || ageRange !== "all";

  // Retornar descripción amigable del segmento actual
  const getSegmentLabel = () => {
    const genderLabels = t.genderSegmentLabels;
    const ageLabels: Record<string, string> = {
      all: t.ageSegmentLabels.all,
      "18_24": t.ageSegmentLabels.age18_24,
      "25_34": t.ageSegmentLabels.age25_34,
      "35_44": t.ageSegmentLabels.age35_44,
      "45_54": t.ageSegmentLabels.age45_54,
      "55_plus": t.ageSegmentLabels.age55_plus,
    };

    const gText = genderLabels[gender as keyof typeof genderLabels] || genderLabels.all;
    const aText = ageLabels[ageRange] || ageLabels.all;
    
    if (gender === "all" && ageRange === "all") return t.globalAudience;
    return `${gText} ${aText}`;
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-8">
      {/* Cabecera */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* PANEL DE FILTROS */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
        
        {/* Filtros Demográficos (Diferenciadores) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t.demographicFilters}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Género del Segmento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70">{t.voterGender}</label>
              <div className="grid grid-cols-4 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                {[
                  { value: "all", label: t.all },
                  { value: "male", label: t.male },
                  { value: "female", label: t.female },
                  { value: "non_binary", label: t.nonBinary }
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
              <label className="text-xs font-bold text-white/70">{t.voterAge}</label>
              <select
                value={ageRange}
                onChange={(e) => handleFilterChange(setAgeRange, e.target.value)}
                className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-primary/50 cursor-pointer h-[38px]"
              >
                <option value="all">{t.allAges}</option>
                <option value="18_24">{t.age18_24}</option>
                <option value="25_34">{t.age25_34}</option>
                <option value="35_44">{t.age35_44}</option>
                <option value="45_54">{t.age45_54}</option>
                <option value="55_plus">{t.age55_plus}</option>
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
              {t.movieGenre}
            </label>
            <select
              value={selectedGenreId}
              onChange={(e) => handleFilterChange(setSelectedGenreId, e.target.value)}
              className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="all">{t.allGenres}</option>
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
              {t.releaseDecade}
            </label>
            <select
              value={selectedDecade}
              onChange={(e) => handleFilterChange(setSelectedDecade, e.target.value)}
              className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="all">{t.allDecades}</option>
              <option value="2020s">{t.decade2020s}</option>
              <option value="2010s">{t.decade2010s}</option>
              <option value="2000s">{t.decade2000s}</option>
              <option value="1990s">{t.decade1990s}</option>
              <option value="1980s">{t.decade1980s}</option>
              <option value="1970s">{t.decade1970s}</option>
              <option value="classic">{t.decadeClassic}</option>
            </select>
          </div>
        </div>

      </div>

      {/* LISTADO DE RANKINGS */}
      <div className="space-y-4">
        
        {/* Cabecera del Listado */}
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {t.topFor}: <span className="text-white normal-case font-black">{getSegmentLabel()}</span>
          </h2>
          <span className="text-xs text-muted-foreground font-semibold">
            {totalResults} {totalResults === 1 ? t.singleMovieFound : t.moviesFound}
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
            <p className="text-xs text-muted-foreground">{t.calculatingStats}</p>
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
            <h3 className="text-base font-bold text-white">{t.noMoviesFound}</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {t.noMoviesDesc}
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
                      {movie.year} • {t.directorPrefix}{movie.director}
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
                      {movie.ratingCount} {movie.ratingCount === 1 ? t.singleVoteInSegment : t.votesInSegment}
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
                        {movie.deviation > 0 ? `+${movie.deviation}` : movie.deviation} {t.vsGlobal}
                      </span>

                      {/* Tooltip/Texto descriptivo discreto */}
                      <span className="hidden lg:inline text-[9px] font-bold text-muted-foreground">
                        {movie.deviation > 0
                          ? t.likedMore
                          : movie.deviation < 0
                          ? t.likedLess
                          : t.identicalScore}
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
                  {t.previous}
                </button>
                <span className="text-xs text-muted-foreground font-semibold">
                  {t.page} {page} {t.of} {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed interactive-transition"
                >
                  {t.next}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
