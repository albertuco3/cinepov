import { describe, it, expect } from "vitest";
import { es } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import { getDictionary } from "./get-dictionary";

type Tree = { [key: string]: unknown };

/** Valor de una clave con puntos ("common.loading") dentro de un diccionario. */
function valueAt(dict: object, key: string): unknown {
  let curr: unknown = dict;
  for (const p of key.split(".")) curr = (curr as Tree)[p];
  return curr;
}

function getKeysRecursively(obj: object, prefix = ""): string[] {
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
    const checkNoEmptyValues = (dict: object, lang: string) => {
      const keys = getKeysRecursively(dict);
      for (const key of keys) {
        const curr = valueAt(dict, key);
        expect(typeof curr, `La clave ${key} en ${lang} debe ser un string`).toBe("string");
        expect(String(curr).trim().length, `La clave ${key} en ${lang} no debe estar vacía`).toBeGreaterThan(0);
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

  it("no contiene emoticonos en ningún texto de los diccionarios", () => {
    // Regex para detectar emojis y símbolos gráficos
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const esKeys = getKeysRecursively(es);
    for (const key of esKeys) {
      const currEs = valueAt(es, key);
      const currEn = valueAt(en, key);
      expect(currEs, `Texto con emoji encontrado en es: ${key}`).not.toMatch(emojiRegex);
      expect(currEn, `Texto con emoji encontrado en en: ${key}`).not.toMatch(emojiRegex);
    }
  });
});
