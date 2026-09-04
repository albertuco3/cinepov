/**
 * Motor de moderación y filtro de contenido ofensivo para CinePOV (Fase 5.1.3).
 * Detecta lenguaje de odio, insultos graves, amenazas y patrones de spam en español e inglés.
 * Utiliza normalización con eliminación de diacríticos y sustitución de leetspeak común
 * para evitar evasiones sencillas sin generar falsos positivos en términos cinematográficos.
 */

// Sustituciones comunes de leetspeak
const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "5": "s",
  "$": "s",
  "7": "t",
};

/**
 * Normaliza un texto eliminando tildes, signos de puntuación redundantes y normalizando caracteres leetspeak.
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  // Pasar a minúsculas
  let normalized = text.toLowerCase();

  // Reemplazar caracteres leetspeak
  for (const [leet, char] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(leet).join(char);
  }

  // Eliminar diacríticos (tildes, diéresis)
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Reemplazar caracteres no alfanuméricos repetidos por espacios
  normalized = normalized.replace(/[^a-z0-9\s]/g, " ");

  // Colapsar espacios múltiples
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

// Lista de raíces o términos ofensivos graves en español e inglés.
// Diseñada cuidadosamente para evitar falsos positivos con vocabulario cinematográfico
// (por ejemplo: "asesino", "violencia", "maldito", "puto" en giros coloquiales inocuos vs insultos directos).
const OFFENSIVE_PATTERNS: RegExp[] = [
  // Insultos y vejaciones graves en español
  /\b(hijo\s*de\s*puta|hija\s*de\s*puta|hdp)\b/i,
  /\b(subnormal|subnormales)\b/i,
  /\b(retrasad[oa]s?)\b/i,
  /\b(maric[oó]n|maricones|marica|maricas)\b/i,
  /\b(sudaca|sudacas)\b/i,
  /\b(negrat[ao]s?)\b/i,
  /\b(mor[oa]s?\s*de\s*mierda)\b/i,
  /\b(hijo\s*de\s*perra)\b/i,
  /\b(malparid[oa]s?)\b/i,
  /\b(gilipollas|gilipollez|gilipuertas)\b/i,
  /\b(soplapollas)\b/i,
  /\b(imbecil|imbeciles)\b/i,
  /\b(bastard[oa]s?)\b/i,
  /\b(pedofil[oa]s?|pederastas?)\b/i,
  /\b(violador(a|es)?)\b/i,

  // Insultos y lenguaje de odio en inglés
  /\b(nigger|nigga)s?\b/i,
  /\b(faggot|fag)s?\b/i,
  /\b(motherfucker|motherfucking)\b/i,
  /\b(cunt|cunts)\b/i,
  /\b(retard|retarded)\b/i,
  /\b(bitch|bitches)\b/i,
  /\b(whore|whores)\b/i,
  /\b(asshole|assholes)\b/i,
  /\b(kill\s*yourself|kys)\b/i,
  /\b(suicide\s*threat)\b/i,

  // Patrones evidentes de spam o enlaces sospechosos
  /\b(t\.me\/|wa\.me\/|bit\.ly\/|cutt\.ly\/)\b/i,
  /\b(buy\s*crypto|free\s*bitcoin|telegram\s*channel)\b/i,
  /\b(casino\s*online|gana\s*dinero\s*facil)\b/i,
];

export interface ModerationResult {
  isOffensive: boolean;
  detectedTerms: string[];
}

/**
 * Analiza un texto y determina si contiene términos censurables o contrarios a las normas de convivencia.
 */
export function checkContentModeration(text: string): ModerationResult {
  if (!text || typeof text !== "string") {
    return { isOffensive: false, detectedTerms: [] };
  }

  const normalized = normalizeText(text);
  const detectedTerms: string[] = [];

  for (const pattern of OFFENSIVE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      detectedTerms.push(match[0]);
    }
  }

  return {
    isOffensive: detectedTerms.length > 0,
    detectedTerms: Array.from(new Set(detectedTerms)),
  };
}
