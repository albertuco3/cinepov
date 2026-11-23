"use client";

import { errorMessage } from "@/lib/errors";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";

interface Review {
  id: string;
  score: number;
  reviewText: string;
  watchedAt: string | null;
  createdAt: string;
  user: {
    displayName: string;
  };
}

interface MovieReviewsSectionProps {
  movieId: string;
  hasUserSegment: boolean;
}

export default function MovieReviewsSection({
  movieId,
  hasUserSegment,
}: MovieReviewsSectionProps) {
  const { dict, locale } = useI18n();
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<"recent" | "best">("recent");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Estados para reporte y moderación comunitaria
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>("offensive");
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [submittingReport, setSubmittingReport] = useState(false);

  // Al cambiar de filtro u orden se vuelve a la primera página. El estado de
  // carga se activa en el propio manejador, no dentro del efecto.
  const changeFilter = (value: string) => {
    if (value === filter) return;
    setLoading(true);
    setPage(1);
    setFilter(value);
  };
  const changeSort = (value: "recent" | "best") => {
    if (value === sort) return;
    setLoading(true);
    setPage(1);
    setSort(value);
  };

  useEffect(() => {
    fetch(`/api/movies/${movieId}/reviews?filter=${filter}&sort=${sort}&page=1&limit=10`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setReviews(data.reviews || []);
        setHasMore(Boolean(data.hasMore));
      })
      .catch((err) => console.error("Error al cargar opiniones:", err?.message || err))
      .finally(() => setLoading(false));
  }, [movieId, filter, sort]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(
        `/api/movies/${movieId}/reviews?filter=${filter}&sort=${sort}&page=${nextPage}&limit=10`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews((prev) => [...prev, ...(data.reviews || [])]);
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } catch (err) {
      console.error("Error al cargar más opiniones:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubmitReport = async (reviewId: string) => {
    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (locale === "en" ? "Error reporting review" : "Error al reportar"));

      setReportedIds((prev) => new Set([...prev, reviewId]));
      setReportingReviewId(null);
      toast.success(locale === "en" ? "Review reported for moderation." : "Reseña reportada para moderación.");
      if (data.moderated) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (err) {
      toast.error(errorMessage(err) || (locale === "en" ? "Could not submit report." : "No se pudo enviar el reporte."));
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6 pt-8 border-t border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {dict.movie.communityReviews}
          </h2>
          <p className="text-xs text-muted-foreground">
            {dict.movie.communityReviewsSubtitle}
          </p>
        </div>

        {/* Filtros demográficos */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => changeFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              filter === "all"
                ? "bg-primary border-primary text-white"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {dict.movie.allReviews} {filter === "all" && reviews.length > 0 ? `(${reviews.length})` : ""}
          </button>
          {hasUserSegment && (
            <button
              onClick={() => changeFilter("my_segment")}
              className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
                filter === "my_segment"
                  ? "bg-primary border-primary text-white"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              {dict.movie.yourCohortReviews}
            </button>
          )}
          <button
            onClick={() => changeFilter("female")}
            className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              filter === "female"
                ? "bg-primary border-primary text-white"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {dict.movie.womenReviews}
          </button>
          <button
            onClick={() => changeFilter("male")}
            className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              filter === "male"
                ? "bg-primary border-primary text-white"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {dict.movie.menReviews}
          </button>
          <button
            onClick={() => changeFilter("young")}
            className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              filter === "young"
                ? "bg-primary border-primary text-white"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {dict.movie.youngReviews}
          </button>
          <button
            onClick={() => changeFilter("senior")}
            className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              filter === "senior"
                ? "bg-primary border-primary text-white"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {dict.movie.seniorReviews}
          </button>

          {/* Selector de ordenación */}
          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value === "best" ? "best" : "recent")}
            className="bg-[#0f111a] border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full outline-none cursor-pointer focus:border-primary/50"
          >
            <option value="recent">{dict.movie.recentSort}</option>
            <option value="best">{dict.movie.bestSort}</option>
          </select>
        </div>
      </div>

      {/* Listado de reseñas */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Cabecera de la reseña */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-black text-white truncate">
                      {rev.user.displayName}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-0.5 bg-[#0f111a] border border-white/5 px-2.5 py-1 rounded-xl flex-shrink-0">
                    <span className="text-base font-black text-primary">{rev.score}</span>
                    <span className="text-[9px] text-muted-foreground">/10</span>
                  </div>
                </div>

                {/* Texto de la reseña */}
                <p className="text-xs text-white/90 leading-relaxed font-normal whitespace-pre-wrap">
                  {rev.reviewText}
                </p>
              </div>

              {/* Pie con fecha y botón de reporte */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{formatDate(rev.createdAt)}</span>
                  {rev.watchedAt && (
                    <span>· {locale === "en" ? "Watched on" : "Vista el"} {formatDate(rev.watchedAt)}</span>
                  )}
                </div>

                {reportedIds.has(rev.id) ? (
                  <span className="text-amber-400 font-bold">
                    {locale === "en" ? "Reported" : "Reportada"}
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      setReportingReviewId(reportingReviewId === rev.id ? null : rev.id)
                    }
                    className="hover:text-red-400 transition-colors cursor-pointer underline text-[10px]"
                  >
                    {locale === "en" ? "Report" : "Reportar"}
                  </button>
                )}
              </div>

              {/* Formulario de reporte inline si está abierto */}
              {reportingReviewId === rev.id && (
                <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-white block">
                    {locale === "en" ? "Why do you want to report this review?" : "¿Por qué deseas reportar esta reseña?"}
                  </span>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-[#0d101a] border border-white/10 rounded-lg p-1.5 text-xs text-white"
                  >
                    <option value="offensive">{locale === "en" ? "Offensive or inappropriate content" : "Contenido ofensivo o inapropiado"}</option>
                    <option value="spam">{locale === "en" ? "Spam or advertising" : "Spam o publicidad"}</option>
                    <option value="spoiler">{locale === "en" ? "Spoiler without warning" : "Spoiler sin advertencia"}</option>
                    <option value="other">{locale === "en" ? "Other reason" : "Otro motivo"}</option>
                  </select>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setReportingReviewId(null)}
                      className="px-2.5 py-1 rounded-md text-[10px] text-muted-foreground hover:text-white cursor-pointer"
                    >
                      {dict.common.cancel}
                    </button>
                    <button
                      disabled={submittingReport}
                      onClick={() => handleSubmitReport(rev.id)}
                      className="px-3 py-1 rounded-md bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {locale === "en" ? "Confirm" : "Confirmar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? dict.common.loading : dict.movie.loadMoreReviews}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {locale === "en"
              ? "No written reviews for this filter yet. Rate the movie and share the first one!"
              : "No hay opiniones escritas para este filtro todavía. ¡Valora la película y añade la primera opinión!"}
          </p>
        </div>
      )}
    </div>
  );
}
