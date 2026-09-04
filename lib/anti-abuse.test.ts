import { describe, it, expect } from "vitest";
import { validateHoneypot } from "./anti-abuse";

describe("Validación de Honeypot contra Bots (lib/anti-abuse.ts)", () => {
  it("acepta formularios cuando el campo trampa está vacío o ausente", () => {
    expect(validateHoneypot(undefined)).toBe(true);
    expect(validateHoneypot(null)).toBe(true);
    expect(validateHoneypot("")).toBe(true);
    expect(validateHoneypot("   ")).toBe(true);
  });

  it("rechaza formularios cuando un bot ha rellenado el campo trampa", () => {
    expect(validateHoneypot("https://spam-link.com")).toBe(false);
    expect(validateHoneypot("bot-value")).toBe(false);
    expect(validateHoneypot("123")).toBe(false);
  });
});
