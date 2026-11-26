"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/lib/i18n/client";
import { localizePath } from "@/lib/i18n/paths";

/**
 * `next/link` con el prefijo de idioma añadido a los enlaces internos:
 * href="/explore" se convierte en "/es/explore" o "/en/explore".
 *
 * Úsalo en lugar de `next/link` en toda la app. Un enlace sin prefijo también
 * funciona (el middleware redirige), pero cuesta una redirección por clic y los
 * buscadores lo ven como un enlace hacia otro idioma.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  return <NextLink href={typeof href === "string" ? localizePath(href, locale) : href} {...props} />;
}
