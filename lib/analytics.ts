/**
 * Instrumentación de producto de CinePOV.
 *
 * EMBUDO DE ACTIVACIÓN QUE SE MIDE AQUÍ
 *
 *   visita  ->  signup_completed  ->  onboarding_completed  ->  demographics_viewed
 *
 * El último paso es el momento "aha": la primera vez que alguien ve cómo cambia la
 * nota de una película según quién la vota. Los dos objetivos contra los que se leen
 * estos eventos son:
 *
 *   - Tiempo desde la primera visita hasta el primer `demographics_viewed`: < 4 min.
 *   - Tasa de activación (visitantes que llegan a `demographics_viewed`): > 60 %.
 *
 * Por eso `demographics_viewed` lleva el nivel máximo desbloqueado y el número de
 * valoraciones reales de la película: un "aha" sobre una película sin datos
 * suficientes no es el mismo evento que sobre una con la matriz completa, y
 * mezclarlos falsea la tasa de activación.
 *
 * RESTRICCIÓN DE PRIVACIDAD (no negociable)
 *
 * Los datos demográficos del usuario -edad o año de nacimiento, género, email,
 * nombre- no se envían nunca a la analítica, ni como propiedades de evento ni como
 * propiedades de persona. El desglose demográfico es el producto y se sirve desde la
 * base de datos: replicarlo en un tercero solo añade superficie de riesgo RGPD sin
 * aportar nada medible. Lo único que sale de aquí es el identificador de usuario, vía
 * `identifyUser`, más la lista blanca cerrada de `SafeUserTraits`, que además se
 * filtra en tiempo de ejecución. No añadas a este módulo ninguna función que acepte
 * propiedades libres, porque es justo la puerta por la que se filtran esos datos.
 */

import posthog from "posthog-js";

import type { AgeKey, GenderKey, GranularityLevel } from "@/lib/demographics";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

/** Servidor europeo por defecto: los datos no deben salir de la UE sin decidirlo. */
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

/** Clave de `localStorage` que escribe el banner de cookies. */
export const CONSENT_STORAGE_KEY = "cinepov_cookie_consent";

/** Evento en `window` con el que el banner avisa de un cambio de decisión. */
export const CONSENT_CHANGE_EVENT = "cinepov:consent-change";

export type ConsentDecision = "accepted" | "rejected";

export type SignupMethod = "credentials" | "google";

/**
 * Razones cerradas de fallo en el registro. Es una unión y no `string` a propósito:
 * un campo libre acaba con decenas de variantes del mismo error y deja de ser
 * agregable. Si aparece un fallo nuevo, se añade aquí.
 */
export type SignupFailureReason =
  | "email_already_registered"
  | "invalid_email"
  | "weak_password"
  | "missing_demographics"
  | "oauth_denied"
  | "rate_limited"
  | "server_error";

export type ImportSource = "letterboxd" | "imdb";

export type ShareChannel =
  | "twitter"
  | "whatsapp"
  | "telegram"
  | "reddit"
  | "native"
  | "copy_link"
  | "download_image";

export type ShareArtifact =
  | "movie_demographics"
  | "movie_gap"
  | "user_profile"
  | "ranking";

/** Desde dónde se abre la metodología, para saber qué nivel de duda la provoca. */
export type MethodologySource =
  | "movie_demographics"
  | "locked_level"
  | "rankings"
  | "onboarding"
  | "footer";

/** `global` no es una pestaña: es la nota agregada que se ve siempre. */
export type DemographicsTabLevel = Exclude<GranularityLevel, "global">;

export type RankingsGenderFilter = GenderKey | "all";
export type RankingsAgeFilter = AgeKey | "all";

/** Tramos de valoraciones. Se manda el tramo y no el número exacto porque el número
 *  exacto, cruzado con la fecha de registro, vuelve a identificar a una persona. */
export type RatingsCountBucket = "0" | "1-9" | "10-49" | "50-99" | "100+";

/** Eventos que no llevan propiedades propias: se emiten con un único argumento. */
type EmptyProperties = Record<never, never>;

/**
 * Catálogo de eventos y su contrato de propiedades. Es la única fuente de verdad:
 * añadir una entrada aquí es lo que habilita `track` para ese evento.
 */
type AnalyticsEventProperties = {
  // Registro
  signup_started: EmptyProperties;
  signup_completed: { method: SignupMethod };
  signup_failed: { reason: SignupFailureReason };

  // Onboarding
  onboarding_started: EmptyProperties;
  onboarding_movie_rated: { score: number; position: number };
  onboarding_completed: { ratings_count: number };
  onboarding_skipped: { ratings_count: number };

  // Núcleo del producto
  rating_created: { score: number; is_first_rating: boolean };
  rating_updated: { score: number; previous_score: number };
  rating_deleted: EmptyProperties;

  // Momento de activación
  demographics_viewed: {
    max_level: GranularityLevel;
    real_ratings_count: number;
  };
  demographics_tab_switched: { level: DemographicsTabLevel };
  demographics_locked_level_viewed: { level: DemographicsTabLevel };
  methodology_clicked: { source: MethodologySource };

  // Descubrimiento. Del buscador se mide la longitud y el número de resultados, no el
  // texto: la tasa de búsquedas sin resultados es lo accionable, y guardar consultas
  // libres es guardar lo que la gente escriba en un campo de texto.
  search_performed: { query_length: number; results_count: number };
  rankings_segment_changed: {
    gender: RankingsGenderFilter;
    age_range: RankingsAgeFilter;
  };
  movie_page_viewed: { tmdb_id: number };

  // Importación
  import_started: { source: ImportSource };
  import_completed: { source: ImportSource; imported: number; failed: number };

  // Viral
  share_clicked: { channel: ShareChannel; artifact_type: ShareArtifact };

  // Retención
  weekly_email_clicked: EmptyProperties;
  unlock_notification_clicked: EmptyProperties;
};

export type AnalyticsEvent = keyof AnalyticsEventProperties;

export type AnalyticsEventPayload<E extends AnalyticsEvent> =
  AnalyticsEventProperties[E];

type PropertylessEvent = {
  [K in AnalyticsEvent]: keyof AnalyticsEventProperties[K] extends never
    ? K
    : never;
}[AnalyticsEvent];

type EventWithProperties = Exclude<AnalyticsEvent, PropertylessEvent>;

/**
 * Propiedades de persona admitidas. Lista blanca cerrada por diseño: cualquier cosa
 * que no esté aquí no llega a PostHog, ni por tipos ni en tiempo de ejecución.
 */
export interface SafeUserTraits {
  signup_method?: SignupMethod;
  /** Propiedad clave del embudo: permite cohortar activados frente a registrados. */
  onboarding_completed?: boolean;
  ratings_count_bucket?: RatingsCountBucket;
}

const ALLOWED_TRAIT_KEYS = [
  "signup_method",
  "onboarding_completed",
  "ratings_count_bucket",
] as const satisfies readonly (keyof SafeUserTraits)[];

const isDevelopment = process.env.NODE_ENV === "development";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isAnalyticsConfigured(): boolean {
  return POSTHOG_KEY.length > 0;
}

/**
 * Lee la decisión de cookies. Defensivo a propósito: el banner puede no existir
 * todavía y `localStorage` lanza en navegadores con el almacenamiento bloqueado.
 */
export function readConsent(): ConsentDecision | null {
  if (!isBrowser()) return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === "accepted";
}

type BlockedReason =
  | "sin navegador"
  | "sin clave"
  | "sin consentimiento"
  | "sin inicializar";

function blockedReason(): BlockedReason | null {
  if (!isBrowser()) return "sin navegador";
  if (!isAnalyticsConfigured()) return "sin clave";
  if (!hasAnalyticsConsent()) return "sin consentimiento";
  if (!posthog.__loaded) return "sin inicializar";
  return null;
}

function logInDevelopment(message: string, payload?: unknown): void {
  if (!isDevelopment) return;
  console.info(`[analytics] ${message}`, payload ?? {});
}

/**
 * Único punto de salida hacia PostHog. Nunca lanza: una excepción de analítica que
 * rompa un `onClick` cuesta más que el dato que se pierde.
 */
function emit(event: string, properties?: Record<string, unknown>): void {
  const blocked = blockedReason();
  if (blocked) {
    logInDevelopment(`omitido [${blocked}] ${event}`, properties);
    return;
  }
  try {
    posthog.capture(event, properties);
    logInDevelopment(event, properties);
  } catch {
    // Silencio deliberado.
  }
}

export function track(event: PropertylessEvent): void;
export function track<E extends EventWithProperties>(
  event: E,
  properties: AnalyticsEventProperties[E],
): void;
export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  emit(event, properties);
}

/** Vista de página manual: la captura automática de PostHog está desactivada. */
export function capturePageView(url: string): void {
  emit("$pageview", { $current_url: url });
}

function sanitizeTraits(traits: SafeUserTraits): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of ALLOWED_TRAIT_KEYS) {
    const value = traits[key];
    if (value !== undefined) safe[key] = value;
  }
  return safe;
}

/**
 * Asocia los eventos siguientes a un usuario. `userId` es lo único identificativo
 * que se manda; `traits` se filtra contra la lista blanca antes de salir.
 */
export function identifyUser(userId: string, traits?: SafeUserTraits): void {
  const blocked = blockedReason();
  if (blocked) {
    logInDevelopment(`identify omitido [${blocked}]`, { userId });
    return;
  }
  try {
    posthog.identify(userId, traits ? sanitizeTraits(traits) : undefined);
  } catch {
    // Silencio deliberado.
  }
}

/**
 * Corta el hilo entre la sesión anterior y la siguiente. Obligatorio al cerrar
 * sesión: sin esto, el siguiente usuario del navegador hereda el identificador.
 */
export function resetIdentity(): void {
  if (!isBrowser() || !isAnalyticsConfigured() || !posthog.__loaded) return;
  try {
    posthog.reset();
  } catch {
    // Silencio deliberado.
  }
}

export function ratingsCountBucket(count: number): RatingsCountBucket {
  if (count <= 0) return "0";
  if (count < 10) return "1-9";
  if (count < 50) return "10-49";
  if (count < 100) return "50-99";
  return "100+";
}
