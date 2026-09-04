"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/client";

interface SearchResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
}

export default function SearchBar() {
  const router = useRouter();
  const { locale, dict } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera del buscador
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Implementar Debounce de 300ms para la búsqueda
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const lang = locale === "en" ? "en-US" : "es-ES";
        const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&lang=${lang}`);
        const data = await response.json();
        
        if (data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Error al buscar películas:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, locale]);

  const handleSelectMovie = (tmdbId: number) => {
    setQuery("");
    setIsOpen(false);
    // Navegar a la página dinámica de detalle de la película
    router.push(`/movie/${tmdbId}`);
  };

  const getYear = (dateString?: string) => {
    if (!dateString) return "";
    return dateString.split("-")[0];
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg mx-auto">
      {/* Campo de entrada */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.search.placeholder}
          className="block w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition"
        />
        
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              className="animate-spin h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (results.length > 0 || !loading) && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f111a]">
          {results.length > 0 ? (
            <ul className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {results.map((movie) => (
                <li key={movie.id}>
                  <button
                    onClick={() => handleSelectMovie(movie.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 text-left interactive-transition cursor-pointer"
                  >
                    {/* Póster miniatura */}
                    <div className="relative h-12 w-8 flex-shrink-0 bg-white/5 rounded overflow-hidden">
                      {movie.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px] text-muted-foreground text-center">
                          S/P
                        </div>
                      )}
                    </div>
                    {/* Título e Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{movie.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {movie.original_title !== movie.title && `${movie.original_title} • `}
                        {getYear(movie.release_date)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {dict.search.noResults}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
