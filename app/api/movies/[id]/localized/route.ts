import { NextRequest, NextResponse } from "next/server";
import { getMovieLocalized } from "@/lib/movies";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tmdbId = parseInt(id, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "ID de película inválido" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get("locale") || "es";

    const movie = await getMovieLocalized(tmdbId, locale);
    if (!movie) {
      return NextResponse.json({ error: "Película no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      title: movie.title,
      synopsis: movie.synopsis,
      director: movie.director,
    });
  } catch (error) {
    console.error("Error al obtener película localizada:", error);
    return NextResponse.json(
      { error: "Error interno al obtener los datos localizados de la película." },
      { status: 500 }
    );
  }
}
