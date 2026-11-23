/**
 * Edad mínima para usar CinePOV.
 *
 * Solo pedimos el año de nacimiento (minimización de datos), así que el año
 * no basta para garantizar la edad: quien nació en el año límite puede tener
 * todavía 17. Por eso el registro pide además una declaración explícita de
 * mayoría de edad. Este módulo no importa nada para que los formularios del
 * cliente puedan usarlo sin arrastrar dependencias.
 */
export const MIN_AGE = 18;
export const MIN_BIRTH_YEAR = 1920;

export function maxBirthYear(currentYear = new Date().getFullYear()): number {
  return currentYear - MIN_AGE;
}

/** Años seleccionables en los formularios, del más reciente al más antiguo. */
export function birthYearOptions(currentYear = new Date().getFullYear()): number[] {
  const newest = maxBirthYear(currentYear);
  return Array.from({ length: newest - MIN_BIRTH_YEAR + 1 }, (_, i) => newest - i);
}
