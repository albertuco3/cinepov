import { NextResponse } from "next/server";
import { resolveMovieId } from "@/lib/movies";
import { getMovieDemographics } from "@/lib/movie-demographics";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: ParamsProps) {
  try {
    const { id } = await params;
    const movieId = await resolveMovieId(id ?? "");
    if (!movieId) {
      return NextResponse.json({ error: "Película no encontrada." }, { status: 404 });
    }

    return NextResponse.json(await getMovieDemographics(movieId));
  } catch (error) {
    console.error("Error al agrupar estadísticas demográficas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar datos demográficos." },
      { status: 500 }
    );
  }
}
