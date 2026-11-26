"use client";

import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import Link from "@/components/LocaleLink";
import { toast } from "sonner";

export interface ReportItem {
  id: string;
  score: number;
  reviewText: string | null;
  reportCount: number;
  isModerated: boolean;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  movie: {
    id: string;
    tmdbId: number;
    title: string;
    year: number;
    posterUrl: string;
  };
  reasons: {
    id: string;
    reason: string;
    details: string | null;
    reportedBy: string;
    createdAt: string;
  }[];
}

interface Props {
  initialReports: ReportItem[];
}

const REASON_LABELS: Record<string, string> = {
  offensive: "Ofensivo",
  spam: "Spam",
  spoiler: "Spoiler",
  other: "Otro",
};

export default function ReportsAdminClient({ initialReports }: Props) {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (ratingId: string, action: "dismiss" | "moderate" | "delete_text") => {
    setProcessingId(ratingId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratingId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar acción");

      toast.success(data.message || "Acción realizada");

      if (action === "dismiss" || action === "delete_text") {
        setReports((prev) => prev.filter((r) => r.id !== ratingId));
      } else if (action === "moderate") {
        setReports((prev) =>
          prev.map((r) => (r.id === ratingId ? { ...r, isModerated: true } : r))
        );
      }
    } catch (err) {
      toast.error(errorMessage(err) || "Error al procesar acción");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 bg-white/[0.01]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      item.isModerated
                        ? "bg-red-500/15 border-red-500/30 text-red-300"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {item.isModerated ? "Oculta Preventivamente" : "Pendiente de Revision"}
                  </span>
                  <span className="text-xs text-white font-bold">
                    {item.reportCount} {item.reportCount === 1 ? "denuncia" : "denuncias"}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Película:{" "}
                  <Link
                    href={`/movie/${item.movie.tmdbId}`}
                    target="_blank"
                    className="text-white font-bold hover:underline"
                  >
                    {item.movie.title} ({item.movie.year})
                  </Link>
                </div>
              </div>

              {/* Contenido denunciado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Autor: <strong className="text-white">{item.user.displayName}</strong> ({item.user.email})
                  </span>
                  <span className="font-bold text-primary">Nota: {item.score}/10</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-white/90 whitespace-pre-wrap">
                  {item.reviewText || <span className="italic text-muted-foreground">Sin texto de reseña</span>}
                </div>
              </div>

              {/* Motivos de denuncia detallados */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Reportado por usuarios:
                </span>
                <div className="flex flex-wrap gap-2">
                  {item.reasons.map((r) => (
                    <span
                      key={r.id}
                      className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80"
                    >
                      <strong>{REASON_LABELS[r.reason] || r.reason}</strong> por {r.reportedBy}
                    </span>
                  ))}
                </div>
              </div>

              {/* Acciones del moderador */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5 flex-wrap">
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item.id, "dismiss")}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Desestimar Reportes
                </button>
                <button
                  disabled={processingId === item.id || item.isModerated}
                  onClick={() => handleAction(item.id, "moderate")}
                  className="px-4 py-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Mantener Oculta
                </button>
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item.id, "delete_text")}
                  className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Borrar Texto de Reseña
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-white/5">
          <h3 className="text-lg font-bold text-white">Bandeja de moderación limpia</h3>
          <p className="text-xs text-muted-foreground">
            No hay reseñas con denuncias pendientes ni contenido marcado para revisión.
          </p>
        </div>
      )}
    </div>
  );
}
