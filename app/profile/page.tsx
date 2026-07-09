import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import UserProfileClient from "@/components/UserProfileClient";

export const metadata = {
  title: "Mi Perfil — CinePOV",
  description: "Administra tus datos demográficos de CinePOV y revisa tu historial de valoraciones y películas calificadas de la comunidad.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  // 1. Consultar información completa del usuario y su historial de ratings en la base de datos
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
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

  // Obtener medias globales de las películas calificadas por el usuario para calcular desviaciones
  const movieIds = ratings.map((r) => r.movieId);
  const globalAverages = await db.rating.groupBy({
    by: ["movieId"],
    where: {
      movieId: { in: movieIds },
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

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-start">
      <UserProfileClient
        initialUser={serializedUser}
        initialRatings={serializedRatings}
      />
    </div>
  );
}
