"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";

interface CustomListSummary {
  id: string;
  name: string;
  itemCount: number;
}

interface Props {
  movieId: string;
  movieTitle: string;
  isLoggedIn: boolean;
}

export default function AddToListButton({ movieId, movieTitle, isLoggedIn }: Props) {
  const { dict, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<CustomListSummary[]>([]);
  const [includedListIds, setIncludedListIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && isLoggedIn) {
      setLoading(true);
      fetch("/api/lists?scope=user")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          setLists(data.lists || []);
        })
        .catch((err) => console.error("Error al cargar listas:", err))
        .finally(() => setLoading(false));
    }
  }, [open, isLoggedIn]);

  const handleToggleItem = async (listId: string) => {
    setTogglingId(listId);
    const isIncluded = includedListIds.has(listId);

    try {
      if (isIncluded) {
        const res = await fetch(`/api/lists/${listId}/items?movieId=${movieId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        setIncludedListIds((prev) => {
          const next = new Set(prev);
          next.delete(listId);
          return next;
        });
        toast.success(locale === "en" ? "Movie removed from list" : "Película retirada de la lista");
      } else {
        const res = await fetch(`/api/lists/${listId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieId }),
        });
        if (!res.ok) throw new Error();
        setIncludedListIds((prev) => new Set([...prev, listId]));
        toast.success(locale === "en" ? "Movie added to list" : "Película añadida a la lista");
      }
    } catch {
      toast.error(locale === "en" ? "Could not update list" : "No se pudo actualizar la lista");
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenClick = () => {
    if (!isLoggedIn) {
      toast.info(locale === "en" ? "Sign in to save movies to custom lists" : "Inicia sesión para guardar películas en tus listas");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpenClick}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        title={locale === "en" ? "Add to custom list" : "Añadir a una lista personalizada"}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span>{dict.movie.addToList}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 max-w-md w-full space-y-5 bg-[#0f111a] shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  {locale === "en" ? "Save to Collection" : "Guardar en Colección"}
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-xs">
                  {movieTitle}
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

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-2 animate-pulse py-4">
                  <div className="h-10 bg-white/5 rounded-xl" />
                  <div className="h-10 bg-white/5 rounded-xl" />
                </div>
              ) : lists.length > 0 ? (
                lists.map((l) => {
                  const isIncluded = includedListIds.has(l.id);
                  const isToggling = togglingId === l.id;

                  return (
                    <button
                      key={l.id}
                      onClick={() => handleToggleItem(l.id)}
                      disabled={isToggling}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isIncluded
                          ? "bg-primary/15 border-primary/40 text-white"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold block truncate">
                          {l.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {l.itemCount} {l.itemCount === 1 ? (locale === "en" ? "movie" : "película") : (locale === "en" ? "movies" : "películas")}
                        </span>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isIncluded
                            ? "bg-primary border-primary text-white"
                            : "border-white/20 bg-black/40"
                        }`}
                      >
                        {isIncluded && (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {locale === "en" ? "You have not created any custom lists yet." : "Aún no has creado ninguna lista personalizada."}
                  </p>
                  <Link
                    href="/profile"
                    className="inline-block text-xs font-bold text-primary hover:underline"
                  >
                    {locale === "en" ? "Create your first list in your profile" : "Crear mi primera lista en el perfil"} &rarr;
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <Link
                href="/profile"
                className="text-[11px] text-primary-light font-semibold hover:underline"
              >
                {locale === "en" ? "+ Manage lists" : "+ Gestionar listas"}
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {locale === "en" ? "Done" : "Listo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
