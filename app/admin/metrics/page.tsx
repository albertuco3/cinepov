import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/LocaleLink";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth-guards";
import { COUNTED_USER_WHERE, countedRatingWhere } from "@/lib/rating-filters";
import { getManyMovieDemographics, getMostRatedMovieIds } from "@/lib/movie-demographics";
import {
  AGE_KEYS,
  AGE_RANGE_LABELS,
  GENDER_KEYS,
  GENDER_LABELS,
  type GranularityLevel,
} from "@/lib/demographics";
import { MAX_SEGMENT_SHARE, MIN_AGE_SHARE, demographicDistribution, levelCoverage, median, type Share } from "@/lib/admin-metrics";
import { TASTE } from "@/lib/taste";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Métricas de la beta | CinePOV",
  robots: { index: false, follow: false },
};

const LEVEL_LABELS: Record<GranularityLevel, string> = {
  global: "Solo nota global",
  age_broad: "Por generación",
  gender: "Por género",
  age_full: "Edad detallada",
  cross: "Matriz completa",
};

const DAY = 24 * 60 * 60 * 1000;

/** Carga y calcula todas las métricas (fuera del render: usa la hora actual). */
async function loadMetrics() {
  const now = Date.now();
  const [registered, verifiedPeople, onboarded, ratingsByUser, countedRatings, ratings7d, ratings30d, newVerified7d] =
    await Promise.all([
      db.user.count({ where: { isAnonymized: false } }),
      db.user.findMany({ where: { ...COUNTED_USER_WHERE, isAnonymized: false }, select: { gender: true, birthYear: true } }),
      db.user.count({ where: { isAnonymized: false, onboardingCompleted: true } }),
      db.rating.groupBy({ by: ["userId"], where: countedRatingWhere(), _count: { userId: true } }),
      db.rating.count({ where: countedRatingWhere() }),
      db.rating.count({ where: { ...countedRatingWhere(), createdAt: { gte: new Date(now - 7 * DAY) } } }),
      db.rating.count({ where: { ...countedRatingWhere(), createdAt: { gte: new Date(now - 30 * DAY) } } }),
      db.user.count({ where: { ...COUNTED_USER_WHERE, isAnonymized: false, createdAt: { gte: new Date(now - 7 * DAY) } } }),
    ]);

  const perUser = ratingsByUser.map((r) => r._count.userId);

  // Cobertura: películas del onboarding y las 50 con más votos que cuentan.
  const [featured, mostRated] = await Promise.all([
    db.movie.findMany({ where: { isFeatured: true }, select: { id: true } }),
    getMostRatedMovieIds(1, 50),
  ]);
  const coverageIds = [...new Set([...featured.map((m) => m.id), ...mostRated])];
  const coverage = levelCoverage([...(await getManyMovieDemographics(coverageIds)).values()]);

  return {
    registered,
    onboarded,
    countedRatings,
    ratings7d,
    ratings30d,
    newVerified7d,
    distribution: demographicDistribution(verifiedPeople),
    medianPerUser: median(perUser),
    tasteReady: perUser.filter((n) => n >= TASTE.MIN_OWN_RATINGS).length,
    coverage,
    coverageTotal: coverageIds.length,
  };
}

export default async function AdminMetricsPage() {
  // Solo administradores; a cualquier otra persona se le responde como si no existiera.
  if (!(await getAdminUser())) notFound();

  const {
    registered,
    onboarded,
    countedRatings,
    ratings7d,
    ratings30d,
    newVerified7d,
    distribution,
    medianPerUser,
    tasteReady,
    coverage,
    coverageTotal,
  } = await loadMetrics();
  const withComparison = coverageTotal - coverage.global;

  const pct = (s: Share) => `${(s.share * 100).toFixed(0)} %`;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <div className="border-b border-white/5 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          Administración
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Métricas de la beta</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Salud del dataset, calculada en vivo con las valoraciones que cuentan (personas verificadas). El embudo y la
          retención se miden en PostHog. ·{" "}
          <Link href="/admin/reports" className="text-primary-light hover:underline">
            Moderación
          </Link>
        </p>
      </div>

      {/* Actividad */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Tile label="Registradas" value={registered} />
        <Tile label="Verificadas" value={distribution.total} hint={`+${newVerified7d} en 7 días`} />
        <Tile label="Onboarding completado" value={onboarded} />
        <Tile label="Con 5+ valoraciones" value={tasteReady} hint="Tienen nota estimada" />
        <Tile label="Valoraciones que cuentan" value={countedRatings} />
        <Tile label="Últimos 7 días" value={ratings7d} />
        <Tile label="Últimos 30 días" value={ratings30d} />
        <Tile label="Mediana por persona" value={medianPerUser} />
      </section>

      {/* Distribución demográfica */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Distribución de las personas verificadas</h2>
        <Alerts
          items={[
            ...distribution.overrepresented.map((key) => {
              const [g, a] = key.split(":") as [keyof typeof GENDER_LABELS, keyof typeof AGE_RANGE_LABELS];
              return `${GENDER_LABELS[g]} ${AGE_RANGE_LABELS[a]} supera el ${MAX_SEGMENT_SHARE * 100} % de la base.`;
            }),
            ...distribution.underrepresentedAges.map(
              (a) => `El tramo ${AGE_RANGE_LABELS[a]} tiene menos del ${MIN_AGE_SHARE * 100} %: conviene captar en ese grupo.`
            ),
          ]}
          empty={distribution.total === 0 ? "Aún no hay personas verificadas." : "Distribución dentro de los umbrales."}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left py-2 px-2">Género / Edad</th>
                {AGE_KEYS.map((a) => (
                  <th key={a} className="text-right py-2 px-2">
                    {AGE_RANGE_LABELS[a]}
                  </th>
                ))}
                <th className="text-right py-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground tabular-nums">
              {GENDER_KEYS.map((g) => (
                <tr key={g} className="border-b border-white/5">
                  <td className="py-2 px-2 text-white">{GENDER_LABELS[g]}</td>
                  {AGE_KEYS.map((a) => {
                    const cell = distribution.cross[g][a];
                    return (
                      <td
                        key={a}
                        className={`text-right py-2 px-2 ${cell.share > MAX_SEGMENT_SHARE ? "text-amber-300 font-bold" : ""}`}
                      >
                        {cell.count} <span className="text-[10px] opacity-70">({pct(cell)})</span>
                      </td>
                    );
                  })}
                  <td className="text-right py-2 px-2 text-white">
                    {distribution.byGender[g].count} <span className="text-[10px] opacity-70">({pct(distribution.byGender[g])})</span>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 px-2 text-white">Total</td>
                {AGE_KEYS.map((a) => (
                  <td
                    key={a}
                    className={`text-right py-2 px-2 text-white ${distribution.underrepresentedAges.includes(a) ? "text-amber-300 font-bold" : ""}`}
                  >
                    {distribution.byAge[a].count} <span className="text-[10px] opacity-70">({pct(distribution.byAge[a])})</span>
                  </td>
                ))}
                <td className="text-right py-2 px-2 text-white">{distribution.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Cobertura de los desgloses */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Cobertura de los desgloses</h2>
        <p className="text-xs text-muted-foreground">
          Nivel máximo desbloqueado en las {coverageTotal} películas del onboarding y las más valoradas.{" "}
          {withComparison} ({coverageTotal ? Math.round((withComparison / coverageTotal) * 100) : 0} %) ya
          permiten comparar al menos dos grupos.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(Object.keys(LEVEL_LABELS) as GranularityLevel[]).map((level) => (
            <Tile key={level} label={LEVEL_LABELS[level]} value={coverage[level]} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-4 space-y-1">
      <p className="text-2xl font-black text-white tabular-nums">{value.toLocaleString("es-ES")}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function Alerts({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-emerald-300/80">{empty}</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}
