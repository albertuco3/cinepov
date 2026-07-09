import "dotenv/config";
import { searchMovies, getMovieWithCredits } from "../lib/tmdb";

async function runTest() {
  console.log("=== INICIANDO TEST DE INTEGRACIÓN TMDB ===");

  try {
    // 1. Probar búsqueda
    const searchQuery = "Interstellar";
    console.log(`\n1. Buscando película: "${searchQuery}"...`);
    const searchResults = await searchMovies(searchQuery);

    if (searchResults.length === 0) {
      console.log("❌ No se encontraron películas.");
      return;
    }

    console.log(`✅ ¡Éxito! Encontradas ${searchResults.length} películas.`);
    console.log("Primera película encontrada:");
    console.log({
      id: searchResults[0].id,
      title: searchResults[0].title,
      original_title: searchResults[0].original_title,
      release_date: searchResults[0].release_date,
      vote_average: searchResults[0].vote_average,
    });

    // 2. Probar detalle y créditos
    const targetId = searchResults[0].id;
    console.log(`\n2. Obteniendo detalles y créditos para TMDB ID: ${targetId}...`);
    const movieDetails = await getMovieWithCredits(targetId);

    if (!movieDetails) {
      console.log("❌ No se pudieron obtener los detalles.");
      return;
    }

    console.log("✅ ¡Éxito! Detalles de la película formateados:");
    console.log(JSON.stringify(movieDetails, null, 2));

  } catch (error) {
    console.error("❌ Error durante el test:", error);
  }
}

runTest();
