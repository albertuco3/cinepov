import Papa from "papaparse";

export interface LetterboxdMovieRow {
  title: string;
  year: number;
  rating: number; // Escala Letterboxd (0.5 a 5.0)
}

export interface ImdbMovieRow {
  imdbId: string;
  title: string;
  year: number;
  rating: number; // Escala IMDb (1 a 10)
}

/**
 * Parsea el contenido CSV de un archivo exportado de Letterboxd utilizando PapaParse.
 * Soporta de forma nativa comas dentro de comillas, comillas dobles escapadas,
 * diferentes delimitadores y caracteres especiales.
 */
export function parseLetterboxdCsv(
  csvText: unknown
): { ok: true; movies: LetterboxdMovieRow[] } | { ok: false; error: string } {
  if (!csvText || typeof csvText !== "string" || !csvText.trim()) {
    return { ok: false, error: "El contenido del archivo CSV está vacío." };
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return { ok: false, error: "No se pudo leer el archivo CSV. Verifica su formato." };
  }

  const fields = parsed.meta.fields || [];
  const nameField = fields.find((f) => f === "name" || f === "title");
  const ratingField = fields.find((f) => f === "rating");
  const yearField = fields.find((f) => f === "year");

  if (!nameField || !ratingField) {
    return {
      ok: false,
      error: "La estructura del archivo CSV de Letterboxd es inválida. Debe contener las columnas 'Name' o 'Title', y 'Rating'.",
    };
  }

  const movies: LetterboxdMovieRow[] = [];

  for (const row of parsed.data) {
    const title = (row[nameField] || "").trim();
    const ratingStr = (row[ratingField] || "").trim();
    const yearStr = yearField ? (row[yearField] || "").trim() : "";

    const rating = parseFloat(ratingStr);
    const year = yearStr ? parseInt(yearStr, 10) : 0;

    // Solo importar si tiene título y valoración numérica válida
    if (title && !isNaN(rating)) {
      movies.push({
        title,
        year: isNaN(year) ? 0 : year,
        rating,
      });
    }
  }

  if (movies.length === 0) {
    return {
      ok: false,
      error: "No se encontraron películas con valoraciones válidas para importar en el archivo CSV.",
    };
  }

  return { ok: true, movies };
}

/**
 * Parsea el contenido CSV de un archivo exportado de IMDb (ratings.csv) con PapaParse.
 */
export function parseImdbCsv(
  csvText: unknown
): { ok: true; movies: ImdbMovieRow[] } | { ok: false; error: string } {
  if (!csvText || typeof csvText !== "string" || !csvText.trim()) {
    return { ok: false, error: "El contenido del archivo CSV está vacío." };
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return { ok: false, error: "No se pudo leer el archivo CSV de IMDb. Verifica su formato." };
  }

  const fields = parsed.meta.fields || [];
  const idField = fields.find((f) => f === "const" || f === "id" || f === "imdb id" || f === "imdbid");
  const ratingField = fields.find((f) => f === "your rating" || f === "rating");
  const titleField = fields.find((f) => f === "title" || f === "original title");
  const yearField = fields.find((f) => f === "year");

  if (!idField || !ratingField) {
    return {
      ok: false,
      error: "La estructura del archivo CSV de IMDb es inválida. Debe contener las columnas 'Const' (ID de IMDb) y 'Your Rating'.",
    };
  }

  const movies: ImdbMovieRow[] = [];

  for (const row of parsed.data) {
    const rawId = (row[idField] || "").trim();
    const ratingStr = (row[ratingField] || "").trim();
    const title = titleField ? (row[titleField] || "").trim() : "";
    const yearStr = yearField ? (row[yearField] || "").trim() : "";

    const rating = parseInt(ratingStr, 10);
    const year = yearStr ? parseInt(yearStr, 10) : 0;

    // Solo importar si tiene ID de IMDb válido (formato ttXXXXXXX) y nota numérica válida
    if (rawId && /^tt\d+/i.test(rawId) && !isNaN(rating) && rating >= 1 && rating <= 10) {
      movies.push({
        imdbId: rawId,
        title: title || rawId,
        year: isNaN(year) ? 0 : year,
        rating,
      });
    }
  }

  if (movies.length === 0) {
    return {
      ok: false,
      error: "No se encontraron películas con valoraciones válidas para importar en el archivo CSV.",
    };
  }

  return { ok: true, movies };
}
