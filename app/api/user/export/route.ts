import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";

const CSV_HEADERS = [
  "titulo",
  "titulo_original",
  "anio",
  "director",
  "tmdb_id",
  "mi_nota",
  "fecha_visionado",
  "fecha_valoracion",
  "ultima_modificacion",
];

/**
 * Escapado conforme al RFC 4180: el campo se envuelve en comillas dobles cuando
 * contiene un separador, un salto de línea o comillas, y las comillas internas se
 * duplican. Los títulos de película llevan comas y comillas con frecuencia.
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toIsoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const ratings = await db.rating.findMany({
      where: {
        userId: auth.user.id,
        // Las valoraciones de un usuario real nunca son artificiales, pero el
        // filtro se explicita para que el export jamás arrastre datos sintéticos.
        isArtificial: false,
      },
      include: {
        movie: {
          select: {
            title: true,
            originalTitle: true,
            year: true,
            director: true,
            tmdbId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = ratings.map((rating) =>
      [
        rating.movie.title,
        rating.movie.originalTitle,
        rating.movie.year,
        rating.movie.director,
        rating.movie.tmdbId,
        rating.score,
        toIsoDate(rating.watchedAt),
        rating.createdAt.toISOString(),
        rating.updatedAt.toISOString(),
      ]
        .map(escapeCsvField)
        .join(",")
    );

    // El BOM es imprescindible para que Excel en Windows interprete el fichero
    // como UTF-8 y no destroce los acentos de los títulos.
    const csv = `\uFEFF${[CSV_HEADERS.join(","), ...rows].join("\r\n")}\r\n`;
    const fileName = `cinepov-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error al exportar las valoraciones del usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al generar la exportación." },
      { status: 500 }
    );
  }
}
