import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeAndTruncate } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const VALID_REASONS = ["offensive", "spam", "spoiler", "other"] as const;

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para reportar una reseña" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: ratingId } = await params;

    // Control de tasa contra spam de reportes
    const limit = await checkRateLimit("review_report", userId);
    if (!limit.allowed) {
      return rateLimitResponse(
        limit,
        "Has enviado demasiados reportes recientemente. Por favor, inténtalo más tarde."
      );
    }

    const body = await request.json();
    const { reason, details } = body;

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Motivo de reporte no válido." },
        { status: 400 }
      );
    }

    // Verificar existencia de la reseña
    const rating = await db.rating.findUnique({
      where: { id: ratingId },
      select: { id: true, userId: true, reportCount: true, isModerated: true },
    });

    if (!rating) {
      return NextResponse.json(
        { error: "La reseña no existe." },
        { status: 404 }
      );
    }

    // No se puede reportar la propia reseña
    if (rating.userId === userId) {
      return NextResponse.json(
        { error: "No puedes reportar tu propia reseña." },
        { status: 400 }
      );
    }

    // Comprobar si ya fue reportada por este mismo usuario
    const existingReport = await db.reviewReport.findUnique({
      where: {
        ratingId_userId: {
          ratingId,
          userId,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "Ya has reportado esta reseña anteriormente." },
        { status: 400 }
      );
    }

    const sanitizedDetails = details
      ? sanitizeAndTruncate(String(details), 500)
      : null;

    // Transacción: Registrar reporte e incrementar contador de la reseña
    const newReportCount = rating.reportCount + 1;
    const shouldModerate = newReportCount >= 3;

    await db.$transaction([
      db.reviewReport.create({
        data: {
          ratingId,
          userId,
          reason,
          details: sanitizedDetails,
        },
      }),
      db.rating.update({
        where: { id: ratingId },
        data: {
          reportCount: { increment: 1 },
          ...(shouldModerate ? { isModerated: true } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Reseña reportada para moderación.",
      moderated: shouldModerate,
    });
  } catch (error) {
    console.error("Error al reportar reseña:", error);
    return NextResponse.json(
      { error: "No se pudo procesar el reporte de la reseña" },
      { status: 500 }
    );
  }
}
