"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

interface RatingWidgetProps {
  movieId: string;
  initialScore: number | null;
  onRatingUpdated?: (newAvg: string | null, newCount: number) => void;
}

export default function RatingWidget({ movieId, initialScore, onRatingUpdated }: RatingWidgetProps) {
  const { data: session, status, update } = useSession();
  const [currentScore, setCurrentScore] = useState<number | null>(initialScore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const scores = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleRate = async (score: number) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, score }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar la valoración.");
      }

      setCurrentScore(score);
      setSuccess(true);
      toast.success("¡Valoración registrada!");

      // Sincronizar el contador en la sesión
      update();

      // Notificar al componente padre si existe
      if (onRatingUpdated && data.stats) {
        onRatingUpdated(data.stats.avgRating, data.stats.ratingCount);
      }

      // Quitar el estado de éxito tras 1.5 segundos
      setTimeout(() => setSuccess(false), 1500);

    } catch (err: any) {
      setError(err.message || "Error al enviar la valoración.");
      toast.error(err.message || "Error al registrar la valoración.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading || currentScore === null) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/ratings?movieId=${movieId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar la valoración.");
      }

      setCurrentScore(null);
      toast.success("Valoración eliminada.");

      // Sincronizar el contador en la sesión
      update();

      // Notificar al componente padre si existe
      if (onRatingUpdated && data.stats) {
        onRatingUpdated(data.stats.avgRating, data.stats.ratingCount);
      }

    } catch (err: any) {
      setError(err.message || "Error al eliminar la valoración.");
      toast.error(err.message || "Error al eliminar la valoración.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="bg-white/5 border border-white/5 p-6 rounded-2xl text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          ¿Has visto esta película? Inicia sesión para calificarla y ver cómo encaja en tu desglose demográfico.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-full bg-primary hover:bg-primary-hover px-6 py-2 text-sm font-semibold text-white shadow-md hover:shadow-primary/25 interactive-transition"
        >
          Iniciar sesión para votar
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          {currentScore !== null ? "Tu valoración" : "Valora esta película"}
        </h3>
        {currentScore !== null && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-red-400 interactive-transition disabled:opacity-50 cursor-pointer"
          >
            Quitar mi voto
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs text-center">
          {error}
        </div>
      )}

      {/* Grid de 10 botones (5x2 en móviles, 10x1 en pantallas más grandes) */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {scores.map((score) => {
          const isSelected = currentScore === score;
          return (
            <button
              key={score}
              disabled={loading}
              onClick={() => handleRate(score)}
              className={`
                w-full aspect-square rounded-xl font-black text-sm
                flex items-center justify-center interactive-transition cursor-pointer
                ${
                  isSelected
                    ? "bg-primary text-white shadow-lg shadow-primary/30 border border-primary/20 scale-105"
                    : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                }
                disabled:opacity-50 hover:scale-105 active:scale-95
              `}
            >
              {score}
            </button>
          );
        })}
      </div>

      {success && (
        <p className="text-xs text-emerald-400 text-center font-medium animate-pulse">
          ¡Valoración guardada correctamente!
        </p>
      )}
    </div>
  );
}
