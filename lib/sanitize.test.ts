import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizeAndTruncate,
  validateDisplayName,
  validateFeedbackMessage,
} from "./sanitize";

describe("sanitizeText", () => {
  it("elimina etiquetas HTML y caracteres invisibles", () => {
    expect(sanitizeText("<script>alert('xss')</script>Hola")).toBe("Hola");
    expect(sanitizeText("<b>Texto</b> con <i>formato</i>")).toBe("Texto con formato");
    expect(sanitizeText("Hola\u200B Mundo")).toBe("Hola Mundo");
  });

  it("normaliza espacios repetidos", () => {
    expect(sanitizeText("  Muchos   espacios   ")).toBe("Muchos espacios");
  });
});

describe("sanitizeAndTruncate", () => {
  it("recorta a la longitud maxima indicada", () => {
    expect(sanitizeAndTruncate("1234567890", 5)).toBe("12345");
  });
});

describe("validateDisplayName", () => {
  it("valida nombres correctos", () => {
    const res = validateDisplayName("Carlos");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe("Carlos");
    }
  });

  it("rechaza nombres demasiado cortos", () => {
    const res = validateDisplayName("A");
    expect(res.ok).toBe(false);
  });

  it("rechaza nombres reservados del sistema", () => {
    expect(validateDisplayName("Admin").ok).toBe(false);
    expect(validateDisplayName("cinepov_bot").ok).toBe(false);
    expect(validateDisplayName("moderador").ok).toBe(false);
  });

  it("rechaza nombres sin caracteres alfanumericos", () => {
    expect(validateDisplayName("---").ok).toBe(false);
    expect(validateDisplayName("   ").ok).toBe(false);
  });
});

describe("validateFeedbackMessage", () => {
  it("acepta mensajes con longitud suficiente", () => {
    const res = validateFeedbackMessage("Me gusta mucho la funcionalidad de granularidad progresiva.");
    expect(res.ok).toBe(true);
  });

  it("rechaza mensajes de menos de 10 caracteres", () => {
    const res = validateFeedbackMessage("hola");
    expect(res.ok).toBe(false);
  });
});
