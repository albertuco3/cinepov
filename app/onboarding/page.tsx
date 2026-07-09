import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import OnboardingClient from "@/components/OnboardingClient";

export const metadata = {
  title: "Onboarding — CinePOV",
  description: "Valora rápidamente las películas esenciales para personalizar tus gráficos demográficos y recomendaciones.",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  // 1. Consultar el perfil del usuario para verificar si completó los datos demográficos básicos
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, displayName: true, gender: true, birthYear: true, onboardingCompleted: true },
  });

  if (!user) {
    redirect("/login");
  }

  // Si el usuario ya ha completado el onboarding en la BD, redirigirlo a la raíz
  if (user.onboardingCompleted) {
    redirect("/");
  }

  // Si no tiene completo el año de nacimiento o género, obligar a pasar por /welcome primero
  if (!user.birthYear || !user.gender) {
    redirect("/welcome");
  }

  // 2. Obtener todas las películas destacadas del onboarding (isFeatured: true)
  const featuredMovies = await db.movie.findMany({
    where: { isFeatured: true },
    select: {
      id: true,
      tmdbId: true,
      title: true,
      originalTitle: true,
      year: true,
      synopsis: true,
      posterUrl: true,
      director: true,
      runtime: true,
      tmdbRating: true,
    },
    orderBy: {
      tmdbRating: "desc", // Ordenar por nota de TMDB para presentar primero las de mayor prestigio
    },
  });

  // 3. Consultar cuáles de estas películas ya han sido valoradas por el usuario actual
  const userRatings = await db.rating.findMany({
    where: {
      userId: user.id,
      movieId: { in: featuredMovies.map((m) => m.id) },
    },
    select: {
      movieId: true,
    },
  });

  const ratedMovieIds = new Set(userRatings.map((r) => r.movieId));

  // 4. Filtrar para pasar únicamente las películas esenciales que el usuario AÚN no ha calificado
  const unratedMovies = featuredMovies.filter((movie) => !ratedMovieIds.has(movie.id));

  return (
    <div className="flex-1 flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <OnboardingClient 
        initialMovies={unratedMovies}
        userDisplayName={user.displayName}
      />
    </div>
  );
}
