import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";
import { ageKeyFromBirthYear, ageBroadFromAgeKey } from "@/lib/demographics";
import { COUNTED_USER_WHERE, segmentUserWhere, type SegmentFilter } from "@/lib/rating-filters";
import { SOCIAL_ENABLED } from "@/lib/features";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  if (!SOCIAL_ENABLED) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
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

    // Filtro de autores. Las cuentas anonimizadas no muestran reseñas: ya no
    // hay una persona detrás a la que atribuirlas.
    let segment: SegmentFilter = {};
    if (filter === "female" || filter === "male") {
      segment = { gender: filter };
    } else if (filter === "young" || filter === "senior") {
      segment = { ageBroad: filter };
    } else if (filter === "my_segment" && session?.user) {
      const ageKey = session.user.birthYear ? ageKeyFromBirthYear(session.user.birthYear, currentYear) : null;
      segment = {
        gender: session.user.gender || undefined,
        ageBroad: ageKey ? ageBroadFromAgeKey(ageKey) : undefined,
      };
    }
    const userWhere: Prisma.UserWhereInput = {
      ...COUNTED_USER_WHERE,
      isAnonymized: false,
      ...segmentUserWhere(segment, currentYear),
    };

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
      // Nunca se devuelve el género ni la edad del autor: el registro promete
      // que esos datos no se muestran de forma individual.
      .map((r) => ({
        id: r.id,
        score: r.score,
        reviewText: r.reviewText,
        watchedAt: r.watchedAt ? r.watchedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        user: {
          displayName: r.user.displayName,
        },
      }));

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
