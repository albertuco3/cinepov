"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
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

  // El estado inmediato (abrir, cargando, vaciar) se fija al escribir; el efecto
  // solo lanza la búsqueda con retardo de 300 ms.
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
    } else {
      setLoading(true);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!query.trim()) return;
    // Si se escribe deprisa, una respuesta que llega tarde no pisa a la nueva.
    let cancelled = false;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const lang = locale === "en" ? "en-US" : "es-ES";
        const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&lang=${lang}`);
        const data = await response.json();
        if (!cancelled) setResults(data.results ?? []);
      } catch (error) {
        console.error("Error al buscar películas:", error);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounceFn);
    };
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
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={dict.search.placeholder}
          className="block w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition"
        />
        
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="animate-spin h-4 w-4 text-primary" />
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
