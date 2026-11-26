import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildCanonicalMoviePath } from "@/lib/slug";
import ListShareBar from "./ListShareBar";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const list = await db.customList.findUnique({
    where: { id },
    select: { name: true, description: true, isPublic: true },
  });

  if (!list || !list.isPublic) {
    return { title: "Lista no encontrada | CinePOV" };
  }

  return {
    title: `${list.name} | Lista de Cine - CinePOV`,
    description: list.description || `Colección de películas seleccionada en CinePOV.`,
    openGraph: {
      title: `${list.name} - CinePOV`,
      description: list.description || `Lista temática de cine en CinePOV.`,
      type: "website",
    },
  };
}

export default async function ListDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const list = await db.customList.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, displayName: true },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
          movie: {
            include: {
              genres: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!list) {
    notFound();
  }

  if (!list.isPublic && list.userId !== session?.user?.id) {
    notFound();
  }

  const isOwner = list.userId === session?.user?.id;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* 1. Cabecera de la lista */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
                {list.isPublic ? "Lista Pública" : "Lista Privada"}
              </span>
              <span className="text-xs text-muted-foreground">
                Por <strong className="text-white">{list.user.displayName}</strong>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {list.name}
            </h1>
            {list.description && (
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {list.description}
              </p>
            )}
          </div>

          <div className="text-right self-start sm:self-auto flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
            <span className="text-2xl font-black text-primary">
              {list.items.length}
            </span>
            <span className="text-[11px] uppercase font-bold text-muted-foreground">
              {list.items.length === 1 ? "Película" : "Películas"}
            </span>
          </div>
        </div>

        {/* Barra para compartir */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <ListShareBar listName={list.name} />
          {isOwner && (
            <Link
              href="/profile"
              className="text-xs text-primary-light font-bold hover:underline self-start sm:self-auto"
            >
              Gestionar mis listas en el perfil &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* 2. Cuadrícula de películas */}
      {list.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {list.items.map((item, index) => {
            const movie = item.movie;
            const canonicalPath = buildCanonicalMoviePath(movie.tmdbId, movie.title);

            return (
              <div
                key={item.id}
                className="glass-panel p-4 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white font-black text-xs">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white truncate">
                      <Link
                        href={canonicalPath}
                        className="hover:text-primary transition-colors"
                      >
                        {movie.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {movie.year} · {movie.director}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <Link
                    href={canonicalPath}
                    className="flex-1 text-center py-2 px-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Ficha
                  </Link>
                  <Link
                    href={`/vs/${movie.tmdbId}`}
                    className="py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-black uppercase tracking-wider border border-white/10 transition-all"
                  >
                    Batalla
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/5">
          <p className="text-sm text-muted-foreground">
            Esta lista aun no tiene películas añadidas.
          </p>
          <Link
            href="/explore"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all"
          >
            Explorar Películas
          </Link>
        </div>
      )}
    </div>
  );
}
