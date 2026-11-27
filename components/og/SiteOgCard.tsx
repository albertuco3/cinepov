/**
 * Tarjeta para redes de las páginas que no tienen una propia (portada,
 * explorar, género, década, metodología…). Mismo estilo que `MovieOgCard`.
 * Recuerda la regla de Satori: todo <div> con más de un hijo necesita
 * `display: flex` (lo comprueba el test).
 */
export function SiteOgCard({ siteHost }: { siteHost: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: "#080a11",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(229, 9, 20, 0.18), transparent 45%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.12), transparent 40%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 40, fontWeight: 900, letterSpacing: 2, color: "#ff4d4d" }}>CinePOV</div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 900, lineHeight: 1.05, maxWidth: 960 }}>
          ¿Qué nota le darías a cada película?
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 28, color: "rgba(255, 255, 255, 0.65)", maxWidth: 900 }}>
          Tu nota estimada según cómo puntúas tú y la gente con tus gustos. Y las películas que dividen a generaciones.
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 24, color: "rgba(255, 255, 255, 0.4)" }}>{siteHost}</div>
    </div>
  );
}
