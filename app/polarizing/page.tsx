import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import PolarizingClient from "./PolarizingClient";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Películas Polarizantes | CinePOV",
  description:
    "El ranking de las películas que más dividen a la audiencia. Descubre qué títulos separan la opinión de jóvenes y mayores, o de mujeres y hombres.",
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: "Películas Polarizantes - CinePOV",
    description:
      "Las películas con mayor discrepancia de calificación entre grupos demográficos.",
    type: "website",
  },
};

export default function PolarizingPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* 1. Cabecera de la sección */}
      <div className="space-y-3 text-center sm:text-left border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          Termómetro Cultural
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Películas Polarizantes
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Estas son las películas donde no existe el consenso: títulos que un segmento demográfico ama mientras otro los califica con dureza. Calculado a partir de votos reales y verificados de la comunidad.
        </p>
      </div>

      {/* 2. Componente interactivo con pestañas y listado */}
      <PolarizingClient />

      {/* 3. Footer explicativo */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 text-center text-xs text-muted-foreground space-y-2">
        <p>
          ¿Cómo se calculan estas brechas? Comparamos las medias reales entre los segmentos desbloqueados de cada película. Solo entran en el calculo los votos de usuarios verificados.
        </p>
        <Link href="/metodologia" className="text-primary-light font-semibold hover:underline">
          Leer metodología completa
        </Link>
      </div>
    </div>
  );
}
