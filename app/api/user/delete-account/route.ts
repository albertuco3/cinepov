import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";

const CONFIRMATION_KEYWORD = "ELIMINAR";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const userId = auth.user.id;

    let body: { confirmation?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "La solicitud no incluye un cuerpo válido." },
        { status: 400 }
      );
    }

    const { confirmation, password } = body;

    if (confirmation !== CONFIRMATION_KEYWORD) {
      return NextResponse.json(
        {
          error: `Para eliminar la cuenta debes escribir exactamente la palabra ${CONFIRMATION_KEYWORD} en el campo de confirmación.`,
        },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, isAnonymized: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "La cuenta no existe." }, { status: 404 });
    }

    if (user.isAnonymized) {
      return NextResponse.json(
        { error: "Esta cuenta ya ha sido eliminada." },
        { status: 400 }
      );
    }

    // Las cuentas de proveedor externo (OAuth) no tienen contraseña local: en esos
    // casos la sesión activa es la única prueba de identidad exigible.
    if (user.passwordHash) {
      if (typeof password !== "string" || password.length === 0) {
        return NextResponse.json(
          {
            error: "Debes introducir tu contraseña actual para confirmar la eliminación.",
            requiresPassword: true,
          },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          { error: "La contraseña no es correcta." },
          { status: 401 }
        );
      }
    }

    // El derecho de supresión se satisface desvinculando los datos de la persona,
    // no destruyendo el agregado estadístico: las valoraciones se conservan sin
    // ningún identificador que permita volver a atribuirlas a nadie.
    const preservedRatings = await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${crypto.randomUUID()}@anonimo.cinepov`,
          passwordHash: null,
          displayName: "Usuario eliminado",
          avatarUrl: null,
          emailWeeklyActive: false,
          // Se conserva *que* estaba verificada, no cuándo: sin esto sus
          // valoraciones dejarían de contar (solo cuentan las verificadas) y
          // el agregado que se quiere conservar desaparecería en silencio.
          emailVerified: user.emailVerified ? new Date(0) : null,
          isAnonymized: true,
          // birthYear y gender se conservan a propósito: son los únicos atributos
          // que sostienen los desgloses demográficos y, una vez roto el vínculo
          // con el email y el nombre, no identifican a la persona.
        },
      });

      await tx.verificationToken.deleteMany({ where: { userId } });

      // De las valoraciones solo se conserva la nota: el texto libre de las
      // reseñas y las fechas del diario son contenido personal.
      await tx.rating.updateMany({ where: { userId }, data: { reviewText: null, watchedAt: null } });

      // Todo lo demás que creó la persona se borra: listas (eran públicas por
      // enlace), watchlist, seguimientos, notificaciones y sus denuncias.
      await tx.customList.deleteMany({ where: { userId } });
      await tx.watchlist.deleteMany({ where: { userId } });
      await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.reviewReport.deleteMany({ where: { userId } });

      await tx.feedback.updateMany({
        where: { userId },
        data: { userId: null },
      });

      return tx.rating.count({ where: { userId } });
    });

    console.log(
      `[RGPD] Cuenta ${userId} anonimizada. Valoraciones conservadas: ${preservedRatings}`
    );

    return NextResponse.json({
      success: true,
      message:
        "Tu cuenta y tus datos personales se han eliminado. Tus valoraciones se conservan de forma anónima.",
      preservedRatings,
    });
  } catch (error) {
    console.error("Error al eliminar la cuenta del usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la eliminación de la cuenta." },
      { status: 500 }
    );
  }
}
