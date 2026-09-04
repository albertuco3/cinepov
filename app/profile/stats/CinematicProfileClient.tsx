"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { type CinematicProfileData } from "@/lib/cinematic-profile";

interface Props {
  profile: CinematicProfileData;
  userName: string;
}

export default function CinematicProfileClient({ profile, userName }: Props) {
  const [copied, setCopied] = useState(false);

  // Determinar altura máxima del histograma para escalar las barras
  const maxHistogramCount = Math.max(...Object.values(profile.histogram), 1);

  const handleCopySummary = async () => {
    const lines = [
      `Perfil Cinematografico de ${userName} en CinePOV:`,
      `- Nota media: ${profile.averageScore}/10 (${profile.totalRatings} peliculas)`,
      profile.twinSegment
        ? `- Gemelo Demografico: ${profile.twinSegment.segmentLabel} (${profile.twinSegment.affinityPercentage}% afinidad)`
        : "",
      profile.favoriteDecade ? `- Decada favorita: ${profile.favoriteDecade.decadeLabel}` : "",
      `- Criterio: ${profile.generosity.label}`,
      `Descubre tu punto de vista en https://cinepov.com`,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      toast.success("Resumen copiado al portapapeles.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar.");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
            Radiografia Personal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Tu Perfil Cinematografico
          </h1>
          <p className="text-sm text-muted-foreground">
            Patrones de gusto, sesgo critico y afinidad estadistica calculados a partir de tus votos.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleCopySummary}
            className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            {copied ? "Copiado" : "Compartir Mi Perfil"}
          </button>
          <Link
            href="/profile"
            className="px-4 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
          >
            Mi Perfil
          </Link>
        </div>
      </div>

      {/* 2. Tarjeta Estrella: TU GEMELO DEMOGRÁFICO */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-[#101322] to-indigo-950/40 p-6 sm:p-8 space-y-4 shadow-xl shadow-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full">
              Algoritmo de Afinidad
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Tu Gemelo Demografico
            </h2>
          </div>

          {profile.totalRatings >= 5 && profile.twinSegment ? (
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-black text-primary tabular-nums block">
                {profile.twinSegment.affinityPercentage}%
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Afinidad Estadistica
              </span>
            </div>
          ) : profile.totalRatings < 5 ? (
            <div className="text-right">
              <span className="text-xs uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                Bloqueado
              </span>
            </div>
          ) : null}
        </div>

        {profile.totalRatings < 5 ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">Progreso de Desbloqueo</span>
                <span className="text-primary-light">{profile.totalRatings} / 5 valoraciones</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (profile.totalRatings / 5) * 100)}%` }}
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Necesitas al menos 5 valoraciones para calcular tu afinidad estadistica de forma fiable. Valora{" "}
                <strong className="text-white">{5 - profile.totalRatings} {5 - profile.totalRatings === 1 ? "pelicula mas" : "peliculas mas"}</strong> para revelar que colectivo piensa exactamente como tu.
              </p>
            </div>
          </div>
        ) : profile.twinSegment ? (
          <div className="space-y-3 pt-2">
            <p className="text-base sm:text-lg font-bold text-white">
              Tus gustos coinciden principalmente con:{" "}
              <span className="text-primary-light">{profile.twinSegment.segmentLabel}</span>
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Al comparar tus calificaciones directas con la media de cada grupo de la comunidad en las mismas peliculas ({profile.twinSegment.moviesCompared} titulos coincidentes), este es el segmento con la menor discrepancia respecto a tu criterio.
            </p>
          </div>
        ) : (
          <div className="pt-2 text-xs text-muted-foreground leading-relaxed">
            Aun no has calificado suficientes peliculas coincidentes con los segmentos de la comunidad. Sigue valorando peliculas del catalogo para calcular tu Gemelo.
          </div>
        )}
      </div>

      {/* 3. Métricas Principales (Generosidad y Década) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Generosidad / Severidad */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Severidad y Criterio
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white tabular-nums">
              {profile.averageScore}
            </span>
            <span className="text-xs text-muted-foreground">
              tu media vs. {profile.generosity.globalAvg || "--"} comunitaria
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold text-white/90">
            {profile.generosity.label}
          </div>
        </div>

        {/* Década favorita */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Decada Predilecta
          </span>
          {profile.favoriteDecade ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">
                  {profile.favoriteDecade.decadeLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  media de {profile.favoriteDecade.avgScore}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold text-white/90">
                Has calificado {profile.favoriteDecade.count} titulos de esta epoca.
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground pt-3">Sin valoraciones registradas.</p>
          )}
        </div>
      </div>

      {/* 4. Histograma de Puntuaciones */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Distribucion de tus Notas</h3>
          <p className="text-xs text-muted-foreground">
            Frecuencia con la que otorgas cada puntuacion del 1 al 10.
          </p>
        </div>

        <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
            const count = profile.histogram[score] || 0;
            const heightPct = Math.max((count / maxHistogramCount) * 100, 4);

            return (
              <div key={score} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                    count > 0
                      ? "bg-primary/80 group-hover:bg-primary group-hover:scale-y-105"
                      : "bg-white/5"
                  }`}
                />
                <span className="text-xs font-bold text-white/80">{score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Géneros Más y Menos Valorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Géneros */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-emerald-400">Generos con Mayor Puntuacion</h3>
          {profile.topGenres.length > 0 ? (
            <div className="space-y-2.5">
              {profile.topGenres.map((g, idx) => (
                <div
                  key={g.genre}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground w-4">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white">{g.genre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px]">({g.count} peliculas)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-black">
                      {g.avgScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos suficientes.</p>
          )}
        </div>

        {/* Bottom Géneros */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-rose-400">Generos con Menor Puntuacion</h3>
          {profile.bottomGenres.length > 0 ? (
            <div className="space-y-2.5">
              {profile.bottomGenres.map((g, idx) => (
                <div
                  key={g.genre}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground w-4">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white">{g.genre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px]">({g.count} peliculas)</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/25 text-rose-300 font-black">
                      {g.avgScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos suficientes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
