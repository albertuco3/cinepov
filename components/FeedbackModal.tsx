"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || message.trim() === "") {
      toast.error("Por favor, escribe un mensaje antes de enviar.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo enviar la sugerencia.");
      }

      toast.success("¡Sugerencia enviada! Muchas gracias por ayudarnos a mejorar.");
      setMessage("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al enviar la sugerencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Cabecera */}
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-xl font-black text-white tracking-tight">
            Buzón de Sugerencias
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Queremos mejorar CinePOV. Cuéntanos qué características te gustaría ver o reporta cualquier problema técnico que experimentes.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wide">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-primary/50 cursor-pointer h-10"
            >
              <option value="suggestion">💡 Sugerencia o Idea de mejora</option>
              <option value="bug">🐛 Reporte de error o bug</option>
              <option value="other">💬 Otro comentario</option>
            </select>
          </div>

          {/* Mensaje */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wide">
              Mensaje
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explica detalladamente tu sugerencia o reporte..."
              rows={4}
              maxLength={1000}
              className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-medium p-3 rounded-xl outline-none focus:border-primary/50 resize-none placeholder:text-muted-foreground/60 leading-relaxed"
              required
            />
          </div>

          {/* Acciones */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground border border-white/5 bg-white/5 hover:bg-white/10 hover:text-white cursor-pointer disabled:opacity-50 interactive-transition text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-primary/25 cursor-pointer disabled:opacity-50 interactive-transition flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Enviar sugerencia</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
