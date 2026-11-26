"use client";

import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "@/components/LocaleLink";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n/client";
import { SOCIAL_ENABLED } from "@/lib/features";

interface RatingWidgetProps {
  movieId: string;
  initialScore: number | null;
  initialWatchedAt?: string | null;
  onRatingUpdated?: (newAvg: string | null, newCount: number) => void;
}

export default function RatingWidget({
  movieId,
  initialScore,
  initialWatchedAt,
  onRatingUpdated,
}: RatingWidgetProps) {
  const { dict } = useI18n();
  const { status, update } = useSession();
  const [currentScore, setCurrentScore] = useState<number | null>(initialScore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [includeWatchedDate, setIncludeWatchedDate] = useState<boolean>(Boolean(initialWatchedAt));
  const [watchedDate, setWatchedDate] = useState<string>(
    initialWatchedAt ? initialWatchedAt.slice(0, 10) : todayStr
  );
  const [reviewText, setReviewText] = useState<string>("");
  const [showReviewInput, setShowReviewInput] = useState<boolean>(false);

  const scores = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleRate = async (score: number) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: { movieId: string; score: number; watchedAt?: string; reviewText?: string } = {
        movieId,
        score,
      };

      if (includeWatchedDate && watchedDate) {
        payload.watchedAt = new Date(watchedDate).toISOString();
      }

      if (reviewText.trim().length > 0) {
        payload.reviewText = reviewText.trim();
      }

      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || dict.common.error);
      }

      const isFirst = currentScore === null;
      if (isFirst) {
        track("rating_created", { score, is_first_rating: true });
      } else {
        track("rating_updated", { score, previous_score: currentScore });
      }

      setCurrentScore(score);
      setSuccess(true);
      toast.success(dict.movie.ratingSaved);

      // Sincronizar el contador en la sesion
      update();

      // Notificar al componente padre si existe
      if (onRatingUpdated && data.stats) {
        onRatingUpdated(data.stats.avgRating, data.stats.ratingCount);
      }

      // Quitar el estado de exito tras 1.5 segundos
      setTimeout(() => setSuccess(false), 1500);
    } catch (err) {
      setError(errorMessage(err) || dict.common.error);
      toast.error(errorMessage(err) || dict.common.error);
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
        throw new Error(data.error || dict.common.error);
      }

      track("rating_deleted");
      setCurrentScore(null);
      setIncludeWatchedDate(false);
      toast.success(dict.movie.ratingDeleted);

      // Sincronizar el contador en la sesion
      update();

      // Notificar al componente padre si existe
      if (onRatingUpdated && data.stats) {
        onRatingUpdated(data.stats.avgRating, data.stats.ratingCount);
      }
    } catch (err) {
      setError(errorMessage(err) || dict.common.error);
      toast.error(errorMessage(err) || dict.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="bg-white/5 border border-white/5 p-6 rounded-2xl text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          {dict.movie.unauthenticatedRateTitle}
        </p>
        <Link
          href="/login"
          className="inline-block rounded-full bg-primary hover:bg-primary-hover px-6 py-2 text-sm font-semibold text-white shadow-md hover:shadow-primary/25 interactive-transition"
        >
          {dict.movie.unauthenticatedRateCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          {currentScore !== null ? dict.movie.yourRating : dict.movie.rateThisMovie}
        </h3>
        {currentScore !== null && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-red-400 interactive-transition disabled:opacity-50 cursor-pointer"
          >
            {dict.movie.removeRating}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs text-center">
          {error}
        </div>
      )}

      {/* Grid de 10 botones */}
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

      {/* Selector opcional de fecha para el diario de visionados */}
      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeWatchedDate}
            onChange={(e) => setIncludeWatchedDate(e.target.checked)}
            className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary h-3.5 w-3.5"
          />
          <span>{dict.movie.logDateInDiary}</span>
        </label>
        {includeWatchedDate && (
          <input
            type="date"
            max={todayStr}
            value={watchedDate}
            onChange={(e) => setWatchedDate(e.target.value)}
            className="bg-[#11131f] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-primary/50 cursor-pointer"
          />
        )}
      </div>

      {/* Reseña escrita opcional (solo con las funciones sociales activas) */}
      {SOCIAL_ENABLED && (
      <div className="pt-2 border-t border-white/5 space-y-2">
        {!showReviewInput ? (
          <button
            type="button"
            onClick={() => setShowReviewInput(true)}
            className="text-[11px] font-semibold text-muted-foreground hover:text-white transition-colors underline cursor-pointer"
          >
            {dict.movie.addWrittenReview}
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
              <span>{dict.movie.yourReview}</span>
              <span>{reviewText.length}/2000</span>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={2000}
              placeholder={dict.movie.reviewPlaceholder}
              rows={3}
              className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none resize-none"
            />
            {currentScore !== null && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleRate(currentScore)}
                className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {dict.movie.saveReview}
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {success && (
        <p className="text-xs text-emerald-400 text-center font-medium animate-pulse">
          {dict.movie.ratingSaved}
        </p>
      )}
    </div>
  );
}
