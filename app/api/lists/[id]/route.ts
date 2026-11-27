import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const list = await db.customList.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
        items: {
          orderBy: { order: "asc" },
          include: {
            movie: {
              select: {
                id: true,
                tmdbId: true,
                title: true,
                year: true,
                posterUrl: true,
                director: true,
                tmdbRating: true,
              },
            },
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    }

    // Si la lista es privada y no es del usuario logueado
    if (!list.isPublic && list.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Esta lista es privada" }, { status: 403 });
    }

    return NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
        author: list.user.displayName,
        isOwner: list.userId === session?.user?.id,
        itemCount: list.items.length,
        createdAt: list.createdAt.toISOString(),
        items: list.items.map((it) => ({
          id: it.id,
          order: it.order,
          addedAt: it.addedAt.toISOString(),
          movie: it.movie,
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de lista:", error);
    return NextResponse.json(
      { error: "Error al consultar la lista" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const list = await db.customList.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    }

    if (list.userId !== auth.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta lista" },
        { status: 403 }
      );
    }

    await db.customList.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar lista:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la lista" },
      { status: 500 }
    );
  }
}
