import { describe, it, expect } from "vitest";
import {
  isEmbedPath,
  isLocalizablePath,
  localeFromAcceptLanguage,
  localesForPath,
  localizePath,
  negotiateLocale,
  splitLocale,
  swapLocale,
} from "./paths";

describe("splitLocale", () => {
  it("separa el prefijo de idioma", () => {
    expect(splitLocale("/en/movie/1")).toEqual({ locale: "en", rest: "/movie/1" });
    expect(splitLocale("/es")).toEqual({ locale: "es", rest: "/" });
    expect(splitLocale("/es/")).toEqual({ locale: "es", rest: "/" });
  });

  it("no confunde otros segmentos de dos letras con un idioma", () => {
    expect(splitLocale("/vs/27205")).toEqual({ locale: null, rest: "/vs/27205" });
    expect(splitLocale("/fr/movie/1")).toEqual({ locale: null, rest: "/fr/movie/1" });
    expect(splitLocale("/english")).toEqual({ locale: null, rest: "/english" });
  });
});

describe("isLocalizablePath", () => {
  it("excluye la API, los recursos, el widget, las imágenes OG y los ficheros", () => {
    expect(isLocalizablePath("/api/movies/1/stats")).toBe(false);
    expect(isLocalizablePath("/_next/static/x.js")).toBe(false);
    expect(isLocalizablePath("/embed/movie/1")).toBe(false);
    expect(isLocalizablePath("/movie/27205/opengraph-image")).toBe(false);
    expect(isLocalizablePath("/sitemap.xml")).toBe(false);
    expect(isLocalizablePath("/icon.svg")).toBe(false);
  });

  it("acepta las páginas", () => {
    expect(isLocalizablePath("/")).toBe(true);
    expect(isLocalizablePath("/movie/27205-origen")).toBe(true);
    expect(isLocalizablePath("/apiary")).toBe(true);
  });
});

describe("localizePath", () => {
  it("añade el prefijo a los enlaces internos, conservando consulta y ancla", () => {
    expect(localizePath("/", "es")).toBe("/es");
    expect(localizePath("/explore", "en")).toBe("/en/explore");
    expect(localizePath("/rankings?page=2#top", "es")).toBe("/es/rankings?page=2#top");
  });

  it("deja intactos los externos, las anclas, la API y los ya localizados", () => {
    expect(localizePath("https://tmdb.org", "es")).toBe("https://tmdb.org");
    expect(localizePath("//cdn.example.com/x", "es")).toBe("//cdn.example.com/x");
    expect(localizePath("#metodo", "es")).toBe("#metodo");
    expect(localizePath("/api/ratings", "es")).toBe("/api/ratings");
    expect(localizePath("/en/explore", "es")).toBe("/en/explore");
  });
});

describe("swapLocale", () => {
  it("cambia el idioma de la misma página", () => {
    expect(swapLocale("/es/movie/1?x=1", "en")).toBe("/en/movie/1?x=1");
    expect(swapLocale("/en", "es")).toBe("/es");
    expect(swapLocale("/movie/1", "en")).toBe("/en/movie/1");
  });
});

describe("negociación de idioma", () => {
  it("prioriza la cookie, luego el navegador y luego el idioma por defecto", () => {
    expect(negotiateLocale("en", "es-ES,es;q=0.9")).toBe("en");
    expect(negotiateLocale(undefined, "en-GB,en;q=0.9,es;q=0.8")).toBe("en");
    expect(negotiateLocale("fr", "de-DE")).toBe("es");
    expect(negotiateLocale(undefined, null)).toBe("es");
  });

  it("respeta el orden de preferencia de Accept-Language", () => {
    expect(localeFromAcceptLanguage("de-DE,es;q=0.5,en;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR")).toBeNull();
  });
});

describe("localesForPath", () => {
  it("declara los dos idiomas solo en las rutas traducidas", () => {
    expect(localesForPath("/")).toEqual(["es", "en"]);
    expect(localesForPath("/movie/27205")).toEqual(["es", "en"]);
    expect(localesForPath("/privacidad")).toEqual(["es"]);
    expect(localesForPath("/movies-old")).toEqual(["es"]);
  });
});

describe("isEmbedPath", () => {
  it("reconoce solo las rutas del widget", () => {
    expect(isEmbedPath("/embed/movie/27205")).toBe(true);
    expect(isEmbedPath("/embed")).toBe(true);
    expect(isEmbedPath("/embedded")).toBe(false);
    expect(isEmbedPath("/es/embed/movie/1")).toBe(false);
  });
});
