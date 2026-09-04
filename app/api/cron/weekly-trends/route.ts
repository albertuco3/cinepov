import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWeeklyTrendsEmail } from "@/lib/email";

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 1. Obtener todos los usuarios reales activos con el boletín semanal habilitado
    const users = await db.user.findMany({
      where: {
        emailWeeklyActive: true,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        gender: true,
        birthYear: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({
        message: "No hay usuarios con suscripción semanal activa para procesar.",
        emailsSent: 0,
      });
    }

    let emailsSentCount = 0;
    const currentYear = new Date().getFullYear();

    // 2. Procesar boletín para cada usuario según su segmento
    for (const user of users) {
      const { id: userId, email, displayName, gender, birthYear } = user;

      if (!gender || !birthYear) continue;

      const age = currentYear - birthYear;
      let ageRange = "all";
      let ageLabel = "";

      // Determinar rango y etiqueta
      if (age >= 18 && age <= 24) { ageRange = "18_24"; ageLabel = "18-24 años"; }
      else if (age >= 25 && age <= 34) { ageRange = "25_34"; ageLabel = "25-34 años"; }
      else if (age >= 35 && age <= 44) { ageRange = "35_44"; ageLabel = "35-44 años"; }
      else if (age >= 45 && age <= 54) { ageRange = "45_54"; ageLabel = "45-54 años"; }
      else if (age >= 55) { ageRange = "55_plus"; ageLabel = "55+ años"; }

      const genderLabels: Record<string, string> = {
        male: "Hombres",
        female: "Mujeres",
        non_binary: "No Binarios",
        prefer_not_to_say: "Otros",
      };

      const genderLabel = genderLabels[gender] || "Usuarios";
      const userSegmentLabel = `${genderLabel} ${ageLabel}`;

      // Configurar el filtro de edad de nacimiento
      const ageFilter: any = {};
      if (ageRange === "18_24") ageFilter.birthYear = { gte: currentYear - 24, lte: currentYear - 18 };
      else if (ageRange === "25_34") ageFilter.birthYear = { gte: currentYear - 34, lte: currentYear - 25 };
      else if (ageRange === "35_44") ageFilter.birthYear = { gte: currentYear - 44, lte: currentYear - 35 };
      else if (ageRange === "45_54") ageFilter.birthYear = { gte: currentYear - 54, lte: currentYear - 45 };
      else if (ageRange === "55_plus") ageFilter.birthYear = { lte: currentYear - 55 };

      // Obtener valoraciones agregadas para este segmento demográfico.
      // El boletín es contenido que enviamos al usuario: solo puede construirse
      // con valoraciones reales, nunca con estimaciones de arranque.
      const segmentRatings = await db.rating.groupBy({
        by: ["movieId"],
        where: {
          isArtificial: false,
          user: {
            gender,
            ...ageFilter,
          },
        },
        _avg: {
          score: true,
        },
        _count: {
          score: true,
        },
        having: {
          score: {
            _count: {
              gte: 3,
            },
          },
        },
      });

      // Ordenar por nota media descendente
      const sortedRatings = segmentRatings
        .sort((a, b) => (b._avg.score || 0) - (a._avg.score || 0))
        .slice(0, 3); // Top 3

      if (sortedRatings.length === 0) {
        // Opcional: Si no hay valoraciones en el segmento, no se envía o se relaja a global
        console.log(`[Cron boletín] Sin tendencias en el segmento para el usuario ${displayName} (${userSegmentLabel})`);
        continue;
      }

      // Traer los títulos de las películas del top
      const movieIds = sortedRatings.map((r) => r.movieId);
      const movies = await db.movie.findMany({
        where: {
          id: { in: movieIds },
        },
        select: {
          id: true,
          title: true,
          year: true,
        },
      });

      // Mapear al formato esperado por el simulador de correo
      const trendingMovies = sortedRatings
        .map((r) => {
          const movie = movies.find((m) => m.id === r.movieId);
          if (!movie) return null;
          return {
            title: movie.title,
            year: movie.year,
            avgScore: r._avg.score || 0,
            votes: r._count.score || 0,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (trendingMovies.length > 0) {
        await sendWeeklyTrendsEmail(email, displayName, userSegmentLabel, trendingMovies);
        emailsSentCount++;
      }
    }

    return NextResponse.json({
      message: "Proceso de cron semanal de tendencias simulado completado.",
      usersProcessed: users.length,
      emailsSent: emailsSentCount,
    });
  } catch (error) {
    console.error("Error en cron weekly-trends:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el cron semanal." },
      { status: 500 }
    );
  }
}
