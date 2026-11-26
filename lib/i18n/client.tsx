"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { Locale, Dictionary, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES } from "./types";
import { localizePath, swapLocale } from "./paths";
import { es } from "./dictionaries/es";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = {
  es,
  en,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
  t: (keyPath: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // El idioma inicial llega resuelto desde el servidor (cookie o idioma del
  // navegador, ver lib/i18n/server.ts): no se vuelve a detectar en el cliente,
  // lo que evitaba un parpadeo de un idioma a otro al hidratar.

  // El idioma vive en la URL (/es/..., /en/...): cambiarlo es navegar a la
  // misma página con el otro prefijo. Se hace con una carga completa para que
  // el servidor vuelva a pintar todo (incluido el layout) en el nuevo idioma.
  const setLocale = (newLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale) || newLocale === locale) return;
    setLocaleState(newLocale);
    try {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${oneYear}; SameSite=Lax`;
      const { pathname, search, hash } = window.location;
      window.location.assign(swapLocale(pathname + search, newLocale) + hash);
    } catch {
      // Sin acceso a cookies o a la navegación: el cambio queda en la sesión actual.
    }
  };

  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];

  const t = (keyPath: string, fallback?: string): string => {
    const value = getNestedValue(dict, keyPath);
    if (value !== undefined) return value;

    // Fallback al diccionario por defecto si la clave no existiera
    const defaultVal = getNestedValue(dictionaries[DEFAULT_LOCALE], keyPath);
    if (defaultVal !== undefined) return defaultVal;

    return fallback || keyPath;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, dict, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Idioma actual; fuera del proveedor (páginas de error) devuelve el idioma por defecto. */
export function useLocale(): Locale {
  return useContext(I18nContext)?.locale ?? DEFAULT_LOCALE;
}

/** Función que añade el prefijo de idioma a una ruta interna, para router.push y similares. */
export function useLocalePath() {
  const locale = useLocale();
  return useCallback((href: string) => localizePath(href, locale), [locale]);
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n debe usarse dentro de un I18nProvider.");
  }
  return context;
}
