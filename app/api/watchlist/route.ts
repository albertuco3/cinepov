import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Obtener las películas de la watchlist del usuario autenticado.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const items = await db.watchlist.findMany({
      where: { userId: session.user.id },
      include: {
        movie: {
          select: {
            id: true,
            tmdbId: true,
            title: true,
            year: true,
            posterUrl: true,
            tmdbRating: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({
      watchlist: items.map((w) => ({
        id: w.id,
        addedAt: w.addedAt.toISOString(),
        movie: w.movie,
      })),
    });
  } catch (error) {
    console.error("Error al obtener watchlist:", error);
    return NextResponse.json(
      { error: "Error al consultar la watchlist" },
      { status: 500 }
    );
  }
}

/**
 * POST: Añadir una película a la watchlist.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { movieId } = body;

    if (!movieId || typeof movieId !== "string") {
      return NextResponse.json(
        { error: "movieId es obligatorio" },
        { status: 400 }
      );
    }

    const entry = await db.watchlist.upsert({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        movieId,
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Error al añadir a watchlist:", error);
    return NextResponse.json(
      { error: "No se pudo añadir la película a la watchlist" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Quitar una película de la watchlist.
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get("movieId");

  if (!movieId) {
    return NextResponse.json(
      { error: "movieId es obligatorio" },
      { status: 400 }
    );
  }

  try {
    await db.watchlist.deleteMany({
      where: {
        userId: session.user.id,
        movieId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar de watchlist:", error);
    return NextResponse.json(
      { error: "No se pudo quitar de la watchlist" },
      { status: 500 }
    );
  }
}
