import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, ALL_BLOG_SLUGS } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: "Artículo no encontrado | CinePOV" };
  }

  const baseUrl = SITE_URL;
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} | Blog de Datos CinePOV`,
    description: post.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const dateFormatted = new Date(post.publishedAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const baseUrl = SITE_URL;

  // Schema.org BlogPosting JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "CinePOV",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
  };

  return (
    <article className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Enlace de retorno */}
      <div>
        <Link
          href="/blog"
          className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          &larr; Volver al blog
        </Link>
      </div>

      {/* Cabecera del artículo */}
      <header className="space-y-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary-light font-bold text-[10px] uppercase tracking-wider">
            {post.category}
          </span>
          <span>·</span>
          <span>{post.readTime}</span>
          <span>·</span>
          <span>Publicado el {dateFormatted}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {post.excerpt}
        </p>

        <div className="text-xs text-white/70 font-semibold pt-2">
          Por {post.author}
        </div>
      </header>

      {/* Cuerpo editorial */}
      <div
        className="space-y-4 text-white/90 leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/* Pie del artículo con llamada a la acción */}
      <footer className="pt-10 border-t border-white/5 space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 text-center space-y-4 bg-gradient-to-br from-primary/10 via-[#0f111a] to-transparent">
          <h3 className="text-lg font-black text-white">
            ¿Quieres comprobar cómo valoran tus películas favoritas?
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Explora nuestro comparador de batallas demográficas o descubre qué películas dividen más a la audiencia.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/polarizing"
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
            >
              Ver Películas Polarizantes
            </Link>
            <Link
              href="/explore"
              className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider border border-white/10 transition-all"
            >
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </footer>
    </article>
  );
}
