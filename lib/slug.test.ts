import { describe, it, expect } from "vitest";
import { slugify, parseMovieParam, buildCanonicalMoviePath } from "./slug";

describe("lib/slug", () => {
  it("slugify genera slugs URL-safe sin acentos ni caracteres especiales", () => {
    expect(slugify("El Caballero Oscuro")).toBe("el-caballero-oscuro");
    expect(slugify("Parásitos (2019)")).toBe("parasitos-2019");
    expect(slugify("Amélie & Compañía")).toBe("amelie-compania");
    expect(slugify("¡Qué bello es vivir!")).toBe("que-bello-es-vivir");
  });

  it("parseMovieParam extrae el ID numérico tanto de cadenas puras como compuestas", () => {
    expect(parseMovieParam("157336")).toEqual({ tmdbId: 157336, slug: undefined });
    expect(parseMovieParam("157336-interstellar")).toEqual({
      tmdbId: 157336,
      slug: "interstellar",
    });
    expect(parseMovieParam("496243-parasitos-2019")).toEqual({
      tmdbId: 496243,
      slug: "parasitos-2019",
    });
    expect(parseMovieParam("invalido")).toEqual({ tmdbId: null });
    expect(parseMovieParam("07bb15f0-0000-4000-8000-000000000000")).toEqual({ tmdbId: null });
    expect(parseMovieParam("12abc")).toEqual({ tmdbId: null });
  });

  it("buildCanonicalMoviePath construye la URL canónica formateada", () => {
    expect(buildCanonicalMoviePath(157336, "Interstellar")).toBe(
      "/movie/157336-interstellar"
    );
    expect(buildCanonicalMoviePath(157336)).toBe("/movie/157336");
  });
});
