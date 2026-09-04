import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://cinepov.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/profile/",
        "/reset-password/",
        "/forgot-password/",
        "/verificar-email/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
