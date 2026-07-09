import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const { category, message } = await request.json();

    if (!category || !message || message.trim() === "") {
      return NextResponse.json(
        { error: "Falta rellenar campos obligatorios (categoría o mensaje)." },
        { status: 400 }
      );
    }

    const validCategories = ["suggestion", "bug", "other"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Categoría de sugerencia inválida." }, { status: 400 });
    }

    // El feedback se guarda vinculado al usuario si está autenticado
    const feedback = await db.feedback.create({
      data: {
        userId: session?.user?.id || null,
        category,
        message: message.trim(),
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
  } catch (error: any) {
    console.error("Error al guardar feedback:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor al procesar la sugerencia." },
      { status: 500 }
    );
  }
}
