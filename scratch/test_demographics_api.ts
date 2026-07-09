import "dotenv/config";
import { db } from "../lib/db";

async function runDemographicsApiTest() {
  console.log("=== INICIANDO TEST DE ENDPOINT DE AGREGACIÓN DEMOGRÁFICA ===");

  try {
    // 1. Obtener la primera película disponible de la base de datos (por ejemplo, Origen)
    const movie = await db.movie.findFirst();

    if (!movie) {
      console.log("❌ Error: No se encontraron películas en la base de datos local.");
      return;
    }

    console.log(`Usando película: "${movie.title}"`);
    console.log(`Petición: GET http://localhost:3000/api/movies/${movie.id}/demographics...`);

    const response = await fetch(`http://localhost:3000/api/movies/${movie.id}/demographics`);
    const data = await response.json();

    console.log(`Estado HTTP: ${response.status}`);
    
    if (data.global && data.byGender && data.byAgeRange && data.cross) {
      console.log("✅ ¡Éxito! Estructura del JSON demográfico verificada correctamente.");
      console.log("\n--- RESULTADO DEL ANÁLISIS DEMOGRÁFICO DE AVATAR ---");
      console.log("Global:", data.global);
      console.log("\nPor Género:");
      console.log("- Masculino:", data.byGender.male);
      console.log("- Femenino:", data.byGender.female);
      console.log("- No binario:", data.byGender.non_binary);
      
      console.log("\nPor Rango de Edad:");
      console.log("- 18-24 años:", data.byAgeRange["18_24"]);
      console.log("- 25-34 años:", data.byAgeRange["25_34"]);
      console.log("- 35-44 años:", data.byAgeRange["35_44"]);
      console.log("- 45-54 años:", data.byAgeRange["45_54"]);
      console.log("- 55+ años:", data.byAgeRange["55_plus"]);

      console.log("\nCruce Cruzado (Ejemplo Hombre 25-34 años):");
      console.log(data.cross.male["25_34"]);
    } else {
      console.log("❌ Error: El JSON devuelto no tiene la estructura demográfica esperada.");
    }

    console.log("\n=== TEST DE API DE AGREGACIÓN DEMOGRÁFICA COMPLETADO ===");
  } catch (error) {
    console.error("❌ Error durante el test de la API demográfica:", error);
  }
}

runDemographicsApiTest();
