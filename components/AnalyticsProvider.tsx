"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import posthog from "posthog-js";
import type { PostHogConfig } from "posthog-js";

import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  POSTHOG_HOST,
  POSTHOG_KEY,
  capturePageView,
  isAnalyticsConfigured,
  readConsent,
  type ConsentDecision,
} from "@/lib/analytics";

// `@vercel/speed-insights` no está instalado en el proyecto. Si se añade, basta con
// importar `SpeedInsights` de `@vercel/speed-insights/next` y montarlo junto a
// `<Analytics />`; no requiere consentimiento porque no usa cookies ni identificadores.

/**
 * Configuración de arranque. Todo lo que podría escribir en el dispositivo o capturar
 * texto de la página está desactivado de entrada, y solo el consentimiento explícito
 * sube el nivel de persistencia. Así, si algún día algo inicializa PostHog fuera del
 * flujo de consentimiento, el peor caso es una sesión en memoria sin capturar nada.
 */
const BASE_CONFIG: Partial<PostHogConfig> = {
  api_host: POSTHOG_HOST,
  persistence: "memory",
  opt_out_capturing_by_default: true,
  // Las vistas de página se emiten a mano en `PageViewTracker`: con App Router la
  // captura automática se pierde navegaciones de cliente y duplica otras.
  capture_pageview: false,
  // El catálogo de eventos es explícito. El autocapture añadiría ruido y, sobre todo,
  // manda texto y atributos del DOM que aquí incluyen datos del perfil.
  autocapture: false,
  person_profiles: "identified_only",
  mask_all_text: true,
  mask_all_element_attributes: true,
  session_recording: { maskAllInputs: true, maskTextSelector: "*" },
};

function applyConsent(decision: ConsentDecision | null): void {
  if (!isAnalyticsConfigured()) return;

  try {
    if (decision === "accepted") {
      if (!posthog.__loaded) {
        posthog.init(POSTHOG_KEY, BASE_CONFIG);
      }
      posthog.set_config({ persistence: "localStorage+cookie" });
      if (posthog.has_opted_out_capturing()) {
        // El `$opt_in` que emite por defecto queda como rastro con fecha del
        // consentimiento, que es exactamente lo que hay que poder demostrar.
        posthog.opt_in_capturing();
      }
      return;
    }

    if (!posthog.__loaded) return;
    posthog.opt_out_capturing();
    posthog.set_config({ persistence: "memory" });
  } catch {
    // La analítica no puede tumbar el árbol de React.
  }
}

// Se resuelve al importar el módulo y no en un efecto porque los efectos de los hijos
// corren antes que los del padre: esperar perdería la primera vista de página de la
// sesión, que es justo el inicio del embudo de activación.
if (typeof window !== "undefined") {
  applyConsent(readConsent());
}

/**
 * El banner adjunta la decisión al evento. Solo se usa como respaldo cuando el
 * almacenamiento está bloqueado (Safari en modo privado), donde no hay forma de leerla:
 * si `localStorage` responde, manda él, porque es lo que sobrevive a la recarga.
 */
function decisionFromEvent(event: Event): ConsentDecision | null {
  const detail: unknown = (event as CustomEvent<unknown>).detail;
  return detail === "accepted" || detail === "rejected" ? detail : null;
}

function PageViewTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    capturePageView(
      `${window.location.origin}${pathname}${query ? `?${query}` : ""}`,
    );
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  useEffect(() => {
    const syncConsent = (event?: Event) =>
      applyConsent(readConsent() ?? (event ? decisionFromEvent(event) : null));

    syncConsent();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY) syncConsent();
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, syncConsent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, syncConsent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <Analytics />
    </>
  );
}
