import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: ParamsProps) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Falta el identificador de la película." },
        { status: 400 }
      );
    }

    // 1. Obtener todos los ratings de esta película incluyendo edad y género de los usuarios
    const ratings = await db.rating.findMany({
      where: { movieId: id },
      include: {
        user: {
          select: {
            gender: true,
            birthYear: true,
          },
        },
      },
    });

    const totalCount = ratings.length;
    if (totalCount === 0) {
      return NextResponse.json({
        movieId: id,
        global: { avg: null, count: 0 },
        byGender: { male: null, female: null, non_binary: null },
        byAgeRange: { "18_24": null, "25_34": null, "35_44": null, "45_54": null, "55_plus": null },
        cross: {},
      });
    }

    // 2. Auxiliar: calcular promedio de un array de puntuaciones con umbral mínimo de fiabilidad (3 para segmentos)
    const getAvg = (scores: number[], threshold = 3) => {
      if (scores.length < threshold) return null;
      return parseFloat((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1));
    };

    const currentYear = new Date().getFullYear();

    // 3. Procesar datos demográficos
    const globalScores: number[] = [];
    const genderScores: Record<string, number[]> = { male: [], female: [], non_binary: [] };
    const ageScores: Record<string, number[]> = {
      "18_24": [],
      "25_34": [],
      "35_44": [],
      "45_54": [],
      "55_plus": [],
    };
    
    // Estructura cruzada género x edad
    const crossScores: Record<string, Record<string, number[]>> = {
      male: { "18_24": [], "25_34": [], "35_44": [], "45_54": [], "55_plus": [] },
      female: { "18_24": [], "25_34": [], "35_44": [], "45_54": [], "55_plus": [] },
      non_binary: { "18_24": [], "25_34": [], "35_44": [], "45_54": [], "55_plus": [] },
    };

    for (const r of ratings) {
      if (!r.user) continue;

      const score = r.score;
      globalScores.push(score);

      // Clasificación por género
      const gender = r.user.gender;
      if (genderScores[gender]) {
        genderScores[gender].push(score);
      }

      // Clasificación por edad
      const age = currentYear - r.user.birthYear;
      let ageKey = "";
      if (age >= 18 && age <= 24) ageKey = "18_24";
      else if (age >= 25 && age <= 34) ageKey = "25_34";
      else if (age >= 35 && age <= 44) ageKey = "35_44";
      else if (age >= 45 && age <= 54) ageKey = "45_54";
      else if (age >= 55) ageKey = "55_plus";

      if (ageKey) {
        ageScores[ageKey].push(score);
        
        // Clasificación cruzada
        if (crossScores[gender] && crossScores[gender][ageKey]) {
          crossScores[gender][ageKey].push(score);
        }
      }
    }

    // 4. Estructurar la respuesta
    const response = {
      movieId: id,
      global: {
        avg: getAvg(globalScores, 1),
        count: globalScores.length,
      },
      byGender: {
        male: {
          avg: getAvg(genderScores.male),
          count: genderScores.male.length,
        },
        female: {
          avg: getAvg(genderScores.female),
          count: genderScores.female.length,
        },
        non_binary: {
          avg: getAvg(genderScores.non_binary),
          count: genderScores.non_binary.length,
        },
      },
      byAgeRange: {
        "18_24": {
          avg: getAvg(ageScores["18_24"]),
          count: ageScores["18_24"].length,
        },
        "25_34": {
          avg: getAvg(ageScores["25_34"]),
          count: ageScores["25_34"].length,
        },
        "35_44": {
          avg: getAvg(ageScores["35_44"]),
          count: ageScores["35_44"].length,
        },
        "45_54": {
          avg: getAvg(ageScores["45_54"]),
          count: ageScores["45_54"].length,
        },
        "55_plus": {
          avg: getAvg(ageScores["55_plus"]),
          count: ageScores["55_plus"].length,
        },
      },
      cross: {
        male: {
          "18_24": { avg: getAvg(crossScores.male["18_24"]), count: crossScores.male["18_24"].length },
          "25_34": { avg: getAvg(crossScores.male["25_34"]), count: crossScores.male["25_34"].length },
          "35_44": { avg: getAvg(crossScores.male["35_44"]), count: crossScores.male["35_44"].length },
          "45_54": { avg: getAvg(crossScores.male["45_54"]), count: crossScores.male["45_54"].length },
          "55_plus": { avg: getAvg(crossScores.male["55_plus"]), count: crossScores.male["55_plus"].length },
        },
        female: {
          "18_24": { avg: getAvg(crossScores.female["18_24"]), count: crossScores.female["18_24"].length },
          "25_34": { avg: getAvg(crossScores.female["25_34"]), count: crossScores.female["25_34"].length },
          "35_44": { avg: getAvg(crossScores.female["35_44"]), count: crossScores.female["35_44"].length },
          "45_54": { avg: getAvg(crossScores.female["45_54"]), count: crossScores.female["45_54"].length },
          "55_plus": { avg: getAvg(crossScores.female["55_plus"]), count: crossScores.female["55_plus"].length },
        },
        non_binary: {
          "18_24": { avg: getAvg(crossScores.non_binary["18_24"]), count: crossScores.non_binary["18_24"].length },
          "25_34": { avg: getAvg(crossScores.non_binary["25_34"]), count: crossScores.non_binary["25_34"].length },
          "35_44": { avg: getAvg(crossScores.non_binary["35_44"]), count: crossScores.non_binary["35_44"].length },
          "45_54": { avg: getAvg(crossScores.non_binary["45_54"]), count: crossScores.non_binary["45_54"].length },
          "55_plus": { avg: getAvg(crossScores.non_binary["55_plus"]), count: crossScores.non_binary["55_plus"].length },
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al agrupar estadísticas demográficas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar datos demográficos." },
      { status: 500 }
    );
  }
}
