"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

export type CookieConsent = "accepted" | "rejected";

/** Clave de `localStorage` donde vive la decisión. Contrato con la capa de analítica. */
export const CONSENT_STORAGE_KEY = "cinepov_cookie_consent";

/** Evento en `window` que se emite al cambiar la decisión, con la decisión en `detail`. */
export const CONSENT_EVENT = "cinepov:consent-change";

declare global {
  interface WindowEventMap {
    [CONSENT_EVENT]: CustomEvent<CookieConsent>;
  }
}

/**
 * Decisión almacenada, o `null` si el usuario todavía no ha decidido.
 *
 * Cualquier script no esencial debe consultar esta función antes de inicializarse
 * y suscribirse a `CONSENT_EVENT` para reaccionar a un cambio en la misma sesión.
 */
export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : null;
  } catch {
    // Safari en modo privado y los navegadores con almacenamiento bloqueado lanzan aquí.
    return null;
  }
}

export default function CookieBanner() {
  const { dict } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [needsDecision, setNeedsDecision] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNeedsDecision(getStoredConsent() === null);
  }, []);

  const decide = useCallback((consent: CookieConsent) => {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, consent);
    } catch {
      // Sin almacenamiento persistente el aviso reaparecerá, pero la decisión de esta
      // sesión sí se propaga por el evento.
    }
    window.dispatchEvent(new CustomEvent<CookieConsent>(CONSENT_EVENT, { detail: consent }));
    setNeedsDecision(false);
  }, []);

  if (!mounted || !needsDecision) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="bg-[#0e1019] mx-auto max-w-3xl rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl shadow-black/90 space-y-4">
        <div className="space-y-2">
          <h2 id="cookie-banner-title" className="text-base font-bold text-white">
            {dict.cookieBanner.title}
          </h2>
          <p id="cookie-banner-description" className="text-sm text-muted-foreground leading-relaxed">
            {dict.cookieBanner.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl interactive-transition cursor-pointer"
          >
            {dict.cookieBanner.acceptAll}
          </button>
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="border border-white/10 hover:border-white/25 text-muted-foreground hover:text-foreground text-sm font-semibold px-5 py-2.5 rounded-xl interactive-transition cursor-pointer bg-white/5"
          >
            {dict.cookieBanner.rejectNonEssential}
          </button>
          <Link
            href="/privacidad"
            className="text-sm font-semibold text-primary-light hover:underline sm:ml-auto text-center"
          >
            {dict.cookieBanner.privacyLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
