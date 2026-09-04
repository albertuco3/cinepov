import { db } from "./db";
import { getMovieWithCredits } from "./tmdb";

/**
 * Obtiene una película de la base de datos local por su TMDB ID.
 * Si no existe localmente, la consulta a TMDB, la guarda en la base de datos
 * local (creando/conectando los géneros correspondientes) y la devuelve.
 *
 * Las películas nuevas se importan limpias, con cero votos sintéticos,
 * para respetar el principio de granularidad progresiva y transparencia de datos.
 */
export async function getOrCreateMovie(tmdbId: number) {
  // 1. Buscar en la base de datos local
  const localMovie = await db.movie.findUnique({
    where: { tmdbId },
    include: {
      genres: true,
    },
  });

  if (localMovie) {
    console.log(`[Cache local] Pelicula encontrada en BD: "${localMovie.title}" (TMDB ID: ${tmdbId})`);
    return localMovie;
  }

  // 2. Si no existe, buscar en TMDB
  console.log(`[API TMDB] Pelicula no encontrada en BD. Consultando a TMDB para ID: ${tmdbId}...`);
  const tmdbMovie = await getMovieWithCredits(tmdbId);

  if (!tmdbMovie) {
    console.log(`[API TMDB] No se pudo encontrar la pelicula con ID ${tmdbId} en TMDB.`);
    return null;
  }

  // 3. Guardar en la base de datos local con géneros asociados
  try {
    const savedMovie = await db.movie.create({
      data: {
        tmdbId: tmdbMovie.tmdbId,
        title: tmdbMovie.title,
        originalTitle: tmdbMovie.originalTitle,
        year: tmdbMovie.year,
        synopsis: tmdbMovie.synopsis,
        posterUrl: tmdbMovie.posterUrl,
        backdropUrl: tmdbMovie.backdropUrl,
        director: tmdbMovie.director,
        runtime: tmdbMovie.runtime,
        tmdbRating: tmdbMovie.tmdbRating,
        cast: tmdbMovie.cast,
        genres: {
          connectOrCreate: tmdbMovie.genres.map((genreName) => ({
            where: { name: genreName },
            create: { name: genreName },
          })),
        },
      },
      include: {
        genres: true,
      },
    });

    console.log(`[Cache local] Pelicula importada y guardada en BD: "${savedMovie.title}"`);
    return savedMovie;
  } catch (error) {
    console.error(`Error al guardar la pelicula TMDB ID ${tmdbId} en la base de datos:`, error);
    return null;
  }
}

/**
 * Obtiene una película persistida en BD local y, si el locale solicitado es "en",
 * devuelve el título, sinopsis y géneros en inglés consultando TMDB en caché.
 */
export async function getMovieLocalized(tmdbId: number, locale: string = "es") {
  const localMovie = await getOrCreateMovie(tmdbId);
  if (!localMovie) return null;

  if (locale === "en") {
    try {
      const tmdbEn = await getMovieWithCredits(tmdbId, "en-US");
      if (tmdbEn) {
        return {
          ...localMovie,
          title: tmdbEn.title || localMovie.title,
          synopsis: tmdbEn.synopsis || localMovie.synopsis,
          genres: tmdbEn.genres && tmdbEn.genres.length > 0
            ? tmdbEn.genres.map((g, idx) => ({
                id: localMovie.genres[idx]?.id || `genre-${idx}`,
                name: g,
              }))
            : localMovie.genres,
        };
      }
    } catch {
      // Fallback al registro local si TMDB falla
    }
  }

  return localMovie;
}
