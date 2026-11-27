import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { notificationReadSchema } from "@/lib/schemas";
import { db } from "@/lib/db";
import { SOCIAL_ENABLED } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!SOCIAL_ENABLED) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    // El cuerpo es opcional: vacío significa "marcar todas".
    const parsed = notificationReadSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Notificación no válida." }, { status: 400 });
    const { notificationId } = parsed.data;

    if (notificationId) {
      await db.notification.updateMany({
        where: { id: notificationId, userId: auth.user.id },
        data: { isRead: true },
      });
    } else {
      // Marcar todas como leídas
      await db.notification.updateMany({
        where: { userId: auth.user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    return NextResponse.json(
      { error: "Error al actualizar notificaciones" },
      { status: 500 }
    );
  }
}
