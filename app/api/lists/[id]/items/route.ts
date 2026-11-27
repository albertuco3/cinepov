import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireUser } from "@/lib/auth-guards";
import { movieRefSchema } from "@/lib/schemas";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * POST: Añadir una película a una lista personalizada.
 */
export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const { id: listId } = await params;
    const parsed = await parseJsonBody(request, movieRefSchema);
    if (!parsed.ok) return parsed.response;
    const { movieId } = parsed.data;

    const list = await db.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    }

    if (list.userId !== auth.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar esta lista" },
        { status: 403 }
      );
    }

    // Contar películas actuales para definir el orden
    const count = await db.listItem.count({
      where: { listId },
    });

    const item = await db.listItem.upsert({
      where: {
        listId_movieId: {
          listId,
          movieId,
        },
      },
      update: {},
      create: {
        listId,
        movieId,
        order: count,
      },
    });

    // Actualizar updatedAt de la lista
    await db.customList.update({
      where: { id: listId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error al añadir película a la lista:", error);
    return NextResponse.json(
      { error: "No se pudo añadir la película a la lista" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Quitar una película de la lista.
 */
export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const { id: listId } = await params;
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");

    if (!movieId) {
      return NextResponse.json({ error: "movieId es obligatorio" }, { status: 400 });
    }

    const list = await db.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    }

    if (list.userId !== auth.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar esta lista" },
        { status: 403 }
      );
    }

    await db.listItem.deleteMany({
      where: {
        listId,
        movieId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al quitar película de la lista:", error);
    return NextResponse.json(
      { error: "No se pudo quitar la película de la lista" },
      { status: 500 }
    );
  }
}
