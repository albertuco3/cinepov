import { NextResponse } from "next/server";
import { parseJsonBody, requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { completeProfileSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    // 1. Obtener la sesiÃ³n del usuario actual
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const userId = auth.user.id;
    const parsed = await parseJsonBody(request, completeProfileSchema);
    if (!parsed.ok) return parsed.response;

    const { birthYear: parsedBirthYear, gender } = parsed.data;

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
        message: "Perfil demogrÃ¡fico completado correctamente.",
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
    console.error("Error al completar el perfil demogrÃ¡fico:", error);
    return NextResponse.json(
      { error: "OcurriÃ³ un error inesperado al actualizar el perfil." },
      { status: 500 }
    );
  }
}
