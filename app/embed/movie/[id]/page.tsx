import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { getOrCreateMovie } from "@/lib/movies";
import { getMovieDemographics } from "@/lib/movie-demographics";
import { parseMovieParam } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MovieEmbedPage({ params }: Props) {
  const { id } = await params;
  const { tmdbId } = parseMovieParam(id);

  if (!tmdbId) {
    return notFound();
  }

  const movie = await getOrCreateMovie(tmdbId);
  if (!movie) {
    return notFound();
  }

  const payload = await getMovieDemographics(movie.id);

  const realCount = payload.counts.real;
  const realAvg = payload.real.global.avg;

  const femaleAvg = payload.real.byGender.female.avg;
  const maleAvg = payload.real.byGender.male.avg;
  const youngAvg = payload.real.byAgeBroad.young.avg;
  const seniorAvg = payload.real.byAgeBroad.senior.avg;

  return (
    <div className="min-h-[300px] w-full bg-[#0a0c14] text-white p-4 font-sans flex flex-col justify-between border border-white/10 rounded-2xl select-none">
      {/* 1. Cabecera con póster y nota */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-16 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 shadow-md">
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="44px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-black tracking-wider text-primary-light block">
              Termómetro Demográfico
            </span>
            <h1 className="text-sm font-black text-white truncate leading-tight">
              {movie.title}
            </h1>
            <p className="text-[11px] text-muted-foreground">{movie.year}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-0.5 bg-primary/15 border border-primary/25 px-3 py-1.5 rounded-xl flex-shrink-0">
          <span className="text-xl font-black text-primary">
            {realAvg ? realAvg : "--"}
          </span>
          <span className="text-[9px] text-muted-foreground">/10</span>
        </div>
      </div>

      {/* 2. Barras comparativas de contraste */}
      <div className="space-y-2 py-3">
        {/* Género */}
        {femaleAvg !== null && maleAvg !== null ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-pink-400">Mujeres: {femaleAvg}</span>
              <span className="text-blue-400">Hombres: {maleAvg}</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(femaleAvg / (femaleAvg + maleAvg)) * 100}%` }}
                className="bg-pink-500 h-full"
              />
              <div
                style={{ width: `${(maleAvg / (femaleAvg + maleAvg)) * 100}%` }}
                className="bg-blue-500 h-full"
              />
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground text-center py-1">
            Desbloqueo de género en progreso ({realCount} votos)
          </div>
        )}

        {/* Edad */}
        {youngAvg !== null && seniorAvg !== null && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-emerald-400">Jóvenes (18-34): {youngAvg}</span>
              <span className="text-amber-400">Seniors (55+): {seniorAvg}</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(youngAvg / (youngAvg + seniorAvg)) * 100}%` }}
                className="bg-emerald-500 h-full"
              />
              <div
                style={{ width: `${(seniorAvg / (youngAvg + seniorAvg)) * 100}%` }}
                className="bg-amber-500 h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Pie con atribución y enlace */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Datos verificados de CinePOV</span>
        <Link
          href={`/movie/${movie.tmdbId}`}
          target="_blank"
          className="text-primary-light font-bold hover:underline"
        >
          Ver desglose completo &rarr;
        </Link>
      </div>
    </div>
  );
}
