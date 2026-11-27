"use client";

import { useState } from "react";
import { useJson } from "@/lib/hooks/use-json";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";
import { tmdbImage } from "@/lib/tmdb-image";

interface Genre {
  id: string;
  name: string;
}

interface ConsensusMovie {
  id: string;
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string;
  tmdbRating: number | null;
  genres: string[];
  scoreA: number;
  votesA: number;
  scoreB: number;
  votesB: number;
  consensusScore: number;
}

interface Props {
  genres: Genre[];
}

export default function TonightClient({ genres }: Props) {
  const { dict } = useI18n();
  const t = dict.tonight;

  const [genderA, setGenderA] = useState("female");
  const [ageA, setAgeA] = useState("young");

  const [genderB, setGenderB] = useState("male");
  const [ageB, setAgeB] = useState("young");

  const [genreId, setGenreId] = useState("");
  const params = new URLSearchParams({
    genderA,
    ageA,
    genderB,
    ageB,
    ...(genreId ? { genreId } : {}),
  });
  const { data, loading } = useJson<{ movies: ConsensusMovie[] }>(`/api/movies/consensus?${params.toString()}`);
  const movies = data?.movies ?? [];

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${t.title} - CinePOV`,
          text: t.subtitle,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t.linkCopied);
      }
    } catch {
      // Ignorar cancelaciones
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Panel de selección dual de perfiles */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Persona 1 */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-pink-500/20 text-pink-300 font-black text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {t.person1}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  {t.gender}
                </label>
                <select
                  value={genderA}
                  onChange={(e) => setGenderA(e.target.value)}
                  className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary/50"
                >
                  <option value="female">{t.female}</option>
                  <option value="male">{t.male}</option>
                  <option value="non_binary">{t.nonBinary}</option>
                  <option value="all">{t.anyGender}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  {t.age}
                </label>
                <select
                  value={ageA}
                  onChange={(e) => setAgeA(e.target.value)}
                  className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary/50"
                >
                  <option value="young">{t.youngAge}</option>
                  <option value="adult">{t.adultAge}</option>
                  <option value="senior">{t.seniorAge}</option>
                  <option value="all">{t.anyAge}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Persona 2 */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-300 font-black text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {t.person2}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  {t.gender}
                </label>
                <select
                  value={genderB}
                  onChange={(e) => setGenderB(e.target.value)}
                  className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary/50"
                >
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                  <option value="non_binary">{t.nonBinary}</option>
                  <option value="all">{t.anyGender}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  {t.age}
                </label>
                <select
                  value={ageB}
                  onChange={(e) => setAgeB(e.target.value)}
                  className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary/50"
                >
                  <option value="young">{t.youngAge}</option>
                  <option value="adult">{t.adultAge}</option>
                  <option value="senior">{t.seniorAge}</option>
                  <option value="all">{t.anyAge}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro opcional por género de película */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              {t.filterByGenre}
            </span>
            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="bg-[#0d101a] border border-white/10 rounded-full px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="">{t.allGenres}</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleShare}
            className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer self-start sm:self-auto"
          >
            {t.shareSearch}
          </button>
        </div>
      </div>

      {/* 2. Resultados de consenso */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-40 bg-white/5 rounded-3xl" />
          <div className="h-40 bg-white/5 rounded-3xl" />
        </div>
      ) : movies.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t.recommendedMovies} ({movies.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              {t.sortedByAgreement}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  {/* Poster */}
                  <div className="relative h-28 w-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 shadow-md">
                    <Image
                      src={tmdbImage(movie.posterUrl, "w185")}
                      alt={movie.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                        #{index + 1} · {t.consensusScore} {movie.consensusScore}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white leading-tight truncate">
                      <Link
                        href={`/movie/${movie.tmdbId}`}
                        className="hover:text-primary transition-colors"
                      >
                        {movie.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      {movie.year} {movie.genres.length > 0 && `· ${movie.genres.slice(0, 2).join(", ")}`}
                    </p>

                    {/* Desglose de notas por persona */}
                    <div className="flex items-center gap-3 pt-2 text-xs">
                      <span className="text-pink-400 font-bold">
                        {t.person1}: {movie.scoreA}
                      </span>
                      <span className="text-white/20">|</span>
                      <span className="text-blue-400 font-bold">
                        {t.person2}: {movie.scoreB}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <Link
                    href={`/movie/${movie.tmdbId}`}
                    className="flex-1 text-center py-2 px-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary/10"
                  >
                    {t.viewDetails}
                  </Link>
                  <Link
                    href={`/vs/${movie.tmdbId}`}
                    className="py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-black uppercase tracking-wider border border-white/10 transition-all"
                  >
                    {t.battle}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/5">
          <h3 className="text-lg font-bold text-white">
            {t.noConsensusYet}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t.noConsensusDesc}
          </p>
        </div>
      )}
    </div>
  );
}
