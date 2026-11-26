"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useI18n, useLocalePath } from "@/lib/i18n/client";

interface WatchlistButtonProps {
  movieId: string;
  initialInWatchlist: boolean;
  isLoggedIn: boolean;
}

export default function WatchlistButton({
  movieId,
  initialInWatchlist,
  isLoggedIn,
}: WatchlistButtonProps) {
  const { dict, locale } = useI18n();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const lp = useLocalePath();

  const handleToggle = async () => {
    if (!isLoggedIn) {
      toast(locale === "en" ? "Sign in to save movies to your watchlist" : "Inicia sesión para guardar películas en tu lista", {
        action: {
          label: dict.nav.login,
          onClick: () => router.push(lp("/login")),
        },
      });
      return;
    }

    const previousState = inWatchlist;
    const nextState = !previousState;
    setInWatchlist(nextState);
    setLoading(true);

    try {
      if (nextState) {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieId }),
        });
        if (!res.ok) throw new Error();
        toast.success(locale === "en" ? "Movie saved to watchlist" : "Película guardada en tu lista de pendientes");
      } else {
        const res = await fetch(`/api/watchlist?movieId=${movieId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        toast.success(locale === "en" ? "Movie removed from watchlist" : "Película eliminada de tu lista");
      }
    } catch {
      setInWatchlist(previousState);
      toast.error(locale === "en" ? "Could not update your watchlist" : "No se pudo actualizar tu lista de pendientes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
        inWatchlist
          ? "bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30"
          : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
      }`}
      title={inWatchlist ? (locale === "en" ? "Remove from watchlist" : "Quitar de mi lista") : (locale === "en" ? "Add to watchlist" : "Añadir a mi lista")}
    >
      <Bookmark
        className={`h-3.5 w-3.5 ${inWatchlist ? "fill-amber-400 text-amber-400" : "text-current"}`}
      />
      <span>{inWatchlist ? dict.movie.inWatchlist : dict.movie.wantToSee}</span>
    </button>
  );
}
