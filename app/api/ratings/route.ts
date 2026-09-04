import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeAndTruncate } from "@/lib/sanitize";
import { checkContentModeration } from "@/lib/moderation";
import { checkReviewBombingAnomaly } from "@/lib/anti-abuse";

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

    const limit = await checkRateLimit("rating", userId);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "Estás valorando demasiado rápido. Espera unos segundos.");
    }

    const body = await request.json();
    const { movieId, score, watchedAt, reviewText } = body;

    // Validar puntuación entre 1 y 10
    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      return NextResponse.json(
        { error: "La puntuación debe ser un número entero entre 1 y 10." },
        { status: 400 }
      );
    }

    // Fecha de visionado opcional. Convierte la valoración en un diario, que es
    // el hábito recurrente que sostiene la retención.
    let parsedWatchedAt: Date | null = null;
    if (watchedAt) {
      const candidate = new Date(watchedAt);
      if (isNaN(candidate.getTime())) {
        return NextResponse.json(
          { error: "La fecha de visionado no es válida." },
          { status: 400 }
        );
      }
      if (candidate.getTime() > Date.now()) {
        return NextResponse.json(
          { error: "No puedes registrar el visionado de una película en el futuro." },
          { status: 400 }
        );
      }
      parsedWatchedAt = candidate;
    }

    // Reseña de texto libre opcional, saneada contra XSS y limitada a 2000 caracteres
    let sanitizedReview: string | null = null;
    if (typeof reviewText === "string" && reviewText.trim().length > 0) {
      sanitizedReview = sanitizeAndTruncate(reviewText.trim(), 2000);
      if (sanitizedReview.length === 0) {
        sanitizedReview = null;
      } else {
        // Filtro automático de contenido ofensivo (Fase 5.1.3)
        const moderation = checkContentModeration(sanitizedReview);
        if (moderation.isOffensive) {
          return NextResponse.json(
            { error: "Tu reseña contiene términos que no cumplen las normas de la comunidad. Por favor, modifícala antes de publicarla." },
            { status: 400 }
          );
        }
      }
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

    // Comprobación de anomalías de review bombing (Fase 3.6)
    const anomalyCheck = await checkReviewBombingAnomaly(movieId, parsedScore);
    if (anomalyCheck.isAnomaly) {
      console.warn(`[ANTIABUSO / REVIEW BOMBING] Pico detectado en película ${movie.title}: ${anomalyCheck.details}`);
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
        data: {
          score: parsedScore,
          // Solo se sobrescribe la fecha si el cliente envía una nueva.
          ...(parsedWatchedAt ? { watchedAt: parsedWatchedAt } : {}),
          ...(typeof reviewText !== "undefined" ? { reviewText: sanitizedReview } : {}),
        },
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
          watchedAt: parsedWatchedAt,
          reviewText: sanitizedReview,
        },
      });
      console.log(`[Valoración] Creado nuevo voto real de usuario ${session.user.email} para película ${movie.title} con nota ${parsedScore}`);
    }

    // Auto-limpieza de Watchlist (Fase 5.2.1):
    // Si la película estaba en la watchlist, se retira automáticamente porque ya ha sido vista.
    await db.watchlist.deleteMany({
      where: { userId, movieId },
    });

    // 3. Recalcular la nota media de valoraciones REALES para retornar al cliente.
    // Las estimaciones de arranque nunca entran en la nota que se presenta.
    const realAgg = await db.rating.aggregate({
      where: { movieId, isArtificial: false },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      message: "Valoración registrada con éxito.",
      rating,
      stats: {
        avgRating: realAgg._avg.score !== null ? realAgg._avg.score.toFixed(1) : null,
        ratingCount: realAgg._count.score,
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

    // Recalcular estadísticas actualizadas sobre valoraciones reales
    const realAgg = await db.rating.aggregate({
      where: { movieId, isArtificial: false },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      message: "Valoración eliminada correctamente.",
      stats: {
        avgRating: realAgg._avg.score !== null ? realAgg._avg.score.toFixed(1) : null,
        ratingCount: realAgg._count.score,
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
