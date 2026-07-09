"use client";

import { useState, useEffect } from "react";

interface DemographicsData {
  movieId: string;
  global: { avg: number | null; count: number };
  byGender: {
    male: { avg: number | null; count: number };
    female: { avg: number | null; count: number };
    non_binary: { avg: number | null; count: number };
  };
  byAgeRange: {
    "18_24": { avg: number | null; count: number };
    "25_34": { avg: number | null; count: number };
    "35_44": { avg: number | null; count: number };
    "45_54": { avg: number | null; count: number };
    "55_plus": { avg: number | null; count: number };
  };
  cross: Record<string, Record<string, { avg: number | null; count: number }>>;
}

interface MovieDemographicsProps {
  movieId: string;
  userGender: string | null;
  userBirthYear: number | null;
}

export default function MovieDemographics({ movieId, userGender, userBirthYear }: MovieDemographicsProps) {
  const [data, setData] = useState<DemographicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "matrix">("summary");

  useEffect(() => {
    const loadDemographics = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}/demographics`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar los datos demográficos.");
        }
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    loadDemographics();
  }, [movieId]);

  // 1. Obtener segmento de edad del usuario actual (si está logueado)
  const getUserAgeSegment = () => {
    if (!userBirthYear) return null;
    const currentYear = new Date().getFullYear();
    const age = currentYear - userBirthYear;

    if (age >= 18 && age <= 24) return { key: "18_24", label: "18-24" };
    if (age >= 25 && age <= 34) return { key: "25_34", label: "25-34" };
    if (age >= 35 && age <= 44) return { key: "35_44", label: "35-44" };
    if (age >= 45 && age <= 54) return { key: "45_54", label: "45-54" };
    return { key: "55_plus", label: "55+" };
  };

  const getGenderLabel = (g: string) => {
    if (g === "male") return "Hombres";
    if (g === "female") return "Mujeres";
    return "No binarios";
  };

  // 2. Helper de color para celdas de la matriz de calor (Heatmap)
  const getCellBgClass = (avg: number | null) => {
    if (avg === null) return "bg-white/5 text-muted-foreground border border-white/5";
    if (avg < 5.0) return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (avg < 7.0) return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    if (avg < 8.5) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    return "bg-emerald-400/20 text-emerald-300 font-extrabold border border-emerald-400/30 shadow-sm shadow-emerald-400/5";
  };

  // --- RENDERIZADO: SKELETON LOADER ---
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-28 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 bg-white/5 rounded-3xl" />
          <div className="h-64 bg-white/5 rounded-3xl" />
        </div>
        <div className="h-72 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  // --- RENDERIZADO: ERROR ---
  if (error || !data) {
    return (
      <div className="text-center py-8 bg-red-500/5 rounded-2xl border border-red-500/10 text-red-400 text-sm">
        Ocurrió un problema al procesar el desglose demográfico: {error || "Sin datos disponibles."}
      </div>
    );
  }

  // --- RENDERIZADO: ESTADO VACÍO (0 Votos en CinePOV) ---
  if (data.global.count === 0) {
    return (
      <div className="glass-panel p-8 sm:p-10 rounded-3xl text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground">
          <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Gráficos Demográficos en Espera</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Aún no se han registrado suficientes valoraciones en la comunidad para activar los desgloses visuales por edad y género. ¡Sé el primero en calificar esta película!
        </p>
      </div>
    );
  }

  // 3. Evaluar segmento del usuario logueado
  const ageSegment = getUserAgeSegment();
  let userSegmentScore: number | null = null;
  let userSegmentVotes = 0;

  if (userGender && ageSegment && data.cross[userGender] && data.cross[userGender][ageSegment.key]) {
    const cell = data.cross[userGender][ageSegment.key];
    userSegmentScore = cell.avg;
    userSegmentVotes = cell.count;
  }

  return (
    <div className="space-y-10">
      {/* 1. SECCIÓN DESTACADA: "Personas como tú" */}
      {userGender && ageSegment && (
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl shadow-primary/5">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-primary/20 border border-primary/30 text-white px-2.5 py-1 rounded-full">
              Punto de Vista Personal
            </span>
            <h3 className="text-xl font-bold text-white pt-1">
              Personas como tú ({getGenderLabel(userGender).slice(0, -1)} de {ageSegment.label} años)
            </h3>
            <p className="text-sm text-muted-foreground">
              {userSegmentScore !== null
                ? `Califican esta película con un promedio de ${userSegmentScore} (sobre un total de ${userSegmentVotes} votos del segmento).`
                : "Aún no hay suficientes votos en tu segmento para dar una nota exacta. ¡Vota y sé el primero!"}
            </p>
          </div>
          {userSegmentScore !== null ? (
            <div className="flex items-baseline justify-center sm:justify-start gap-1 bg-[#0f111a] border border-white/10 px-6 py-4 rounded-2xl sm:flex-shrink-0 self-center">
              <span className="text-4xl font-black text-primary">{userSegmentScore}</span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
          ) : (
            <div className="text-xs font-semibold text-muted-foreground bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-center self-center sm:flex-shrink-0">
              Datos insuficientes
            </div>
          )}
        </div>
      )}

      {/* 1.5. SELECTOR DE PESTAÑAS INTERACTIVAS */}
      <div className="flex border-b border-white/5 pb-2 gap-2">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all duration-300 ${
            activeTab === "summary"
              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
          }`}
        >
          Resumen Demográfico
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all duration-300 ${
            activeTab === "matrix"
              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
          }`}
        >
          Matriz Cruzada (Género × Edad)
        </button>
      </div>

      {/* 2. RENDERS CONDICIONALES EN BASE A LA PESTAÑA ACTIVA */}
      {activeTab === "summary" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gráfico A: Barras por Género */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/5">
          <h3 className="text-lg font-bold text-white tracking-wide border-b border-white/5 pb-3">
            Calificación por Género
          </h3>
          <div className="space-y-5">
            {Object.entries(data.byGender).map(([genderKey, stats]) => {
              const label = getGenderLabel(genderKey);
              const hasData = stats.avg !== null;
              const percentage = hasData ? (stats.avg! / 10) * 100 : 0;
              
              // Colores de barras
              let barBg = "bg-white/10";
              if (hasData) {
                if (genderKey === "male") barBg = "bg-gradient-to-r from-cyan-500 to-blue-500";
                else if (genderKey === "female") barBg = "bg-gradient-to-r from-pink-500 to-violet-500";
                else barBg = "bg-gradient-to-r from-violet-500 to-fuchsia-500";
              }

              return (
                <div key={genderKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-white">
                      {hasData ? `${stats.avg} (${stats.count} v.)` : "Insuficiente (<3 v.)"}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    {hasData && (
                      <div
                        className={`h-full rounded-full ${barBg} interactive-transition`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico B: Barras por Edad */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/5">
          <h3 className="text-lg font-bold text-white tracking-wide border-b border-white/5 pb-3">
            Calificación por Rango de Edad
          </h3>
          <div className="space-y-4">
            {Object.entries(data.byAgeRange).map(([ageKey, stats]) => {
              const label = ageKey.replace("_", "-").replace("plus", "+");
              const hasData = stats.avg !== null;
              const percentage = hasData ? (stats.avg! / 10) * 100 : 0;

              return (
                <div key={ageKey} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">{label} años</span>
                    <span className="text-white">
                      {hasData ? `${stats.avg} (${stats.count} v.)` : "Insuficiente (<3 v.)"}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    {hasData && (
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 interactive-transition"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      ) : (
        /* 3. HEATMAP: Matriz de Calor Cruzada Género × Edad */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-wide">
            Matriz de Calor: Género × Edad
          </h3>
          <p className="text-xs text-muted-foreground">
            Cruce estadístico detallado. El color indica el nivel de calificación (verde para notas altas, rojo para bajas).
          </p>
        </div>

        <div className="overflow-x-auto">
          {/* Cuadrícula de la Matriz (mínimo 600px de ancho en pantallas muy pequeñas para no romperse) */}
          <div className="min-w-[550px] grid grid-cols-6 gap-2 pt-2">
            {/* Esquina vacía */}
            <div className="flex items-center justify-center p-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-white/5 rounded-xl border border-white/5">
              CinePOV
            </div>
            {/* Cabeceras de Edad */}
            {["18-24", "25-34", "35-44", "45-54", "55+"].map((h) => (
              <div
                key={h}
                className="flex items-center justify-center p-2.5 text-xs font-bold text-white bg-white/5 rounded-xl border border-white/5 text-center"
              >
                {h}
              </div>
            ))}

            {/* Fila Hombres */}
            <div className="flex items-center p-3 text-xs font-bold text-white bg-white/5 rounded-xl border border-white/5">
              Hombres
            </div>
            {["18_24", "25_34", "35_44", "45_54", "55_plus"].map((k) => {
              const cell = data.cross.male?.[k] || { avg: null, count: 0 };
              return (
                <div
                  key={`m-${k}`}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center interactive-transition ${getCellBgClass(
                    cell.avg
                  )}`}
                >
                  <span className="text-sm font-black">{cell.avg !== null ? cell.avg : "—"}</span>
                  <span className="text-[9px] opacity-75">{cell.count} v.</span>
                </div>
              );
            })}

            {/* Fila Mujeres */}
            <div className="flex items-center p-3 text-xs font-bold text-white bg-white/5 rounded-xl border border-white/5">
              Mujeres
            </div>
            {["18_24", "25_34", "35_44", "45_54", "55_plus"].map((k) => {
              const cell = data.cross.female?.[k] || { avg: null, count: 0 };
              return (
                <div
                  key={`f-${k}`}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center interactive-transition ${getCellBgClass(
                    cell.avg
                  )}`}
                >
                  <span className="text-sm font-black">{cell.avg !== null ? cell.avg : "—"}</span>
                  <span className="text-[9px] opacity-75">{cell.count} v.</span>
                </div>
              );
            })}

            {/* Fila No Binarios */}
            <div className="flex items-center p-3 text-xs font-bold text-white bg-white/5 rounded-xl border border-white/5">
              No Binarios
            </div>
            {["18_24", "25_34", "35_44", "45_54", "55_plus"].map((k) => {
              const cell = data.cross.non_binary?.[k] || { avg: null, count: 0 };
              return (
                <div
                  key={`nb-${k}`}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center interactive-transition ${getCellBgClass(
                    cell.avg
                  )}`}
                >
                  <span className="text-sm font-black">{cell.avg !== null ? cell.avg : "—"}</span>
                  <span className="text-[9px] opacity-75">{cell.count} v.</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
