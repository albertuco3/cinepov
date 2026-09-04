import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { buildDemographicsPayload, type RatingRow } from "@/lib/demographics";
import { getTopDemographicContrast } from "@/lib/viral";
import { parseMovieParam } from "@/lib/slug";

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
            Perspectiva Demografica del Cine
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // Obtener votos reales verificados
  const ratings = await db.rating.findMany({
    where: {
      movieId: movie.id,
      isArtificial: false,
      user: { emailVerified: { not: null } },
    },
    select: {
      score: true,
      user: {
        select: {
          gender: true,
          birthYear: true,
        },
      },
    },
  });

  const rows: RatingRow[] = ratings
    .filter((r) => r.user.gender && r.user.birthYear)
    .map((r) => ({
      score: r.score,
      isArtificial: false,
      gender: r.user.gender!,
      birthYear: r.user.birthYear!,
    }));

  const payload = buildDemographicsPayload(movie.id, rows);
  const contrast = getTopDemographicContrast(payload);

  const globalAvg =
    rows.length > 0
      ? (rows.reduce((sum, r) => sum + r.score, 0) / rows.length).toFixed(1)
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#080a11",
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(229, 9, 20, 0.15), transparent 45%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1), transparent 40%)",
          padding: 60,
          boxSizing: "border-box",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Lado izquierdo: Póster */}
        <div
          style={{
            width: 320,
            height: 510,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            backgroundColor: "#131622",
            flexShrink: 0,
          }}
        >
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: 24,
              }}
            >
              Sin Póster
            </div>
          )}
        </div>

        {/* Lado derecho: Info y Contraste Demográfico */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            marginLeft: 50,
          }}
        >
          {/* Header con marca y título */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  backgroundColor: "rgba(229, 9, 20, 0.15)",
                  border: "1px solid rgba(229, 9, 20, 0.3)",
                  color: "#ff4d4d",
                  fontSize: 16,
                  fontWeight: 900,
                  padding: "6px 14px",
                  borderRadius: 999,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                CinePOV · Veredicto Demografico
              </span>
              {globalAvg && (
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: 15,
                    color: "rgba(255, 255, 255, 0.6)",
                    fontWeight: 600,
                  }}
                >
                  Media Global: {globalAvg}/10
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: "#ffffff",
                marginTop: 14,
                lineHeight: 1.15,
                maxHeight: 110,
                overflow: "hidden",
              }}
            >
              {movie.title}
            </div>

            <div style={{ fontSize: 20, color: "rgba(255, 255, 255, 0.5)", marginTop: 6 }}>
              {movie.year}
            </div>
          </div>

          {/* Bloque central: Contraste Demográfico */}
          {contrast ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 24,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: "#ff4d4d",
                  marginBottom: 12,
                }}
              >
                {contrast.title} · Brecha de {contrast.difference} puntos
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Grupo A */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(229, 9, 20, 0.08)",
                    border: "1px solid rgba(229, 9, 20, 0.2)",
                    borderRadius: 18,
                    padding: "12px 18px",
                  }}
                >
                  <span style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", fontWeight: 700 }}>
                    {contrast.labelA}
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: "#ffffff" }}>
                      {contrast.scoreA}
                    </span>
                    <span style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.4)", marginLeft: 4 }}>
                      /10
                    </span>
                  </div>
                </div>

                {/* Separador VS */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "rgba(255, 255, 255, 0.3)",
                    padding: "0 6px",
                  }}
                >
                  VS
                </div>

                {/* Grupo B */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: 18,
                    padding: "12px 18px",
                  }}
                >
                  <span style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", fontWeight: 700 }}>
                    {contrast.labelB}
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: "#ffffff" }}>
                      {contrast.scoreB}
                    </span>
                    <span style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.4)", marginLeft: 4 }}>
                      /10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 24,
                padding: "24px 28px",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>
                ¿Como la valora tu generacion?
              </div>
              <div style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.6)", marginTop: 6 }}>
                Vota en CinePOV para desbloquear el desglose por edad y genero.
              </div>
            </div>
          )}

          {/* Footer de la tarjeta */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: 16,
            }}
          >
            <span style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.5)" }}>
              cinepov.com/movie/{movie.tmdbId}
            </span>
            <span style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.4)", fontWeight: 600 }}>
              Datos verificados sin algoritmos opacos
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
