/*
 * Tarjeta de la imagen OG de una película.
 *
 * La renderiza Satori, que exige que todo elemento con más de un hijo tenga
 * display: flex. Un texto con una variable en medio ("Nota: {x}/10") son varios
 * hijos y rompe la imagen en tiempo de ejecución, no en el build. Usa siempre
 * una única cadena: {`Nota: ${x}/10`}. El test de este fichero lo comprueba.
 */
import type { DemographicContrast } from "@/lib/viral";

export interface MovieOgCardProps {
  movie: { title: string; year: number; posterUrl: string | null; tmdbId: number };
  globalAvg: string | null;
  contrast: DemographicContrast | null;
  siteHost: string;
}

export function MovieOgCard({ movie, globalAvg, contrast, siteHost }: MovieOgCardProps) {
  return (
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
              CinePOV · Veredicto demográfico
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
                {`Media global: ${globalAvg}/10`}
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
            {String(movie.year)}
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
              {`${contrast.title} · Brecha de ${contrast.difference} puntos`}
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
              ¿Cómo la valora tu generación?
            </div>
            <div style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.6)", marginTop: 6 }}>
              Vota en CinePOV para desbloquear el desglose por edad y género.
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
            {`${siteHost}/movie/${movie.tmdbId}`}
          </span>
          <span style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.4)", fontWeight: 600 }}>
            Datos verificados sin algoritmos opacos
          </span>
        </div>
      </div>
    </div>
  );
}
