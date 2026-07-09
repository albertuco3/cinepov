"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: number;
  synopsis: string;
  posterUrl: string;
  director: string;
  runtime: number;
  tmdbRating: number | null;
}

interface OnboardingClientProps {
  initialMovies: Movie[];
  userDisplayName: string;
}

export default function OnboardingClient({ initialMovies, userDisplayName }: OnboardingClientProps) {
  const router = useRouter();
  const { update } = useSession();
  const [movies] = useState<Movie[]>(initialMovies);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(initialMovies.length === 0);
  const [recommendation, setRecommendation] = useState<{ tmdbId: number; title: string } | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const currentMovie = movies[currentIndex];
  const totalMovies = movies.length;
  
  // Formatear duración (ej: 148 min -> 2h 28m)
  const formatRuntime = (minutes: number) => {
    if (!minutes) return "Duración desconocida";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Cargar recomendación al finalizar el carrusel
  useEffect(() => {
    if (finished) {
      const loadRecommendation = async () => {
        setRecLoading(true);
        try {
          // Consultar recomendación demográfica únicamente (sin marcar como completado aún)
          const res = await fetch("/api/user/recommendation");
          if (res.ok) {
            const data = await res.json();
            if (data.recommendedMovieId) {
              setRecommendation({
                tmdbId: data.recommendedMovieId,
                title: data.title || "Película recomendada",
              });
            }
          }
        } catch (err) {
          console.error("Error al obtener recomendación:", err);
        } finally {
          setRecLoading(false);
        }
      };
      loadRecommendation();
    }
  }, [finished]);

  // Manejar el voto de 1 a 10
  const handleRate = async (score: number) => {
    if (!currentMovie || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: currentMovie.id,
          score,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar la valoración.");
      }

      setRatingsCount((prev) => prev + 1);
      
      // Avanzar al siguiente index
      if (currentIndex + 1 >= totalMovies) {
        setFinished(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || "Error al enviar la valoración.");
    } finally {
      setLoading(false);
    }
  };

  // Omitir película
  const handleSkip = () => {
    if (loading) return;
    setError(null);
    
    if (currentIndex + 1 >= totalMovies) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Saltar todo el onboarding y marcarlo como completado en la BD
  const handleSkipAll = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/complete-onboarding", {
        method: "POST",
      });
      if (res.ok) {
        await update({ onboardingCompleted: true });
        router.refresh();
        setFinished(true);
      } else {
        const data = await res.json();
        throw new Error(data.error || "No se pudo omitir el onboarding.");
      }
    } catch (err: any) {
      setError(err.message || "Error al omitir el onboarding.");
    } finally {
      setLoading(false);
    }
  };

  // Salir de la pantalla final de éxito del onboarding guardando el estado
  const handleExitOnboarding = async (targetUrl: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/complete-onboarding", {
        method: "POST",
      });
      if (res.ok) {
        await update({ onboardingCompleted: true });
        router.refresh();
      }
    } catch (err) {
      console.error("Error al registrar finalización del onboarding:", err);
    } finally {
      setLoading(false);
      router.push(targetUrl);
    }
  };

  // Si no hay películas de onboarding disponibles o ya finalizó
  if (finished) {
    return (
      <div className="max-w-md w-full mx-auto glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 border border-primary/20 text-primary animate-bounce">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white text-gradient">¡Excelente, {userDisplayName}!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Has valorado <strong className="text-white font-bold">{ratingsCount}</strong> películas esenciales. Tu perfil de gustos ya está configurado.
          </p>
        </div>

        <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Recomendación para tu segmento
          </h3>
          {recLoading ? (
            <div className="flex items-center justify-center py-4 space-x-2">
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
            </div>
          ) : recommendation ? (
            <div className="space-y-3">
              <p className="text-base font-bold text-white leading-normal">
                "{recommendation.title}"
              </p>
              <p className="text-xs text-muted-foreground">
                Las personas de tu mismo grupo de edad y género le dan una nota muy alta. ¡Comienza por aquí!
              </p>
              <button
                disabled={loading}
                onClick={() => handleExitOnboarding(`/movie/${recommendation.tmdbId}`)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg hover:shadow-primary/25 interactive-transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "Cargando..." : "Ver ficha y estadísticas de la película"}
              </button>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <p className="text-sm text-white font-medium">¡Todo listo para explorar!</p>
              <button
                disabled={loading}
                onClick={() => handleExitOnboarding("/explore")}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg hover:shadow-primary/25 interactive-transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "Cargando..." : "Explorar catálogo completo"}
              </button>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-center gap-4 text-xs font-semibold">
          <button
            disabled={loading}
            onClick={() => handleExitOnboarding("/explore")}
            className="text-muted-foreground hover:text-white transition-colors cursor-pointer disabled:opacity-50 bg-transparent border-none p-0 font-semibold"
          >
            Explorar catálogo
          </button>
          <span className="text-white/10">•</span>
          <button
            disabled={loading}
            onClick={() => handleExitOnboarding("/profile")}
            className="text-muted-foreground hover:text-white transition-colors cursor-pointer disabled:opacity-50 bg-transparent border-none p-0 font-semibold"
          >
            Ver mi perfil
          </button>
        </div>
      </div>
    );
  }

  if (totalMovies === 0) {
    return (
      <div className="max-w-md w-full mx-auto glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl text-center space-y-4">
        <h2 className="text-2xl font-black text-white">No hay películas pendientes</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ya has calificado todas las películas esenciales del onboarding. Puedes ir al catálogo principal a calificar más títulos.
        </p>
        <Link
          href="/explore"
          className="w-full inline-block py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg hover:shadow-primary/25 interactive-transition cursor-pointer"
        >
          Ir a Explorar
        </Link>
      </div>
    );
  }

  // Porcentaje de progreso
  const progressPercent = Math.round((currentIndex / totalMovies) * 100);

  return (
    <div className="max-w-xl w-full mx-auto space-y-6">
      {/* Barra de progreso superior */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Valoración Rápida</span>
            <button
              onClick={handleSkipAll}
              disabled={loading}
              className="text-[10px] lowercase text-muted-foreground hover:text-white transition-colors cursor-pointer border border-white/10 px-2 py-0.5 rounded-md hover:border-white/20 bg-white/5 disabled:opacity-50"
            >
              (saltar todo)
            </button>
          </div>
          <span className="text-white font-black">
            Película {currentIndex + 1} de {totalMovies}
          </span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Tarjeta Principal de la Película */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Póster */}
          <div className="relative h-48 w-32 sm:h-56 sm:w-36 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-lg flex-shrink-0">
            <Image
              src={currentMovie.posterUrl}
              alt={currentMovie.title}
              fill
              sizes="(max-w-768px) 128px, 144px"
              priority
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Información */}
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white leading-tight tracking-tight">
                {currentMovie.title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {currentMovie.originalTitle !== currentMovie.title && `${currentMovie.originalTitle} • `}
                {currentMovie.year} • {formatRuntime(currentMovie.runtime)}
              </p>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
              {currentMovie.synopsis}
            </div>

            <div className="pt-2 text-xs font-semibold">
              <span className="text-muted-foreground block sm:inline">Dirección:</span>{" "}
              <span className="text-white">{currentMovie.director}</span>
            </div>
          </div>
        </div>

        {/* Sección de Selección de Nota */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="text-center">
            <p className="text-sm font-bold text-white">¿Qué nota le das a esta película?</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Haz clic en una puntuación para guardarla y avanzar
            </p>
          </div>

          {/* Grid de 10 botones compacto */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                disabled={loading}
                onClick={() => handleRate(score)}
                className="w-full aspect-square rounded-xl bg-white/5 border border-white/10 hover:bg-primary hover:text-white hover:border-primary text-muted-foreground font-black text-sm flex items-center justify-center interactive-transition cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {score}
              </button>
            ))}
          </div>

          {/* Botón de Omitir */}
          <div className="pt-2 text-center">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-xs text-muted-foreground hover:text-white font-semibold interactive-transition cursor-pointer disabled:opacity-50"
            >
              No la he visto / Omitir
            </button>
          </div>
        </div>
      </div>

      {/* Invitación a importar desde Letterboxd/IMDb */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          ¿Ya tienes valoraciones en otras plataformas?{" "}
          <Link
            href="/import"
            className="text-primary hover:underline font-bold transition-colors cursor-pointer"
          >
            Importar desde Letterboxd o IMDb
          </Link>
        </p>
      </div>
    </div>
  );
}
