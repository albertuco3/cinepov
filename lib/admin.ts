/**
 * Comprueba si un email está en la lista de administradores (`ADMIN_EMAILS`,
 * separada por comas). Sin la variable configurada no hay administradores:
 * el panel queda cerrado por defecto.
 */
export function isAdminEmail(email: string | null | undefined, adminList = process.env.ADMIN_EMAILS): boolean {
  if (!email || !adminList) return false;
  const admins = adminList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}
