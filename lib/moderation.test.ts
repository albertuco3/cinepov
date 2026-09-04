import { describe, it, expect } from "vitest";
import { checkContentModeration, normalizeText } from "./moderation";

describe("Motor de moderación de contenido (lib/moderation.ts)", () => {
  it("normaliza texto con diacríticos y leetspeak correctamente", () => {
    const raw = "¡H0la @m1go! Éste es un téxto con ácéntos y 5ímbolos.";
    const normalized = normalizeText(raw);
    expect(normalized).toContain("hola amigo");
    expect(normalized).toContain("este es un texto con acentos y simbolos");
  });

  it("permite reseñas cinematográficas legítimas con palabras sobre crímenes o drama", () => {
    const validReviews = [
      "Una obra maestra del cine negro. El asesino en serie está brillantemente interpretado.",
      "La violencia explícita retrata con crudeza la realidad de la guerra.",
      "Un drama psicológico sobre el dolor y la pérdida. Los actores están sublimes.",
      "La película es bastante mala y aburrida, pero la fotografía es impecable.",
      "A masterpiece of modern cinema with incredible sound design and acting.",
    ];

    for (const review of validReviews) {
      const result = checkContentModeration(review);
      expect(result.isOffensive).toBe(false);
      expect(result.detectedTerms).toHaveLength(0);
    }
  });

  it("detecta insultos graves y lenguaje de odio en español", () => {
    const offensiveSpanish = [
      "El director es un puto gilipollas que no sabe rodar nada.",
      "Vaya soplapollas de protagonista, película para subnormales.",
      "Un auténtico imbécil quien haya escrito este guión tan retrasado.",
      "Menudo hijo de puta el villano y el actor que lo hace.",
    ];

    for (const review of offensiveSpanish) {
      const result = checkContentModeration(review);
      expect(result.isOffensive).toBe(true);
      expect(result.detectedTerms.length).toBeGreaterThan(0);
    }
  });

  it("detecta insultos y lenguaje de odio en inglés", () => {
    const offensiveEnglish = [
      "This actor is a total asshole and the movie is trash.",
      "What a motherfucker, the director ruined the franchise.",
      "Just kill yourself if you enjoyed this garbage.",
    ];

    for (const review of offensiveEnglish) {
      const result = checkContentModeration(review);
      expect(result.isOffensive).toBe(true);
      expect(result.detectedTerms.length).toBeGreaterThan(0);
    }
  });

  it("detecta evasiones sencillas mediante leetspeak", () => {
    const leetOffensive = [
      "Vaya g1l1p0ll@s de director",
      "Es un @ssh0le total",
    ];

    for (const review of leetOffensive) {
      const result = checkContentModeration(review);
      expect(result.isOffensive).toBe(true);
    }
  });

  it("detecta patrones evidentes de spam o enlaces comerciales", () => {
    const spamReview = "Si quieres ganar dinero mira este enlace t.me/cine_gratis y buy crypto";
    const result = checkContentModeration(spamReview);
    expect(result.isOffensive).toBe(true);
  });
});
