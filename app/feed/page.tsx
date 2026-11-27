import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import Link from "@/components/LocaleLink";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildCanonicalMoviePath } from "@/lib/slug";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/server";
import { SOCIAL_ENABLED } from "@/lib/features";
import { notFound } from "next/navigation";
import { tmdbImage } from "@/lib/tmdb-image";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);

  return {
    title: `${dict.feed.unauthenticatedTitle} | CinePOV`,
    description: dict.feed.subtitle,
  };
}

export default async function FeedPage() {
  if (!SOCIAL_ENABLED) notFound();
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);
  const t = dict.feed;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen py-16 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-4">
          <h1 className="text-3xl font-black text-white">{t.unauthenticatedTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {t.unauthenticatedDesc}
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
          >
            {t.loginCta}
          </Link>
        </div>
      </div>
    );
  }

  // Obtener los usuarios a los que sigue
  const follows = await db.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);

  const ratings = followingIds.length > 0
    ? await db.rating.findMany({
        where: {
          userId: { in: followingIds },
          isArtificial: false,
        },
        include: {
          user: {
            select: { id: true, displayName: true },
          },
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
        take: 40,
      })
    : [];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Cabecera */}
      <div className="border-b border-white/5 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          {t.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      {/* Lista de actividad */}
      {ratings.length > 0 ? (
        <div className="space-y-4">
          {ratings.map((r) => {
            const canonicalPath = buildCanonicalMoviePath(r.movie.tmdbId, r.movie.title);
            const dateStr = new Date(r.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={r.id}
                className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-20 w-14 rounded-2xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 shadow-md">
                    <Image
                      src={tmdbImage(r.movie.posterUrl, "w154")}
                      alt={r.movie.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <Link
                        href={`/user/${r.user.id}`}
                        className="text-white font-bold hover:text-primary transition-colors"
                      >
                        {r.user.displayName}
                      </Link>{" "}
                      {t.ratedAction}
                    </p>
                    <h3 className="text-base font-black text-white truncate">
                      <Link href={canonicalPath} className="hover:text-primary transition-colors">
                        {r.movie.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {r.movie.year} · {t.directorPrefix}{r.movie.director}
                    </p>
                    {r.reviewText && (
                      <p className="text-xs text-white/80 line-clamp-2 italic pt-1">
                        &quot;{r.reviewText}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div className="flex items-baseline gap-1 bg-primary/15 border border-primary/25 px-3 py-1 rounded-xl">
                    <span className="text-lg font-black text-primary">{r.score}</span>
                    <span className="text-[9px] text-muted-foreground">/10</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/5">
          <h3 className="text-lg font-bold text-white">{t.quietFeedTitle}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {followingIds.length === 0
              ? t.noFollowsDesc
              : t.noActivityFromFollows}
          </p>
          <Link
            href="/explore"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/10"
          >
            {t.exploreMovies}
          </Link>
        </div>
      )}
    </div>
  );
}
