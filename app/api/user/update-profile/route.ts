import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { displayName, gender, birthYear, emailWeeklyActive } = body;

    // Validar nombre
    if (!displayName || displayName.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre de usuario debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }

    // Validar género
    const validGenders = ["male", "female", "non_binary"];
    if (!gender || !validGenders.includes(gender)) {
      return NextResponse.json({ error: "El género es obligatorio y debe ser válido." }, { status: 400 });
    }

    // Validar año de nacimiento
    let parsedBirthYear: number | undefined;
    if (birthYear) {
      parsedBirthYear = parseInt(birthYear, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(parsedBirthYear) || parsedBirthYear < 1920 || parsedBirthYear > currentYear) {
        return NextResponse.json(
          { error: "Año de nacimiento no válido." },
          { status: 400 }
        );
      }
    }

    // Actualizar base de datos
    const updateData: any = {
      displayName: displayName.trim(),
      gender: gender,
      birthYear: parsedBirthYear || null,
      emailWeeklyActive: emailWeeklyActive !== undefined ? Boolean(emailWeeklyActive) : undefined,
    };

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    console.log(`[Perfil] Usuario ID ${userId} actualizado: ${updatedUser.displayName}, Gen: ${updatedUser.gender}, Año: ${updatedUser.birthYear}`);

    return NextResponse.json({
      message: "Perfil actualizado con éxito.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        gender: updatedUser.gender,
        birthYear: updatedUser.birthYear,
      },
    });
  } catch (error) {
    console.error("Error al actualizar el perfil de usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la actualización del perfil." },
      { status: 500 }
    );
  }
}
