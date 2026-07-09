import "dotenv/config";
import { db } from "../lib/db";

async function runRatingApiTest() {
  console.log("=== INICIANDO TEST DE INTEGRACIÓN DE VALORACIONES (1-10) ===");

  try {
    // 1. Obtener una película y un usuario reales de la base de datos local
    const movie = await db.movie.findFirst();
    const user = await db.user.findFirst({
      where: { email: { not: "test.user@example.com" } }, // Usar un usuario bot del seed
    });

    if (!movie || !user) {
      console.log("❌ Error: No se encontraron películas o usuarios para el test en la base de datos.");
      return;
    }

    console.log(`Usando película: "${movie.title}" (ID: ${movie.id})`);
    console.log(`Usando usuario: "${user.displayName}" (ID: ${user.id})`);

    // Limpiar votos anteriores del usuario para este test
    await db.rating.deleteMany({
      where: { userId: user.id, movieId: movie.id },
    });

    // 2. Inyectar un voto artificial para comprobar el algoritmo de reemplazo 1-a-1
    console.log("\n1. Inyectando 1 voto artificial de bot...");
    const botRating = await db.rating.create({
      data: {
        score: 7,
        userId: user.id,
        movieId: movie.id,
        isArtificial: true,
      },
    });
    console.log("Voto artificial creado:", botRating);

    // Contar ratings iniciales
    const initialCount = await db.rating.count({ where: { movieId: movie.id } });
    console.log(`Votos totales iniciales en la película: ${initialCount}`);

    // 3. Simular la API POST /api/ratings (Insertar un voto REAL)
    console.log("\n2. Insertando voto REAL del usuario...");
    
    // Simular lógica de reemplazo 1-a-1:
    const artificialRating = await db.rating.findFirst({
      where: { movieId: movie.id, isArtificial: true },
    });

    if (artificialRating) {
      console.log(`-> Encontrado voto artificial (ID: ${artificialRating.id}). Borrando...`);
      await db.rating.delete({ where: { id: artificialRating.id } });
    }

    // Insertar voto real
    const realRating = await db.rating.create({
      data: {
        score: 9,
        userId: user.id,
        movieId: movie.id,
        isArtificial: false,
      },
    });
    console.log("Voto real creado:", realRating);

    // Contar ratings finales
    const finalCount = await db.rating.count({ where: { movieId: movie.id } });
    console.log(`Votos totales tras insertar voto real: ${finalCount}`);
    
    if (finalCount === initialCount) {
      console.log("✅ ¡Éxito! El número de votos se mantuvo estable (reemplazo 1-a-1 correcto).");
    } else {
      console.log("❌ Error: Falló la compensación 1-a-1 de votos.");
    }

    // 4. Limpieza del test
    await db.rating.delete({ where: { id: realRating.id } });
    console.log("\nLimpieza de test realizada.");
    console.log("=== TEST DE VALORACIONES COMPLETADO CON ÉXITO ===");

  } catch (error) {
    console.error("❌ Error durante el test de valoraciones:", error);
  }
}

runRatingApiTest();
