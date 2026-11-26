import { describe, it, expect } from "vitest";
import { normalizeSiteUrl } from "./site";

describe("normalizeSiteUrl", () => {
  it("quita las barras finales para no generar '//ruta'", () => {
    expect(normalizeSiteUrl("https://cinepov-beta.vercel.app/", "x")).toBe("https://cinepov-beta.vercel.app");
    expect(normalizeSiteUrl("https://cinepov.com//", "x")).toBe("https://cinepov.com");
    expect(normalizeSiteUrl("https://cinepov.com", "x")).toBe("https://cinepov.com");
  });

  it("usa el valor por defecto si la variable falta o está vacía", () => {
    expect(normalizeSiteUrl(undefined, "https://cinepov.com")).toBe("https://cinepov.com");
    expect(normalizeSiteUrl("  ", "http://localhost:3000/")).toBe("http://localhost:3000");
  });
});
