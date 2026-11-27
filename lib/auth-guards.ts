import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { db } from "./db";
import { isAdminEmail } from "./admin";
import { getFirstZodError } from "./schemas";
import type { z } from "zod";

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

export interface ApiUser {
  id: string;
  name: string | null;
}

/**
 * Para rutas de API: usuario con sesión o respuesta 401.
 *
 * Se comprueba en la base de datos que la cuenta sigue existiendo y no está
 * anonimizada: el token dura 30 días y, si alguien borra su cuenta, la sesión
 * de sus otros dispositivos no debe poder seguir valorando ni editando.
 */
export async function requireUser(): Promise<Guard<ApiUser>> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  const user = id
    ? await db.user.findUnique({ where: { id }, select: { id: true, displayName: true, isAnonymized: true } })
    : null;
  if (!user || user.isAnonymized) {
    return { ok: false, response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  }
  return { ok: true, user: { id: user.id, name: user.displayName } };
}

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * Lee y valida el cuerpo JSON de una petición. Un cuerpo que no es JSON o que
 * no cumple el esquema responde 400 con el primer error legible, en lugar de
 * acabar en un 500.
 */
export async function parseJsonBody<S extends z.ZodType>(request: Request, schema: S): Promise<Parsed<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: "El cuerpo de la petición no es JSON válido." }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, response: NextResponse.json({ error: getFirstZodError(result.error) }, { status: 400 }) };
  }
  return { ok: true, data: result.data };
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
