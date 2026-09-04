import type { NextConfig } from "next";

/**
 * Política de seguridad de contenido.
 *
 * `unsafe-inline` y `unsafe-eval` en los scripts son necesarios hoy para el
 * runtime de Next y para el hot reload en desarrollo. Endurecerlos con nonces
 * requiere middleware y es la siguiente iteración; esta cabecera ya cierra los
 * vectores de inyección de recursos externos, que es el riesgo principal.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://image.tmdb.org https://images.unsplash.com https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.themoviedb.org https://*.posthog.com https://*.ingest.sentry.io https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // HSTS solo tiene efecto sobre HTTPS, así que es inocuo en local.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const embedSecurityHeaders = securityHeaders
  .filter((h) => h.key !== "X-Frame-Options" && h.key !== "Content-Security-Policy")
  .concat([
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors *"),
    },
  ]);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: embedSecurityHeaders,
      },
      {
        source: "/((?!embed).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
