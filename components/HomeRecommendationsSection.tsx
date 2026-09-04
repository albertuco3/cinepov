"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface RecommendedMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string;
  year: number;
  cohortRating: number;
  affinityScore: number;
  taglineReason: string;
}

interface RecommendationsData {
  cohortName: string;
  recommendations: RecommendedMovie[];
}

export default function HomeRecommendationsSection() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetch("/api/recommendations?limit=4")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && json.recommendations?.length > 0) {
            setData(json);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status !== "authenticated" || !data || data.recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white/[0.01] border-b border-white/5">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Tu Colectivo: {data.cohortName}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Películas que te van a encantar
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Aclamadas por personas de tu generación que todavía no has valorado.
            </p>
          </div>
          <Link
            href="/recommendations"
            className="text-xs font-bold text-primary hover:text-primary-hover transition-colors shrink-0 flex items-center gap-1"
          >
            <span>Ver todas las recomendaciones</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.recommendations.map((movie) => (
            <Link
              key={movie.id}
              href={`/movie/${movie.id}`}
              className="group glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full bg-white/5 overflow-hidden">
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-muted-foreground">
                    Sin póster
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-[#0a0a0f]/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                  {movie.affinityScore}% afín
                </div>
                <div className="absolute bottom-2 right-2 bg-primary text-white px-1.5 py-0.5 rounded text-xs font-black">
                  {movie.cohortRating.toFixed(1)}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                <h3 className="font-bold text-xs text-white line-clamp-1 group-hover:text-primary transition-colors">
                  {movie.title}
                </h3>
                <p className="text-[10px] text-primary/80 line-clamp-1">
                  {movie.taglineReason}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
