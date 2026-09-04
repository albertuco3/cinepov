"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";

interface Props {
  tmdbId: number;
  movieTitle: string;
}

export default function MovieEmbedModal({ tmdbId, movieTitle }: Props) {
  const { dict, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://cinepov.com";
  const embedUrl = `${baseUrl}/embed/movie/${tmdbId}`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="320" style="border:none;border-radius:16px;overflow:hidden;" title="CinePOV - ${movieTitle}"></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      toast.success(dict.movie.codeCopied);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(locale === "en" ? "Could not copy code" : "No se pudo copiar el código");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        title={locale === "en" ? "Embed this demographic chart on your site" : "Insertar este gráfico en tu blog o web"}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        <span>{dict.movie.embed}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 max-w-lg w-full space-y-5 bg-[#0f111a] shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  {dict.movie.embedTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {locale === "en"
                    ? `Copy this code to include data for ${movieTitle} in your blog or article.`
                    : `Copia este código para incluir los datos de ${movieTitle} en tu blog o artículo.`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                {locale === "en" ? "HTML Code for your website" : "Código HTML para tu web"}
              </label>
              <textarea
                readOnly
                value={iframeCode}
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white/90 font-mono focus:outline-none select-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
              <span className="text-[11px] text-muted-foreground">
                {locale === "en" ? "Responsive · Real-time updates" : "Responsivo · Actualizado en tiempo real"}
              </span>
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-primary/20"
              >
                {copied ? dict.movie.codeCopied : dict.movie.copyCode}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
