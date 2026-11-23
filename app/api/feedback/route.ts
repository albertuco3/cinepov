import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { feedbackSubmissionSchema, getFirstZodError } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const limit = await checkRateLimit("feedback", session?.user?.id || getClientIp(request));
    if (!limit.allowed) {
      return rateLimitResponse(limit, "Has enviado varias sugerencias seguidas. Inténtalo más tarde.");
    }

    const rawBody = await request.json();
    const parseResult = feedbackSubmissionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: getFirstZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { category, message: cleanMessage } = parseResult.data;

    // El feedback se guarda vinculado al usuario si está autenticado
    const feedback = await db.feedback.create({
      data: {
        userId: session?.user?.id || null,
        category,
        message: cleanMessage,
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
