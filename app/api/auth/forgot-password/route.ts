import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken, getLastTokenDate, TOKEN_PASSWORD_RESET } from "@/lib/tokens";
import { APP_URL, sendOAuthOnlyAccountEmail, sendPasswordResetEmail } from "@/lib/email";

/**
 * Respuesta única para cualquier email bien formado, exista la cuenta o no.
 * Devolver mensajes distintos permitiría averiguar qué direcciones están
 * registradas (enumeración de usuarios), así que el endpoint es deliberadamente
 * opaco: el resultado real solo llega al buzón del titular.
 */
const GENERIC_RESPONSE = {
  message:
    "Si esa dirección está registrada, te hemos enviado un enlace para restablecer la contraseña.",
};

/** Evita que se pueda inundar el buzón de un tercero pidiendo enlaces en bucle. */
const REQUEST_COOLDOWN_MS = 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El correo electrónico es obligatorio." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El formato de correo electrónico no es válido." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    // Una cuenta anonimizada por derecho de supresión no debe poder recuperarse.
    if (user && !user.isAnonymized) {
      if (!user.passwordHash) {
        // Cuenta creada con Google: no hay contraseña que restablecer, así que en
        // lugar de un token le explicamos por email cómo debe acceder.
        await sendOAuthOnlyAccountEmail(user.email, user.displayName);
      } else {
        const lastRequest = await getLastTokenDate(user.id, TOKEN_PASSWORD_RESET);
        const isThrottled =
          lastRequest !== null && Date.now() - lastRequest.getTime() < REQUEST_COOLDOWN_MS;

        if (!isThrottled) {
          const token = await createToken(user.id, TOKEN_PASSWORD_RESET);
          await sendPasswordResetEmail(
            user.email,
            user.displayName,
            `${APP_URL}/reset-password?token=${token}`
          );
        }
      }
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Error al solicitar el restablecimiento de contraseña:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al procesar la solicitud." },
      { status: 500 }
    );
  }
}
