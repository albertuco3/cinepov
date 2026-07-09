import "dotenv/config";
import { getOrCreateMovie } from "../lib/movies";
import { db } from "../lib/db";

async function runCacheTest() {
  console.log("=== INICIANDO TEST DE ESTRATEGIA DE CACHÉ LOCAL ===");

  try {
    // 1. Consultar una película que YA existe en la BD (sembrada en el seed: Origen = 27205)
    console.log("\n1. Solicitando película sembrada (ID: 27205 - Origen)...");
    const movie1 = await getOrCreateMovie(27205);
    if (movie1) {
      console.log(`Resultado: Película "${movie1.title}" (Director: ${movie1.director})`);
    }

    // 2. Consultar una película que NO existe en la BD (ej: Avatar = 19995)
    const newTmdbId = 19995;
    
    // Asegurarse de que no existe antes de la prueba
    await db.movie.delete({ where: { tmdbId: newTmdbId } }).catch(() => {});
    
    console.log(`\n2. Solicitando nueva película no existente en BD (ID: ${newTmdbId} - Avatar)...`);
    const movie2 = await getOrCreateMovie(newTmdbId);
    if (movie2) {
      console.log(`Resultado: Película "${movie2.title}" (Director: ${movie2.director})`);
    }

    // 3. Volver a consultar la misma película recién importada (Avatar)
    console.log(`\n3. Solicitando la misma película por segunda vez (ID: ${newTmdbId})...`);
    const movie3 = await getOrCreateMovie(newTmdbId);
    if (movie3) {
      console.log(`Resultado: Película "${movie3.title}" (Director: ${movie3.director})`);
    }

    console.log("\n=== TEST DE CACHÉ COMPLETADO ===");
  } catch (error) {
    console.error("❌ Error durante el test de caché:", error);
  }
}

runCacheTest();
