import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWeeklyTrendsEmail } from "@/lib/email";
import { AGE_RANGE_LABELS, ageKeyFromBirthYear, type AgeKey } from "@/lib/demographics";
import { countedRatingWhere, segmentUserWhere } from "@/lib/rating-filters";

export const revalidate = 0;

/** Votos mínimos para que una película entre en las tendencias de un segmento. */
const MIN_SEGMENT_VOTES = 3;
const TOP_N = 3;

const GENDER_LABELS_ES: Record<string, string> = {
  male: "Hombres",
  female: "Mujeres",
  non_binary: "No binarios",
};

interface TrendingMovie {
  title: string;
  year: number;
  avgScore: number;
  votes: number;
}

/**
 * Vercel Cron envía `Authorization: Bearer <CRON_SECRET>`. Sin el secreto
 * configurado la ruta se niega a ejecutarse: si no, cualquiera podría disparar
 * el envío masivo de emails.
 */
function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Top de películas de un segmento. Solo con valoraciones que cuentan: el
 * boletín es contenido que enviamos, nunca puede apoyarse en votos sin verificar.
 */
async function topMoviesForSegment(gender: string, ageKey: AgeKey, currentYear: number): Promise<TrendingMovie[]> {
  const grouped = await db.rating.groupBy({
    by: ["movieId"],
    where: countedRatingWhere(segmentUserWhere({ gender, ageKey }, currentYear)),
    _avg: { score: true },
    _count: { score: true },
    having: { score: { _count: { gte: MIN_SEGMENT_VOTES } } },
  });

  const top = grouped
    .sort((a, b) => (b._avg.score ?? 0) - (a._avg.score ?? 0))
    .slice(0, TOP_N);
  if (top.length === 0) return [];

  const movies = await db.movie.findMany({
    where: { id: { in: top.map((r) => r.movieId) } },
    select: { id: true, title: true, year: true },
  });
  const byId = new Map(movies.map((m) => [m.id, m]));

  return top.flatMap((r) => {
    const movie = byId.get(r.movieId);
    if (!movie) return [];
    return [{ title: movie.title, year: movie.year, avgScore: r._avg.score ?? 0, votes: r._count.score }];
  });
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    // Solo direcciones verificadas: enviar a un email que nadie ha confirmado
    // es spam hacia terceros y daña la reputación del dominio de envío.
    const users = await db.user.findMany({
      where: {
        emailWeeklyActive: true,
        onboardingCompleted: true,
        emailVerified: { not: null },
        isAnonymized: false,
      },
      select: { email: true, displayName: true, gender: true, birthYear: true },
    });

    const currentYear = new Date().getFullYear();
    // Hay como mucho quince segmentos: se calcula cada uno una sola vez.
    const segmentCache = new Map<string, Promise<TrendingMovie[]>>();
    let emailsSent = 0;

    for (const user of users) {
      const ageKey = ageKeyFromBirthYear(user.birthYear, currentYear);
      if (!user.gender || !ageKey) continue;

      const segmentKey = `${user.gender}:${ageKey}`;
      let trending = segmentCache.get(segmentKey);
      if (!trending) {
        trending = topMoviesForSegment(user.gender, ageKey, currentYear);
        segmentCache.set(segmentKey, trending);
      }

      const movies = await trending;
      if (movies.length === 0) continue;

      const segmentLabel = `${GENDER_LABELS_ES[user.gender] ?? "Usuarios"} ${AGE_RANGE_LABELS[ageKey]} años`;
      await sendWeeklyTrendsEmail(user.email, user.displayName, segmentLabel, movies);
      emailsSent++;
    }

    return NextResponse.json({ usersProcessed: users.length, emailsSent });
  } catch (error) {
    console.error("Error en cron weekly-trends:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el cron semanal." },
      { status: 500 }
    );
  }
}
