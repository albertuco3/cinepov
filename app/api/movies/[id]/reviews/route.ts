import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ageKeyFromBirthYear,
  ageBroadFromAgeKey,
  AGE_RANGE_LABELS,
} from "@/lib/demographics";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;
    const currentYear = new Date().getFullYear();

    // Resolver si el ID es un tmdbId numérico o un UUID/ID interno de la base de datos
    const cleanId = id.trim();
    const isNumeric = /^\d+$/.test(cleanId);
    let movie = isNumeric
      ? await db.movie.findUnique({ where: { tmdbId: parseInt(cleanId, 10) } })
      : await db.movie.findUnique({ where: { id: cleanId } });

    if (!movie && isNumeric) {
      movie = await db.movie.findUnique({ where: { id: cleanId } });
    }

    if (!movie) {
      return NextResponse.json(
        { error: "Película no encontrada" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);

    // Construir filtro de usuarios
    const userWhere: any = {
      emailVerified: { not: null },
      isAnonymized: false,
    };

    if (filter === "female") {
      userWhere.gender = "female";
    } else if (filter === "male") {
      userWhere.gender = "male";
    } else if (filter === "young") {
      // 18 a 34 años
      userWhere.birthYear = {
        gte: currentYear - 34,
        lte: currentYear - 18,
      };
    } else if (filter === "senior") {
      // 55+ años
      userWhere.birthYear = {
        lte: currentYear - 55,
      };
    } else if (filter === "my_segment" && session?.user) {
      if (session.user.gender) {
        userWhere.gender = session.user.gender;
      }
      if (session.user.birthYear) {
        const ageKey = ageKeyFromBirthYear(session.user.birthYear, currentYear);
        if (ageKey) {
          const broad = ageBroadFromAgeKey(ageKey);
          if (broad === "young") {
            userWhere.birthYear = { gte: currentYear - 34, lte: currentYear - 18 };
          } else if (broad === "adult") {
            userWhere.birthYear = { gte: currentYear - 54, lte: currentYear - 35 };
          } else if (broad === "senior") {
            userWhere.birthYear = { lte: currentYear - 55 };
          }
        }
      }
    }

    const reviews = await db.rating.findMany({
      where: {
        movieId: movie.id,
        isArtificial: false,
        isModerated: false,
        reviewText: { not: null },
        user: userWhere,
      },
      select: {
        id: true,
        score: true,
        reviewText: true,
        watchedAt: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
            gender: true,
            birthYear: true,
          },
        },
      },
      orderBy:
        sort === "best"
          ? [{ score: "desc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }],
      skip,
      take: limit + 1,
    });

    const hasMore = reviews.length > limit;
    const paginatedReviews = hasMore ? reviews.slice(0, limit) : reviews;

    const formattedReviews = paginatedReviews
      .filter((r) => r.reviewText && r.reviewText.trim().length > 0)
      .map((r) => {
        const ageKey = r.user.birthYear ? ageKeyFromBirthYear(r.user.birthYear, currentYear) : null;
        return {
          id: r.id,
          score: r.score,
          reviewText: r.reviewText,
          watchedAt: r.watchedAt ? r.watchedAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
          user: {
            displayName: r.user.displayName,
            gender: r.user.gender,
            ageRange: ageKey ? AGE_RANGE_LABELS[ageKey] : null,
          },
        };
      });

    return NextResponse.json({
      reviews: formattedReviews,
      hasMore,
      page,
      count: formattedReviews.length,
    });
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    return NextResponse.json(
      { error: "Error al consultar las reseñas" },
      { status: 500 }
    );
  }
}
