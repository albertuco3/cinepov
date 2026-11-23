import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SOCIAL_ENABLED } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!SOCIAL_ENABLED) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ activity: [] });
    }

    // Obtener los usuarios a los que sigue el usuario en sesión
    const follows = await db.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({ activity: [] });
    }

    // Consultar las calificaciones recientes de los usuarios seguidos
    const ratings = await db.rating.findMany({
      where: {
        userId: { in: followingIds },
        isArtificial: false,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        movie: {
          select: {
            id: true,
            tmdbId: true,
            title: true,
            year: true,
            posterUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const activity = ratings.map((r) => ({
      id: r.id,
      score: r.score,
      reviewText: r.reviewText,
      watchedAt: r.watchedAt ? r.watchedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
      movie: r.movie,
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Error al obtener feed de actividad:", error);
    return NextResponse.json(
      { error: "Error al consultar la actividad" },
      { status: 500 }
    );
  }
}
