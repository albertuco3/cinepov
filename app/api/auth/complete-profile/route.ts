import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // 1. Obtener la sesión del usuario actual
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "No estás autorizado. Por favor, inicia sesión." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { birthYear, gender } = body;

    // 2. Validaciones básicas
    if (!birthYear || !gender) {
      return NextResponse.json(
        { error: "El año de nacimiento y el género son campos obligatorios." },
        { status: 400 }
      );
    }

    // 3. Validar año de nacimiento razonable (entre 1910 y 2018)
    const currentYear = new Date().getFullYear();
    const parsedBirthYear = parseInt(birthYear, 10);
    
    if (isNaN(parsedBirthYear) || parsedBirthYear < 1910 || parsedBirthYear > currentYear - 6) {
      return NextResponse.json(
        { error: "El año de nacimiento introducido no es válido." },
        { status: 400 }
      );
    }

    // 4. Validar género
    const validGenders = ["male", "female", "non_binary"];
    if (!validGenders.includes(gender)) {
      return NextResponse.json(
        { error: "El género seleccionado no es válido." },
        { status: 400 }
      );
    }

    // 5. Actualizar el perfil del usuario en la base de datos
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        birthYear: parsedBirthYear,
        gender,
      },
    });

    console.log(`[Onboarding] Perfil completado para el usuario ${updatedUser.email}`);

    return NextResponse.json(
      {
        message: "Perfil demográfico completado correctamente.",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          birthYear: updatedUser.birthYear,
          gender: updatedUser.gender,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error al completar el perfil demográfico:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al actualizar el perfil." },
      { status: 500 }
    );
  }
}
