import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { resolveMovieId } from "@/lib/movies";
import { getMovieDemographics } from "@/lib/movie-demographics";
import { getNotableContrast } from "@/lib/viral";
import { StoryOgCard } from "@/components/og/StoryOgCard";
import { SITE_HOST } from "@/lib/site";

export const runtime = "nodejs";

interface Props {
  params: Promise<{ id: string }>;
}

/** Imagen vertical de una película para stories (1080×1920). */
export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const movieId = await resolveMovieId(id ?? "");
  const movie = movieId
    ? await db.movie.findUnique({
        where: { id: movieId },
        select: { id: true, title: true, year: true, posterUrl: true, tmdbId: true },
      })
    : null;
  if (!movie) {
    return new Response("Película no encontrada.", { status: 404 });
  }

  const payload = await getMovieDemographics(movie.id);
  const contrast = getNotableContrast(payload);
  const globalAvg = payload.real.global.avg !== null ? payload.real.global.avg.toFixed(1) : null;

  return new ImageResponse(StoryOgCard({ movie, globalAvg, contrast, siteHost: SITE_HOST }), {
    width: 1080,
    height: 1920,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
