"use client";

import { useI18n } from "@/lib/i18n/client";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label="Selector de idioma / Language selector"
      className="inline-flex items-center rounded-full bg-white/5 p-0.5 border border-white/10 text-xs font-bold"
    >
      <button
        type="button"
        onClick={() => setLocale("es")}
        aria-pressed={locale === "es"}
        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
          locale === "es"
            ? "bg-primary text-white shadow-sm"
            : "text-muted-foreground hover:text-white"
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
          locale === "en"
            ? "bg-primary text-white shadow-sm"
            : "text-muted-foreground hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
