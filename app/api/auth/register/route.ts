import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { APP_URL, sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { createToken, TOKEN_EMAIL_VERIFICATION } from "@/lib/tokens";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { validateHoneypot } from "@/lib/anti-abuse";
import { registerSchema, getFirstZodError } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const limit = await checkRateLimit("register", clientIp);
    if (!limit.allowed) {
      return rateLimitResponse(
        limit,
        "Has alcanzado el límite de intentos de registro. Inténtalo de nuevo más tarde."
      );
    }

    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: getFirstZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { email, password, displayName: cleanDisplayName, birthYear, gender, website } = parseResult.data;

    // Validación Honeypot contra bots automáticos (Fase 3.6)
    if (!validateHoneypot(website)) {
      console.warn(`[ANTIABUSO] Registro bloqueado por campo trampa (honeypot): IP ${clientIp}`);
      return NextResponse.json(
        { error: "Petición no permitida." },
        { status: 400 }
      );
    }

    // 6. Verificar si el usuario ya existe
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este correo electrónico ya está registrado." },
        { status: 400 }
      );
    }

    // 7. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 8. Crear el usuario en la base de datos
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: cleanDisplayName,
        birthYear,
        gender,
      },
    });

    // 8.1 Enviar el email de bienvenida
    try {
      await sendWelcomeEmail(user.email, user.displayName);
      await db.user.update({
        where: { id: user.id },
        data: { emailWelcomeSent: true },
      });
    } catch (emailErr) {
      console.error("Error al enviar el email de bienvenida:", emailErr);
    }

    // 8.2 Enviar el enlace de verificación del correo. Si algo falla, el registro
    // se completa igualmente: el usuario puede pedir el reenvío desde su perfil.
    try {
      const verificationToken = await createToken(user.id, TOKEN_EMAIL_VERIFICATION);
      await sendVerificationEmail(
        user.email,
        user.displayName,
        `${APP_URL}/api/auth/verify-email?token=${verificationToken}`
      );
    } catch (verificationErr) {
      console.error("Error al enviar el email de verificación:", verificationErr);
    }

    // 9. Devolver respuesta de éxito sin exponer la contraseña hasheada
    return NextResponse.json(
      {
        message: "Usuario registrado correctamente.",
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error en el registro de usuario:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al procesar el registro." },
      { status: 500 }
    );
  }
}
