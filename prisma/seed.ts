import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

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
      genreBias += botAge < 30 ? -0.8 : -0.4;
    } else if (bot.gender === "male") {
      genreBias += botAge > 45 ? 0.7 : 0.3;
    }
  }

  // 2. Terror (Muy dependiente de la edad)
  if (hasGenre("Terror")) {
    if (botAge < 25) {
      genreBias += 0.5;
    } else if (botAge > 45) {
      genreBias += -1.0;
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
      genreBias += 0.4;
    } else if (botAge >= 19 && botAge < 30) {
      genreBias += -0.4;
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
  let finalBias = Math.max(-1.2, Math.min(1.2, genreBias));

  // --- FACTOR NOSTALGIA ---
  if (movieYear) {
    const ageAtRelease = movieYear - bot.birthYear;
    if (ageAtRelease >= 12 && ageAtRelease <= 22) {
      finalBias += 0.5;
    }
  }

  return finalBias;
}

async function fetchMovieFromTMDB(tmdbId: number) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === "tu_api_key_aqui") {
    throw new Error("TMDB_API_KEY no está configurada en el entorno.");
  }
  
  // 1. Obtener detalles
  const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=es-ES`;
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    throw new Error(`Error detalles TMDB: ${detailsRes.status}`);
  }
  const details = await detailsRes.json();

  // 2. Obtener créditos
  const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${apiKey}`;
  const creditsRes = await fetch(creditsUrl);
  if (!creditsRes.ok) {
    throw new Error(`Error créditos TMDB: ${creditsRes.status}`);
  }
  const credits = await creditsRes.json();

  const directorInfo = credits.crew.find((member: any) => member.job === "Director");
  const director = directorInfo ? directorInfo.name : "Director Desconocido";
  const genres = details.genres ? details.genres.map((g: any) => g.name) : [];
  const year = details.release_date ? new Date(details.release_date).getFullYear() : 0;
  const cast = credits.cast
    ? credits.cast
        .slice(0, 6)
        .map((actor: any) => actor.name)
        .join(", ")
    : "";

  const posterUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop";

  const backdropUrl = details.backdrop_path
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : null;

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
}

async function main() {
  console.log("Iniciando el sembrado de datos (seed)...");

  // 1. Limpiar base de datos
  await prisma.rating.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  console.log("Base de datos limpia.");

  // 2. Crear Géneros
  const genresData = [
    { name: "Drama" },
    { name: "Acción" },
    { name: "Ciencia ficción" },
    { name: "Terror" },
    { name: "Romance" },
    { name: "Suspense" },
    { name: "Comedia" },
  ];

  const genres: Record<string, any> = {};
  for (const g of genresData) {
    genres[g.name] = await prisma.genre.create({
      data: g,
    });
  }
  console.log(`Creados ${Object.keys(genres).length} géneros.`);

  // 3. Crear Usuarios con perfiles demográficos variados
  // Definimos años de nacimiento para simular distintos rangos en 2026:
  // - 2008 (18 años) -> Adolescentes / Jóvenes
  // - 1998 (28 años) -> Jóvenes adultos
  // - 1988 (38 años) -> Adultos
  // - 1973 (53 años) -> Adultos maduros
  // - 1958 (68 años) -> Seniors
  const usersData = [
    { email: "lucia.98@example.com", displayName: "Lucía", birthYear: 1998, gender: "female" },
    { email: "carlos.action@example.com", displayName: "Carlos", birthYear: 1988, gender: "male" },
    { email: "sofia.cinema@example.com", displayName: "Sofía", birthYear: 1973, gender: "female" },
    { email: "mateo.genz@example.com", displayName: "Mateo", birthYear: 2008, gender: "male" },
    { email: "alex.nb@example.com", displayName: "Alex", birthYear: 1995, gender: "non_binary" },
    { email: "elena.classic@example.com", displayName: "Elena", birthYear: 1958, gender: "female" },
    { email: "antonio.55@example.com", displayName: "Antonio", birthYear: 1968, gender: "male" },
    { email: "julia.romance@example.com", displayName: "Julia", birthYear: 2000, gender: "female" },
    { email: "david.sci@example.com", displayName: "David", birthYear: 1990, gender: "male" },
    { email: "clara.terror@example.com", displayName: "Clara", birthYear: 2005, gender: "female" },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        displayName: u.displayName,
        birthYear: u.birthYear,
        gender: u.gender,
        passwordHash: "$2b$10$xyzFakeHashForDevelopmentTestingOnly", // password simulada
      },
    });
    users.push(user);
  }
  console.log(`Creados ${users.length} usuarios.`);

  // 3.5. Crear Pool de 5000 Bots Demográficos para simulación (Cold Start)
  console.log("Generando pool de 5000 bots demográficos...");
  const botsData = [];
  const maleNames = [
    "carlos", "david", "javier", "daniel", "antonio", "manuel", "jose", "francisco", "alejandro", "sergio",
    "miguel", "alberto", "jorge", "adrian", "pablo", "raul", "ivan", "diego", "alvaro", "ruben"
  ];
  const femaleNames = [
    "maria", "lucia", "marta", "sofia", "laura", "ana", "carmen", "isabel", "elena", "cristina",
    "sara", "paula", "raquel", "sandra", "patricia", "andrea", "julia", "irene", "alicia", "silvia"
  ];
  const suffixes = [
    "cine", "film", "geek", "pov", "lover", "fan", "critic", "butaca", "claqueta", "palomitas",
    "oscar", "nolan", "tarantino", "scorsese", "kubrick", "hitchcock", "cinema", "screen", "camara", "guion"
  ];

  for (let i = 1; i <= 5000; i++) {
    // 1. Determinar primero el género de forma probabilística
    const randGender = Math.random();
    const gender = randGender < 0.499 ? "male" : randGender < 0.998 ? "female" : "non_binary";

    // 2. Elegir un nombre acorde al género seleccionado para evitar inconsistencias visuales
    let name = "";
    if (gender === "male") {
      name = maleNames[(i - 1) % maleNames.length];
    } else if (gender === "female") {
      name = femaleNames[(i - 1) % femaleNames.length];
    } else {
      // Para no binarios, podemos mezclar indistintamente
      const combined = [...maleNames, ...femaleNames];
      name = combined[(i - 1) % combined.length];
    }

    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const displayName = `${name}_${suffix}${i}`;

    // Distribución demográfica realista para 2026:
    // - 40% de 25-34 años (1992-2001)
    // - 30% de 18-24 años (2002-2008)
    // - 20% de 35-54 años (1972-1991)
    // - 10% de 55+ años (1950-1971)
    let birthYear;
    const rand = Math.random();
    if (rand < 0.40) {
      birthYear = Math.floor(Math.random() * (2001 - 1992 + 1)) + 1992;
    } else if (rand < 0.70) {
      birthYear = Math.floor(Math.random() * (2008 - 2002 + 1)) + 2002;
    } else if (rand < 0.90) {
      birthYear = Math.floor(Math.random() * (1991 - 1972 + 1)) + 1972;
    } else {
      birthYear = Math.floor(Math.random() * (1971 - 1950 + 1)) + 1950;
    }

    botsData.push({
      email: `bot.${i}@cinepov.local`,
      displayName,
      birthYear,
      gender,
      passwordHash: "$2b$10$xyzFakeHashForDevelopmentTestingOnly",
    });
  }

  const { count: botsCreated } = await prisma.user.createMany({
    data: botsData,
  });
  console.log(`✅ Creados ${botsCreated} usuarios bot para la simulación demográfica.`);

  // 4. Crear Películas Esenciales (Onboarding) desde la API de TMDB
  const ESSENTIAL_MOVIE_IDS = [
    27205,   // Inception
    238,     // The Godfather
    57201,   // Parasite
    597,     // Titanic
    155,     // The Dark Knight
    680,     // Pulp Fiction
    157336,  // Interstellar
    120,     // LotR: Fellowship of the Ring
    129,     // Spirited Away
    603,     // The Matrix
    98,      // Gladiator
    11,      // Star Wars: A New Hope
    13,      // Forrest Gump
    289,     // Jaws
    329,     // Jurassic Park
    278,     // The Shawshank Redemption
    550,     // Fight Club
    105,     // Back to the Future
    1417,    // El laberinto del fauno
    10439,   // Torrente
    1585,    // Tesis
    37165,   // The Truman Show
    239,     // Psycho
    274,     // The Silence of the Lambs
    424,     // Schindler's List
    348,     // Alien
    78,      // Blade Runner
    19995,   // Avatar
    244786,  // Whiplash
    313369,  // La La Land
    283,     // Casablanca
    15,      // Citizen Kane
    8587,    // The Lion King
    862,     // Toy Story
    808,     // Shrek
    354912,  // Coco
    324857,  // Spider-Man: Into the Spider-Verse
    475557,  // Joker
    24428,   // The Avengers
    194,     // Amélie
    106646,  // The Wolf of Wall Street
    769,     // Goodfellas
    16869,   // Inglourious Basterds
    857,     // Saving Private Ryan
    33,      // Unforgiven
    391,     // A Fistful of Dollars
    10494,   // Perfect Blue
    149,     // Todo sobre mi madre
    33273,   // Celda 211
    429,     // The Good, the Bad and the Ugly
  ];

  console.log(`Consultando ${ESSENTIAL_MOVIE_IDS.length} películas esenciales en la API de TMDB...`);
  const movies = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < ESSENTIAL_MOVIE_IDS.length; i++) {
    const tmdbId = ESSENTIAL_MOVIE_IDS[i];
    try {
      console.log(`[${i + 1}/${ESSENTIAL_MOVIE_IDS.length}] Importando TMDB ID: ${tmdbId}...`);
      const tmdbMovie = await fetchMovieFromTMDB(tmdbId);

      const movie = await prisma.movie.create({
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
          isFeatured: true,
          genres: {
            connectOrCreate: tmdbMovie.genres.map((name: string) => ({
              where: { name },
              create: { name },
            })),
          },
        },
        include: {
          genres: true,
        },
      });
      (movie as any).voteCount = tmdbMovie.voteCount || 0;
      movies.push(movie);
      
      // Delay de 100ms para respetar límites de la API de TMDB
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err: any) {
      console.error(`❌ Error al importar película TMDB ID ${tmdbId}:`, err.message);
    }
  }
  console.log(`✅ Creadas e importadas ${movies.length} películas esenciales.`);

  // 5. Crear Valoraciones (Ratings) con sesgos demográficos avanzados para los bots
  console.log("Generando valoraciones de simulación demográfica para las películas esenciales...");
  const bots = await prisma.user.findMany({
    where: { email: { startsWith: "bot." } },
  });

  if (bots.length > 0) {
    const ratingsToInsert = [];

    for (const movie of movies) {
      const voteCount = (movie as any).voteCount || 0;
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

      const numVotes = Math.floor(Math.random() * (maxVotes - minVotes + 1)) + minVotes;
      const shuffledBots = [...bots].sort(() => 0.5 - Math.random()).slice(0, numVotes);
      const genresArray = movie.genres.map((g) => g.name);

      for (const bot of shuffledBots) {
        const demographicBias = calculateDemographicBias(
          { id: bot.id, gender: bot.gender, birthYear: bot.birthYear },
          genresArray,
          movie.year,
          currentYear
        );

        const randomNoise = Math.random() * 2.4 - 1.2;
        let score = (movie.tmdbRating || 7.0) + demographicBias + randomNoise;
        score = Math.max(1, Math.min(10, score));
        const finalScore = Math.round(score);

        ratingsToInsert.push({
          score: finalScore,
          userId: bot.id,
          movieId: movie.id,
          isArtificial: true,
        });
      }
    }

    // Inserción en bloques de Prisma createMany para maximizar rendimiento
    const { count: ratingsCreated } = await prisma.rating.createMany({
      data: ratingsToInsert,
    });
    console.log(`✅ Creadas ${ratingsCreated} valoraciones de simulación.`);
  }

  // Crear también algunas valoraciones fijas para los usuarios manuales de prueba (para ver diversidad inicial)
  console.log("Creando valoraciones manuales para usuarios de prueba...");
  if (users.length > 0 && movies.length >= 5) {
    // Lucía (F, 28) valora Origen, El Padrino, Titanic
    const lucia = users[0];
    const origen = movies.find(m => m.tmdbId === 27205);
    const padrino = movies.find(m => m.tmdbId === 238);
    const titanic = movies.find(m => m.tmdbId === 597);

    if (lucia && origen) await prisma.rating.create({ data: { userId: lucia.id, movieId: origen.id, score: 9 } });
    if (lucia && padrino) await prisma.rating.create({ data: { userId: lucia.id, movieId: padrino.id, score: 9 } });
    if (lucia && titanic) await prisma.rating.create({ data: { userId: lucia.id, movieId: titanic.id, score: 10 } });
  }

  console.log("Sembrado de datos finalizado correctamente.");
}

main()
  .catch((e) => {
    console.error("Error ejecutando el seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
