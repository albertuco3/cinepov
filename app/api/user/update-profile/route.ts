import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFirstZodError, updateProfileSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: getFirstZodError(parseResult.error) }, { status: 400 });
    }

    const { displayName, gender, birthYear, emailWeeklyActive } = parseResult.data;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { displayName, gender, birthYear, emailWeeklyActive },
    });

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
