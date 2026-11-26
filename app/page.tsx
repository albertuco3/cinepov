import Link from "@/components/LocaleLink";
import LandingDemo from "@/components/LandingDemo";
import SearchBar from "@/components/SearchBar";
import HomeRecommendationsSection from "@/components/HomeRecommendationsSection";
import { db } from "@/lib/db";
import { COUNTED_USER_WHERE, countedRatingWhere } from "@/lib/rating-filters";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "CinePOV — La Película no tiene un 7.2. Tiene un 8.6 para ti.",
  description: "Rompe la tiranía de la nota media. CinePOV filtra las puntuaciones de las películas por género y edad para descubrir qué gusta de verdad a personas como tú.",
};

export default async function Home() {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);

  // Cifras reales de la base de datos. La landing no anuncia números que no
  // pueda respaldar: solo personas verificadas y valoraciones que cuentan.
  const [realUsers, realRatings, movieCount] = await Promise.all([
    db.user.count({ where: { ...COUNTED_USER_WHERE, isAnonymized: false } }),
    db.rating.count({ where: countedRatingWhere() }),
    db.movie.count(),
  ]);

  return (
    <div className="flex-1 flex flex-col justify-start w-full">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-28">
        {/* Iluminación de fondo sutil (Background Glow) */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              {dict.hero.titlePart1} <span className="text-muted-foreground/60">7.2</span>.
              <br />
              {dict.hero.titlePart2} <span className="accent-gradient">{dict.hero.titleHighlight}</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
              {dict.hero.subtitle}
            </p>
          </div>

          {/* Buscador de películas integrado en la Landing */}
          <div className="max-w-lg mx-auto bg-[#0f111a] p-2.5 rounded-3xl border border-white/10 shadow-xl">
            <SearchBar />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/15 cursor-pointer"
            >
              {dict.hero.ctaRegister}
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all cursor-pointer"
            >
              {dict.hero.ctaExplore}
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN RECOMENDACIONES PERSONALIZADAS DEMOGRÁFICAS (FASE 7) */}
      <HomeRecommendationsSection />

      {/* 2. SIMULADOR INTERACTIVO (DEMO) */}
      <section className="py-12 bg-white/[0.01] border-y border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">{dict.landing.conceptTitle}</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {dict.landing.conceptSubtitle}
            </p>
          </div>
          <LandingDemo />
        </div>
      </section>

      {/* 3. CÓMO FUNCIONA EN 3 PASOS */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">{dict.landing.howItWorksTitle}</h2>
            <p className="text-sm text-muted-foreground">{dict.landing.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta Paso 1 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white">{dict.landing.step1Title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dict.landing.step1Desc}
              </p>
            </div>

            {/* Tarjeta Paso 2 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white">{dict.landing.step2Title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dict.landing.step2Desc}
              </p>
            </div>

            {/* Tarjeta Paso 3 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white">{dict.landing.step3Title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dict.landing.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN POLARIZACIÓN CULTURAL (FASE 4) */}
      <section className="py-8 bg-white/[0.01] border-y border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-pink-500/5 via-primary/5 to-blue-500/5">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                {dict.landing.polarizingBadge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {dict.landing.polarizingTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                {dict.landing.polarizingDesc}
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/polarizing"
                className="px-6 py-3 rounded-full text-xs font-black tracking-wide uppercase bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/15"
              >
                {dict.landing.polarizingCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ESTADO REAL DEL PROYECTO */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] p-8 sm:p-12 text-center space-y-6">
            {/* Background Glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                {dict.landing.liveDataBadge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {dict.landing.liveDataTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {dict.landing.liveDataDesc}
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 pt-4">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {realUsers.toLocaleString(locale === "en" ? "en-US" : "es-ES")}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {dict.landing.registeredUsers}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                  {realRatings.toLocaleString(locale === "en" ? "en-US" : "es-ES")}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {dict.landing.realRatings}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {movieCount.toLocaleString(locale === "en" ? "en-US" : "es-ES")}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {dict.landing.moviesCatalog}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CTA DE REGISTRO FINAL */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-indigo-600 p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-primary/10">
            <div className="max-w-md mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {dict.landing.readyTitle}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {dict.landing.readySubtitle}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-block px-8 py-4 rounded-full text-xs font-black tracking-wide uppercase bg-[#0f111a] hover:bg-black text-white transition-all shadow-xl cursor-pointer"
              >
                {dict.landing.readyCta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
