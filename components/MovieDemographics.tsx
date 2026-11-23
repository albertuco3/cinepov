"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n/client";
import {
  AGE_BROAD_KEYS,
  AGE_BROAD_LABELS,
  AGE_KEYS,
  AGE_RANGE_LABELS,
  GENDER_KEYS,
  GENDER_LABELS,
  ageBroadFromAgeKey,
  ageKeyFromBirthYear,
  isGenderKey,
  type AgeKey,
  type DemographicsPayload,
  type GenderKey,
  type GranularityLevel,
  type Segment,
} from "@/lib/demographics";

interface MovieDemographicsProps {
  movieId: string;
  userGender: string | null;
  userBirthYear: number | null;
}

export default function MovieDemographics({ movieId, userGender, userBirthYear }: MovieDemographicsProps) {
  const { dict, locale } = useI18n();
  const [data, setData] = useState<DemographicsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Exclude<GranularityLevel, "global"> | null>(null);

  const tabs: { level: Exclude<GranularityLevel, "global">; label: string; short: string }[] = useMemo(() => [
    { level: "age_broad", label: dict.movie.byGeneration, short: locale === "en" ? "Generation" : "Generación" },
    { level: "gender", label: dict.movie.byGender, short: locale === "en" ? "Gender" : "Género" },
    { level: "age_full", label: dict.movie.byDetailedAge, short: locale === "en" ? "Age" : "Edad" },
    { level: "cross", label: dict.movie.fullMatrix, short: locale === "en" ? "Matrix" : "Matriz" },
  ], [dict, locale]);

  useEffect(() => {
    const loadDemographics = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}/demographics`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar los datos demográficos.");
        }
        const json: DemographicsPayload = await response.json();
        setData(json);
        track("demographics_viewed", {
          max_level: json.maxLevel,
          real_ratings_count: json.counts.real,
        });
        // Abrir siempre en el nivel más alto que tenga datos reales sólidos.
        // Nunca se abre en una vista mayoritariamente vacía.
        setActiveTab(json.maxLevel === "global" ? "age_broad" : json.maxLevel);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    loadDemographics();
  }, [movieId]);

  const userSegment = useMemo(() => {
    if (!userBirthYear || !userGender || !isGenderKey(userGender)) return null;
    const ageKey = ageKeyFromBirthYear(userBirthYear);
    if (!ageKey) return null;
    return { gender: userGender, ageKey, ageLabel: AGE_RANGE_LABELS[ageKey] };
  }, [userGender, userBirthYear]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-28 bg-white/5 rounded-3xl" />
        <div className="h-12 bg-white/5 rounded-full max-w-lg" />
        <div className="h-72 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 bg-red-500/5 rounded-2xl border border-red-500/10 text-red-400 text-sm">
        Ocurrió un problema al procesar el desglose demográfico: {error || "Sin datos disponibles."}
      </div>
    );
  }

  const { counts, progress, real } = data;

  // Estado vacío absoluto: nadie ha valorado todavía la película.
  if (counts.real === 0) {
    return (
      <div className="glass-panel p-8 sm:p-10 rounded-3xl text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Este desglose está por escribir</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Nadie ha valorado todavía esta película en CinePOV. Si la votas, serás quien cree el primer dato
          demográfico de esta ficha.
        </p>
      </div>
    );
  }

  const handleTabSwitch = (level: Exclude<GranularityLevel, "global">) => {
    setActiveTab(level);
    track("demographics_tab_switched", { level });
    const p = progress[level];
    if (p && !p.unlocked) {
      track("demographics_locked_level_viewed", { level });
    }
  };

  const activeProgress = activeTab ? progress[activeTab] : null;

  return (
    <div className="space-y-8">
      {/* 1. Origen de los datos: cuántas personas reales hay detrás */}
      <DataProvenanceBar realCount={counts.real} />

      {/* 2. Tarjeta destacada del segmento del usuario */}
      {userSegment && (
        <UserSegmentCard
          segment={real.cross[userSegment.gender][userSegment.ageKey]}
          genderLabel={GENDER_LABELS[userSegment.gender]}
          ageLabel={userSegment.ageLabel}
          broadSegment={real.byAgeBroad[ageBroadFromAgeKey(userSegment.ageKey)]}
        />
      )}

      {/* 3. Pestañas de la escalera de granularidad */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {tabs.map((tab) => {
          const p = progress[tab.level];
          const isActive = activeTab === tab.level;
          return (
            <button
              key={tab.level}
              onClick={() => handleTabSwitch(tab.level)}
              className={`group relative px-4 py-2.5 rounded-full text-[11px] font-black tracking-wide uppercase border interactive-transition cursor-pointer ${
                isActive
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : p.unlocked
                    ? "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
                    : "bg-transparent border-dashed border-white/10 text-muted-foreground/60 hover:text-muted-foreground hover:border-white/20"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
                {!p.unlocked && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-muted-foreground border border-white/10"
                    }`}
                  >
                    {locale === "en" ? "Calibrating" : "En calibración"}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Aviso de nivel bloqueado, con progreso en lugar de un vacío sin explicación */}
      {activeProgress && !activeProgress.unlocked && (
        <LockedLevelNotice progress={activeProgress} />
      )}

      {/* 5. Contenido del nivel activo */}
      {activeTab === "age_broad" && (
        <BarChartPanel
          title={locale === "en" ? "Ratings by generation" : "Calificación por generación"}
          subtitle={locale === "en" ? "Generational cohorts accumulate reliable data the fastest." : "La brecha generacional es el corte que más rápido acumula datos fiables."}
          rows={AGE_BROAD_KEYS.map((k) => ({
            key: k,
            label: `${AGE_BROAD_LABELS[k]} ${locale === "en" ? "years old" : "años"}`,
            segment: real.byAgeBroad[k],
          }))}
          gradient="bg-gradient-to-r from-violet-500 to-cyan-500"
        />
      )}

      {activeTab === "gender" && (
        <BarChartPanel
          title={locale === "en" ? "Ratings by gender" : "Calificación por género"}
          subtitle={locale === "en" ? "Segments exceeding the verified real ratings threshold." : "Se muestran los segmentos que superan el mínimo de valoraciones reales."}
          rows={GENDER_KEYS.map((k) => ({
            key: k,
            label: locale === "en"
              ? ({ male: "Men", female: "Women", non_binary: "Non-Binary", prefer_not_to_say: "Other" }[k] || k)
              : GENDER_LABELS[k],
            segment: real.byGender[k],
            gradient:
              k === "male"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                : k === "female"
                  ? "bg-gradient-to-r from-pink-500 to-violet-500"
                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500",
          }))}
        />
      )}

      {activeTab === "age_full" && (
        <BarChartPanel
          title={locale === "en" ? "Ratings by age range" : "Calificación por rango de edad"}
          subtitle={locale === "en" ? "Five age brackets. Requires more data than generational view." : "Cinco tramos de edad. Requiere más datos que la vista por generación."}
          rows={AGE_KEYS.map((k) => ({
            key: k,
            label: `${AGE_RANGE_LABELS[k]} ${locale === "en" ? "years old" : "años"}`,
            segment: real.byAgeRange[k],
          }))}
          gradient="bg-gradient-to-r from-violet-500 to-cyan-500"
        />
      )}

      {activeTab === "cross" && (
        <CrossMatrix
          real={real.cross}
          segmentMinVotes={data.segmentMinVotes}
          highlight={userSegment ? { gender: userSegment.gender, ageKey: userSegment.ageKey } : null}
        />
      )}

      {/* 6. Enlace permanente a la metodología */}
      <p className="text-[11px] text-muted-foreground text-center pt-2">
        {locale === "en" ? "How are these scores computed and where do they come from?" : "¿Cómo se calculan estos datos y de dónde salen?"}{" "}
        <Link
          href="/metodologia"
          onClick={() => track("methodology_clicked", { source: "movie_demographics" })}
          className="text-primary-light font-semibold hover:underline"
        >
          {dict.movie.methodologyLink}
        </Link>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DataProvenanceBar({ realCount }: { realCount: number }) {
  const { dict } = useI18n();

  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-4 sm:p-5 space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {dict.movie.dataProvenance}
      </p>
      <p className="text-sm font-semibold text-white">
        <span className="text-emerald-400">{realCount}</span>{" "}
        {realCount === 1 ? dict.movie.realVote : dict.movie.realVotes}
      </p>
    </div>
  );
}

function UserSegmentCard({
  segment,
  genderLabel,
  ageLabel,
  broadSegment,
}: {
  segment: Segment;
  genderLabel: string;
  ageLabel: string;
  broadSegment: Segment;
}) {
  const { locale } = useI18n();
  const singular = genderLabel.endsWith("s") ? genderLabel.slice(0, -1) : genderLabel;
  // Si el cruce exacto aún no tiene datos, se cae al corte por generación,
  // que es más grueso pero real. Es mejor un dato amplio que ningún dato.
  const fallback = segment.avg === null && broadSegment.avg !== null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl shadow-primary/5">
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-black tracking-widest bg-primary/20 border border-primary/30 text-white px-2.5 py-1 rounded-full">
          {locale === "en" ? "Your point of view" : "Tu punto de vista"}
        </span>
        <h3 className="text-xl font-bold text-white pt-1">
          {locale === "en" ? `People like you (${singular}, ${ageLabel})` : `Personas como tú (${singular} de ${ageLabel})`}
        </h3>
        <p className="text-sm text-muted-foreground">
          {locale === "en" ? (
            segment.avg !== null
              ? `Rate this movie with a ${segment.avg} average, across ${segment.count} verified ${segment.count === 1 ? "rating" : "ratings"} from your cohort.`
              : fallback
                ? `Your exact segment does not have enough data yet. Your generation rates it ${broadSegment.avg}.`
                : segment.count === 0
                  ? "No one in your cohort has rated this movie yet. Your vote will create this insight from scratch."
                  : `${segment.missing} more ${segment.missing === 1 ? "rating" : "ratings"} needed from your cohort to show the score.`
          ) : (
            segment.avg !== null
              ? `Valoran esta película con un ${segment.avg} de media, sobre ${segment.count} ${segment.count === 1 ? "voto" : "votos"} reales de tu segmento exacto.`
              : fallback
                ? `Tu segmento exacto aún no tiene datos suficientes. Tu generación (${ageLabel.startsWith("55") ? "55+" : "tu tramo"}) la valora con un ${broadSegment.avg}.`
                : segment.count === 0
                  ? "Nadie de tu segmento ha valorado esta película todavía. Tu voto crearía este dato desde cero."
                  : `Faltan ${segment.missing} ${segment.missing === 1 ? "valoración" : "valoraciones"} de tu segmento para mostrar la nota.`
          )}
        </p>
      </div>
      {segment.avg !== null ? (
        <div className="flex items-baseline justify-center sm:justify-start gap-1 bg-[#0f111a] border border-white/10 px-6 py-4 rounded-2xl sm:flex-shrink-0 self-center">
          <span className="text-4xl font-black text-primary">{segment.avg}</span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 bg-white/5 border border-dashed border-white/10 px-5 py-4 rounded-2xl text-center self-center sm:flex-shrink-0">
          <span className="text-2xl font-black text-white/40">?</span>
          <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
            {segment.count === 0
              ? (locale === "en" ? "Be first" : "Sé el primero")
              : (locale === "en"
                  ? `${segment.missing} ${segment.missing === 1 ? "vote needed" : "votes needed"}`
                  : `Faltan ${segment.missing} ${segment.missing === 1 ? "voto" : "votos"}`)}
          </span>
        </div>
      )}
    </div>
  );
}

function LockedLevelNotice({ progress }: { progress: { current: number; required: number; missing: number } }) {
  const { locale } = useI18n();
  const pct = Math.min(100, Math.round((progress.current / progress.required) * 100));

  return (
    <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-white">
          {locale === "en" ? "This level of detail is in calibration" : "Este nivel de detalle todavía se está calibrando"}
        </p>
        <span className="text-[10px] font-black uppercase tracking-wider text-primary-light tabular-nums">
          {progress.current} / {progress.required}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 interactive-transition"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {locale === "en" ? (
          <>
            <span className="text-white font-bold">{progress.missing}</span> more verified {progress.missing === 1 ? "rating" : "ratings"} needed to consolidate this breakdown. We show available data below: honest partial insight is always better than fabricated numbers.
          </>
        ) : (
          <>
            Faltan <span className="text-white font-bold">{progress.missing}</span> {progress.missing === 1 ? "valoración real" : "valoraciones reales"} para consolidar este desglose con rigor estadístico. Mostramos lo que hay debajo mientras se completa: preferimos un dato incompleto y verdadero a un dato completo e inventado.
          </>
        )}
      </p>
    </div>
  );
}

interface BarRow {
  key: string;
  label: string;
  segment: Segment;
  gradient?: string;
}

function BarChartPanel({
  title,
  subtitle,
  rows,
  gradient = "bg-gradient-to-r from-violet-500 to-cyan-500",
}: {
  title: string;
  subtitle: string;
  rows: BarRow[];
  gradient?: string;
}) {
  const { locale } = useI18n();
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/5">
      <div className="space-y-1 border-b border-white/5 pb-3">
        <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-5">
        {rows.map((row) => {
          const hasData = row.segment.avg !== null;
          const pct = hasData ? (row.segment.avg! / 10) * 100 : 0;

          return (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm font-semibold gap-3">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-right">
                  {hasData ? (
                    <span className="text-white tabular-nums">
                      {row.segment.avg}{" "}
                      <span className="text-[10px] text-muted-foreground font-medium">
                        ({row.segment.count} {row.segment.count === 1 ? (locale === "en" ? "vote" : "voto") : (locale === "en" ? "votes" : "votos")})
                      </span>
                    </span>
                  ) : row.segment.count === 0 ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {locale === "en" ? "No votes · be first" : "Sin votos · sé el primero"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-light/80">
                      {locale === "en"
                        ? `${row.segment.missing} ${row.segment.missing === 1 ? "vote needed" : "votes needed"}`
                        : `Faltan ${row.segment.missing} ${row.segment.missing === 1 ? "voto" : "votos"}`}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                {hasData && (
                  <div
                    className={`h-full rounded-full ${row.gradient || gradient} interactive-transition`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrossMatrix({
  real,
  segmentMinVotes,
  highlight,
}: {
  real: Record<GenderKey, Record<AgeKey, Segment>>;
  segmentMinVotes: number;
  highlight: { gender: GenderKey; ageKey: AgeKey } | null;
}) {
  const { locale } = useI18n();
  const cellClasses = (segment: Segment, isHighlight: boolean) => {
    const base = "flex flex-col items-center justify-center p-2.5 rounded-xl text-center interactive-transition";
    const ring = isHighlight ? " ring-2 ring-primary ring-offset-2 ring-offset-[#0b0c10]" : "";
    if (segment.avg === null) {
      return `${base}${ring} bg-white/[0.02] border border-dashed border-white/10 text-muted-foreground/60`;
    }
    if (segment.avg < 5.0) return `${base}${ring} bg-red-500/10 text-red-400 border border-red-500/20`;
    if (segment.avg < 7.0) return `${base}${ring} bg-amber-500/10 text-amber-400 border border-amber-500/20`;
    if (segment.avg < 8.5) return `${base}${ring} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`;
    return `${base}${ring} bg-emerald-400/20 text-emerald-300 font-extrabold border border-emerald-400/30`;
  };

  const localizedGenderLabels: Record<GenderKey, string> = {
    male: locale === "en" ? "Men" : "Hombres",
    female: locale === "en" ? "Women" : "Mujeres",
    non_binary: locale === "en" ? "Non-Binary" : "No Binarios",
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white tracking-wide">
          {locale === "en" ? "Full Matrix: Gender × Age" : "Matriz completa: género × edad"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {locale === "en"
            ? `The highest level of detail. Each cell requires at least ${segmentMinVotes} verified ratings to display a score.`
            : `El nivel máximo de detalle. Cada celda necesita al menos ${segmentMinVotes} valoraciones reales para mostrar su nota; las que aún no llegan indican cuántas faltan.`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[550px] grid grid-cols-6 gap-2 pt-2">
          <div className="flex items-center justify-center p-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-white/5 rounded-xl border border-white/5">
            CinePOV
          </div>
          {AGE_KEYS.map((k) => (
            <div
              key={`head-${k}`}
              className="flex items-center justify-center p-2.5 text-xs font-bold text-white bg-white/5 rounded-xl border border-white/5 text-center"
            >
              {AGE_RANGE_LABELS[k]}
            </div>
          ))}

          {GENDER_KEYS.map((gender) => (
            <div key={gender} className="contents">
              <div className="flex items-center p-3 text-xs font-bold text-white bg-white/5 rounded-xl border border-white/5">
                {localizedGenderLabels[gender]}
              </div>
              {AGE_KEYS.map((ageKey) => {
                const segment = real[gender][ageKey];
                const isHighlight = highlight?.gender === gender && highlight?.ageKey === ageKey;

                return (
                  <div key={`${gender}-${ageKey}`} className={cellClasses(segment, Boolean(isHighlight))}>
                    {segment.avg !== null ? (
                      <>
                        <span className="text-sm font-black tabular-nums">{segment.avg}</span>
                        <span className="text-[9px] opacity-75">{segment.count} v.</span>
                      </>
                    ) : segment.count === 0 ? (
                      <>
                        <span className="text-sm font-black opacity-40">·</span>
                        <span className="text-[8px] font-bold uppercase tracking-tight leading-tight">
                          {locale === "en" ? "no votes" : "sin votos"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-black text-primary-light tabular-nums">
                          {segment.count}/{segmentMinVotes}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-tight leading-tight">
                          {locale === "en"
                            ? `${segment.missing} ${segment.missing === 1 ? "vote" : "votes"}`
                            : `faltan ${segment.missing} ${segment.missing === 1 ? "voto" : "votos"}`}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-white/5 pt-4">
        {locale === "en"
          ? "Dashed cells are not an error: they represent data the community is still generating. Each new vote fills one in. If you are the first in your cohort to rate a movie, you create that data."
          : "Las celdas con borde discontinuo no son un error: son datos que la comunidad aún no ha generado. Cada valoración nueva rellena una. Si eres el primero de tu segmento en votar una película, ese dato lo creas tú."}
      </p>
    </div>
  );
}
