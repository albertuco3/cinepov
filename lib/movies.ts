import { db } from "./db";
import { getMovieWithCredits } from "./tmdb";
import { parseMovieParam } from "./slug";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resuelve el identificador que llega a una API al id interno de la película.
 *
 * Admite el id interno (UUID), el de TMDB ("157336") y el de TMDB con slug
 * ("157336-interstellar"). El UUID se comprueba primero: uno que empiece por
 * dígitos ("12391438-…") no debe confundirse con un id de TMDB. No importa
 * nada de TMDB: si la película no existe en local, devuelve `null`.
 */
export async function resolveMovieId(param: string): Promise<string | null> {
  const clean = param.trim();
  if (!clean) return null;

  if (UUID_PATTERN.test(clean)) {
    const movie = await db.movie.findUnique({ where: { id: clean }, select: { id: true } });
    return movie?.id ?? null;
  }

  const { tmdbId } = parseMovieParam(clean);
  if (!tmdbId) return null;
  const movie = await db.movie.findUnique({ where: { tmdbId }, select: { id: true } });
  return movie?.id ?? null;
}

/**
 * Obtiene una película de la base de datos local por su TMDB ID.
 * Si no existe localmente, la consulta a TMDB, la guarda en la base de datos
 * local (creando/conectando los géneros correspondientes) y la devuelve.
 *
 * Usa `upsert`: si dos peticiones piden a la vez una película nueva (lo normal
 * en un pico viral), las dos obtienen la película en lugar de que una choque
 * con el índice único y devuelva un 404.
 */
export async function getOrCreateMovie(tmdbId: number) {
  const localMovie = await db.movie.findUnique({
    where: { tmdbId },
    include: { genres: true },
  });
  if (localMovie) return localMovie;

  const tmdbMovie = await getMovieWithCredits(tmdbId);
  if (!tmdbMovie) return null;

  const genres = {
    connectOrCreate: tmdbMovie.genres.map((genreName) => ({
      where: { name: genreName },
      create: { name: genreName },
    })),
  };

  try {
    return await db.movie.upsert({
      where: { tmdbId: tmdbMovie.tmdbId },
      update: {},
      create: {
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
        genres,
      },
      include: { genres: true },
    });
  } catch (error) {
    // Incluso con upsert, dos inserciones simultáneas pueden chocar en el
    // índice único (de la película o de un género). La otra petición ya la ha
    // creado: basta con releerla.
    const existing = await db.movie.findUnique({ where: { tmdbId }, include: { genres: true } });
    if (existing) return existing;
    console.error(`Error al guardar la película TMDB ${tmdbId}:`, error);
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
