import { describe, it, expect } from "vitest";
import { tmdbImage } from "./tmdb-image";

describe("tmdbImage", () => {
  it("cambia el tamaño de un póster o fondo de TMDB", () => {
    expect(tmdbImage("https://image.tmdb.org/t/p/w500/abc.jpg", "w185")).toBe("https://image.tmdb.org/t/p/w185/abc.jpg");
    expect(tmdbImage("https://image.tmdb.org/t/p/original/fondo.jpg", "w1280")).toBe("https://image.tmdb.org/t/p/w1280/fondo.jpg");
  });

  it("deja igual lo que no es de TMDB", () => {
    expect(tmdbImage("/placeholder-poster.png", "w154")).toBe("/placeholder-poster.png");
    expect(tmdbImage("", "w154")).toBe("");
  });
});
