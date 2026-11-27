"use client";

import { useState } from "react";
import Link from "@/components/LocaleLink";
import FeedbackModal from "@/components/FeedbackModal";
import { useI18n } from "@/lib/i18n/client";
import { GENRE_SLUG_MAP } from "@/lib/genres";
import { DECADES_CONFIG } from "@/lib/decades";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { dict, locale } = useI18n();

  return (
    <footer className="w-full border-t border-white/5 bg-background/50 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
          {/* Info y Branding */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-black tracking-wider accent-gradient bg-clip-text text-transparent">
              CinePOV
            </span>
            <p className="text-xs text-muted-foreground text-center md:text-left max-w-md">
              {dict.footer.tagline}
            </p>
          </div>

          {/* Links rápidos */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground interactive-transition">
              {dict.nav.about}
            </Link>
            <Link href="/explore" className="hover:text-foreground interactive-transition">
              {dict.nav.explore}
            </Link>
            <Link href="/rankings" className="hover:text-foreground interactive-transition">
              {dict.nav.rankings}
            </Link>
            <Link href="/metodologia" className="hover:text-foreground interactive-transition">
              {dict.nav.methodology}
            </Link>
            <Link href="/widget" className="hover:text-foreground interactive-transition">
              {locale === "en" ? "Widget for websites" : "Widget para webs"}
            </Link>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hover:text-foreground interactive-transition cursor-pointer font-medium text-sm text-left bg-transparent border-none"
            >
              {dict.nav.feedback}
            </button>
            <Link href="/moderacion" className="hover:text-foreground interactive-transition">
              {dict.nav.moderation}
            </Link>
            <Link href="/terminos" className="hover:text-foreground interactive-transition">
              {dict.nav.terms}
            </Link>
            <Link href="/privacidad" className="hover:text-foreground interactive-transition">
              {dict.nav.privacy}
            </Link>
            <Link href="/aviso-legal" className="hover:text-foreground interactive-transition">
              {dict.nav.legalNotice}
            </Link>
          </div>
        </div>

        {/* Páginas por género y década. Solo existen en español: enlazarlas desde
            aquí evita que dependan únicamente del sitemap para indexarse. */}
        {locale === "es" && (
          <nav aria-label="Descubre películas" className="grid gap-4 border-b border-white/5 py-6 text-xs text-muted-foreground sm:grid-cols-[auto_1fr]">
            <span className="font-bold uppercase tracking-wider text-foreground/70">Por género</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {Object.entries(GENRE_SLUG_MAP).map(([slug, name]) => (
                <Link key={slug} href={`/genre/${slug}`} className="hover:text-foreground interactive-transition">
                  {name}
                </Link>
              ))}
            </div>
            <span className="font-bold uppercase tracking-wider text-foreground/70">Por década</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {Object.values(DECADES_CONFIG).map((decade) => (
                <Link key={decade.slug} href={`/decade/${decade.slug}`} className="hover:text-foreground interactive-transition">
                  {decade.label}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Atribuciones y Derechos */}
        <div className="flex flex-col gap-3 pt-6 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {currentYear} CinePOV. {dict.footer.rights}</p>
            <div className="flex items-center gap-2">
              <span>{dict.footer.dataProvidedBy}</span>
              <a 
                href="https://www.themoviedb.org" 
                target="_blank" 
                rel="noreferrer"
                className="text-foreground hover:underline font-semibold"
              >
                TMDB
              </a>
            </div>
          </div>
          <p className="text-center sm:text-left">
            {dict.footer.tmdbAttribution}
          </p>
        </div>
      </div>

      {/* Modal global de sugerencias */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </footer>
  );
}
