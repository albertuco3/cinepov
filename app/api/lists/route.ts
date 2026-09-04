import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeAndTruncate } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/**
 * GET: Devuelve las listas del usuario actual (si está autenticado)
 * o las listas públicas destacadas.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "user";

    if (scope === "user") {
      if (!session?.user?.id) {
        return NextResponse.json({ lists: [] });
      }

      const lists = await db.customList.findMany({
        where: { userId: session.user.id },
        include: {
          items: {
            take: 4,
            orderBy: { order: "asc" },
            include: {
              movie: {
                select: {
                  id: true,
                  tmdbId: true,
                  title: true,
                  posterUrl: true,
                },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return NextResponse.json({
        lists: lists.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          isPublic: l.isPublic,
          itemCount: l._count.items,
          previewPosters: l.items.map((it) => it.movie.posterUrl),
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
      });
    }

    // Listas públicas recientes
    const publicLists = await db.customList.findMany({
      where: { isPublic: true },
      take: 20,
      include: {
        user: {
          select: { displayName: true },
        },
        items: {
          take: 4,
          orderBy: { order: "asc" },
          include: {
            movie: {
              select: {
                id: true,
                tmdbId: true,
                title: true,
                posterUrl: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      lists: publicLists.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        author: l.user.displayName,
        itemCount: l._count.items,
        previewPosters: l.items.map((it) => it.movie.posterUrl),
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error al obtener listas:", error);
    return NextResponse.json(
      { error: "Error al consultar las listas" },
      { status: 500 }
    );
  }
}

/**
 * POST: Crear una nueva lista personalizada.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para crear listas" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic = true } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la lista es obligatorio." },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeAndTruncate(name.trim(), 100);
    const sanitizedDesc = description
      ? sanitizeAndTruncate(String(description).trim(), 500)
      : null;

    const newList = await db.customList.create({
      data: {
        userId: session.user.id,
        name: sanitizedName,
        description: sanitizedDesc,
        isPublic: Boolean(isPublic),
      },
    });

    return NextResponse.json({
      success: true,
      list: {
        id: newList.id,
        name: newList.name,
        description: newList.description,
        isPublic: newList.isPublic,
      },
    });
  } catch (error) {
    console.error("Error al crear lista:", error);
    return NextResponse.json(
      { error: "No se pudo crear la lista" },
      { status: 500 }
    );
  }
}
