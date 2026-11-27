import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireUser } from "@/lib/auth-guards";
import { movieRefSchema } from "@/lib/schemas";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Obtener las películas de la watchlist del usuario autenticado.
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const items = await db.watchlist.findMany({
      where: { userId: auth.user.id },
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
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const parsed = await parseJsonBody(request, movieRefSchema);
    if (!parsed.ok) return parsed.response;
    const { movieId } = parsed.data;

    const entry = await db.watchlist.upsert({
      where: {
        userId_movieId: {
          userId: auth.user.id,
          movieId,
        },
      },
      update: {},
      create: {
        userId: auth.user.id,
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
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

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
        userId: auth.user.id,
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
