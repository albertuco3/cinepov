"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale, Dictionary, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES } from "./types";
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

function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
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

  // Leer la cookie o el navegador al montar en el cliente
  useEffect(() => {
    try {
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${LOCALE_COOKIE_NAME}=`));

      if (match) {
        const value = match.split("=")[1] as Locale;
        if (SUPPORTED_LOCALES.includes(value)) {
          setLocaleState(value);
          document.documentElement.lang = value;
          return;
        }
      }

      // Si no hay cookie, detectar idioma preferido del navegador
      const browserLang = navigator.language?.toLowerCase() || "";
      if (browserLang.startsWith("en")) {
        setLocaleState("en");
        document.documentElement.lang = "en";
      }
    } catch {
      // Entornos sin acceso a cookies o modo privado restringido
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    try {
      // Guardar en cookie para 1 año
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${oneYear}; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // Fallback
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

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n debe usarse dentro de un I18nProvider.");
  }
  return context;
}
