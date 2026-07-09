import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: Crear o actualizar una valoración de película (y aplicar reemplazo 1-a-1 de bots)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para valorar películas." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { movieId, score } = body;

    // Validar puntuación entre 1 y 10
    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      return NextResponse.json(
        { error: "La puntuación debe ser un número entero entre 1 y 10." },
        { status: 400 }
      );
    }

    // Verificar que la película existe físicamente
    const movie = await db.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return NextResponse.json(
        { error: "La película especificada no existe." },
        { status: 404 }
      );
    }

    // Comprobar si el usuario ya ha valorado esta película anteriormente
    const existingRating = await db.rating.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    let rating;

    if (existingRating) {
      // 1. Si ya existe, actualizamos la nota de la valoración real
      rating = await db.rating.update({
        where: { id: existingRating.id },
        data: { score: parsedScore },
      });
      console.log(`[Valoración] Actualizada nota de usuario ${session.user.email} para película ${movie.title} a ${parsedScore}`);
    } else {
      // 2. Si no existe, es una nueva valoración real.
      
      // Aplicar algoritmo de reemplazo 1-a-1:
      // Buscamos si existe alguna valoración artificial (bot) para esta película
      const artificialRating = await db.rating.findFirst({
        where: {
          movieId,
          isArtificial: true,
        },
      });

      if (artificialRating) {
        // Borramos un voto de bot para equilibrar la masa de votos
        await db.rating.delete({
          where: { id: artificialRating.id },
        });
        console.log(`[Decaimiento] Borrado 1 voto artificial de bot para la película ${movie.title} por inserción de voto real.`);
      }

      // Creamos la valoración real del usuario
      rating = await db.rating.create({
        data: {
          score: parsedScore,
          userId,
          movieId,
          isArtificial: false,
        },
      });
      console.log(`[Valoración] Creado nuevo voto real de usuario ${session.user.email} para película ${movie.title} con nota ${parsedScore}`);
    }

    // 3. Recalcular nota media en tiempo real para retornar al cliente
    const allRatings = await db.rating.findMany({
      where: { movieId },
    });
    
    const count = allRatings.length;
    const avg = count > 0
      ? (allRatings.reduce((sum, r) => sum + r.score, 0) / count).toFixed(1)
      : null;

    return NextResponse.json({
      message: "Valoración registrada con éxito.",
      rating,
      stats: {
        avgRating: avg,
        ratingCount: count,
      },
    });

  } catch (error) {
    console.error("Error en API de valoraciones (POST):", error);
    return NextResponse.json(
      { error: "Ocurrió un error al registrar la valoración." },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar la valoración de una película para el usuario actual
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");

    if (!movieId) {
      return NextResponse.json(
        { error: "Falta el identificador de la película (movieId)." },
        { status: 400 }
      );
    }

    // Buscar y eliminar el rating
    const targetRating = await db.rating.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    if (!targetRating) {
      return NextResponse.json(
        { error: "No tienes ninguna valoración registrada para esta película." },
        { status: 404 }
      );
    }

    await db.rating.delete({
      where: { id: targetRating.id },
    });

    console.log(`[Valoración] Eliminada valoración del usuario ${session.user.email} para película ID ${movieId}`);

    // Recalcular estadísticas actualizadas
    const allRatings = await db.rating.findMany({
      where: { movieId },
    });
    
    const count = allRatings.length;
    const avg = count > 0
      ? (allRatings.reduce((sum, r) => sum + r.score, 0) / count).toFixed(1)
      : null;

    return NextResponse.json({
      message: "Valoración eliminada correctamente.",
      stats: {
        avgRating: avg,
        ratingCount: count,
      },
    });

  } catch (error) {
    console.error("Error en API de valoraciones (DELETE):", error);
    return NextResponse.json(
      { error: "Ocurrió un error al eliminar la valoración." },
      { status: 500 }
    );
  }
}
