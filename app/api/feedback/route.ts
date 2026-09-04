import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { validateFeedbackMessage } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const limit = await checkRateLimit("feedback", session?.user?.id || getClientIp(request));
    if (!limit.allowed) {
      return rateLimitResponse(limit, "Has enviado varias sugerencias seguidas. Inténtalo más tarde.");
    }

    const { category, message } = await request.json();

    if (!category || !message) {
      return NextResponse.json(
        { error: "Falta rellenar campos obligatorios (categoría o mensaje)." },
        { status: 400 }
      );
    }

    const validCategories = ["suggestion", "bug", "other"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Categoría de sugerencia inválida." }, { status: 400 });
    }

    const validated = validateFeedbackMessage(message);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    // El feedback se guarda vinculado al usuario si está autenticado
    const feedback = await db.feedback.create({
      data: {
        userId: session?.user?.id || null,
        category,
        message: validated.value,
      },
    });

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        category: feedback.category,
        message: feedback.message,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Error al guardar feedback:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la sugerencia." },
      { status: 500 }
    );
  }
}
