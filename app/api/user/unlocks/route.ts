import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildDemographicsPayload,
  GENDER_LABELS,
  AGE_RANGE_LABELS,
  ageKeyFromBirthYear,
  isGenderKey,
  type RatingRow,
} from "@/lib/demographics";

/**
 * Desbloqueos de granularidad en las películas que el usuario ha valorado.
 *
 * Este es el mecanismo de retención que nace del propio funcionamiento del
 * producto: a medida que la comunidad crece, las películas que ya valoraste
 * revelan información nueva. Es una razón para volver que mejora sola y que no
 * requiere inventar contenido.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true, birthYear: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    // Solo las valoraciones más recientes del usuario: revisar su historial
    // completo en cada visita no escala y aporta poco.
    const userRatings = await db.rating.findMany({
      where: { userId: session.user.id, isArtificial: false },
      select: { movieId: true, score: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });

    if (userRatings.length === 0) {
      return NextResponse.json({ unlocks: [] });
    }

    const movieIds = userRatings.map((r) => r.movieId);
    const userScoreByMovie = new Map(userRatings.map((r) => [r.movieId, r.score]));

    const [ratings, movies] = await Promise.all([
      db.rating.findMany({
        where: {
          movieId: { in: movieIds },
          OR: [
            { isArtificial: true },
            { user: { emailVerified: { not: null } } },
          ],
        },
        select: {
          movieId: true,
          score: true,
          isArtificial: true,
          user: { select: { gender: true, birthYear: true } },
        },
      }),
      db.movie.findMany({
        where: { id: { in: movieIds } },
        select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true },
      }),
    ]);

    const rowsByMovie = new Map<string, RatingRow[]>();
    for (const r of ratings) {
      if (!r.user) continue;
      const list = rowsByMovie.get(r.movieId) ?? [];
      list.push({
        score: r.score,
        isArtificial: r.isArtificial,
        gender: r.user.gender,
        birthYear: r.user.birthYear,
      });
      rowsByMovie.set(r.movieId, list);
    }

    const userAgeKey = ageKeyFromBirthYear(user.birthYear);
    const userGender = isGenderKey(user.gender) ? user.gender : null;

    const unlocks = movies
      .map((movie) => {
        const payload = buildDemographicsPayload(movie.id, rowsByMovie.get(movie.id) ?? []);
        if (payload.maxLevel === "global") return null;

        // El dato con gancho es el del segmento del usuario, si ya existe.
        let segmentAvg: number | null = null;
        let segmentLabel: string | null = null;

        if (userGender && userAgeKey) {
          const cell = payload.real.cross[userGender][userAgeKey];
          if (cell.avg !== null) {
            segmentAvg = cell.avg;
            segmentLabel = `${GENDER_LABELS[userGender]} de ${AGE_RANGE_LABELS[userAgeKey]}`;
          }
        }

        const userScore = userScoreByMovie.get(movie.id) ?? null;

        return {
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          level: payload.maxLevel,
          realCount: payload.counts.real,
          userScore,
          segmentAvg,
          segmentLabel,
          // Diferencia entre la nota del usuario y la de su segmento: es el dato
          // que hace interesante volver a la ficha.
          deviation: segmentAvg !== null && userScore !== null
            ? Math.round((userScore - segmentAvg) * 10) / 10
            : null,
        };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null)
      .sort((a, b) => {
        // Primero las que más contrastan con la nota del usuario.
        const da = a.deviation === null ? -1 : Math.abs(a.deviation);
        const db_ = b.deviation === null ? -1 : Math.abs(b.deviation);
        return db_ - da;
      })
      .slice(0, 5);

    await db.user.update({
      where: { id: session.user.id },
      data: { lastUnlockCheck: new Date() },
    });

    return NextResponse.json({ unlocks });
  } catch (error) {
    console.error("Error al calcular desbloqueos demográficos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al calcular los desbloqueos." },
      { status: 500 }
    );
  }
}
