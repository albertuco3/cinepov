import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { db } from "@/lib/db";
import { COUNTED_USER_WHERE, countedRatingWhere } from "@/lib/rating-filters";
import { GRANULARITY_THRESHOLDS, SEGMENT_MIN_VOTES } from "@/lib/demographics";
import { NOTABLE_GAP } from "@/lib/viral";
import { TASTE } from "@/lib/taste";
import { getRequestLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

export const dynamic = "force-dynamic";

/*
 * Todas las cifras de esta página (umbrales, mínimos, parámetros del motor)
 * salen de las mismas constantes que usa el código: si cambian, la página
 * cambia con ellas. Las de la validación con MovieLens están en
 * docs/validacion_movielens.md.
 */

const LEVELS = [
  { key: "age_broad", es: "Por generación (18-34, 35-54, 55+)", en: "By generation (18-34, 35-54, 55+)" },
  { key: "gender", es: "Por género", en: "By gender" },
  { key: "age_full", es: "Por edad detallada (cinco tramos)", en: "By detailed age (five brackets)" },
  { key: "cross", es: "Matriz completa género × edad", en: "Full gender × age matrix" },
] as const;

const TEXT = {
  es: {
    metaTitle: "Metodología · CinePOV",
    metaDescription:
      "Cómo calcula CinePOV tu nota estimada y las notas por edad y género, qué votos cuentan, cuándo hay una brecha real y qué mostramos cuando aún no hay datos.",
    badge: "Transparencia",
    title: "Cómo funcionan nuestros datos",
    intro:
      "CinePOV te dice qué nota le darías a una película y te enseña dónde se separan las generaciones o los géneros. Esas promesas solo valen algo si puedes comprobar de dónde salen los números. Esta página lo explica, incluida la parte incómoda.",
    statsTitle: "Estado actual de la base de datos",
    statCounted: "Valoraciones que cuentan",
    statPeople: "Personas verificadas",
    statMovies: "Películas en catálogo",
    statsNote:
      "Se calculan en vivo cada vez que cargas esta página. Todas las valoraciones son de personas reales con el email verificado: no hay votos simulados.",
    s1Title: "1. Tu nota estimada",
    s1: [
      `Cuando ya has valorado al menos ${TASTE.MIN_OWN_RATINGS} películas, en las que aún no has visto te enseñamos la nota que probablemente les darías. Sale de tres piezas, sumadas:`,
      `La base de la película: su nota en TMDB, que cuenta como si fueran ${TASTE.MOVIE_PRIOR} votos, desplazada por los votos de CinePOV. Cuantos más votos hay, menos pesa TMDB.`,
      "Tu tendencia: si sueles puntuar por encima o por debajo de la media. Con pocas valoraciones tuyas se tiene poco en cuenta.",
      `La gente que puntúa como tú: entre quienes han visto esa película, hasta ${TASTE.K} personas cuyas notas se parecen a las tuyas en al menos ${TASTE.MIN_OVERLAP} películas en común. Si a ellas les gustó más de lo esperable, tu nota sube; si menos, baja.`,
      "No usa tu edad ni tu género. Lo comprobamos con un millón de valoraciones públicas (MovieLens): saber tu grupo demográfico reduce el error al predecir tu nota menos de un 1 %; saber cómo puntúas tú y quién puntúa como tú, entre un 6 % y un 10 %.",
    ],
    s2Title: "2. Cómo calculamos la nota de un grupo",
    s2: [
      "Cuando te registras te pedimos dos datos: tu año de nacimiento (no la fecha completa) y tu género. La nota de un grupo es la media aritmética de las valoraciones de las personas que pertenecen a él.",
      "No hay ponderaciones ocultas ni ajustes editoriales: la nota de «mujeres de 25 a 34» es la media de las notas de las usuarias de entre 25 y 34 años. Nada más. A diferencia de la nota estimada, aquí no interviene TMDB.",
      "Los tramos de edad se calculan a partir del año de nacimiento, así que cada persona va cambiando de tramo con los años. Nunca guardamos la edad como un dato fijo.",
    ],
    s3Title: "3. Por qué a veces no te mostramos un dato",
    s3: [
      `Un grupo solo muestra su nota cuando tiene al menos ${SEGMENT_MIN_VOTES} valoraciones. Ese mínimo es sobre todo de privacidad: con una sola persona dentro, la nota del grupo sería su voto, identificable por descarte. Por debajo verás cuántas faltan, no un número inventado.`,
      "Solo cuentan las valoraciones de cuentas con el email verificado: es la barrera básica contra quien crea cuentas en masa para inflar o hundir la nota de un grupo.",
      "Además, el desglose se desbloquea por niveles según la película acumula votos. Cada nivel pide un total y que al menos dos de sus grupos alcancen un mínimo; un desglose con todos los votos en un mismo grupo no compara nada.",
    ],
    colLevel: "Nivel de detalle",
    colTotal: "Votos en total",
    colPerGroup: "Mínimo por grupo",
    levelGlobal: "Nota global de la película",
    gapTitle: "Cuándo decimos que hay una brecha",
    gap: `Que dos grupos tengan notas distintas no basta: con pocos votos, la diferencia puede ser casualidad. Solo hablamos de brecha cuando la diferencia es de al menos ${NOTABLE_GAP.MIN_DIFFERENCE} punto, cada grupo tiene al menos ${NOTABLE_GAP.MIN_VOTES} votos y es improbable que se deba al azar (una prueba estadística estándar, con un 95 % de confianza). Cuando no se cumple, lo decimos: «aquí no hay brecha». En los datos de MovieLens, solo en torno al 15 % de las películas tiene una brecha real, casi siempre entre generaciones.`,
    s4Title: "4. Qué mostramos cuando todavía no hay datos",
    s4: [
      "Una plataforma de valoraciones colaborativas no es útil hasta que mucha gente ha votado (el «arranque en frío»). Nuestra respuesta es no rellenar los huecos: donde no hay datos suficientes, te enseñamos cuántos faltan para desbloquear cada nivel, y tu voto es literalmente el que lo acerca.",
      "Durante el desarrollo probamos valoraciones simuladas para que las fichas no estuvieran vacías. Las retiramos antes de abrir: aunque iban etiquetadas, dibujaban diferencias entre grupos que nadie había expresado. Nunca contaron para ninguna nota.",
    ],
    aiTitle: "Por qué no usamos inteligencia artificial generativa",
    ai: [
      "Un modelo de lenguaje no sabe qué opina una mujer de 22 años sobre una película: sabe qué se dice en internet sobre lo que opinan las mujeres de 22 años. Es decir, devuelve el estereotipo.",
      "CinePOV existe para comprobar con datos si esos estereotipos son ciertos. Tu nota estimada sí es un cálculo, pero estadístico y hecho solo con votos reales. Preferimos una celda vacía que dice la verdad.",
    ],
    s5Title: "5. Qué hacemos con tus datos personales",
    s5: [
      "Pedimos el mínimo imprescindible: año de nacimiento y género. No pedimos tu nombre real, ni tu ubicación, ni tu profesión.",
      `Tu edad y tu género nunca son públicos: no aparecen en tu perfil ni junto a tus valoraciones. Solo intervienen en medias de grupo de al menos ${SEGMENT_MIN_VOTES} personas.`,
    ],
    privacyBefore: "Puedes cambiarlos, exportar tus valoraciones o eliminar tu cuenta en cualquier momento desde tu perfil. Los detalles están en la ",
    privacyLink: "política de privacidad",
    s6Title: "6. Nuestra postura sobre los sesgos",
    s6: [
      "Que dos grupos valoren una película de forma distinta es un dato descriptivo, no un juicio sobre ninguno de los dos. No existe una nota correcta.",
      "Por eso nunca ordenamos los grupos por acierto y siempre mostramos la nota global junto a las de cada grupo. El registro ofrece tres opciones de género (mujer, hombre y no binario), y cada una forma su propio grupo cuando reúne votos suficientes.",
      "Nuestra base de usuarios no está repartida de forma equilibrada, y eso afecta a la calidad de los datos. Lo vigilamos y solo se resuelve con más gente de los grupos menos representados.",
    ],
    s7Title: "7. Fuentes y atribución",
    tmdbBefore: "La información de las películas (títulos, sinopsis, carteles, reparto, dirección y duración) proviene de ",
    tmdbAfter: ". Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.",
    tmdbScore:
      "La nota de TMDB se muestra siempre identificada como tal. Las medias de CinePOV (la global y las de cada grupo) nunca la mezclan. Sí la usamos como punto de partida en dos cálculos, y pesa menos cuantos más votos hay: tu nota estimada y el orden de las listas de mejores películas por género y por década.",
    contactTitle: "¿Has encontrado algo que no cuadra?",
    contact:
      "Nos interesa mucho saberlo. Si un dato parece incorrecto, un cálculo no encaja o algo contradice lo que dice esta página, escríbenos desde «Sugerencias», en el pie de página. Corregirlo y explicarlo públicamente nos importa más que quedar bien.",
    revised: "Última revisión de esta página: noviembre de 2026.",
  },
  en: {
    metaTitle: "Methodology · CinePOV",
    metaDescription:
      "How CinePOV calculates your estimated score and the scores by age and gender, which votes count, when a gap is real, and what we show when there is no data yet.",
    badge: "Transparency",
    title: "How our data works",
    intro:
      "CinePOV tells you the score you'd likely give a movie and shows you where generations or genders split. Those promises are only worth something if you can check where the numbers come from. This page explains it, including the uncomfortable part.",
    statsTitle: "Current state of the database",
    statCounted: "Ratings that count",
    statPeople: "Verified people",
    statMovies: "Movies in the catalog",
    statsNote:
      "Calculated live every time you load this page. Every rating comes from a real person with a verified email: there are no simulated votes.",
    s1Title: "1. Your estimated score",
    s1: [
      `Once you have rated at least ${TASTE.MIN_OWN_RATINGS} movies, for the ones you haven't seen we show the score you would probably give them. It adds up three parts:`,
      `The movie's baseline: its TMDB score, counted as if it were ${TASTE.MOVIE_PRIOR} votes, moved by CinePOV votes. The more votes there are, the less TMDB weighs.`,
      "Your tendency: whether you usually rate above or below average. With few ratings of yours it barely counts.",
      `People who rate like you: among those who have seen that movie, up to ${TASTE.K} people whose scores resemble yours on at least ${TASTE.MIN_OVERLAP} movies in common. If they liked it more than expected, your score goes up; if less, it goes down.`,
      "It does not use your age or gender. We checked with a million public ratings (MovieLens): knowing your demographic group cuts the error in predicting your score by less than 1%; knowing how you rate and who rates like you, by 6% to 10%.",
    ],
    s2Title: "2. How we calculate a group's score",
    s2: [
      "When you sign up we ask for two things: your birth year (not your full date of birth) and your gender. A group's score is the arithmetic mean of the ratings from the people in it.",
      "There are no hidden weights or editorial adjustments: the score for “women aged 25 to 34” is the mean of the scores given by users aged 25 to 34. Nothing else. Unlike the estimated score, TMDB plays no part here.",
      "Age brackets are calculated from the birth year, so people move bracket as the years go by. We never store age as a fixed value.",
    ],
    s3Title: "3. Why we sometimes don't show a number",
    s3: [
      `A group only shows its score once it has at least ${SEGMENT_MIN_VOTES} ratings. That minimum is mainly about privacy: with a single person inside, the group's score would be their vote, identifiable by elimination. Below it you see how many are missing, not a made-up number.`,
      "Only ratings from accounts with a verified email count: the basic barrier against mass-created accounts trying to inflate or sink a group's score.",
      "On top of that, the breakdown unlocks in levels as the movie gathers votes. Each level needs a total and at least two of its groups reaching a minimum; a breakdown with every vote in one group compares nothing.",
    ],
    colLevel: "Level of detail",
    colTotal: "Total votes",
    colPerGroup: "Minimum per group",
    levelGlobal: "Overall movie score",
    gapTitle: "When we say there is a gap",
    gap: `Two groups having different scores is not enough: with few votes, the difference can be chance. We only talk about a gap when the difference is at least ${NOTABLE_GAP.MIN_DIFFERENCE} point, each group has at least ${NOTABLE_GAP.MIN_VOTES} votes, and it is unlikely to be chance (a standard statistical test at 95% confidence). When that doesn't hold, we say so: “no real gap here”. In the MovieLens data, only about 15% of movies have a real gap, almost always between generations.`,
    s4Title: "4. What we show when there is no data yet",
    s4: [
      "A collaborative rating platform isn't useful until many people have voted (the “cold start”). Our answer is not to fill the gaps: where there isn't enough data, we show how many votes are missing to unlock each level, and your vote is literally what brings it closer.",
      "During development we tried simulated ratings so movie pages wouldn't look empty. We removed them before opening: even though they were labeled, they drew differences between groups that nobody had expressed. They never counted towards any score.",
    ],
    aiTitle: "Why we don't use generative AI",
    ai: [
      "A language model doesn't know what a 22-year-old woman thinks of a movie: it knows what the internet says 22-year-old women think. In other words, it returns the stereotype.",
      "CinePOV exists to check with data whether those stereotypes hold. Your estimated score is a calculation, but a statistical one made only from real votes. We prefer an empty cell that tells the truth.",
    ],
    s5Title: "5. What we do with your personal data",
    s5: [
      "We ask for the bare minimum: birth year and gender. We don't ask for your real name, your location or your job.",
      `Your age and gender are never public: they don't appear on your profile or next to your ratings. They only feed into group averages of at least ${SEGMENT_MIN_VOTES} people.`,
    ],
    privacyBefore: "You can change them, export your ratings or delete your account at any time from your profile. The details are in the ",
    privacyLink: "privacy policy",
    s6Title: "6. Our stance on bias",
    s6: [
      "Two groups rating a movie differently is a descriptive fact, not a judgment on either of them. There is no correct score.",
      "That's why we never rank groups by who is right, and we always show the overall score next to each group's. Sign-up offers three gender options (woman, man and non-binary), and each forms its own group once it has enough votes.",
      "Our user base isn't evenly spread, and that affects data quality. We monitor it, and it only improves with more people from the less represented groups.",
    ],
    s7Title: "7. Sources and attribution",
    tmdbBefore: "Movie information (titles, synopses, posters, cast, direction and runtime) comes from ",
    tmdbAfter: ". This product uses the TMDB API but is not endorsed or certified by TMDB.",
    tmdbScore:
      "The TMDB score is always labeled as such. CinePOV's averages (overall and per group) never mix it in. We do use it as a starting point in two calculations, weighing less the more votes there are: your estimated score and the order of the best-movies lists by genre and by decade.",
    contactTitle: "Found something that doesn't add up?",
    contact:
      "We really want to know. If a number looks wrong, a calculation doesn't fit, or anything contradicts this page, write to us from “Feedback” in the footer. Fixing it and explaining it publicly matters more to us than looking good.",
    revised: "Last reviewed: November 2026.",
  },
} as const;

const NUMBER_LOCALE: Record<Locale, string> = { es: "es-ES", en: "en-GB" };

export async function generateMetadata(): Promise<Metadata> {
  const t = TEXT[await getRequestLocale()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function MetodologiaPage() {
  const locale = await getRequestLocale();
  const t = TEXT[locale];
  const [realCount, userCount, movieCount] = await Promise.all([
    db.rating.count({ where: countedRatingWhere() }),
    db.user.count({ where: { ...COUNTED_USER_WHERE, isAnonymized: false } }),
    db.movie.count(),
  ]);
  const fmt = (n: number) => n.toLocaleString(NUMBER_LOCALE[locale]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          {t.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">{t.title}</h1>
        <p className="text-base text-muted-foreground leading-relaxed">{t.intro}</p>
      </header>

      <section className="glass-panel rounded-3xl border border-white/5 p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-white">{t.statsTitle}</h2>
        <div className="grid grid-cols-3 gap-4">
          <Stat label={t.statCounted} value={fmt(realCount)} accent="text-emerald-400" />
          <Stat label={t.statPeople} value={fmt(userCount)} accent="text-white" />
          <Stat label={t.statMovies} value={fmt(movieCount)} accent="text-white" />
        </div>
        <p className="text-xs text-muted-foreground">{t.statsNote}</p>
      </section>

      <Section title={t.s1Title}>
        <p>{t.s1[0]}</p>
        <ul className="list-disc pl-5 space-y-2">
          {t.s1.slice(1, 4).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>{t.s1[4]}</p>
      </Section>

      <Section title={t.s2Title}>
        {t.s2.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Section>

      <Section title={t.s3Title}>
        {t.s3.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {t.colLevel}
                </th>
                <th className="text-right py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {t.colTotal}
                </th>
                <th className="text-right py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {t.colPerGroup}
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/5">
                <td className="py-3 px-3">{t.levelGlobal}</td>
                <td className="py-3 px-3 text-right text-white font-bold tabular-nums">1</td>
                <td className="py-3 px-3 text-right tabular-nums">—</td>
              </tr>
              {LEVELS.map((level) => (
                <tr key={level.key} className="border-b border-white/5 last:border-0">
                  <td className="py-3 px-3">{level[locale]}</td>
                  <td className="py-3 px-3 text-right text-white font-bold tabular-nums">
                    {GRANULARITY_THRESHOLDS[level.key].minTotal}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">{GRANULARITY_THRESHOLDS[level.key].minPerSegment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="text-base font-bold text-white pt-2">{t.gapTitle}</h3>
        <p>{t.gap}</p>
      </Section>

      <Section title={t.s4Title}>
        {t.s4.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <h3 className="text-base font-bold text-white pt-2">{t.aiTitle}</h3>
        {t.ai.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Section>

      <Section title={t.s5Title}>
        {t.s5.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>
          {t.privacyBefore}
          <Link href="/privacidad" className="text-primary-light font-semibold hover:underline">
            {t.privacyLink}
          </Link>
          .
        </p>
      </Section>

      <Section title={t.s6Title}>
        {t.s6.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Section>

      <Section title={t.s7Title}>
        <p>
          {t.tmdbBefore}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light font-semibold hover:underline"
          >
            The Movie Database (TMDB)
          </a>
          {t.tmdbAfter}
        </p>
        <p>{t.tmdbScore}</p>
      </Section>

      <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-bold text-white">{t.contactTitle}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.contact}</p>
        <p className="text-xs text-muted-foreground">{t.revised}</p>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="space-y-1">
      <p className={`text-2xl font-black tabular-nums ${accent}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
