import "dotenv/config";
import { db } from "../lib/db";
import { getOrCreateMovie } from "../lib/movies";

async function testSingleMovie(tmdbId: number) {
  console.log(`\n--- Probando importación para TMDB ID: ${tmdbId} ---`);

  // Limpiar si existía
  const existingMovie = await db.movie.findUnique({ where: { tmdbId } });
  if (existingMovie) {
    await db.rating.deleteMany({ where: { movieId: existingMovie.id } });
    await db.movie.delete({ where: { id: existingMovie.id } });
    console.log("Limpieza previa realizada.");
  }

  // Importar
  const movie = await getOrCreateMovie(tmdbId);
  if (!movie) {
    console.log("❌ Error: No se pudo importar la película.");
    return null;
  }

  console.log(`Película: "${movie.title}"`);
  console.log(`TMDB Rating: ${movie.tmdbRating}`);

  // Consultar ratings creados
  const ratings = await db.rating.findMany({
    where: { movieId: movie.id },
    include: { user: true },
  });

  console.log(`Votos inyectados: ${ratings.length}`);
  
  // Limpieza del test
  await db.rating.deleteMany({ where: { movieId: movie.id } });
  await db.movie.delete({ where: { id: movie.id } });
  console.log("Limpieza de test realizada.");

  return ratings.length;
}

async function runImportSimulationTest() {
  console.log("=== INICIANDO TEST DE INYECCIÓN DE BOTS ESCALADO POR POPULARIDAD ===");

  try {
    // 1. Probar un Blockbuster (Avatar - ID: 19995) -> Debería tener muchos votos (120 a 300+)
    const avatarVotes = await testSingleMovie(19995);

    // 2. Probar una película clásica / de autor (Metrópolis - ID: 19) -> Debería tener pocos votos (15 a 60)
    const metropolisVotes = await testSingleMovie(19);

    console.log("\n=== RESULTADOS FINALES DE ESCALADO ===");
    console.log(`- Avatar (Alta Popularidad): ${avatarVotes} votos inyectados.`);
    console.log(`- Metrópolis (Baja Popularidad): ${metropolisVotes} votos inyectados.`);

    if (avatarVotes !== null && metropolisVotes !== null && avatarVotes > metropolisVotes) {
      console.log("✅ ¡Éxito absoluto! La inyección de votos escala de forma realista según la popularidad de la película.");
    } else {
      console.log("❌ Error: El escalado por popularidad falló o los resultados son inconsistentes.");
    }

    console.log("=== TEST DE POPULARIDAD COMPLETADO ===");
  } catch (error) {
    console.error("❌ Error ejecutando test de popularidad:", error);
  }
}

runImportSimulationTest();
