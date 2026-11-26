import { describe, it, expect } from "vitest";
import { escapeHtml, maskEmail } from "./email";

describe("escapeHtml", () => {
  it("escapa lo necesario para insertar texto en el HTML de un email", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    expect(escapeHtml('<b>"hola"</b>')).toBe("&lt;b&gt;&quot;hola&quot;&lt;/b&gt;");
    expect(escapeHtml("L'Atalante")).toBe("L&#39;Atalante");
  });
});

describe("maskEmail", () => {
  it("deja solo la inicial y el dominio", () => {
    expect(maskEmail("ana.garcia@gmail.com")).toBe("a***@gmail.com");
    expect(maskEmail("sin-arroba")).toBe("***");
  });
});
