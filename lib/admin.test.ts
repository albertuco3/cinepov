import { describe, it, expect } from "vitest";
import { isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  it("reconoce los emails de la lista, sin distinguir mayúsculas ni espacios", () => {
    const list = "ana@example.com, Admin@CinePOV.com ";
    expect(isAdminEmail("ana@example.com", list)).toBe(true);
    expect(isAdminEmail("admin@cinepov.com", list)).toBe(true);
    expect(isAdminEmail("  ANA@example.com ", list)).toBe(true);
  });

  it("rechaza cualquier otro email", () => {
    expect(isAdminEmail("otra@example.com", "ana@example.com")).toBe(false);
    // Un email que contiene al de la lista no basta.
    expect(isAdminEmail("xana@example.com", "ana@example.com")).toBe(false);
  });

  it("deja el panel cerrado si la variable no está configurada", () => {
    expect(isAdminEmail("ana@example.com", undefined)).toBe(false);
    expect(isAdminEmail("ana@example.com", "")).toBe(false);
    expect(isAdminEmail("", "ana@example.com")).toBe(false);
    expect(isAdminEmail(null, "ana@example.com")).toBe(false);
  });
});
