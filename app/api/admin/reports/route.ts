import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Obtener todas las reseñas con denuncias pendientes o moderadas.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const reportedRatings = await db.rating.findMany({
      where: {
        OR: [
          { reportCount: { gt: 0 } },
          { isModerated: true },
          { reports: { some: {} } },
        ],
      },
      include: {
        user: {
          select: { id: true, displayName: true, email: true },
        },
        movie: {
          select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true },
        },
        reports: {
          include: {
            user: {
              select: { displayName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { reportCount: "desc" },
      take: 50,
    });

    return NextResponse.json({
      reports: reportedRatings.map((r) => ({
        id: r.id,
        score: r.score,
        reviewText: r.reviewText,
        reportCount: r.reportCount,
        isModerated: r.isModerated,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        movie: r.movie,
        reasons: r.reports.map((rep) => ({
          id: rep.id,
          reason: rep.reason,
          details: rep.details,
          reportedBy: rep.user.displayName,
          createdAt: rep.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    return NextResponse.json(
      { error: "Error al consultar los reportes" },
      { status: 500 }
    );
  }
}

/**
 * POST: Resolver un reporte ("dismiss", "moderate", "delete_text").
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { ratingId, action } = body;

    if (!ratingId || !["dismiss", "moderate", "delete_text"].includes(action)) {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    if (action === "dismiss") {
      // Descartar reporte: Restaurar la reseña a estado normal y vaciar denuncias
      await db.$transaction([
        db.reviewReport.deleteMany({ where: { ratingId } }),
        db.rating.update({
          where: { id: ratingId },
          data: {
            reportCount: 0,
            isModerated: false,
          },
        }),
      ]);
      return NextResponse.json({ success: true, message: "Reportes desestimados y reseña restaurada." });
    }

    if (action === "moderate") {
      // Confirmar moderación preventiva: mantener oculta la reseña
      await db.rating.update({
        where: { id: ratingId },
        data: { isModerated: true },
      });
      return NextResponse.json({ success: true, message: "Reseña marcada como moderada y oculta." });
    }

    if (action === "delete_text") {
      // Eliminar el texto de la reseña por infringir normas
      await db.$transaction([
        db.reviewReport.deleteMany({ where: { ratingId } }),
        db.rating.update({
          where: { id: ratingId },
          data: {
            reviewText: null,
            reportCount: 0,
            isModerated: false,
          },
        }),
      ]);
      return NextResponse.json({ success: true, message: "Texto de la reseña eliminado permanentemente." });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error al resolver reporte:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la acción de moderación" },
      { status: 500 }
    );
  }
}
