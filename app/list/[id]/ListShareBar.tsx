"use client";

import { toast } from "sonner";

interface Props {
  listName: string;
}

export default function ListShareBar({ listName }: Props) {
  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de la lista copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleShareWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = encodeURIComponent(`Echa un vistazo a esta lista de cine en CinePOV: "${listName}"\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareTwitter = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = encodeURIComponent(`Echa un vistazo a mi lista de cine "${listName}" en CinePOV:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-semibold">
        Compartir lista:
      </span>
      <button
        onClick={handleCopyLink}
        className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer"
      >
        Copiar Enlace
      </button>
      <button
        onClick={handleShareWhatsApp}
        className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
      >
        WhatsApp
      </button>
      <button
        onClick={handleShareTwitter}
        className="px-3 py-1.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
      >
        X (Twitter)
      </button>
    </div>
  );
}
