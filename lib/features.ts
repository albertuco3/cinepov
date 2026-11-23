/**
 * Interruptores de funcionalidades.
 *
 * SOCIAL: feed de actividad, seguidores, notificaciones y reseñas escritas.
 * Desactivado por defecto durante la beta: con pocos usuarios, una capa social
 * vacía transmite abandono, y las reseñas añaden carga de moderación. Se activa
 * con NEXT_PUBLIC_SOCIAL_ENABLED=true cuando haya densidad (ver roadmap, Hito 2).
 *
 * Es `NEXT_PUBLIC_` porque también lo leen componentes de cliente; Next lo
 * fija en el momento del build, así que cambiarlo exige redesplegar.
 */
export const SOCIAL_ENABLED = process.env.NEXT_PUBLIC_SOCIAL_ENABLED === "true";
