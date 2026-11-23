import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { db } from "./db";
import { isAdminEmail } from "./admin";

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Administrador de la sesión actual, o `null`.
 *
 * Se consulta la base de datos en lugar de fiarse del token: el email debe
 * estar verificado. Si no, cualquiera podría registrarse con el email de un
 * administrador antes que él y heredar el panel.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true, isAnonymized: true },
  });
  if (!user || !user.emailVerified || user.isAnonymized) return null;
  return isAdminEmail(user.email) ? { id: user.id, email: user.email } : null;
}

type Guard<T> = { ok: true; user: T } | { ok: false; response: NextResponse };

/** Para rutas de API: usuario con sesión o respuesta 401. */
export async function requireUser(): Promise<Guard<{ id: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "No autorizado." }, { status: 401 }) };
  }
  return { ok: true, user: { id: session.user.id } };
}

/**
 * Para rutas de API de administración: administrador o 404. Se responde 404 y
 * no 403 para no confirmar que la ruta existe.
 */
export async function requireAdmin(): Promise<Guard<AdminUser>> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, response: NextResponse.json({ error: "No encontrado." }, { status: 404 }) };
  }
  return { ok: true, user: admin };
}
