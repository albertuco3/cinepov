import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { findMovieByImdbId } from "@/lib/tmdb";
import { getOrCreateMovie } from "@/lib/movies";

// Función auxiliar para parsear una línea de CSV de manera robusta (manejando comillas)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes; // Alternar estado de comillas
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: Request) {
  try {
    // 1. Validar sesión de usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Extraer cuerpo de la petición
    const { csvText } = await responseToJSON(request);
    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json({ error: "El contenido del archivo CSV está vacío." }, { status: 400 });
    }

    // 3. Parsear líneas del CSV
    const lines = csvText.split(/\r?\n/).map((l) => l.trim());
    if (lines.length <= 1) {
      return NextResponse.json({ error: "El archivo CSV no contiene datos suficientes." }, { status: 400 });
    }

    // Analizar la cabecera para identificar índices de columnas
    const headerColumns = lines[0].split(",").map((col) => col.trim().toLowerCase());
    const constIdx = headerColumns.findIndex((c) => c === "const" || c === "imdb id" || c === "position");
    const ratingIdx = headerColumns.findIndex((c) => c === "your rating" || c === "rating");
    const titleIdx = headerColumns.findIndex((c) => c === "title" || c === "name");
    const typeIdx = headerColumns.findIndex((c) => c === "title type" || c === "type");

    if (constIdx === -1 || ratingIdx === -1 || titleIdx === -1) {
      return NextResponse.json(
        { error: "La estructura del archivo CSV de IMDb es inválida. Debe contener al menos las columnas 'Const' (ID de IMDb), 'Title' y 'Your Rating'." },
        { status: 400 }
      );
    }

    const rawMoviesToImport = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const columns = parseCSVLine(line);
      // Validar que la línea tenga suficientes columnas
      if (columns.length <= Math.max(constIdx, ratingIdx, titleIdx)) continue;

      // Extraer datos
      const imdbId = columns[constIdx].replace(/^"|"$/g, "").trim();
      const ratingStr = columns[ratingIdx].replace(/^"|"$/g, "").trim();
      const title = columns[titleIdx].replace(/^"|"$/g, "").trim();
      const titleType = typeIdx !== -1 ? columns[typeIdx].replace(/^"|"$/g, "").trim().toLowerCase() : "movie";

      // Filtrar por películas únicamente (ignorar series, videojuegos, etc.)
      if (titleType !== "movie" && titleType !== "tvmovie" && titleType !== "short") {
        continue;
      }

      const rating = ratingStr ? parseFloat(ratingStr) : null;

      // Solo importar si tiene ID de IMDb válido y nota numérica
      if (imdbId && imdbId.startsWith("tt") && rating !== null && !isNaN(rating) && title) {
        rawMoviesToImport.push({
          imdbId,
          title,
          rating,
        });
      }
    }

    if (rawMoviesToImport.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron películas con valoraciones válidas para importar en el archivo CSV." },
        { status: 400 }
      );
    }

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
      } catch (itemErr: any) {
        console.error(`Error procesando película de IMDb "${item.title}":`, itemErr);
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
    console.error("Error crítico en importación de IMDb:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor al procesar la importación." },
      { status: 500 }
    );
  }
}

// Función auxiliar para leer JSON
async function responseToJSON(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
