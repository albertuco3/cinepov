import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { createToken, getLastTokenDate, TOKEN_EMAIL_VERIFICATION } from "@/lib/tokens";
import { APP_URL, sendVerificationEmail } from "@/lib/email";

/** Ventana mínima entre reenvíos para evitar ráfagas de correos. */
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export async function POST() {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const user = await db.user.findUnique({ where: { id: auth.user.id } });

    if (!user) {
      return NextResponse.json(
        { error: "No hemos encontrado tu cuenta." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Tu correo electrónico ya está verificado." },
        { status: 400 }
      );
    }

    const lastRequest = await getLastTokenDate(user.id, TOKEN_EMAIL_VERIFICATION);

    if (lastRequest) {
      const elapsedMs = Date.now() - lastRequest.getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        return NextResponse.json(
          {
            error: `Acabamos de enviarte un correo. Espera ${waitSeconds} segundos antes de pedir otro.`,
          },
          { status: 429 }
        );
      }
    }

    const token = await createToken(user.id, TOKEN_EMAIL_VERIFICATION);

    await sendVerificationEmail(
      user.email,
      user.displayName,
      `${APP_URL}/api/auth/verify-email?token=${token}`
    );

    return NextResponse.json({
      message: "Te hemos enviado un correo nuevo con el enlace de verificación.",
    });
  } catch (error) {
    console.error("Error al reenviar el correo de verificación:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al reenviar el correo." },
      { status: 500 }
    );
  }
}
