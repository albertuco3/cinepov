import { describe, it, expect } from "vitest";
import { es } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import { getDictionary } from "./get-dictionary";

function getKeysRecursively(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getKeysRecursively(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("Sistema de Internacionalización i18n (lib/i18n)", () => {
  it("contiene exactamente las mismas claves de traducción en español y en inglés", () => {
    const esKeys = getKeysRecursively(es).sort();
    const enKeys = getKeysRecursively(en).sort();

    expect(esKeys).toEqual(enKeys);
  });

  it("no tiene valores vacíos ni textos sin definir", () => {
    const checkNoEmptyValues = (dict: Record<string, any>, lang: string) => {
      const keys = getKeysRecursively(dict);
      for (const key of keys) {
        const parts = key.split(".");
        let curr: any = dict;
        for (const p of parts) curr = curr[p];
        expect(typeof curr, `La clave ${key} en ${lang} debe ser un string`).toBe("string");
        expect(curr.trim().length, `La clave ${key} en ${lang} no debe estar vacía`).toBeGreaterThan(0);
      }
    };

    checkNoEmptyValues(es, "es");
    checkNoEmptyValues(en, "en");
  });

  it("resuelve el diccionario correcto con getDictionary()", () => {
    const spanish = getDictionary("es");
    expect(spanish.common.loading).toBe("Cargando...");

    const english = getDictionary("en");
    expect(english.common.loading).toBe("Loading...");

    const fallback = getDictionary("fr");
    expect(fallback.common.loading).toBe("Cargando...");
  });
});
