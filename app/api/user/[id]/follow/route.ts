import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id: targetUserId } = await params;
    const session = await getServerSession(authOptions);

    const [followerCount, followingCount, isFollowing] = await Promise.all([
      db.follow.count({ where: { followingId: targetUserId } }),
      db.follow.count({ where: { followerId: targetUserId } }),
      session?.user?.id
        ? db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: targetUserId,
              },
            },
          })
        : null,
    ]);

    return NextResponse.json({
      isFollowing: Boolean(isFollowing),
      followerCount,
      followingCount,
    });
  } catch (error) {
    console.error("Error al consultar seguimiento:", error);
    return NextResponse.json(
      { error: "Error al consultar estado de seguimiento" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para seguir usuarios" },
        { status: 401 }
      );
    }

    const followerId = session.user.id;
    const { id: followingId } = await params;

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "No puedes seguirte a ti mismo" },
        { status: 400 }
      );
    }

    // Comprobar si el usuario objetivo existe
    const targetUser = await db.user.findUnique({
      where: { id: followingId },
      select: { id: true, isAnonymized: true },
    });

    if (!targetUser || targetUser.isAnonymized) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await db.follow.delete({
        where: { id: existingFollow.id },
      });
      return NextResponse.json({ isFollowing: false });
    } else {
      await db.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Crear notificación para el usuario seguido
      await db.notification.create({
        data: {
          userId: followingId,
          type: "new_follower",
          title: "Nuevo seguidor",
          message: `${session.user.name || "Un cinéfilo"} ha comenzado a seguirte.`,
          link: `/user/${followerId}`,
        },
      });

      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error("Error al conmutar seguimiento:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el seguimiento" },
      { status: 500 }
    );
  }
}
