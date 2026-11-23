import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { completeProfileSchema, getFirstZodError } from "@/lib/schemas";

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
    const parseResult = completeProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: getFirstZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { birthYear: parsedBirthYear, gender } = parseResult.data;

    // 5. Actualizar el perfil del usuario en la base de datos
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        birthYear: parsedBirthYear,
        gender,
      },
    });


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
