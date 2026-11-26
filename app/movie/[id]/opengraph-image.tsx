import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { getMovieDemographics } from "@/lib/movie-demographics";
import { getTopDemographicContrast } from "@/lib/viral";
import { parseMovieParam } from "@/lib/slug";
import { MovieOgCard } from "@/components/og/MovieOgCard";
import { SITE_HOST } from "@/lib/site";

export const runtime = "nodejs";

export const alt = "CinePOV - Demografía de Cine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OpengraphImage({ params }: Props) {
  const { id } = await params;
  const { tmdbId } = parseMovieParam(id);

  if (!tmdbId) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#07090e",
            color: "#ffffff",
            fontSize: 48,
            fontWeight: "bold",
          }}
        >
          CinePOV
        </div>
      ),
      { ...size }
    );
  }

  const movie = await db.movie.findUnique({
    where: { tmdbId },
  });

  if (!movie) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#07090e",
            color: "#ffffff",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 900, color: "#e50914" }}>CinePOV</div>
          <div style={{ fontSize: 28, color: "#888888", marginTop: 16 }}>
            Perspectiva demográfica del cine
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const payload = await getMovieDemographics(movie.id);
  const contrast = getTopDemographicContrast(payload);

  const globalAvg = payload.real.global.avg !== null ? payload.real.global.avg.toFixed(1) : null;

  return new ImageResponse(
    MovieOgCard({ movie, globalAvg, contrast, siteHost: SITE_HOST }),
    { ...size }
  );
}
