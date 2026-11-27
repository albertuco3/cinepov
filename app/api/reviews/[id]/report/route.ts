import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireUser } from "@/lib/auth-guards";
import { reviewReportSchema } from "@/lib/schemas";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { SOCIAL_ENABLED } from "@/lib/features";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  if (!SOCIAL_ENABLED) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const userId = auth.user.id;
    const { id: ratingId } = await params;

    // Control de tasa contra spam de reportes
    const limit = await checkRateLimit("review_report", userId);
    if (!limit.allowed) {
      return rateLimitResponse(
        limit,
        "Has enviado demasiados reportes recientemente. Por favor, inténtalo más tarde."
      );
    }

    const parsed = await parseJsonBody(request, reviewReportSchema);
    if (!parsed.ok) return parsed.response;
    const { reason, details } = parsed.data;

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

    // Transacción: Registrar reporte e incrementar contador de la reseña
    const newReportCount = rating.reportCount + 1;
    const shouldModerate = newReportCount >= 3;

    await db.$transaction([
      db.reviewReport.create({
        data: {
          ratingId,
          userId,
          reason,
          details,
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
