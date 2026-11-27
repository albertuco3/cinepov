import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { getRequestLocale } from "@/lib/i18n/server";
import { TASTE } from "@/lib/taste";

/*
 * El posicionamiento sigue la validación con MovieLens
 * (docs/validacion_movielens.md): lo que predice tu nota es tu gusto, no tu
 * edad ni tu género; las brechas entre grupos son el contenido, no la utilidad.
 */
const TEXT = {
  es: {
    metaTitle: "Acerca de CinePOV",
    metaDescription:
      "Por qué existe CinePOV: qué nota le darías tú a cada película, según cómo puntúas y quien puntúa como tú, y dónde se separan de verdad las generaciones.",
    badge: "Por qué existe CinePOV",
    title: "Qué nota le darías tú",
    lead: "La nota media de una película dice qué le pareció a la gente en general. CinePOV intenta responder a otra pregunta: qué te va a parecer a ti.",
    learnedTitle: "Lo que aprendimos antes de abrir",
    learned: [
      "Empezamos convencidos de que la clave estaba en la edad y el género: que detrás de un 6,5 se escondía un 8,8 entre los jóvenes y un 4,2 entre los mayores.",
      "Lo comprobamos con un millón de valoraciones públicas, y no era así. En la mayoría de películas, generaciones y géneros coinciden en medio punto o menos. Saber a qué grupo perteneces apenas ayuda a adivinar tu nota.",
    ],
    learnedStrong: "Lo que sí la predice es cómo puntúas tú y la gente que puntúa como tú. Sobre eso está construido CinePOV.",
    learnedLink: "Cómo lo medimos",
    pillarsTitle: "Cómo funciona",
    pillars: [
      {
        title: "Tu nota estimada",
        text: `Valora al menos ${TASTE.MIN_OWN_RATINGS} películas y te diremos qué nota le darías a las demás, según tu forma de puntuar y la de quienes puntúan como tú.`,
      },
      {
        title: "Brechas, solo si son reales",
        text: "Cuando generaciones o géneros se separan de verdad en una película (pasa en torno al 15 % de las películas), lo destacamos. Cuando no, también lo decimos.",
      },
      {
        title: "Datos reales y privados",
        text: "Solo cuentan los votos de personas con el email verificado, sin datos inventados. Tu edad y tu género nunca son públicos.",
      },
    ],
    toolsTitle: "Qué puedes hacer",
    tools: [
      { title: "Qué vemos esta noche", text: "Elige el perfil de cada persona y te proponemos películas que gustan a todos.", href: "/tonight" },
      { title: "Películas que dividen", text: "Las que separan de verdad a generaciones o géneros, con los datos delante.", href: "/polarizing" },
      { title: "Recomendaciones para ti", text: "Películas que aún no has visto, ordenadas por la nota que probablemente les darías.", href: "/recommendations" },
      { title: "Tu año en cine", text: "Lo que has visto este año y cómo puntúas frente a la comunidad.", href: "/wrapped" },
    ],
    ctaTitle: "Empieza por unas cuantas películas",
    ctaText: "Valóralas y te diremos qué nota le darías a las demás.",
    ctaPrimary: "Crear cuenta gratis",
    ctaSecondary: "Cómo calculamos los datos",
  },
  en: {
    metaTitle: "About CinePOV",
    metaDescription:
      "Why CinePOV exists: the score you'd give each movie, based on how you rate and on people who rate like you, and where generations truly split.",
    badge: "Why CinePOV exists",
    title: "The score you would give it",
    lead: "A movie's average score tells you what people in general thought. CinePOV tries to answer a different question: what you will think of it.",
    learnedTitle: "What we learned before opening",
    learned: [
      "We started out convinced that age and gender were the key: that behind a 6.5 hid an 8.8 among young people and a 4.2 among older ones.",
      "We checked it against a million public ratings, and it wasn't so. For most movies, generations and genders agree within half a point. Knowing your group barely helps to guess your score.",
    ],
    learnedStrong: "What does predict it is how you rate and how people who rate like you do. That is what CinePOV is built on.",
    learnedLink: "How we measured it",
    pillarsTitle: "How it works",
    pillars: [
      {
        title: "Your estimated score",
        text: `Rate at least ${TASTE.MIN_OWN_RATINGS} movies and we'll tell you the score you'd give the rest, based on how you rate and on people who rate like you.`,
      },
      {
        title: "Gaps, only when real",
        text: "When generations or genders truly split on a movie (about 15% of movies), we highlight it. When they don't, we say so too.",
      },
      {
        title: "Real, private data",
        text: "Only votes from people with a verified email count, with no made-up data. Your age and gender are never public.",
      },
    ],
    toolsTitle: "What you can do",
    tools: [
      { title: "What shall we watch tonight?", text: "Pick each person's profile and we suggest movies everyone likes.", href: "/tonight" },
      { title: "Movies that divide", text: "The ones that truly split generations or genders, with the data in front of you.", href: "/polarizing" },
      { title: "Recommendations for you", text: "Movies you haven't seen yet, ordered by the score you'd probably give them.", href: "/recommendations" },
      { title: "Your year in film", text: "What you watched this year and how you rate compared with the community.", href: "/wrapped" },
    ],
    ctaTitle: "Start with a few movies",
    ctaText: "Rate them and we'll tell you the score you'd give the rest.",
    ctaPrimary: "Create a free account",
    ctaSecondary: "How we calculate the data",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = TEXT[await getRequestLocale()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function AboutPage() {
  const t = TEXT[await getRequestLocale()];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-12 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-primary font-bold">{t.badge}</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">{t.title}</h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">{t.lead}</p>
      </div>

      <div className="space-y-10 text-sm sm:text-base leading-relaxed">
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">{t.learnedTitle}</h2>
          {t.learned.map((line) => (
            <p key={line} className="text-muted-foreground">
              {line}
            </p>
          ))}
          <p className="text-white font-medium">{t.learnedStrong}</p>
          <Link href="/metodologia" className="inline-block text-sm font-bold text-primary-light hover:underline">
            {t.learnedLink} →
          </Link>
        </section>

        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">{t.pillarsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.pillars.map((pillar) => (
              <div key={pillar.title} className="bg-white/5 p-5 rounded-xl border border-white/5 space-y-2">
                <h3 className="font-bold text-white text-base">{pillar.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">{t.toolsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {t.tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 interactive-transition"
              >
                <h3 className="font-semibold text-white mb-1">{tool.title}</h3>
                <p className="text-xs text-muted-foreground">{tool.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/20 via-violet-900/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-white">{t.ctaTitle}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.ctaText}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold interactive-transition"
            >
              {t.ctaPrimary}
            </Link>
            <Link
              href="/metodologia"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold interactive-transition"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
