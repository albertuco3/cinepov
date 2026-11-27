import { describe, it, expect } from "vitest";
import { ImageResponse } from "next/og";
import { SiteOgCard } from "./SiteOgCard";
import { findSatoriViolations } from "./satori-rules";

describe("SiteOgCard", () => {
  it("cumple la regla de display de Satori", () => {
    expect(findSatoriViolations(SiteOgCard({ siteHost: "www.cinepov.com" }))).toEqual([]);
  });

  it("genera un PNG", async () => {
    const image = new ImageResponse(SiteOgCard({ siteHost: "www.cinepov.com" }), { width: 1200, height: 630 });
    const bytes = new Uint8Array(await image.arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});
