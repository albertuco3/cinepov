import { errorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { findMovieByImdbId } from "@/lib/tmdb";
import { getOrCreateMovie } from "@/lib/movies";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { parseImdbCsv } from "@/lib/csv";

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
    const { csvText } = await readCsvBody(request);
    const parseResult = parseImdbCsv(csvText);
    if (!parseResult.ok) {
      return NextResponse.json({ error: parseResult.error }, { status: 400 });
    }

    const rawMoviesToImport = parseResult.movies;

    // Limitar la importación a un máximo de 100 películas para evitar timeouts y rate limits
    const limit = 100;
    const moviesToProcess = rawMoviesToImport.slice(0, limit);

    const imported = [];
    const failed = [];

    // 4. Procesar secuencialmente con retardo de 100ms
    for (const item of moviesToProcess) {
      try {
        // Buscar película en TMDB usando su IMDb ID
        const tmdbMovieId = await findMovieByImdbId(item.imdbId);
        
        if (!tmdbMovieId) {
          failed.push({ title: item.title, reason: `No se encontró ID de TMDB para el IMDb ID ${item.imdbId}` });
          continue;
        }

        // Recuperar o registrar la película en base de datos local
        const movie = await getOrCreateMovie(tmdbMovieId);
        
        if (!movie) {
          failed.push({ title: item.title, reason: "Error al registrar la película en la base de datos" });
          continue;
        }

        // Puntuación de IMDb (escala 1 a 10) se mapea directamente a CinePOV
        const score = Math.max(1, Math.min(10, Math.round(item.rating)));

        // Guardar o actualizar la calificación
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

        // Retardo para evitar cuellos de botella con la API de TMDB
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (itemErr) {
        console.error(`Error procesando película de IMDb "${item.title}":`, itemErr);
        failed.push({ title: item.title, reason: errorMessage(itemErr) || "Error desconocido" });
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
  } catch (error) {
    console.error("Error crítico en importación de IMDb:", error);
    return NextResponse.json(
      { error: errorMessage(error) || "Error interno del servidor al procesar la importación." },
      { status: 500 }
    );
  }
}

// Función auxiliar para leer JSON
// Lee el cuerpo JSON sin romper si llega mal formado: `csvText` queda indefinido
// y la validación de más arriba devuelve el error adecuado.
async function readCsvBody(request: Request): Promise<{ csvText?: unknown }> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null ? (body as { csvText?: unknown }) : {};
  } catch {
    return {};
  }
}
