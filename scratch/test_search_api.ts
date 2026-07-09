import "dotenv/config";

async function runSearchApiTest() {
  console.log("=== INICIANDO TEST DE ENDPOINT DE BÚSQUEDA DE PELÍCULAS ===");

  try {
    // 1. Probar búsqueda de película real "Batman"
    const query = "Batman";
    console.log(`\n1. Haciendo petición de búsqueda: GET /api/movies/search?q=${query}...`);
    
    const response = await fetch(`http://localhost:3000/api/movies/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    console.log(`Estado HTTP: ${response.status}`);
    
    if (data.results && Array.isArray(data.results)) {
      console.log(`✅ ¡Éxito! Encontrados ${data.results.length} resultados (máximo 8 esperados).`);
      console.log("Primer resultado del API:");
      console.log(data.results[0]);
    } else {
      console.log("❌ Error: La respuesta no tiene el formato de resultados esperado.");
    }

    // 2. Probar con query vacía
    console.log("\n2. Probando petición con query vacía...");
    const emptyResponse = await fetch("http://localhost:3000/api/movies/search?q=");
    const emptyData = await emptyResponse.json();
    console.log(`Estado HTTP: ${emptyResponse.status}`);
    console.log("Respuesta con query vacía (esperado array vacío):", emptyData);

    console.log("\n=== TEST DE API DE BÚSQUEDA COMPLETADO CON ÉXITO ===");
  } catch (error) {
    console.error("❌ Error durante el test de la API de búsqueda:", error);
  }
}

runSearchApiTest();
