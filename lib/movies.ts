import { db } from "./db";
import { getMovieWithCredits } from "./tmdb";

interface BotProfile {
  id: string;
  gender: string | null;
  birthYear: number;
}

function calculateDemographicBias(
  bot: BotProfile,
  genres: string[],
  movieYear: number | null,
  currentYear: number
): number {
  const botAge = currentYear - bot.birthYear;
  let genreBias = 0;

  const hasGenre = (g: string) => genres.includes(g);

  // --- REGLAS DE GÉNERO Y EDAD CRUZADAS (GÉNERO DOMINANTE) ---
  
  // 1. Cine Bélico y Western (Géneros muy polarizados)
  if (hasGenre("Bélica") || hasGenre("Western")) {
    if (bot.gender === "female") {
      // Las mujeres suelen calificar más bajo estos géneros, especialmente las más jóvenes
      genreBias += botAge < 30 ? -0.8 : -0.4;
    } else if (bot.gender === "male") {
      // Los hombres, especialmente mayores, tienen mayor afinidad
      genreBias += botAge > 45 ? 0.7 : 0.3;
    }
  }

  // 2. Terror (Muy dependiente de la edad)
  if (hasGenre("Terror")) {
    if (botAge < 25) {
      genreBias += 0.5; // Muy popular en jóvenes
    } else if (botAge > 45) {
      genreBias += -1.0; // Desagrado acentuado en mayores
    }
    if (bot.gender === "female" && botAge > 30) {
      genreBias += -0.3;
    }
  }

  // 3. Ciencia Ficción, Acción y Aventura
  if (hasGenre("Ciencia ficción") || hasGenre("Acción") || hasGenre("Aventura")) {
    if (bot.gender === "male") {
      genreBias += botAge < 35 ? 0.6 : 0.2;
    } else if (bot.gender === "female") {
      genreBias += botAge > 45 ? -0.4 : -0.2;
    }
  }

  // 4. Romance y Musical
  if (hasGenre("Romance") || hasGenre("Musical")) {
    if (bot.gender === "female") {
      genreBias += 0.6;
    } else if (bot.gender === "male") {
      genreBias += botAge < 25 ? -0.5 : -0.1;
    }
  }

  // 5. Drama
  if (hasGenre("Drama")) {
    if (botAge > 35) {
      genreBias += 0.3;
    }
    if (bot.gender === "female") {
      genreBias += 0.2;
    }
  }

  // 6. Animación y Familia
  if (hasGenre("Animación") || hasGenre("Familia")) {
    if (botAge < 18) {
      genreBias += 0.7;
    } else if (botAge >= 30 && botAge <= 45) {
      genreBias += 0.4; // Padres
    } else if (botAge >= 19 && botAge < 30) {
      genreBias += -0.4; // Brecha sin hijos
    }
  }

  // 7. Documental e Historia
  if (hasGenre("Documental") || hasGenre("Historia")) {
    if (botAge > 45) {
      genreBias += 0.5;
    } else if (botAge < 22) {
      genreBias += -0.5;
    }
  }

  // 8. Comedia
  if (hasGenre("Comedia")) {
    if (botAge < 25) {
      genreBias += 0.3;
    } else if (botAge > 55) {
      genreBias += -0.2;
    }
  }

  // --- CAP / LÍMITE DE SESGOS DE GÉNERO ---
  // Evitamos que películas con muchos géneros sumen valores extremos
  let finalBias = Math.max(-1.2, Math.min(1.2, genreBias));

  // --- FACTOR NOSTALGIA ---
  // Se añade al final de forma moderada
  if (movieYear) {
    const ageAtRelease = movieYear - bot.birthYear;
    if (ageAtRelease >= 12 && ageAtRelease <= 22) {
      finalBias += 0.5;
    }
  }

  return finalBias;
}

/**
 * Obtiene una película de la base de datos local por su TMDB ID.
 * Si no existe localmente, la consulta a TMDB, la guarda en la base de datos
 * local (creando/conectando los géneros correspondientes) y la devuelve.
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
    console.log(`[Caché local] Película encontrada en BD: "${localMovie.title}" (TMDB ID: ${tmdbId})`);
    return localMovie;
  }

  // 2. Si no existe, buscar en TMDB
  console.log(`[API TMDB] Película no encontrada en BD. Consultando a TMDB para ID: ${tmdbId}...`);
  const tmdbMovie = await getMovieWithCredits(tmdbId);

  if (!tmdbMovie) {
    console.log(`[API TMDB] ❌ No se pudo encontrar la película con ID ${tmdbId} en TMDB.`);
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

    // Inyectar de forma inmediata valoraciones de bots escaladas dinámicamente según la popularidad de TMDB
    try {
      const voteCount = tmdbMovie.voteCount || 0;
      let minVotes = 15;
      let maxVotes = 40;

      if (voteCount >= 20000) {
        minVotes = 350;
        maxVotes = 500;
      } else if (voteCount >= 5000) {
        minVotes = 180;
        maxVotes = 300;
      } else if (voteCount >= 1000) {
        minVotes = 90;
        maxVotes = 180;
      } else if (voteCount >= 100) {
        minVotes = 40;
        maxVotes = 90;
      }

      console.log(`[Simulación] Película "${savedMovie.title}" (Votos históricos TMDB: ${voteCount}). Generando entre ${minVotes} y ${maxVotes} votos demográficos...`);
      const numVotes = Math.floor(Math.random() * (maxVotes - minVotes + 1)) + minVotes;

      // Obtener todos los bots de la base de datos
      const bots = await db.user.findMany({
        where: { email: { startsWith: "bot." } },
        select: { id: true, gender: true, birthYear: true },
      });

      if (bots.length > 0) {
        const ratingsToInsert = [];
        const currentYear = new Date().getFullYear();

        // Pre-calcular el año y los géneros una sola vez antes del bucle
        const movieGenres = tmdbMovie.genres;
        const movieYear = tmdbMovie.year ? parseInt(tmdbMovie.year.toString().slice(0, 4), 10) : null;
        const baseRating = tmdbMovie.tmdbRating || 7.0;

        // Seleccionar una muestra aleatoria de bots
        const shuffledBots = [...bots].sort(() => 0.5 - Math.random()).slice(0, numVotes);

        for (const bot of shuffledBots) {
          // 1. Calcular el sesgo demográfico con el motor expandido y nostalgia
          const demographicBias = calculateDemographicBias(bot, movieGenres, movieYear, currentYear);

          // 2. Aplicar varianza aleatoria (ruido estadístico de puntuaciones)
          const randomNoise = Math.random() * 2.4 - 1.2; 

          // 3. Calcular nota final
          let simulatedScore = baseRating + demographicBias + randomNoise;

          // 4. Asegurar límites (1-10) y redondear a entero
          simulatedScore = Math.max(1, Math.min(10, simulatedScore));
          const finalScore = Math.round(simulatedScore);

          ratingsToInsert.push({
            score: finalScore,
            userId: bot.id,
            movieId: savedMovie.id,
            isArtificial: true,
          });
        }

        // Inserción agrupada ultra-rápida (Prisma 7 createMany)
        await db.rating.createMany({
          data: ratingsToInsert,
        });
        console.log(`[Simulación] ✅ Inyectados ${ratingsToInsert.length} votos de bots en "${savedMovie.title}"`);
      }
    } catch (simError) {
      console.error(`Error al inyectar valoraciones artificiales para película ID ${tmdbId}:`, simError);
    }

    console.log(`[Caché local] ✅ Película importada y guardada en BD: "${savedMovie.title}"`);
    return savedMovie;
  } catch (error) {
    console.error(`Error al guardar la película TMDB ID ${tmdbId} en la base de datos:`, error);
    return null;
  }
}
