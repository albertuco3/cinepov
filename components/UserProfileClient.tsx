"use client";

import { errorMessage } from "@/lib/errors";
import { MIN_BIRTH_YEAR, maxBirthYear } from "@/lib/age";
import { useJson } from "@/lib/hooks/use-json";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import AccountDangerZone from "@/components/AccountDangerZone";

interface Movie {
  id: string;
  tmdbId?: number;
  title: string;
  year: number;
  posterUrl: string;
  globalAvgScore?: number;
}

interface Rating {
  id: string;
  score: number;
  createdAt: string;
  watchedAt?: string | null;
  movie: Movie;
  deviation?: number;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  gender: string | null;
  birthYear: number | null;
  emailWeeklyActive?: boolean;
  createdAt: string;
}

interface CommunityUnlock {
  movieId: string;
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string;
  level: string;
  realCount: number;
  userScore: number | null;
  segmentAvg: number | null;
  segmentLabel: string | null;
  deviation: number | null;
}

export interface WatchlistItem {
  id: string;
  addedAt: string;
  movie: {
    id: string;
    tmdbId?: number;
    title: string;
    year: number;
    posterUrl: string;
    tmdbRating?: number | null;
  };
}

export interface CustomListItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  updatedAt: string;
}

interface UserProfileClientProps {
  initialUser: User;
  initialRatings: Rating[];
  initialWatchlist?: WatchlistItem[];
  initialLists?: CustomListItem[];
  hasPassword?: boolean;
}

type ProfileSubTab = "ratings" | "diary" | "watchlist" | "lists" | "unlocks" | "settings";

export default function UserProfileClient({
  initialUser,
  initialRatings,
  initialWatchlist = [],
  initialLists = [],
  hasPassword = false,
}: UserProfileClientProps) {
  const { update } = useSession();

  // Estados para perfil
  const [displayName, setDisplayName] = useState(initialUser.displayName);
  const [gender, setGender] = useState(initialUser.gender || "");
  const [birthYear, setBirthYear] = useState(
    initialUser.birthYear ? String(initialUser.birthYear) : ""
  );
  const [emailWeeklyActive, setEmailWeeklyActive] = useState(
    initialUser.emailWeeklyActive ?? true
  );
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Estados para historial de valoraciones
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [sortBy, setSortBy] = useState<"date_desc" | "score_desc" | "score_asc">("date_desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estados para Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [removingWatchlistId, setRemovingWatchlistId] = useState<string | null>(null);

  const handleRemoveFromWatchlist = async (movieId: string, id: string) => {
    setRemovingWatchlistId(id);
    try {
      const res = await fetch(`/api/watchlist?movieId=${movieId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
      toast.success("Pelicula eliminada de tu lista");
    } catch {
      toast.error("No se pudo quitar la pelicula de la lista");
    } finally {
      setRemovingWatchlistId(null);
    }
  };

  // Estados y handlers para Listas Personalizadas (Fase 5.2.2)
  const [lists, setLists] = useState<CustomListItem[]>(initialLists);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [newListPublic, setNewListPublic] = useState(true);
  const [submittingList, setSubmittingList] = useState(false);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setSubmittingList(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          description: newListDesc,
          isPublic: newListPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear lista");

      setLists((prev) => [
        {
          id: data.list.id,
          name: data.list.name,
          description: data.list.description,
          isPublic: data.list.isPublic,
          itemCount: 0,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewListName("");
      setNewListDesc("");
      setCreatingList(false);
      toast.success("Lista creada correctamente");
    } catch (err) {
      toast.error(errorMessage(err) || "Error al crear lista");
    } finally {
      setSubmittingList(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    setDeletingListId(listId);
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar la lista");
      setLists((prev) => prev.filter((l) => l.id !== listId));
      toast.success("Lista eliminada");
    } catch (err) {
      toast.error(errorMessage(err) || "Error al eliminar lista");
    } finally {
      setDeletingListId(null);
    }
  };

  // Navegacion de pestanas internas del perfil
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTab>("ratings");

  // Desbloqueos de la comunidad
  // Los desbloqueos se cargan al abrir su pestaña (y se refrescan al volver a ella).
  const { data: unlocksData, loading: unlocksLoading } = useJson<{ unlocks: CommunityUnlock[] }>(
    activeSubTab === "unlocks" ? "/api/user/unlocks" : null
  );
  const unlocks = unlocksData?.unlocks ?? [];
  const loadingUnlocks = unlocksLoading && !unlocksData;

  // Calcular estadisticas basicas
  const totalRatingsCount = ratings.length;
  const averageScore =
    totalRatingsCount > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / totalRatingsCount).toFixed(1)
      : "—";

  // Desviaciones para perfil critico
  const ratingsWithDeviations = ratings.map((r) => {
    const dev = r.score - (r.movie.globalAvgScore || 0);
    return { ...r, deviation: parseFloat(dev.toFixed(1)) };
  });

  // Pelicula mas generosa y mas dura
  const generousCandidates = ratingsWithDeviations.filter((r) => r.deviation > 0);
  const generousMovie =
    generousCandidates.length > 0
      ? generousCandidates.sort(
          (a, b) => b.deviation - a.deviation || b.score - a.score
        )[0]
      : null;

  const harshCandidates = ratingsWithDeviations.filter((r) => r.deviation < 0);
  const harshMovie =
    harshCandidates.length > 0
      ? harshCandidates.sort(
          (a, b) => a.deviation - b.deviation || a.score - b.score
        )[0]
      : null;

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Guardar perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMessage(null);

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          gender: gender || null,
          birthYear: birthYear ? parseInt(birthYear, 10) : null,
          emailWeeklyActive,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Error al actualizar perfil.");
      }

      setProfileMessage({
        type: "success",
        text: "Tu perfil se ha actualizado correctamente.",
      });
      toast.success("Perfil actualizado con exito.");
      update();
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: errorMessage(err) || "Error al procesar la solicitud.",
      });
      toast.error(errorMessage(err) || "Error al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar valoracion
  const handleDeleteRating = async (ratingId: string, movieId: string) => {
    setDeletingId(ratingId);
    try {
      const response = await fetch(`/api/ratings?movieId=${movieId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar la valoracion.");
      }

      setRatings(ratings.filter((r) => r.id !== ratingId));
      toast.success("Valoracion eliminada correctamente.");
      update();
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err) || "Error al intentar eliminar la valoracion.");
    } finally {
      setDeletingId(null);
    }
  };

  // Ordenar valoraciones
  const sortedRatings = [...ratings].sort((a, b) => {
    if (sortBy === "date_desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "score_desc") {
      return b.score - a.score;
    }
    if (sortBy === "score_asc") {
      return a.score - b.score;
    }
    return 0;
  });

  // Agrupar diario por mes y ano de visionado
  const diaryGroups = useMemo(() => {
    const list = [...ratings].sort((a, b) => {
      const dateA = new Date(a.watchedAt || a.createdAt).getTime();
      const dateB = new Date(b.watchedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    const groups: { monthKey: string; monthLabel: string; items: Rating[] }[] = [];
    list.forEach((item) => {
      const d = new Date(item.watchedAt || item.createdAt);
      const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const rawMonth = d.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });
      const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

      let group = groups.find((g) => g.monthKey === monthKey);
      if (!group) {
        group = { monthKey, monthLabel, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });

    return groups;
  }, [ratings]);

  const levelLabels: Record<string, string> = {
    age_broad: "Nivel 1: Generacion desbloqueada",
    gender: "Nivel 2: Brecha por genero",
    age_full: "Nivel 3: Rango de edad completo",
    cross: "Nivel 4: Matriz cruzada completa",
  };

  return (
    <div className="space-y-8 w-full">
      {/* 1. CABECERA DE PERFIL */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar inicial */}
          <div className="h-20 w-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-black text-primary flex-shrink-0 shadow-lg shadow-primary/10">
            {initialUser.displayName.charAt(0).toUpperCase()}
          </div>

          {/* Info básica */}
          <div className="space-y-2 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {initialUser.displayName}
            </h1>
            <p className="text-xs text-muted-foreground">{initialUser.email}</p>

            {/* Badges demográficos */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/90">
                {initialUser.gender === "male"
                  ? "Hombre"
                  : initialUser.gender === "female"
                    ? "Mujer"
                    : initialUser.gender === "non_binary"
                      ? "No binario"
                      : "Genero no especificado"}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/90">
                {initialUser.birthYear
                  ? `${new Date().getFullYear() - initialUser.birthYear} anos (Nacido en ${initialUser.birthYear})`
                  : "Edad no especificada"}
              </span>
            </div>
          </div>

          {/* Tarjeta de métricas compactas */}
          <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-center">
            <div className="text-center px-2">
              <span className="text-2xl font-black text-white block">
                {totalRatingsCount}
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Peliculas
              </span>
            </div>
            <div className="text-center px-2">
              <span className="text-2xl font-black text-primary block">
                {averageScore}
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Nota Media
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SELECTOR DE SUBPESTAÑAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3 gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab("ratings")}
            className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              activeSubTab === "ratings"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            Valoraciones ({totalRatingsCount})
          </button>
          <button
            onClick={() => setActiveSubTab("diary")}
            className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              activeSubTab === "diary"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            Diario de Visionados
          </button>
          <button
            onClick={() => setActiveSubTab("watchlist")}
            className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "watchlist"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            <span>Watchlist</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
              {watchlist.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab("lists")}
            className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "lists"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            <span>Mis Listas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
              {lists.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab("unlocks")}
            className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "unlocks"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            <span>Desbloqueos Comunitarios</span>
            {unlocks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                {unlocks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              activeSubTab === "settings"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            Ajustes y Privacidad
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/profile/stats"
            className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase bg-primary/20 border border-primary/30 text-primary-light hover:bg-primary hover:text-white transition-all cursor-pointer shadow-md shadow-primary/10"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Mi Perfil Cinematografico
          </Link>
          <Link
            href="/import"
            className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase border border-white/10 hover:border-white/20 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Importar
          </Link>
        </div>
      </div>

      {/* PESTAÑA 1: MIS VALORACIONES */}
      {activeSubTab === "ratings" && (
        <div className="space-y-6">
          {/* HITOS DE PROGRESO */}
          {totalRatingsCount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`glass-panel p-5 rounded-3xl border text-center space-y-2 flex flex-col items-center justify-center ${
                  totalRatingsCount >= 10
                    ? "border-amber-700/30 bg-amber-900/10 text-white"
                    : "border-white/5 bg-white/1 opacity-40"
                }`}
              >
                <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-wider">
                  Nivel I: Bronce
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Cinefilo Iniciado
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Valorar 10 peliculas ({Math.min(totalRatingsCount, 10)}/10)
                  </p>
                </div>
                {totalRatingsCount >= 10 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                    Completado
                  </span>
                )}
              </div>

              <div
                className={`glass-panel p-5 rounded-3xl border text-center space-y-2 flex flex-col items-center justify-center ${
                  totalRatingsCount >= 50
                    ? "border-slate-400/30 bg-slate-500/10 text-white"
                    : "border-white/5 bg-white/1 opacity-40"
                }`}
              >
                <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-wider">
                  Nivel II: Plata
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Critico de CinePOV
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Valorar 50 peliculas ({Math.min(totalRatingsCount, 50)}/50)
                  </p>
                </div>
                {totalRatingsCount >= 50 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-400/10 text-slate-300 border border-slate-400/20 text-[9px] font-bold">
                    Completado
                  </span>
                )}
              </div>

              <div
                className={`glass-panel p-5 rounded-3xl border text-center space-y-2 flex flex-col items-center justify-center ${
                  totalRatingsCount >= 100
                    ? "border-yellow-500/30 bg-yellow-500/10 text-white"
                    : "border-white/5 bg-white/1 opacity-40"
                }`}
              >
                <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-wider">
                  Nivel III: Oro
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Maestro de la Perspectiva
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Valorar 100 peliculas ({Math.min(totalRatingsCount, 100)}/100)
                  </p>
                </div>
                {totalRatingsCount >= 100 && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold">
                    Completado
                  </span>
                )}
              </div>
            </div>
          )}

          {/* PERFIL CRITICO: PLACER CULPABLE Y CRITICA SEVERA */}
          {(generousMovie || harshMovie) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Tu Identidad Critica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generousMovie && (
                  <div className="glass-panel p-5 rounded-3xl border border-emerald-500/10 bg-emerald-500/5 flex items-center gap-4 relative overflow-hidden group">
                    <div className="relative h-20 w-14 rounded-xl overflow-hidden bg-white/5 border border-white/5 shadow-md flex-shrink-0">
                      <Image
                        src={generousMovie.movie.posterUrl}
                        alt={generousMovie.movie.title}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 interactive-transition"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider">
                        Tu Placer Culpable
                      </span>
                      <h4 className="text-sm font-black text-white truncate leading-tight mt-1">
                        <Link
                          href={`/movie/${generousMovie.movie.tmdbId || generousMovie.movie.id}`}
                          className="hover:text-emerald-400 transition-colors"
                        >
                          {generousMovie.movie.title}
                        </Link>
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        Tu nota: <span className="text-white font-bold">{generousMovie.score}</span> • Media:{" "}
                        <span className="text-white/60">{generousMovie.movie.globalAvgScore}</span>
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold">
                        La valoras +{generousMovie.deviation} por encima de la media
                      </p>
                    </div>
                  </div>
                )}

                {harshMovie && (
                  <div className="glass-panel p-5 rounded-3xl border border-rose-500/10 bg-rose-500/5 flex items-center gap-4 relative overflow-hidden group">
                    <div className="relative h-20 w-14 rounded-xl overflow-hidden bg-white/5 border border-white/5 shadow-md flex-shrink-0">
                      <Image
                        src={harshMovie.movie.posterUrl}
                        alt={harshMovie.movie.title}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 interactive-transition"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider">
                        Tu Critica mas Severa
                      </span>
                      <h4 className="text-sm font-black text-white truncate leading-tight mt-1">
                        <Link
                          href={`/movie/${harshMovie.movie.tmdbId || harshMovie.movie.id}`}
                          className="hover:text-rose-400 transition-colors"
                        >
                          {harshMovie.movie.title}
                        </Link>
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        Tu nota: <span className="text-white font-bold">{harshMovie.score}</span> • Media:{" "}
                        <span className="text-white/60">{harshMovie.movie.globalAvgScore}</span>
                      </p>
                      <p className="text-[10px] text-rose-400 font-bold">
                        La valoras {harshMovie.deviation} por debajo de la media
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {totalRatingsCount > 0 && <div className="h-px bg-white/5" />}

          {/* LISTADO DE VALORACIONES */}
          {totalRatingsCount > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Peliculas Calificadas
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Ordenar por:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-[#0f111a] border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-primary/50"
                  >
                    <option value="date_desc">Fecha (Recientes primero)</option>
                    <option value="score_desc">Nota (Mayor a menor)</option>
                    <option value="score_asc">Nota (Menor a mayor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {sortedRatings.map((rating) => (
                  <div
                    key={rating.id}
                    className={`glass-panel p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row items-center gap-4 sm:justify-between ${
                      deletingId === rating.id
                        ? "opacity-50 pointer-events-none scale-95"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full">
                      <div className="relative h-16 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 shadow-md">
                        <Image
                          src={rating.movie.posterUrl}
                          alt={rating.movie.title}
                          fill
                          sizes="44px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Link
                          href={`/movie/${rating.movie.tmdbId || rating.movie.id}`}
                          className="text-sm font-bold text-white hover:text-primary transition-colors cursor-pointer"
                        >
                          {rating.movie.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{rating.movie.year}</p>
                        <p className="text-[10px] text-muted-foreground/80">
                          {rating.watchedAt
                            ? `Vista el ${formatDate(rating.watchedAt)}`
                            : `Registrada el ${formatDate(rating.createdAt)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-baseline gap-0.5 bg-[#0f111a] border border-white/5 px-3 py-1.5 rounded-xl">
                        <span className="text-xl font-black text-primary">
                          {rating.score}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/10</span>
                      </div>

                      <button
                        onClick={() => handleDeleteRating(rating.id, rating.movie.id)}
                        disabled={deletingId === rating.id}
                        className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
                        title="Eliminar valoracion"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-3xl text-center space-y-4 border border-white/5">
              <h3 className="text-lg font-bold text-white">Ninguna valoracion todavia</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No has valorado ninguna pelicula en CinePOV. Explora el catalogo para anadir tus primeras notas.
              </p>
              <Link
                href="/explore"
                className="inline-block px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/10"
              >
                Explorar Catalogo
              </Link>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: DIARIO DE VISIONADOS */}
      {activeSubTab === "diary" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Diario de Visionados
              </h2>
              <p className="text-xs text-muted-foreground">
                Tu historial cronologico de cine. Registra la fecha en que viste cada pelicula para seguir tu ritmo.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 self-start sm:self-auto">
              {totalRatingsCount} entradas
            </span>
          </div>

          {diaryGroups.length > 0 ? (
            <div className="space-y-8">
              {diaryGroups.map((group) => (
                <div key={group.monthKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black text-white/90 tracking-wide uppercase">
                      {group.monthLabel}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({group.items.length} {group.items.length === 1 ? "pelicula" : "peliculas"})
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="glass-panel p-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-3"
                      >
                        <div className="relative h-16 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 shadow-md">
                          <Image
                            src={item.movie.posterUrl}
                            alt={item.movie.title}
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <Link
                            href={`/movie/${item.movie.tmdbId || item.movie.id}`}
                            className="text-xs font-bold text-white hover:text-primary transition-colors truncate block"
                          >
                            {item.movie.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">{item.movie.year}</p>
                          <p className="text-[10px] text-white/60">
                            {item.watchedAt
                              ? `Visto el ${formatDate(item.watchedAt)}`
                              : `Anotado el ${formatDate(item.createdAt)}`}
                          </p>
                        </div>
                        <div className="flex items-baseline gap-0.5 bg-[#0f111a] border border-white/5 px-2.5 py-1 rounded-xl">
                          <span className="text-base font-black text-primary">
                            {item.score}
                          </span>
                          <span className="text-[9px] text-muted-foreground">/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-3xl text-center space-y-4 border border-white/5">
              <h3 className="text-lg font-bold text-white">Diario vacio</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Al valorar una pelicula, marca la casilla &quot;Registrar fecha en mi diario&quot; para crear tu timeline cinematografico.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: WATCHLIST (FASE 5.2.1) */}
      {activeSubTab === "watchlist" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Mi Watchlist (Pendientes de Ver)
              </h2>
              <p className="text-xs text-muted-foreground">
                Peliculas que has guardado para ver mas tarde.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 self-start sm:self-auto">
              {watchlist.length} {watchlist.length === 1 ? "pelicula" : "peliculas"}
            </span>
          </div>

          {watchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-20 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 shadow-md">
                      <Image
                        src={item.movie.posterUrl}
                        alt={item.movie.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/movie/${item.movie.tmdbId || item.movie.id}`}
                        className="text-sm font-bold text-white hover:text-primary transition-colors truncate block"
                      >
                        {item.movie.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.movie.year}</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        Guardada el {formatDate(item.addedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/movie/${item.movie.tmdbId || item.movie.id}`}
                      className="px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Ficha
                    </Link>
                    <button
                      onClick={() => handleRemoveFromWatchlist(item.movie.id, item.id)}
                      disabled={removingWatchlistId === item.id}
                      className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
                      title="Quitar de mi lista"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-3xl text-center space-y-4 border border-white/5">
              <h3 className="text-lg font-bold text-white">Tu watchlist esta vacia</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Guarda peliculas para ver mas tarde haciendo clic en el boton &quot;Quiero Verla&quot; en cualquier ficha.
              </p>
              <Link
                href="/explore"
                className="inline-block px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/10"
              >
                Explorar Catalogo
              </Link>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: MIS LISTAS PERSONALIZADAS (Fase 5.2.2) */}
      {activeSubTab === "lists" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Mis Listas Personalizadas
              </h2>
              <p className="text-xs text-muted-foreground">
                Crea colecciones tematicas de cine para compartir con la comunidad o guardar en privado.
              </p>
            </div>
            {!creatingList && (
              <button
                onClick={() => setCreatingList(true)}
                className="px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-primary/20 self-start sm:self-auto"
              >
                + Crear Nueva Lista
              </button>
            )}
          </div>

          {/* Formulario de creación inline */}
          {creatingList && (
            <form
              onSubmit={handleCreateList}
              className="glass-panel p-6 rounded-3xl border border-primary/30 space-y-4 bg-primary/[0.02]"
            >
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Nueva Coleccion de Cine
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                    Nombre de la lista *
                  </label>
                  <input
                    type="text"
                    required
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Ej. Joyas ocultas de ciencia ficcion"
                    className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                    Descripcion (opcional)
                  </label>
                  <textarea
                    value={newListDesc}
                    onChange={(e) => setNewListDesc(e.target.value)}
                    rows={2}
                    placeholder="De que trata esta seleccion o para cuando la recomiendas..."
                    className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-primary/50 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="listIsPublic"
                    checked={newListPublic}
                    onChange={(e) => setNewListPublic(e.target.checked)}
                    className="rounded bg-[#0d101a] border-white/10 text-primary focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="listIsPublic" className="text-xs text-white/80 cursor-pointer font-semibold">
                    Hacer publica esta lista (accesible con enlace compartido)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCreatingList(false)}
                  className="px-4 py-2 rounded-full text-xs text-muted-foreground hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingList}
                  className="px-5 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-primary/20"
                >
                  {submittingList ? "Guardando..." : "Crear Lista"}
                </button>
              </div>
            </form>
          )}

          {/* Listado de colecciones */}
          {lists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lists.map((l) => (
                <div
                  key={l.id}
                  className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          l.isPublic
                            ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300"
                            : "bg-white/5 border-white/10 text-muted-foreground"
                        }`}
                      >
                        {l.isPublic ? "Publica" : "Privada"}
                      </span>
                      <span className="text-[11px] font-semibold text-primary">
                        {l.itemCount} {l.itemCount === 1 ? "pelicula" : "peliculas"}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white truncate">
                      <Link href={`/list/${l.id}`} className="hover:text-primary transition-colors">
                        {l.name}
                      </Link>
                    </h3>

                    {l.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {l.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
                    <Link
                      href={`/list/${l.id}`}
                      className="text-xs font-black text-primary-light hover:underline uppercase tracking-wider"
                    >
                      Ver Lista &rarr;
                    </Link>

                    <button
                      onClick={() => handleDeleteList(l.id)}
                      disabled={deletingListId === l.id}
                      className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors cursor-pointer"
                      title="Eliminar lista"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !creatingList && (
              <div className="glass-panel p-10 rounded-3xl text-center space-y-4 border border-white/5">
                <h3 className="text-lg font-bold text-white">No tienes listas creadas todavia</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Crea tu primera lista tematica para organizar tus recomendaciones y compartirlas en redes.
                </p>
                <button
                  onClick={() => setCreatingList(true)}
                  className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/10 cursor-pointer"
                >
                  Crear mi primera lista
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* PESTAÑA 3: DESBLOQUEOS DE LA COMUNIDAD */}
      {activeSubTab === "unlocks" && (
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white tracking-wide">
              Desbloqueos de la Comunidad
            </h2>
            <p className="text-xs text-muted-foreground">
              A medida que otros usuarios valoran peliculas que ya calificaste, se desbloquean nuevos niveles de detalle demografico. Aqui puedes ver como cambia la percepcion comunitaria de tus favoritas.
            </p>
          </div>

          {loadingUnlocks ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 bg-white/5 rounded-2xl" />
              <div className="h-20 bg-white/5 rounded-2xl" />
            </div>
          ) : unlocks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {unlocks.map((unlock) => (
                <div
                  key={unlock.movieId}
                  className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col md:flex-row items-center gap-4 justify-between"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative h-20 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 shadow-md">
                      <Image
                        src={unlock.posterUrl}
                        alt={unlock.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-[9px] font-black uppercase tracking-wider">
                          {levelLabels[unlock.level] || unlock.level}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {unlock.realCount} votos reales acumulados
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white leading-tight">
                        <Link
                          href={`/movie/${unlock.tmdbId}`}
                          className="hover:text-primary transition-colors"
                        >
                          {unlock.title} ({unlock.year})
                        </Link>
                      </h4>
                      {unlock.segmentLabel && unlock.segmentAvg !== null && (
                        <p className="text-xs text-muted-foreground">
                          Nota en tu segmento ({unlock.segmentLabel}):{" "}
                          <span className="text-white font-bold">{unlock.segmentAvg}</span>
                          {unlock.userScore !== null && (
                            <span> • Tu nota: <span className="text-primary font-bold">{unlock.userScore}</span></span>
                          )}
                        </p>
                      )}
                      {unlock.deviation !== null && (
                        <p className="text-[11px] font-semibold text-primary-light">
                          {unlock.deviation > 0
                            ? `Le diste +${unlock.deviation} puntos respecto a personas de tu grupo`
                            : unlock.deviation < 0
                              ? `Le diste ${unlock.deviation} puntos por debajo de personas de tu grupo`
                              : "Tu valoracion coincide exactamente con la media de tu grupo"}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/movie/${unlock.tmdbId}`}
                    className="w-full md:w-auto px-4 py-2 rounded-full bg-white/5 hover:bg-primary border border-white/10 hover:border-primary text-xs font-black uppercase tracking-wider text-white transition-all text-center flex-shrink-0"
                  >
                    Ver Desglose
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-3xl text-center space-y-4 border border-white/5">
              <h3 className="text-lg font-bold text-white">Sin desbloqueos recientes</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Las peliculas que has calificado todavia no han alcanzado el umbral de votos para desbloquear nuevos niveles en tu segmento. En cuanto la comunidad aporte mas valoraciones, apareceran aqui.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: EDICIÓN DE PERFIL Y AJUSTES */}
      {activeSubTab === "settings" && (
        <>
          <form
            onSubmit={handleSaveProfile}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6"
          >
            <h2 className="text-lg font-bold text-white tracking-wide border-b border-white/5 pb-3">
              Ajustes Personales y Demograficos
            </h2>

            {/* Aviso de impacto */}
            <div className="flex gap-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="space-y-1">
                <strong className="font-bold block">
                  Advertencia de Impacto Demografico
                </strong>
                <span>
                  CinePOV filtra las calificaciones por tu genero y tu edad para calcular las tendencias. Cambiar tu perfil demografico reubicara de forma inmediata todos tus votos historicos a tu nuevo segmento.
                </span>
              </div>
            </div>

            {/* Campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="displayName"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Nombre en pantalla
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full bg-[#0f111a] border border-white/10 focus:border-primary/50 outline-none text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-colors"
                  placeholder="Tu alias o nombre"
                />
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Direccion de Correo (Fijo)
                </label>
                <div className="w-full bg-[#0f111a] border border-white/5 text-muted-foreground text-sm font-semibold px-4 py-3 rounded-2xl cursor-not-allowed select-none">
                  {initialUser.email}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="gender"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Genero
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full bg-[#0f111a] border border-white/10 focus:border-primary/50 outline-none text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  <option value="" disabled>
                    Selecciona
                  </option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                  <option value="non_binary">No binario</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="birthYear"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Ano de nacimiento
                </label>
                <input
                  id="birthYear"
                  type="number"
                  min={MIN_BIRTH_YEAR}
                  max={maxBirthYear()}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full bg-[#0f111a] border border-white/10 focus:border-primary/50 outline-none text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-colors"
                  placeholder="Ej. 1995"
                />
              </div>
            </div>

            {/* Preferencias de Email */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Preferencias de Comunicacion
              </h3>
              <label className="flex items-start gap-3 bg-[#0f111a] border border-white/10 hover:border-white/15 p-4 rounded-2xl cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={emailWeeklyActive}
                  onChange={(e) => setEmailWeeklyActive(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-white/10 bg-transparent text-primary focus:ring-0 cursor-pointer"
                />
                <div className="space-y-0.5 text-left">
                  <span className="text-sm font-bold text-white block">
                    Boletin Semanal de Tendencias
                  </span>
                  <span className="text-xs text-muted-foreground block leading-normal font-medium">
                    Deseo recibir por correo electronico un boletin semanal con el Top 3 de peliculas recomendadas para mi grupo demografico.
                  </span>
                </div>
              </label>
            </div>

            {profileMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold border ${
                  profileMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase bg-primary hover:bg-primary-hover disabled:bg-primary/40 text-white transition-all shadow-lg shadow-primary/10 flex items-center gap-2 cursor-pointer"
              >
                {saving ? "Guardando cambios..." : "Guardar Ajustes"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <AccountDangerZone hasPassword={hasPassword} />
          </div>
        </>
      )}
    </div>
  );
}
