const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getApiKey() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === "tu_api_key_aqui") {
    throw new Error(
      "TMDB_API_KEY no está configurada. Por favor, añade tu clave de TMDB en el archivo .env"
    );
  }
  return apiKey;
}

export interface TMDBMovieResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
}

export interface FormattedMovie {
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: number;
  synopsis: string;
  posterUrl: string;
  backdropUrl?: string;
  director: string;
  runtime: number;
  tmdbRating?: number;
  genres: string[];
  cast?: string;
  popularity?: number;
  voteCount?: number;
}

/**
 * Realiza peticiones a la API de TMDB con control de errores.
 */
async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = getApiKey();
  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: "es-ES",
    ...params,
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    next: { revalidate: 86400 }, // Caché de Next.js por 24 horas para evitar peticiones repetidas
  });

  if (!response.ok) {
    throw new Error(`Error en petición a TMDB [${response.status}]: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Busca películas por título en TMDB.
 */
export async function searchMovies(query: string): Promise<TMDBMovieResult[]> {
  if (!query.trim()) return [];

  try {
    const data = await fetchFromTMDB<{ results: TMDBMovieResult[] }>("/search/movie", {
      query: query.trim(),
    });
    return data.results;
  } catch (error) {
    console.error("Error al buscar películas en TMDB:", error);
    return [];
  }
}

/**
 * Obtiene los detalles y los créditos (director y reparto) de una película en TMDB y los formatea.
 */
export async function getMovieWithCredits(tmdbId: number): Promise<FormattedMovie | null> {
  try {
    // 1. Obtener detalles y créditos de forma concurrente
    const [details, credits] = await Promise.all([
      fetchFromTMDB<any>(`/movie/${tmdbId}`),
      fetchFromTMDB<any>(`/movie/${tmdbId}/credits`),
    ]);

    // 2. Extraer el director
    const directorInfo = credits.crew.find((member: any) => member.job === "Director");
    const director = directorInfo ? directorInfo.name : "Director Desconocido";

    // 3. Extraer nombres de géneros
    const genres = details.genres ? details.genres.map((g: any) => g.name) : [];

    // 4. Formatear el año
    const year = details.release_date ? new Date(details.release_date).getFullYear() : 0;

    // 5. Extraer el reparto principal (primeros 6 actores)
    const cast = credits.cast
      ? credits.cast
          .slice(0, 6)
          .map((actor: any) => actor.name)
          .join(", ")
      : "";

    // 6. Construir URLs completas de imágenes de TMDB
    const posterUrl = details.poster_path
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop"; // Imagen placeholder

    const backdropUrl = details.backdrop_path
      ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
      : undefined;

    return {
      tmdbId: details.id,
      title: details.title || details.original_title,
      originalTitle: details.original_title,
      year,
      synopsis: details.overview || "Sin sinopsis disponible.",
      posterUrl,
      backdropUrl,
      director,
      runtime: details.runtime || 0,
      tmdbRating: details.vote_average || 0,
      genres,
      cast,
      popularity: details.popularity || 0,
      voteCount: details.vote_count || 0,
    };
  } catch (error) {
    console.error(`Error al obtener detalles de la película TMDB ID ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Obtiene las películas en tendencias de TMDB de la semana.
 */
export async function getTrendingMovies(): Promise<Array<{
  tmdbId: number;
  title: string;
  posterUrl: string;
  year: number;
  tmdbRating: number;
}>> {
  try {
    const data = await fetchFromTMDB<{ results: TMDBMovieResult[] }>("/trending/movie/week");
    
    if (!data.results) return [];

    return data.results.map((movie) => {
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=342&auto=format&fit=crop";

      return {
        tmdbId: movie.id,
        title: movie.title || movie.original_title,
        posterUrl,
        year,
        tmdbRating: movie.vote_average || 0,
      };
    });
  } catch (error) {
    console.error("Error al obtener películas en tendencias de TMDB:", error);
    return [];
  }
}

/**
 * Busca una película por título y año de lanzamiento en TMDB.
 */
export async function searchMovieByTitleAndYear(title: string, year: number): Promise<TMDBMovieResult | null> {
  if (!title.trim()) return null;

  try {
    const params: Record<string, string> = {
      query: title.trim(),
    };
    if (year > 0) {
      params.primary_release_year = year.toString();
    }

    const data = await fetchFromTMDB<{ results: TMDBMovieResult[] }>("/search/movie", params);
    
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Error al buscar película "${title}" (${year}) en TMDB:`, error);
    return null;
  }
}

/**
 * Busca una película en TMDB a partir de su ID de IMDb (tconst, ej. tt0111161).
 */
export async function findMovieByImdbId(imdbId: string): Promise<number | null> {
  if (!imdbId.trim().startsWith("tt")) return null;

  try {
    const data = await fetchFromTMDB<{ movie_results: Array<{ id: number }> }>(
      `/find/${imdbId.trim()}`,
      { external_source: "imdb_id" }
    );

    if (data.movie_results && data.movie_results.length > 0) {
      return data.movie_results[0].id;
    }
    return null;
  } catch (error) {
    console.error(`Error al buscar ID de IMDb "${imdbId}" en TMDB:`, error);
    return null;
  }
}

interface SimilarMovie {
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string;
}

/**
 * Obtiene las películas similares de TMDB para un id dado.
 */
export async function getSimilarMovies(tmdbId: number): Promise<SimilarMovie[]> {
  try {
    const data = await fetchFromTMDB<{ results: any[] }>(`/movie/${tmdbId}/similar`);
    if (!data.results) return [];

    return data.results.slice(0, 6).map((movie: any) => {
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop";

      return {
        tmdbId: movie.id,
        title: movie.title || movie.original_title,
        year,
        posterUrl,
      };
    });
  } catch (error) {
    console.error(`Error al obtener películas similares para TMDB ID ${tmdbId}:`, error);
    return [];
  }
}
