import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, birthYear, gender } = body;

    // 1. Validaciones básicas de campos vacíos
    if (!email || !password || !displayName || !birthYear || !gender) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    // 2. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El formato de correo electrónico no es válido." },
        { status: 400 }
      );
    }

    // 3. Validar longitud de la contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // 4. Validar año de nacimiento razonable (entre 1910 y 2018)
    const currentYear = new Date().getFullYear();
    const parsedBirthYear = parseInt(birthYear, 10);
    
    if (isNaN(parsedBirthYear) || parsedBirthYear < 1910 || parsedBirthYear > currentYear - 6) {
      return NextResponse.json(
        { error: "El año de nacimiento no es válido." },
        { status: 400 }
      );
    }

    // 5. Validar opciones de género en el enum esperado
    const validGenders = ["male", "female", "non_binary"];
    if (!validGenders.includes(gender)) {
      return NextResponse.json(
        { error: "El género seleccionado no es válido." },
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
        displayName: displayName.trim(),
        birthYear: parsedBirthYear,
        gender,
      },
    });

    // 8.1 Simular envío de email de bienvenida
    try {
      await sendWelcomeEmail(user.email, user.displayName);
      await db.user.update({
        where: { id: user.id },
        data: { emailWelcomeSent: true },
      });
    } catch (emailErr) {
      console.error("Error al simular envío de email de bienvenida:", emailErr);
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
