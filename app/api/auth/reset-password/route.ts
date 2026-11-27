import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { consumeToken, TOKEN_PASSWORD_RESET } from "@/lib/tokens";

const TOKEN_ERROR_MESSAGES: Record<"not_found" | "expired" | "already_used", string> = {
  not_found: "El enlace no es válido. Solicita uno nuevo para restablecer la contraseña.",
  expired: "El enlace ha caducado. Solicita uno nuevo para restablecer la contraseña.",
  already_used:
    "Este enlace ya se ha utilizado. Solicita uno nuevo si necesitas cambiar la contraseña.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Falta el token del enlace de restablecimiento." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "La contraseña es obligatoria." },
        { status: 400 }
      );
    }

    // Se valida antes de consumir el token para que una contraseña rechazada no
    // invalide el enlace y obligue al usuario a pedir otro.
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const result = await consumeToken(token, TOKEN_PASSWORD_RESET);

    if (!result.ok) {
      return NextResponse.json(
        { error: TOKEN_ERROR_MESSAGES[result.reason] },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: result.userId } });

    if (!user || user.isAnonymized) {
      return NextResponse.json(
        { error: "La cuenta asociada a este enlace ya no está disponible." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        // Ha demostrado tener acceso al buzón, así que el email queda verificado.
        ...(user.emailVerified ? {} : { emailVerified: new Date() }),
      },
    });

    return NextResponse.json({
      message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al restablecer la contraseña." },
      { status: 500 }
    );
  }
}
