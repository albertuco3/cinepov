import type { MovieOgCardProps } from "./MovieOgCard";

/**
 * Versión vertical (1080×1920) de la tarjeta de una película, para stories de
 * Instagram, TikTok o WhatsApp. Mismos datos que `MovieOgCard`: solo muestra
 * una brecha si es real. Regla de Satori: todo <div> con más de un hijo, o con
 * un hijo que no sea texto, necesita `display: flex` (lo comprueba el test).
 */
export function StoryOgCard({ movie, globalAvg, contrast, siteHost }: MovieOgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "110px 80px 120px",
        boxSizing: "border-box",
        backgroundColor: "#080a11",
        backgroundImage:
          "radial-gradient(circle at 80% 15%, rgba(229, 9, 20, 0.22), transparent 45%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.14), transparent 40%)",
        fontFamily: "sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", fontSize: 44, fontWeight: 900, letterSpacing: 3, color: "#ff4d4d" }}>CinePOV</div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 520,
            height: 780,
            display: "flex",
            borderRadius: 32,
            overflow: "hidden",
            backgroundColor: "#131622",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.8)",
          }}
        >
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: 36,
              }}
            >
              {movie.title}
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 64, fontWeight: 900, marginTop: 56, textAlign: "center", maxWidth: 920 }}>
          {movie.title}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "rgba(255, 255, 255, 0.5)", marginTop: 12 }}>
          {globalAvg ? `${movie.year} · Media CinePOV ${globalAvg}/10` : String(movie.year)}
        </div>
      </div>

      {contrast ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#ff4d4d",
              marginBottom: 24,
            }}
          >
            {`${contrast.title} · ${contrast.difference} puntos`}
          </div>
          <div style={{ display: "flex", width: "100%", gap: 28 }}>
            {[
              { label: contrast.labelA, score: contrast.scoreA, tint: "229, 9, 20" },
              { label: contrast.labelB, score: contrast.scoreB, tint: "59, 130, 246" },
            ].map((group) => (
              <div
                key={group.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "28px 20px",
                  borderRadius: 28,
                  backgroundColor: `rgba(${group.tint}, 0.1)`,
                  border: `1px solid rgba(${group.tint}, 0.3)`,
                }}
              >
                <div style={{ display: "flex", fontSize: 28, color: "rgba(255, 255, 255, 0.75)", fontWeight: 700 }}>
                  {group.label}
                </div>
                <div style={{ display: "flex", fontSize: 96, fontWeight: 900, marginTop: 8 }}>{String(group.score)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 800,
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          ¿Qué nota le darías tú?
        </div>
      )}

      <div style={{ display: "flex", fontSize: 30, color: "rgba(255, 255, 255, 0.45)" }}>
        {`¿Y tú? Vota en ${siteHost}`}
      </div>
    </div>
  );
}
