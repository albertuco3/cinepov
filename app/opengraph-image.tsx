import { ImageResponse } from "next/og";
import { SiteOgCard } from "@/components/og/SiteOgCard";
import { SITE_HOST } from "@/lib/site";

// Imagen para redes por defecto: la usan las páginas que no definen la suya.
export const alt = "CinePOV: ¿qué nota le darías a cada película?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<SiteOgCard siteHost={SITE_HOST} />, { ...size });
}
