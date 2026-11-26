/**
 * Seed de catálogo: seguro para producción.
 *
 * Solo crea o actualiza las 50 películas esenciales del onboarding y retira
 * del onboarding las que ya no están en la lista. No borra nada, no crea
 * usuarios ni valoraciones: puede ejecutarse tantas veces como haga falta y
 * contra cualquier base de datos.
 *
 * Los datos de prueba para desarrollo local están en `prisma/seed-dev.ts`.
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getMovieWithCredits } from "../lib/tmdb";
import { errorMessage } from "../lib/errors";
import { ESSENTIAL_MOVIE_IDS } from "./catalog";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada para el seed.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  console.log(`Sembrando el catálogo base (${ESSENTIAL_MOVIE_IDS.length} películas)...`);
  let ok = 0;

  for (const [i, tmdbId] of ESSENTIAL_MOVIE_IDS.entries()) {
    try {
      const movie = await getMovieWithCredits(tmdbId);
      if (!movie) throw new Error("TMDB no devolvió la película");

      const data = {
        title: movie.title,
        originalTitle: movie.originalTitle,
        year: movie.year,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl ?? null,
        director: movie.director,
        runtime: movie.runtime,
        tmdbRating: movie.tmdbRating ?? null,
        cast: movie.cast ?? null,
        isFeatured: true,
      };
      const genres = movie.genres.map((name) => ({ where: { name }, create: { name } }));

      await prisma.movie.upsert({
        where: { tmdbId },
        update: { ...data, genres: { set: [], connectOrCreate: genres } },
        create: { tmdbId, ...data, genres: { connectOrCreate: genres } },
      });
      ok++;
      console.log(`[${i + 1}/${ESSENTIAL_MOVIE_IDS.length}] ${movie.title}`);
    } catch (err) {
      console.error(`[${i + 1}/${ESSENTIAL_MOVIE_IDS.length}] Error con TMDB ${tmdbId}: ${errorMessage(err)}`);
    }

    // Margen para no saturar la cuota de la API de TMDB.
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Las películas que dejan de estar en la lista siguen en el catálogo, pero
  // ya no salen en el onboarding.
  const { count: unfeatured } = await prisma.movie.updateMany({
    where: { isFeatured: true, tmdbId: { notIn: ESSENTIAL_MOVIE_IDS } },
    data: { isFeatured: false },
  });

  console.log(`Catálogo listo: ${ok} de ${ESSENTIAL_MOVIE_IDS.length} películas. Retiradas del onboarding: ${unfeatured}.`);
}

main()
  .catch((e) => {
    console.error("Error ejecutando el seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
