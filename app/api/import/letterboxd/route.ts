import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchMovieByTitleAndYear } from "@/lib/tmdb";
import { getOrCreateMovie } from "@/lib/movies";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { parseLetterboxdCsv } from "@/lib/csv";

export async function POST(request: Request) {
  try {
    // 1. Validar sesión de usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const userId = session.user.id;

    // Cada importación puede disparar cientos de llamadas a TMDB: limitarla
    // protege nuestra cuota de API antes que nuestro servidor.
    const importLimit = await checkRateLimit("import", userId);
    if (!importLimit.allowed) {
      return rateLimitResponse(
        importLimit,
        "Has realizado varias importaciones seguidas. Espera un rato antes de volver a intentarlo."
      );
    }

    // 2. Extraer y parsear cuerpo CSV mediante PapaParse
    const { csvText } = await responseToJSON(request);
    const parseResult = parseLetterboxdCsv(csvText);
    if (!parseResult.ok) {
      return NextResponse.json({ error: parseResult.error }, { status: 400 });
    }

    const rawMoviesToImport = parseResult.movies;

    // Limitar la importación a un máximo de 100 películas para evitar timeouts y rate limits
    const limit = 100;
    const moviesToProcess = rawMoviesToImport.slice(0, limit);

    const imported = [];
    const failed = [];

    // 4. Procesar de forma secuencial con delay de 100ms
    for (const item of moviesToProcess) {
      try {
        // Buscar la película en TMDB
        const tmdbMovie = await searchMovieByTitleAndYear(item.title, item.year);
        
        if (!tmdbMovie) {
          failed.push({ title: item.title, reason: "No encontrada en TMDB" });
          continue;
        }

        // Registrar o recuperar la película localmente
        const movie = await getOrCreateMovie(tmdbMovie.id);
        
        if (!movie) {
          failed.push({ title: item.title, reason: "Error al registrar la película en base de datos" });
          continue;
        }

        // Convertir la calificación de Letterboxd (0.5 a 5) a la de CinePOV (1 a 10)
        // Multiplicamos por 2, nos aseguramos que esté entre 1 y 10, y redondeamos
        const score = Math.max(1, Math.min(10, Math.round(item.rating * 2)));

        // Guardar o actualizar la valoración del usuario
        await db.rating.upsert({
          where: {
            userId_movieId: {
              userId,
              movieId: movie.id,
            },
          },
          update: {
            score,
            createdAt: new Date(),
          },
          create: {
            userId,
            movieId: movie.id,
            score,
            isArtificial: false,
          },
        });

        imported.push({ title: movie.title, score });

        // Pequeña pausa para no saturar las llamadas a la API de TMDB
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (itemErr: any) {
        console.error(`Error procesando película "${item.title}":`, itemErr);
        failed.push({ title: item.title, reason: itemErr.message || "Error desconocido" });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: moviesToProcess.length,
      totalInFile: rawMoviesToImport.length,
      importedCount: imported.length,
      failedCount: failed.length,
      imported,
      failed,
      limitApplied: rawMoviesToImport.length > limit,
      limit,
    });
  } catch (error: any) {
    console.error("Error crítico en importación de Letterboxd:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor al procesar la importación." },
      { status: 500 }
    );
  }
}

// Función auxiliar para leer JSON de la petición
async function responseToJSON(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
