import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { getRequestLocale } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import { SEGMENT_MIN_VOTES } from "@/lib/demographics";

const EXAMPLE_TMDB_ID = 27205;
const EXAMPLE_TITLE = "Origen";

const TEXT = {
  es: {
    title: "Widget para blogs y medios · CinePOV",
    description:
      "Inserta en tu web cómo valoran una película distintas generaciones, mujeres y hombres, con votos verificados. Gratis y sin registro.",
    badge: "Para webs",
    heading: "El widget de CinePOV para tu blog o medio",
    intro:
      "Muestra junto a tu crítica o noticia cómo valoran una película distintas generaciones, y mujeres y hombres, con votos verificados de CinePOV. Es gratis y no hace falta registrarse.",
    howTitle: "Cómo añadirlo",
    steps: [
      "Abre la ficha de la película en CinePOV.",
      "Pulsa «Embeber», junto a los botones de compartir.",
      "Copia el código y pégalo en tu web, en el modo HTML de tu editor (WordPress, Ghost, Blogger…).",
    ],
    codeTitle: "El código",
    codeNote:
      "El número de la dirección es el identificador de la película en TMDB: el mismo que aparece en la URL de su ficha en CinePOV (por ejemplo, /movie/27205-origen).",
    exampleTitle: "Así se ve",
    showsTitle: "Qué muestra",
    shows: [
      "La nota media de la película con los votos que cuentan (de cuentas con el email verificado).",
      "Mujeres frente a hombres y jóvenes (18-34) frente a mayores (55+), cuando cada grupo tiene votos suficientes.",
      `Un grupo solo aparece con al menos ${SEGMENT_MIN_VOTES} votos, para que no se pueda deducir el voto de nadie. Mientras tanto, el widget muestra cuántos votos lleva la película.`,
      "Se actualiza cada vez que se carga.",
    ],
    privacyTitle: "Privacidad",
    privacy:
      "El widget no usa cookies, no carga analítica y no recoge datos de quien visita tu web. Cumple el RGPD sin que tengas que añadir nada a tu aviso de cookies.",
    termsTitle: "Condiciones",
    terms:
      "Puedes usarlo libremente en webs con o sin publicidad. Te pedimos que no ocultes ni recortes el enlace a CinePOV que incluye. Para usos a gran escala o integraciones a medida, escríbenos.",
    contact: "¿Dudas o propuestas? Escríbenos desde «Sugerencias», en el pie de la página.",
    methodology: "Cómo se calculan los datos",
  },
  en: {
    title: "Widget for blogs and media · CinePOV",
    description:
      "Embed on your site how different generations, women and men rate a movie, from verified votes. Free, no sign-up.",
    badge: "For websites",
    heading: "The CinePOV widget for your blog or outlet",
    intro:
      "Show next to your review or story how different generations, and women and men, rate a movie, from verified CinePOV votes. It's free and needs no sign-up.",
    howTitle: "How to add it",
    steps: [
      "Open the movie's page on CinePOV.",
      "Press “Embed”, next to the share buttons.",
      "Copy the code and paste it into your site, in your editor's HTML mode (WordPress, Ghost, Blogger…).",
    ],
    codeTitle: "The code",
    codeNote:
      "The number in the address is the movie's TMDB id: the same one in the URL of its CinePOV page (for example, /movie/27205-origen).",
    exampleTitle: "What it looks like",
    showsTitle: "What it shows",
    shows: [
      "The movie's average score from the votes that count (accounts with a verified email).",
      "Women vs. men and young (18-34) vs. older (55+) viewers, once each group has enough votes.",
      `A group only appears with at least ${SEGMENT_MIN_VOTES} votes, so no one's vote can be inferred. Until then, the widget shows how many votes the movie has.`,
      "It updates on every load.",
    ],
    privacyTitle: "Privacy",
    privacy:
      "The widget sets no cookies, loads no analytics and collects nothing about your visitors. It is GDPR-friendly without any change to your cookie notice.",
    termsTitle: "Terms",
    terms:
      "You can use it freely on sites with or without ads. Please don't hide or crop the link to CinePOV it includes. For large-scale use or custom integrations, get in touch.",
    contact: "Questions or ideas? Write to us from “Feedback”, in the page footer.",
    methodology: "How the data is calculated",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = TEXT[await getRequestLocale()];
  return { title: t.title, description: t.description };
}

export default async function WidgetPage() {
  const t = TEXT[await getRequestLocale()];
  const embedUrl = `${SITE_URL}/embed/movie/${EXAMPLE_TMDB_ID}`;
  const code = `<iframe src="${embedUrl}" width="100%" height="320" style="border:none;border-radius:16px;overflow:hidden;" title="CinePOV - ${EXAMPLE_TITLE}"></iframe>`;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          {t.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{t.heading}</h1>
        <p className="text-muted-foreground leading-relaxed">{t.intro}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-white">{t.howTitle}</h2>
        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
          {t.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-white">{t.codeTitle}</h2>
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
          <code>{code}</code>
        </pre>
        <p className="text-sm text-muted-foreground">{t.codeNote}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-white">{t.exampleTitle}</h2>
        <iframe
          src={`/embed/movie/${EXAMPLE_TMDB_ID}`}
          width="100%"
          height={320}
          loading="lazy"
          title={`CinePOV - ${EXAMPLE_TITLE}`}
          className="rounded-2xl border-0"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-white">{t.showsTitle}</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          {t.shows.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <Link href="/metodologia" className="inline-block text-sm font-bold text-primary-light hover:underline">
          {t.methodology} →
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-white">{t.privacyTitle}</h2>
        <p className="text-muted-foreground leading-relaxed">{t.privacy}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-white">{t.termsTitle}</h2>
        <p className="text-muted-foreground leading-relaxed">{t.terms}</p>
        <p className="text-sm text-muted-foreground">{t.contact}</p>
      </section>
    </div>
  );
}
