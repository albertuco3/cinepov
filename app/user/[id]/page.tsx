import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildCanonicalMoviePath } from "@/lib/slug";
import UserShareButton from "./UserShareButton";
import FollowButton from "@/components/FollowButton";
import { SOCIAL_ENABLED } from "@/lib/features";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { displayName: true, isAnonymized: true },
  });

  if (!user || user.isAnonymized) {
    return { title: "Perfil no encontrado | CinePOV" };
  }

  return {
    title: `${user.displayName} | Perfil Cinematográfico - CinePOV`,
    description: `Descubre las valoraciones y colecciones de cine de ${user.displayName} en CinePOV.`,
    openGraph: {
      title: `${user.displayName} en CinePOV`,
      description: `Perfil cinéfilo y valoraciones en CinePOV.`,
      type: "profile",
    },
  };
}

export default async function PublicUserProfilePage({ params }: Props) {
  const { id } = await params;

  // Consultar usuario sin extraer campos sensibles (privacidad estricta)
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      createdAt: true,
      isAnonymized: true,
      emailVerified: true,
    },
  });

  if (!user || user.isAnonymized) {
    notFound();
  }

  // Consultar valoraciones públicas
  const ratings = await db.rating.findMany({
    where: { userId: user.id },
    include: {
      movie: {
        select: {
          id: true,
          tmdbId: true,
          title: true,
          year: true,
          posterUrl: true,
          director: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Consultar listas públicas
  const publicLists = await db.customList.findMany({
    where: { userId: user.id, isPublic: true },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalRatings = ratings.length;
  const avgScore =
    totalRatings > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings).toFixed(1)
      : null;

  const memberSince = new Date(user.createdAt).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  const [followerCount, followingCount, isFollowing] = await Promise.all([
    db.follow.count({ where: { followingId: user.id } }),
    db.follow.count({ where: { followerId: user.id } }),
    currentUserId
      ? db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: user.id,
            },
          },
        })
      : null,
  ]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* 1. Cabecera del perfil */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-primary/20">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {user.displayName}
                </h1>
                {user.emailVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-bold">
                    Verificado
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Miembro de la comunidad desde {memberSince} · Siguiendo a {followingCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {SOCIAL_ENABLED && (
              <FollowButton
                targetUserId={user.id}
                initialIsFollowing={Boolean(isFollowing)}
                initialFollowerCount={followerCount}
                currentUserId={currentUserId}
              />
            )}
            <UserShareButton displayName={user.displayName} />
          </div>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-black text-white block tabular-nums">
              {totalRatings}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Películas Calificadas
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-black text-primary block tabular-nums">
              {avgScore || "--"}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Nota Media
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-black text-white block tabular-nums">
              {publicLists.length}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Listas Publicas
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-black text-white block tabular-nums">
              {followingCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Siguiendo
            </span>
          </div>
        </div>
      </div>

      {/* 2. Listas Públicas si tiene */}
      {publicLists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Listas Creadas ({publicLists.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicLists.map((l) => (
              <Link
                key={l.id}
                href={`/list/${l.id}`}
                className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-bold text-primary block mb-1">
                    {l._count.items} {l._count.items === 1 ? "película" : "películas"}
                  </span>
                  <h3 className="text-base font-black text-white truncate">
                    {l.name}
                  </h3>
                  {l.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {l.description}
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold text-primary-light">
                  Explorar lista &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. Cuadrícula de películas valoradas */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Actividad y Valoraciones ({totalRatings})
        </h2>

        {ratings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ratings.map((r) => {
              const canonicalPath = buildCanonicalMoviePath(r.movie.tmdbId, r.movie.title);

              return (
                <div
                  key={r.id}
                  className="glass-panel p-4 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-md">
                      <Image
                        src={r.movie.posterUrl}
                        alt={r.movie.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-primary font-black text-sm">
                        {r.score}/10
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white truncate">
                        <Link href={canonicalPath} className="hover:text-primary transition-colors">
                          {r.movie.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-muted-foreground">{r.movie.year}</p>
                    </div>

                    {SOCIAL_ENABLED && r.reviewText && (
                      <p className="text-xs text-white/80 line-clamp-2 italic pt-1 border-t border-white/5">
                        &quot;{r.reviewText}&quot;
                      </p>
                    )}
                  </div>

                  <Link
                    href={canonicalPath}
                    className="w-full text-center py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-[10px] font-black uppercase tracking-wider transition-all border border-white/5"
                  >
                    Ver Ficha
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-10 rounded-3xl text-center space-y-2 border border-white/5">
            <p className="text-xs text-muted-foreground">
              Este usuario aún no ha calificado películas en la plataforma.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
