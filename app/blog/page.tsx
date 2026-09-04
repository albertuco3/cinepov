import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog de Datos de Cine y Audiencias | CinePOV",
  description:
    "Estudios, análisis demográficos y tendencias cinematográficas a partir de datos reales de la comunidad de CinePOV.",
  openGraph: {
    title: "Blog de Datos de Cine - CinePOV",
    description: "Análisis y contrastes demográficos de cine basados en datos reales.",
    type: "website",
  },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* 1. Cabecera editorial */}
      <div className="space-y-3 text-center sm:text-left border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          Análisis Editorial
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Blog de Datos de CinePOV
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Investigaciones y contrastes demográficos a partir de las calificaciones verificadas de nuestra comunidad.
        </p>
      </div>

      {/* 2. Listado de artículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BLOG_POSTS.map((post, index) => {
          const dateFormatted = new Date(post.publishedAt).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          return (
            <article
              key={post.slug}
              className={`glass-panel p-6 rounded-3xl border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between space-y-4 ${
                index === 0 ? "md:col-span-2 bg-gradient-to-br from-primary/10 via-[#0f111a] to-transparent" : ""
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-primary-light font-bold text-[10px] uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                  <span>·</span>
                  <span>{dateFormatted}</span>
                </div>

                <h2 className={`${index === 0 ? "text-2xl sm:text-3xl" : "text-xl"} font-black text-white leading-snug`}>
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/70 font-semibold">
                  {post.author}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-xs font-black text-primary hover:underline uppercase tracking-wider"
                >
                  Leer Artículo &rarr;
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
