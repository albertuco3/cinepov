import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchMovies(query);

    // Ordenar los resultados por popularidad (relevancia) de forma descendente
    const sortedResults = [...results].sort((a, b) => b.popularity - a.popularity);

    // Retornar los primeros 8 resultados de búsqueda para no saturar el dropdown
    const topResults = sortedResults.slice(0, 8);

    return NextResponse.json({ results: topResults });
  } catch (error) {
    console.error("Error en API de búsqueda de películas:", error);
    return NextResponse.json(
      { error: "Error interno al realizar la búsqueda." },
      { status: 500 }
    );
  }
}
