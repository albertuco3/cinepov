/**
 * Extrae el mensaje de un error capturado sin recurrir a `any`.
 *
 * En TypeScript lo que llega a un `catch` es `unknown`: puede ser un `Error`,
 * una cadena lanzada a mano o cualquier otra cosa. Devuelve cadena vacía si no
 * hay mensaje, para poder encadenar un texto por defecto con `||`.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "";
}

/** Indica si el error es la cancelación de una operación (p. ej. `navigator.share`). */
export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}
