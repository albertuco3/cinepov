import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

export const TOKEN_EMAIL_VERIFICATION = "email_verification";
export const TOKEN_PASSWORD_RESET = "password_reset";

export type TokenType =
  | typeof TOKEN_EMAIL_VERIFICATION
  | typeof TOKEN_PASSWORD_RESET;

/** La verificación de email no es urgente: damos margen de un día natural. */
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
/** El restablecimiento sí lo es: reduce la ventana de uso de un enlace filtrado. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const TTL_BY_TYPE: Record<TokenType, number> = {
  [TOKEN_EMAIL_VERIFICATION]: EMAIL_VERIFICATION_TTL_MS,
  [TOKEN_PASSWORD_RESET]: PASSWORD_RESET_TTL_MS,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Genera un token de un solo uso y persiste únicamente su hash SHA-256.
 * Devuelve el token en claro, que solo viaja en el enlace del email: si la base
 * de datos se filtrase, los hashes almacenados no permitirían tomar cuentas.
 */
export async function createToken(userId: string, type: TokenType): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_BY_TYPE[type]);

  // Solo puede haber un token vivo por usuario y tipo: al pedir uno nuevo, los
  // enlaces anteriores dejan de funcionar.
  await db.verificationToken.deleteMany({
    where: { userId, type, usedAt: null },
  });

  await db.verificationToken.create({
    data: { userId, type, tokenHash: hashToken(token), expiresAt },
  });

  return token;
}

export type ConsumeTokenResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "already_used" };

/**
 * Valida un token en claro, lo marca como usado y devuelve el usuario asociado.
 * Diferencia el motivo del fallo para poder dar un mensaje preciso al usuario.
 */
export async function consumeToken(
  token: string,
  type: TokenType
): Promise<ConsumeTokenResult> {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "not_found" };
  }

  const record = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  // Un token de verificación no debe servir para restablecer la contraseña.
  if (!record || record.type !== type) {
    return { ok: false, reason: "not_found" };
  }

  if (record.usedAt) {
    return { ok: false, reason: "already_used" };
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  // El filtro por usedAt nulo hace que dos peticiones simultáneas con el mismo
  // enlace solo puedan consumirlo una vez.
  const consumed = await db.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (consumed.count === 0) {
    return { ok: false, reason: "already_used" };
  }

  return { ok: true, userId: record.userId };
}

/** Fecha de creación del último token del usuario para ese tipo, si existe. */
export async function getLastTokenDate(
  userId: string,
  type: TokenType
): Promise<Date | null> {
  const last = await db.verificationToken.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  return last?.createdAt ?? null;
}
