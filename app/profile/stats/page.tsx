import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildCinematicProfile,
  type UserRatedMovie,
  type SegmentMovieAverage,
} from "@/lib/cinematic-profile";
import {
  ageKeyFromBirthYear,
  ageBroadFromAgeKey,
  GENDER_LABELS,
  AGE_BROAD_LABELS,
} from "@/lib/demographics";
import CinematicProfileClient from "./CinematicProfileClient";

export const metadata = {
  title: "Tu Perfil Cinematográfico — CinePOV",
  description:
    "Descubre tus patrones de valoración, tu década y géneros favoritos, y conoce a tu Gemelo Demográfico.",
};

export default async function CinematicProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  // 1. Obtener todas las valoraciones del usuario con datos de películas y géneros
  const userRatings = await db.rating.findMany({
    where: { userId: session.user.id },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
          posterUrl: true,
          genres: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const movieIds = userRatings.map((r) => r.movieId);

  // 2. Medias globales comunitarias de estas películas
  const globalAverages = await db.rating.groupBy({
    by: ["movieId"],
    where: {
      movieId: { in: movieIds },
      isArtificial: false,
    },
    _avg: { score: true },
  });

  const globalMap = new Map<string, number>();
  for (const g of globalAverages) {
    if (g._avg.score !== null) {
      globalMap.set(g.movieId, parseFloat(g._avg.score.toFixed(1)));
    }
  }

  // Mapear a la estructura UserRatedMovie
  const ratedMovies: UserRatedMovie[] = userRatings.map((r) => ({
    id: r.movie.id,
    score: r.score,
    year: r.movie.year,
    genres: r.movie.genres.map((g) => g.name),
    globalAvg: globalMap.get(r.movie.id) || null,
  }));

  // 3. Obtener votos verificados de otros usuarios en estas mismas películas para el Gemelo Demográfico
  const communityVotes = await db.rating.findMany({
    where: {
      movieId: { in: movieIds },
      isArtificial: false,
      user: {
        emailVerified: { not: null },
        isAnonymized: false,
      },
    },
    select: {
      movieId: true,
      score: true,
      user: {
        select: {
          gender: true,
          birthYear: true,
        },
      },
    },
  });

  // Agrupar por segmento (género + grupo de edad amplio) y película
  const segmentAccumulator = new Map<string, { total: number; count: number; label: string }>();

  for (const vote of communityVotes) {
    if (!vote.user.gender || !vote.user.birthYear) continue;

    const ageKey = ageKeyFromBirthYear(vote.user.birthYear, currentYear);
    if (!ageKey) continue;

    const broad = ageBroadFromAgeKey(ageKey);
    const genderKey = vote.user.gender;
    const compoundKey = `${genderKey}_${broad}`;
    const segmentKey = `${compoundKey}___${vote.movieId}`;

    const genderLabel = GENDER_LABELS[genderKey as keyof typeof GENDER_LABELS] || genderKey;
    const ageLabel = AGE_BROAD_LABELS[broad] || broad;
    const label = `${genderLabel} (${ageLabel})`;

    const cur = segmentAccumulator.get(segmentKey) || { total: 0, count: 0, label };
    cur.total += vote.score;
    cur.count += 1;
    segmentAccumulator.set(segmentKey, cur);
  }

  const segmentMovieAverages: SegmentMovieAverage[] = [];
  for (const [key, data] of segmentAccumulator.entries()) {
    const [compoundKey, movieId] = key.split("___");
    segmentMovieAverages.push({
      segmentKey: compoundKey,
      segmentLabel: data.label,
      movieId,
      avgScore: parseFloat((data.total / data.count).toFixed(1)),
    });
  }

  // 4. Calcular el perfil completo
  const profile = buildCinematicProfile(ratedMovies, segmentMovieAverages);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <CinematicProfileClient
        profile={profile}
        userName={session.user.name || "Cinéfilo"}
      />
    </div>
  );
}
