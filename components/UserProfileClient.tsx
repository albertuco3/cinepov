"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
  movie: Movie;
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

interface UserProfileClientProps {
  initialUser: User;
  initialRatings: Rating[];
}

export default function UserProfileClient({ initialUser, initialRatings }: UserProfileClientProps) {
  const { update } = useSession();
  // Estados para perfil
  const [displayName, setDisplayName] = useState(initialUser.displayName);
  const [gender, setGender] = useState(initialUser.gender || "");
  const [birthYear, setBirthYear] = useState(initialUser.birthYear ? String(initialUser.birthYear) : "");
  const [emailWeeklyActive, setEmailWeeklyActive] = useState(initialUser.emailWeeklyActive ?? true);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados para historial de valoraciones
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [sortBy, setSortBy] = useState<"date_desc" | "score_desc" | "score_asc">("date_desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Navegación de pestañas internas del perfil
  const [activeSubTab, setActiveSubTab] = useState<"ratings" | "settings">("ratings");

  // Calcular estadísticas básicas en caliente
  const totalRatingsCount = ratings.length;
  const averageScore = totalRatingsCount > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / totalRatingsCount).toFixed(1)
    : "—";

  // Calcular desviaciones para placeres culpables y críticas severas (Opción A)
  const ratingsWithDeviations = ratings.map((r) => {
    const dev = r.score - (r.movie.globalAvgScore || 0);
    return { ...r, deviation: parseFloat(dev.toFixed(1)) };
  });

  // Película más generosa: desviación positiva máxima (> 0)
  const generousCandidates = ratingsWithDeviations.filter((r) => r.deviation > 0);
  const generousMovie = generousCandidates.length > 0
    ? generousCandidates.sort((a, b) => b.deviation - a.deviation || b.score - a.score)[0]
    : null;

  // Película más dura: desviación negativa mínima (< 0)
  const harshCandidates = ratingsWithDeviations.filter((r) => r.deviation < 0);
  const harshMovie = harshCandidates.length > 0
    ? harshCandidates.sort((a, b) => a.deviation - b.deviation || a.score - b.score)[0]
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

  // Manejar guardado de cambios de perfil
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

      setProfileMessage({ type: "success", text: "¡Tu perfil se ha actualizado correctamente!" });
      toast.success("¡Perfil actualizado con éxito!");
      
      // Sincronizar NextAuth en caliente
      update();
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Error al procesar la solicitud." });
      toast.error(err.message || "Error al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  // Manejar borrado de valoraciones en vivo
  const handleDeleteRating = async (ratingId: string, movieId: string) => {
    setDeletingId(ratingId);
    try {
      const response = await fetch(`/api/ratings?movieId=${movieId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar la valoración.");
      }

      // Filtrar localmente de la lista con una animación fluida
      setRatings(ratings.filter((r) => r.id !== ratingId));
      toast.success("Valoración eliminada correctamente.");
      
      // Sincronizar el contador en el Header
      update();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al intentar eliminar la valoración.");
    } finally {
      setDeletingId(null);
    }
  };

  // Lógica de ordenación
  const sortedRatings = [...ratings].sort((a, b) => {
    if (sortBy === "date_desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "score_desc") {
      return b.score - a.score;
    }
    return a.score - b.score;
  });

  return (
    <div className="space-y-8">
      {/* CABECERA RESUMEN DEL USUARIO */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center md:justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar por defecto */}
          <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-black">
            {initialUser.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white">{initialUser.displayName}</h1>
            <p className="text-sm text-muted-foreground">{initialUser.email}</p>
            <p className="text-xs text-muted-foreground/80">
              Miembro de CinePOV desde {formatDate(initialUser.createdAt)}
            </p>
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/5 px-5 py-3 rounded-2xl text-center">
            <div className="text-2xl font-black text-white">{totalRatingsCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider pt-0.5">
              Valoradas
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/10 px-5 py-3 rounded-2xl text-center">
            <div className="text-2xl font-black text-primary">{averageScore}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider pt-0.5">
              Nota Media
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES DE PESTAÑA PROPIAS DEL ÁREA PRIVADA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-2 gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab("ratings")}
            className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all duration-300 ${
              activeSubTab === "ratings"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            Mis Valoraciones ({totalRatingsCount})
          </button>
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all duration-300 ${
              activeSubTab === "settings"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            Editar Perfil y Demografía
          </button>
        </div>

        <Link
          href="/import"
          className="flex-shrink-0 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase border border-white/10 hover:border-white/20 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importar (Letterboxd / IMDb)
        </Link>
      </div>

      {/* PESTAÑA A: MIS VALORACIONES */}
      {activeSubTab === "ratings" && (
        <div className="space-y-6">
          {/* SECCIÓN DE GAMIFICACIÓN E HITOS */}
          {totalRatingsCount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Hito 1: Bronce */}
              <div className={`glass-panel p-5 rounded-3xl border text-center space-y-2 flex flex-col items-center justify-center interactive-transition ${
                totalRatingsCount >= 10
                  ? "border-amber-700/30 bg-amber-900/5 text-white"
                  : "border-white/5 bg-white/1 opacity-40 grayscale"
              }`}>
                <span className="text-4xl">🥉</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Cinéfilo Iniciado</h4>
                  <p className="text-[10px] text-muted-foreground">Valorar 10 películas ({Math.min(totalRatingsCount, 10)}/10)</p>
                </div>
                {totalRatingsCount >= 10 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">¡Conseguido!</span>
                )}
              </div>

              {/* Hito 2: Plata */}
              <div className={`glass-panel p-5 rounded-3xl border text-center space-y-2 flex flex-col items-center justify-center interactive-transition ${
                totalRatingsCount >= 50
                  ? "border-slate-400/30 bg-slate-500/5 text-white"
                  : "border-white/5 bg-white/1 opacity-40 grayscale"
              }`}>
                <span className="text-4xl">🥈</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Crítico de CinePOV</h4>
                  <p className="text-[10px] text-muted-foreground">Valorar 50 películas ({Math.min(totalRatingsCount, 50)}/50)</p>
                </div>
                {totalRatingsCount >= 50 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-400/10 text-slate-300 border border-slate-400/20 text-[9px] font-bold">¡Conseguido!</span>
                )}
              </div>

              {/* Hito 3: Oro */}
              <div className={`glass-panel p-5 rounded-3xl border text-center space-y-2 flex flex-col items-center justify-center interactive-transition ${
                totalRatingsCount >= 100
                  ? "border-yellow-500/30 bg-yellow-500/5 text-white"
                  : "border-white/5 bg-white/1 opacity-40 grayscale"
              }`}>
                <span className="text-4xl">🥇</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Maestro de la Perspectiva</h4>
                  <p className="text-[10px] text-muted-foreground">Valorar 100 películas ({Math.min(totalRatingsCount, 100)}/100)</p>
                </div>
                {totalRatingsCount >= 100 && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold">¡Conseguido!</span>
                )}
              </div>
            </div>
          )}

          {/* PERFIL CRÍTICO: MÁS GENEROSA / MÁS DURA (OPCIÓN A) */}
          {(generousMovie || harshMovie) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tu Identidad Crítica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Más Generosa */}
                {generousMovie ? (
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
                        🍿 Tu Placer Culpable
                      </span>
                      <h4 className="text-sm font-black text-white truncate leading-tight mt-1">
                        <Link href={`/movie/${generousMovie.movie.tmdbId || generousMovie.movie.id}`} className="hover:text-emerald-400 transition-colors">
                          {generousMovie.movie.title}
                        </Link>
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        Tu nota: <span className="text-white font-bold">{generousMovie.score}</span> • Media: <span className="text-white/60">{generousMovie.movie.globalAvgScore}</span>
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold">
                        La valoras un {generousMovie.deviation > 0 ? `+${generousMovie.deviation}` : generousMovie.deviation} por encima de la media
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center justify-center text-center opacity-65 text-xs text-muted-foreground min-h-[110px]">
                    No has valorado ninguna película por encima de su media global todavía.
                  </div>
                )}

                {/* Más Dura */}
                {harshMovie ? (
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
                        ⚡ Tu Crítica más Severa
                      </span>
                      <h4 className="text-sm font-black text-white truncate leading-tight mt-1">
                        <Link href={`/movie/${harshMovie.movie.tmdbId || harshMovie.movie.id}`} className="hover:text-rose-400 transition-colors">
                          {harshMovie.movie.title}
                        </Link>
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        Tu nota: <span className="text-white font-bold">{harshMovie.score}</span> • Media: <span className="text-white/60">{harshMovie.movie.globalAvgScore}</span>
                      </p>
                      <p className="text-[10px] text-rose-400 font-bold">
                        La valoras un {harshMovie.deviation} por debajo de la media
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center justify-center text-center opacity-65 text-xs text-muted-foreground min-h-[110px]">
                    No has valorado ninguna película por debajo de su media global todavía.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Separador */}
          {totalRatingsCount > 0 && <div className="h-px bg-white/5" />}

          {/* Cabecera del Listado con Ordenación */}
          {totalRatingsCount > 0 ? (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-wide">Películas Calificadas</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#0f111a] border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-primary/50"
                >
                  <option value="date_desc">Fecha (Recientes primero)</option>
                  <option value="score_desc">Nota (Mayor a menor)</option>
                  <option value="score_asc">Nota (Menor a mayor)</option>
                </select>
              </div>
            </div>
          ) : null}

          {/* Listado de Tarjetas */}
          {totalRatingsCount > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sortedRatings.map((rating) => (
                <div
                  key={rating.id}
                  className={`glass-panel p-4 sm:p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col sm:flex-row items-center gap-4 sm:justify-between ${
                    deletingId === rating.id ? "opacity-50 pointer-events-none scale-95" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full">
                    {/* Mini Póster */}
                    <div className="relative h-20 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 shadow-md">
                      <Image
                        src={rating.movie.posterUrl}
                        alt={rating.movie.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1">
                      <Link
                        href={`/movie/${rating.movie.tmdbId || rating.movie.id}`}
                        className="text-base font-bold text-white hover:text-primary transition-colors cursor-pointer"
                      >
                        {rating.movie.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{rating.movie.year}</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        Valorada el {formatDate(rating.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Acciones e Indicador de Nota */}
                  <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Puntuación */}
                    <div className="flex items-baseline gap-0.5 bg-[#0f111a] border border-white/5 px-4 py-2.5 rounded-2xl">
                      <span className="text-2xl font-black text-primary">{rating.score}</span>
                      <span className="text-[10px] text-muted-foreground">/10</span>
                    </div>

                    {/* Botón Borrar */}
                    <button
                      onClick={() => handleDeleteRating(rating.id, rating.movie.id)}
                      disabled={deletingId === rating.id}
                      className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
                      title="Eliminar valoración"
                    >
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Estado Vacío de Valoraciones */
            <div className="glass-panel p-10 rounded-3xl text-center space-y-4 border border-white/5">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Ninguna valoración todavía</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No has valorado ninguna película en CinePOV. ¡Ve al catálogo de exploración y califica tus películas favoritas para verlas aquí!
              </p>
              <Link
                href="/explore"
                className="inline-block px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/10"
              >
                Explorar Catálogo
              </Link>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA B: EDICIÓN DE PERFIL Y DEMOGRAFÍA */}
      {activeSubTab === "settings" && (
        <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white tracking-wide border-b border-white/5 pb-3">
            Ajustes Personales y Demográficos
          </h2>

          {/* WARNING ALERT DEMOGRÁFICO */}
          <div className="flex gap-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-1">
              <strong className="font-bold block">Advertencia de Impacto Demográfico</strong>
              <span>
                CinePOV filtra las calificaciones por tu género y tu edad para calcular las tendencias. Cambiar tu perfil demográfico reubicará de forma inmediata todos tus votos históricos a tu nuevo segmento de comunidad.
              </span>
            </div>
          </div>

          {/* Formulario de campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nombre de usuario */}
            <div className="space-y-1.5">
              <label htmlFor="displayName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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

            {/* Email (Solo Lectura) */}
            <div className="space-y-1.5 opacity-60">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Dirección de Correo (Fijo)
              </label>
              <div className="w-full bg-[#0f111a] border border-white/5 text-muted-foreground text-sm font-semibold px-4 py-3 rounded-2xl cursor-not-allowed select-none">
                {initialUser.email}
              </div>
            </div>

            {/* Género */}
            <div className="space-y-1.5">
              <label htmlFor="gender" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Género
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="w-full bg-[#0f111a] border border-white/10 focus:border-primary/50 outline-none text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-colors cursor-pointer"
              >
                <option value="" disabled>Selecciona</option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="non_binary">No binario</option>
              </select>
            </div>

            {/* Año de nacimiento */}
            <div className="space-y-1.5">
              <label htmlFor="birthYear" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Año de nacimiento
              </label>
              <input
                id="birthYear"
                type="number"
                min="1920"
                max={new Date().getFullYear()}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full bg-[#0f111a] border border-white/10 focus:border-primary/50 outline-none text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-colors"
                placeholder="Ej. 1995"
              />
            </div>
          </div>

          {/* Preferencias de Email (Fase 2.4.3) */}
          <div className="pt-2 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Preferencias de Comunicación y Notificaciones
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
                  Boletín Semanal de Tendencias
                </span>
                <span className="text-xs text-muted-foreground block leading-normal font-medium">
                  Deseo recibir por correo electrónico un boletín semanal con el Top 3 de películas recomendadas y populares específicas de mi segmento demográfico.
                </span>
              </div>
            </label>
          </div>

          {/* Mensajes de respuesta de la API */}
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

          {/* Botón de Guardado */}
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
      )}
    </div>
  );
}
