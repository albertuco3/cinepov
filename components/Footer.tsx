"use client";

import { useState } from "react";
import Link from "next/link";
import FeedbackModal from "@/components/FeedbackModal";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
              Descubre cómo valoran tus películas favoritas las personas con tus mismos gustos y perfil demográfico. Rompiendo la tiranía de la nota media.
            </p>
          </div>

          {/* Links rápidos */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/explore" className="hover:text-foreground interactive-transition">
              Explorar
            </Link>
            <Link href="/rankings" className="hover:text-foreground interactive-transition">
              Rankings
            </Link>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hover:text-foreground interactive-transition cursor-pointer font-medium text-sm text-left bg-transparent border-none"
            >
              Sugerencias
            </button>
            <Link href="/terms" className="hover:text-foreground interactive-transition">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-foreground interactive-transition">
              Privacidad
            </Link>
          </div>
        </div>

        {/* Atribuciones y Derechos */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-muted-foreground">
          <p>© {currentYear} CinePOV. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span>Datos provistos por</span>
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
      </div>

      {/* Modal global de sugerencias */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </footer>
  );
}
