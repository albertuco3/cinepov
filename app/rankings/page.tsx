import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import RankingsClient from "@/components/RankingsClient";

export const metadata = {
  title: "Rankings Demográficos — CinePOV",
  description: "Explora las películas mejor valoradas globalmente y desglosadas por género, edad y segmento demográfico.",
};

interface RankingsPageProps {
  searchParams: Promise<{ genreId?: string }>;
}

export default async function RankingsPage({ searchParams }: RankingsPageProps) {
  const resolvedParams = await searchParams;
  const initialGenreId = resolvedParams.genreId || "all";

  const session = await getServerSession(authOptions);

  // Pre-cargar todos los géneros cinematográficos de la base de datos
  const genres = await db.genre.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Estructurar los datos demográficos iniciales del usuario si está logueado
  const currentUserSegment = session?.user
    ? {
        gender: session.user.gender || "all",
        birthYear: session.user.birthYear || null,
      }
    : null;

  return (
    <div className="flex-1 flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <RankingsClient
        availableGenres={genres.map((g) => ({ id: g.id, name: g.name }))}
        currentUserSegment={currentUserSegment}
        initialGenreId={initialGenreId}
      />
    </div>
  );
}
