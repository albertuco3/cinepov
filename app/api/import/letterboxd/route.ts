import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchMovieByTitleAndYear } from "@/lib/tmdb";
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
    const nameIdx = headerColumns.findIndex((c) => c === "name" || c === "title");
    const yearIdx = headerColumns.findIndex((c) => c === "year");
    const ratingIdx = headerColumns.findIndex((c) => c === "rating");

    if (nameIdx === -1 || ratingIdx === -1) {
      return NextResponse.json(
        { error: "La estructura del archivo CSV de Letterboxd es inválida. Debe contener las columnas 'Name' o 'Title', y 'Rating'." },
        { status: 400 }
      );
    }

    const rawMoviesToImport = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const columns = parseCSVLine(line);
      // Validar que la línea tenga suficientes columnas
      if (columns.length <= Math.max(nameIdx, ratingIdx)) continue;

      // Limpiar comillas iniciales y finales residuales del parser
      const title = columns[nameIdx].replace(/^"|"$/g, "").trim();
      const yearStr = yearIdx !== -1 ? columns[yearIdx].replace(/^"|"$/g, "").trim() : "";
      const ratingStr = columns[ratingIdx].replace(/^"|"$/g, "").trim();

      const year = yearStr ? parseInt(yearStr, 10) : 0;
      const rating = ratingStr ? parseFloat(ratingStr) : null;

      // Solo importar si tiene título y valoración numérica válida
      if (title && rating !== null && !isNaN(rating)) {
        rawMoviesToImport.push({
          title,
          year: isNaN(year) ? 0 : year,
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
