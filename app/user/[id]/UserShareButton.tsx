"use client";

import { toast } from "sonner";

interface Props {
  displayName: string;
}

export default function UserShareButton({ displayName }: Props) {
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Perfil de ${displayName} en CinePOV`,
          text: `Echa un vistazo a las valoraciones y listas de ${displayName} en CinePOV.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Enlace del perfil copiado al portapapeles");
      }
    } catch {
      // Ignorar cancelaciones
    }
  };

  return (
    <button
      onClick={handleShare}
      className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center gap-1.5"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      <span>Compartir Perfil</span>
    </button>
  );
}
