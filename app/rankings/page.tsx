import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import RankingsClient from "@/components/RankingsClient";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, Locale } from "@/lib/i18n/types";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale) || DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return {
    title: `${dict.rankings.title} — CinePOV`,
    description: dict.rankings.subtitle,
  };
}

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
