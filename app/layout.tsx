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
import { I18nProvider } from "@/lib/i18n/client";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, Locale } from "@/lib/i18n/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CinePOV — Tu Punto de Vista Cinematográfico",
  description: "Descubre cómo valoran tus películas favoritas las personas con tus mismos gustos y perfil demográfico. Filtros por género y edad.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale) || DEFAULT_LOCALE;

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

