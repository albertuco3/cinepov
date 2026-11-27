import { describe, it, expect } from "vitest";
import { ImageResponse } from "next/og";
import type { MovieOgCardProps } from "./MovieOgCard";
import { StoryOgCard } from "./StoryOgCard";
import { findSatoriViolations } from "./satori-rules";

const movie = { title: "Origen", year: 2010, posterUrl: null, tmdbId: 27205 };
const contrast = {
  type: "age_broad",
  title: "Brecha generacional",
  keyA: "young",
  labelA: "Jóvenes (18-34)",
  scoreA: 8.4,
  countA: 30,
  keyB: "senior",
  labelB: "Mayores (55+)",
  scoreB: 6.1,
  countB: 25,
  difference: 2.3,
  leadLabel: "Jóvenes (18-34)",
  notable: true,
} as NonNullable<MovieOgCardProps["contrast"]>;

describe("StoryOgCard", () => {
  const cases: [string, MovieOgCardProps][] = [
    ["sin datos", { movie, globalAvg: null, contrast: null, siteHost: "cinepov.com" }],
    ["con nota y brecha", { movie, globalAvg: "7.8", contrast, siteHost: "cinepov.com" }],
  ];

  it.each(cases)("cumple la regla de display de Satori (%s)", (_name, props) => {
    expect(findSatoriViolations(StoryOgCard(props))).toEqual([]);
  });

  it.each(cases)("genera un PNG vertical (%s)", async (_name, props) => {
    const image = new ImageResponse(StoryOgCard(props), { width: 1080, height: 1920 });
    const bytes = new Uint8Array(await image.arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});
