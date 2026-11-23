"use client";

import { isAbortError } from "@/lib/errors";
import { useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

interface BattleShareBarProps {
  movieId: string;
  tmdbId: number;
  movieTitle: string;
  contrastText?: string | null;
}

export default function BattleShareBar({
  tmdbId,
  movieTitle,
  contrastText,
}: BattleShareBarProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/vs/${tmdbId}`;
    }
    return `https://cinepov.com/vs/${tmdbId}`;
  };

  const getShareText = () => {
    if (contrastText) {
      return `Veredicto de ${movieTitle}: ${contrastText}. Mira la comparativa completa en CinePOV:`;
    }
    return `Mira el desglose demografico de ${movieTitle} en CinePOV:`;
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles.");
      track("share_clicked", { channel: "copy_link", artifact_type: "movie_gap" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Batalla Demografica - ${movieTitle}`,
          text: getShareText(),
          url: getShareUrl(),
        });
        track("share_clicked", { channel: "native", artifact_type: "movie_gap" });
      } catch (err) {
        if (!isAbortError(err)) {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleSocialShare = (channel: "whatsapp" | "twitter" | "reddit") => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());

    track("share_clicked", { channel, artifact_type: "movie_gap" });

    let shareUrl = "";
    if (channel === "whatsapp") {
      shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    } else if (channel === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    } else if (channel === "reddit") {
      shareUrl = `https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent(`Veredicto de ${movieTitle} en CinePOV`)}`;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
      {/* Boton Compartir Nativo (dispositivos moviles) */}
      <button
        onClick={handleNativeShare}
        className="sm:hidden px-4 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartir Batalla
      </button>

      {/* WhatsApp */}
      <button
        onClick={() => handleSocialShare("whatsapp")}
        className="px-4 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
        title="Compartir por WhatsApp"
      >
        <span>WhatsApp</span>
      </button>

      {/* X / Twitter */}
      <button
        onClick={() => handleSocialShare("twitter")}
        className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
        title="Publicar en X"
      >
        <span>X (Twitter)</span>
      </button>

      {/* Reddit */}
      <button
        onClick={() => handleSocialShare("reddit")}
        className="px-4 py-2 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
        title="Compartir en Reddit"
      >
        <span>Reddit</span>
      </button>

      {/* Copiar enlace */}
      <button
        onClick={handleCopy}
        className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>{copied ? "¡Copiado!" : "Copiar Enlace"}</span>
      </button>
    </div>
  );
}
