import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import UserProfileClient from "@/components/UserProfileClient";
import { localizePath } from "@/lib/i18n/paths";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "Mi Perfil — CinePOV",
  description: "Administra tus datos demográficos de CinePOV y revisa tu historial de valoraciones y películas calificadas de la comunidad.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect(localizePath("/login", await getRequestLocale()));
  }

  // 1. Consultar información completa del usuario y su historial de ratings en la base de datos
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect(localizePath("/login", await getRequestLocale()));
  }

  const ratings = await db.rating.findMany({
    where: { userId: user.id },
    include: {
      movie: {
        select: {
          id: true,
          tmdbId: true,
          title: true,
          year: true,
          posterUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Obtener medias globales de las películas calificadas por el usuario para
  // calcular desviaciones. Se comparan contra valoraciones reales: comparar la
  // nota del usuario con una estimación estadística no significaría nada.
  const movieIds = ratings.map((r) => r.movieId);
  const globalAverages = await db.rating.groupBy({
    by: ["movieId"],
    where: {
      movieId: { in: movieIds },
      isArtificial: false,
    },
    _avg: {
      score: true,
    },
  });

  // 2. Mapear datos a estructuras serializables para pasarlas al componente del cliente
  const serializedUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    gender: user.gender,
    birthYear: user.birthYear,
    emailWeeklyActive: user.emailWeeklyActive,
    createdAt: user.createdAt.toISOString(),
  };

  const serializedRatings = ratings.map((r) => {
    const globalAvg = globalAverages.find((g) => g.movieId === r.movieId)?._avg.score || 0;
    return {
      id: r.id,
      score: r.score,
      createdAt: r.createdAt.toISOString(),
      watchedAt: r.watchedAt ? r.watchedAt.toISOString() : null,
      movie: {
        id: r.movie.id,
        tmdbId: r.movie.tmdbId,
        title: r.movie.title,
        year: r.movie.year,
        posterUrl: r.movie.posterUrl,
        globalAvgScore: parseFloat(globalAvg.toFixed(1)),
      },
    };
  });

  // 3. Consultar la watchlist del usuario
  const watchlists = await db.watchlist.findMany({
    where: { userId: user.id },
    include: {
      movie: {
        select: {
          id: true,
          tmdbId: true,
          title: true,
          year: true,
          posterUrl: true,
          tmdbRating: true,
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  const serializedWatchlist = watchlists.map((w) => ({
    id: w.id,
    addedAt: w.addedAt.toISOString(),
    movie: w.movie,
  }));

  // 4. Consultar las listas personalizadas del usuario
  const customLists = await db.customList.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serializedLists = customLists.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description,
    isPublic: l.isPublic,
    itemCount: l._count.items,
    updatedAt: l.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-start">
      <UserProfileClient
        initialUser={serializedUser}
        initialRatings={serializedRatings}
        initialWatchlist={serializedWatchlist}
        initialLists={serializedLists}
        hasPassword={Boolean(user.passwordHash)}
      />
    </div>
  );
}
