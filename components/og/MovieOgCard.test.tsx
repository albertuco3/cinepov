import { describe, it, expect } from "vitest";
import { ImageResponse } from "next/og";
import { MovieOgCard, type MovieOgCardProps } from "./MovieOgCard";
import { findSatoriViolations } from "./satori-rules";

const movie = { title: "Origen", year: 2010, posterUrl: "https://image.tmdb.org/t/p/w500/x.jpg", tmdbId: 27205 };
const contrast: NonNullable<MovieOgCardProps["contrast"]> = {
  type: "age_broad",
  title: "Brecha generacional",
  labelA: "18-34 años",
  scoreA: 8.4,
  countA: 30,
  labelB: "55+ años",
  scoreB: 6.1,
  countB: 25,
  difference: 2.3,
  leadLabel: "18-34 años",
} as NonNullable<MovieOgCardProps["contrast"]>;

describe("MovieOgCard", () => {
  const cases: [string, MovieOgCardProps][] = [
    ["sin datos", { movie, globalAvg: null, contrast: null, siteHost: "cinepov.com" }],
    ["con nota y contraste", { movie, globalAvg: "7.8", contrast, siteHost: "cinepov.com" }],
    ["sin póster", { movie: { ...movie, posterUrl: null }, globalAvg: "7.8", contrast: null, siteHost: "cinepov.com" }],
  ];

  it.each(cases)("cumple la regla de display de Satori (%s)", (_name, props) => {
    expect(findSatoriViolations(MovieOgCard(props))).toEqual([]);
  });

  // Renderizado real con el mismo motor que producción. Sin póster, para no depender de la red.
  it.each(cases.filter(([, p]) => p.movie.posterUrl === null || p.contrast === null).map(
    ([name, p]) => [name, { ...p, movie: { ...p.movie, posterUrl: null } }] as [string, MovieOgCardProps]
  ))("genera un PNG (%s)", async (_name, props) => {
    const image = new ImageResponse(MovieOgCard(props), { width: 1200, height: 630 });
    const bytes = new Uint8Array(await image.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(1000);
    // Firma PNG: 0x89 "PNG"
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("genera un PNG con contraste", async () => {
    const image = new ImageResponse(
      MovieOgCard({ movie: { ...movie, posterUrl: null }, globalAvg: "7.8", contrast, siteHost: "cinepov.com" }),
      { width: 1200, height: 630 }
    );
    expect((await image.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });
});
