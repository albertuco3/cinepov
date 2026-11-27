import { NextResponse } from "next/server";
import { parseJsonBody, requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeAndTruncate } from "@/lib/sanitize";
import { checkContentModeration } from "@/lib/moderation";
import { checkReviewBombingAnomaly } from "@/lib/anti-abuse";
import { ratingRequestSchema } from "@/lib/schemas";
import { countedRatingWhere } from "@/lib/rating-filters";
import { SOCIAL_ENABLED } from "@/lib/features";

// POST: Crear o actualizar una valoraciÃ³n de pelÃ­cula
export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const userId = auth.user.id;

    const limit = await checkRateLimit("rating", userId);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "EstÃ¡s valorando demasiado rÃ¡pido. Espera unos segundos.");
    }

    const parsed = await parseJsonBody(request, ratingRequestSchema);
    if (!parsed.ok) return parsed.response;

    const { movieId, score: parsedScore, watchedAt } = parsed.data;
    // Las reseÃ±as escritas solo se aceptan con las funciones sociales activas:
    // sin moderaciÃ³n activa, no se guarda texto libre que nadie revisa.
    const reviewText = SOCIAL_ENABLED ? parsed.data.reviewText : undefined;

    // Fecha de visionado opcional. Convierte la valoraciÃ³n en un diario, que es
    // el hÃ¡bito recurrente que sostiene la retenciÃ³n.
    let parsedWatchedAt: Date | null = null;
    if (watchedAt) {
      const candidate = new Date(watchedAt);
      if (isNaN(candidate.getTime())) {
        return NextResponse.json(
          { error: "La fecha de visionado no es vÃ¡lida." },
          { status: 400 }
        );
      }
      if (candidate.getTime() > Date.now()) {
        return NextResponse.json(
          { error: "No puedes registrar el visionado de una pelÃ­cula en el futuro." },
          { status: 400 }
        );
      }
      parsedWatchedAt = candidate;
    }

    // ReseÃ±a de texto libre opcional, saneada contra XSS y limitada a 2000 caracteres
    let sanitizedReview: string | null = null;
    if (typeof reviewText === "string" && reviewText.trim().length > 0) {
      sanitizedReview = sanitizeAndTruncate(reviewText.trim(), 2000);
      if (sanitizedReview.length === 0) {
        sanitizedReview = null;
      } else {
        // Filtro automÃ¡tico de contenido ofensivo (Fase 5.1.3)
        const moderation = checkContentModeration(sanitizedReview);
        if (moderation.isOffensive) {
          return NextResponse.json(
            { error: "Tu reseÃ±a contiene tÃ©rminos que no cumplen las normas de la comunidad. Por favor, modifÃ­cala antes de publicarla." },
            { status: 400 }
          );
        }
      }
    }

    // Verificar que la pelÃ­cula existe fÃ­sicamente
    const movie = await db.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return NextResponse.json(
        { error: "La pelÃ­cula especificada no existe." },
        { status: 404 }
      );
    }

    // ComprobaciÃ³n de anomalÃ­as de review bombing (Fase 3.6)
    const anomalyCheck = await checkReviewBombingAnomaly(movieId, parsedScore);
    if (anomalyCheck.isAnomaly) {
      console.warn(`[ANTIABUSO / REVIEW BOMBING] Pico detectado en pelÃ­cula ${movie.title}: ${anomalyCheck.details}`);
    }

    // Upsert: dos envÃ­os seguidos del mismo voto no deben chocar con el Ã­ndice
    // Ãºnico (usuario, pelÃ­cula).
    const rating = await db.rating.upsert({
      where: { userId_movieId: { userId, movieId } },
      update: {
        score: parsedScore,
        // Solo se sobrescribe la fecha si el cliente envÃ­a una nueva.
        ...(parsedWatchedAt ? { watchedAt: parsedWatchedAt } : {}),
        ...(typeof reviewText !== "undefined" ? { reviewText: sanitizedReview } : {}),
      },
      create: {
        score: parsedScore,
        userId,
        movieId,
        watchedAt: parsedWatchedAt,
        reviewText: sanitizedReview,
      },
    });

    // Auto-limpieza de Watchlist (Fase 5.2.1):
    // Si la pelÃ­cula estaba en la watchlist, se retira automÃ¡ticamente porque ya ha sido vista.
    await db.watchlist.deleteMany({
      where: { userId, movieId },
    });

    // Nota actualizada con el mismo criterio que la ficha: solo votos que cuentan.
    const realAgg = await db.rating.aggregate({
      where: { ...countedRatingWhere(), movieId },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      message: "ValoraciÃ³n registrada con Ã©xito.",
      rating,
      stats: {
        avgRating: realAgg._avg.score !== null ? realAgg._avg.score.toFixed(1) : null,
        ratingCount: realAgg._count.score,
      },
    });

  } catch (error) {
    console.error("Error en API de valoraciones (POST):", error);
    return NextResponse.json(
      { error: "OcurriÃ³ un error al registrar la valoraciÃ³n." },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar la valoraciÃ³n de una pelÃ­cula para el usuario actual
export async function DELETE(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const userId = auth.user.id;
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");

    if (!movieId) {
      return NextResponse.json(
        { error: "Falta el identificador de la pelÃ­cula (movieId)." },
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
        { error: "No tienes ninguna valoraciÃ³n registrada para esta pelÃ­cula." },
        { status: 404 }
      );
    }

    await db.rating.delete({
      where: { id: targetRating.id },
    });

    const realAgg = await db.rating.aggregate({
      where: { ...countedRatingWhere(), movieId },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      message: "ValoraciÃ³n eliminada correctamente.",
      stats: {
        avgRating: realAgg._avg.score !== null ? realAgg._avg.score.toFixed(1) : null,
        ratingCount: realAgg._count.score,
      },
    });

  } catch (error) {
    console.error("Error en API de valoraciones (DELETE):", error);
    return NextResponse.json(
      { error: "OcurriÃ³ un error al eliminar la valoraciÃ³n." },
      { status: 500 }
    );
  }
}
