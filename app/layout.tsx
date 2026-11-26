import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import CookieBanner from "@/components/CookieBanner";

import BottomNav from "@/components/BottomNav";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import { I18nProvider } from "@/lib/i18n/client";
import { getRequestLocale, getRequestPathname, localeAlternates } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseMetadata: Metadata = {
  title: "CinePOV — Tu Punto de Vista Cinematográfico",
  description: "Descubre qué nota le darías a cada película según cómo puntúas tú y la gente con tus gustos, y qué películas dividen a generaciones.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

/**
 * Metadatos comunes. Añade a cada página su canónica y sus `hreflang` a partir
 * de la ruta que reescribe el middleware; las páginas que necesitan otra
 * canónica (ficha, blog) la declaran ellas.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [locale, pathname] = await Promise.all([getRequestLocale(), getRequestPathname()]);
  return {
    ...baseMetadata,
    metadataBase: new URL(SITE_URL),
    ...(pathname ? { alternates: localeAlternates(pathname, locale) } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <I18nProvider initialLocale={locale}>
            <AnalyticsProvider>
              <Header />
              <VerifyEmailBanner />
              <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
              <Footer />
              <BottomNav />
              <CookieBanner />
              <Toaster richColors closeButton theme="dark" position="bottom-right" />
            </AnalyticsProvider>
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}

