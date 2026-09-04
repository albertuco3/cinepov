"use client";

import { useState } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/client";

interface DemoSegment {
  label: Record<string, string>;
  avg: number;
  badge: Record<string, string>;
  comment: Record<string, string>;
  progressColor: string;
}

const DEMO_SEGMENTS: Record<string, DemoSegment> = {
  global: {
    label: { es: "Nota global", en: "Overall score" },
    avg: 8.0,
    badge: { es: "Media general", en: "Overall average" },
    comment: {
      es: "Una sola cifra para todo el mundo. Es lo que ves en cualquier otra plataforma.",
      en: "A single number for everyone. What you see on any other platform.",
    },
    progressColor: "bg-gradient-to-r from-violet-500 to-indigo-500",
  },
  young: {
    label: { es: "Generación 18-34", en: "Ages 18-34" },
    avg: 9.0,
    badge: { es: "Brecha generacional", en: "Generational gap" },
    comment: {
      es: "Un punto entero por encima de la media global.",
      en: "A full point above the overall average.",
    },
    progressColor: "bg-gradient-to-r from-cyan-400 to-blue-500",
  },
  senior: {
    label: { es: "Generación 55+", en: "Ages 55+" },
    avg: 6.1,
    badge: { es: "Brecha generacional", en: "Generational gap" },
    comment: {
      es: "Casi dos puntos por debajo. La misma película, otra experiencia.",
      en: "Nearly two points below. Same movie, completely different experience.",
    },
    progressColor: "bg-gradient-to-r from-amber-400 to-orange-500",
  },
  young_female: {
    label: { es: "Mujeres 25-34", en: "Women 25-34" },
    avg: 8.6,
    badge: { es: "Cruce de segmentos", en: "Cross-demographic" },
    comment: {
      es: "Cruzando edad y género el detalle aumenta: seis décimas sobre la media.",
      en: "Cross-referencing age and gender reveals deeper nuances: 0.6 above average.",
    },
    progressColor: "bg-gradient-to-r from-pink-400 to-violet-500",
  },
};

export default function LandingDemo() {
  const { locale } = useI18n();
  const [selectedKey, setSelectedKey] = useState<string>("global");
  const segment = DEMO_SEGMENTS[selectedKey];
  const lang = locale === "en" ? "en" : "es";

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col lg:flex-row items-center gap-8 max-w-4xl mx-auto">
      {/* Mini Ficha de Película Demo */}
      <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-1/2">
        {/* Póster de Interstellar */}
        <div className="relative h-44 w-32 sm:h-52 sm:w-36 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-lg flex-shrink-0">
          <Image
            src="https://image.tmdb.org/t/p/w500/9cTfZWP5TfdnmAjiD6ZBXWIJ7O9.jpg"
            alt="Interstellar Póster Demo"
            fill
            sizes="(max-w-768px) 144px, 180px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
              {lang === "en" ? "Interactive Simulator" : "Simulador Interactivo"}
            </span>
            <h4 className="text-xl font-bold text-white pt-1.5 leading-tight">Interstellar</h4>
            <p className="text-xs text-muted-foreground">Christopher Nolan • 2014 • 2h 49m</p>
          </div>

          {/* Barra de Progreso Dinámica */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{segment.label[lang]}</span>
              <span className="text-white font-bold">{segment.avg} / 10</span>
            </div>
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full ${segment.progressColor} transition-all duration-500 ease-out`}
                style={{ width: `${(segment.avg / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0f111a] border border-white/5 rounded-xl p-3 text-left">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block tracking-wider">
              {segment.badge[lang]}
            </span>
            <p className="text-xs text-white pt-0.5 leading-normal">{segment.comment[lang]}</p>
          </div>
        </div>
      </div>

      {/* Controles de Selección de Segmentos */}
      <div className="w-full lg:w-1/2 space-y-4">
        <div className="space-y-1 text-center lg:text-left">
          <h4 className="text-base font-bold text-white">
            {lang === "en" ? "Click and break the average score:" : "Haz clic y rompe la nota media:"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {lang === "en"
              ? "Discover how movie ratings vary depending on which demographic cohort reviews them."
              : "Descubre cómo cambia la valoración de una misma película según el perfil demográfico que la mire."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.entries(DEMO_SEGMENTS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all duration-300 text-center cursor-pointer flex flex-col justify-center items-center gap-1 ${selectedKey === key
                ? "bg-primary/10 border-primary text-white shadow-lg shadow-primary/5"
                : "bg-white/5 border-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                }`}
            >
              <span>{item.label[lang]}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md ${selectedKey === key ? "bg-primary/20 text-primary-light" : "bg-white/5 text-muted-foreground"
                }`}>
                {item.avg}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
          {lang === "en"
            ? "These numbers are illustrative examples, not live platform data. In actual movie pages you will only see authentic user reviews with visible vote counts."
            : "Las cifras de este simulador son un ejemplo ilustrativo, no datos de la plataforma. En las fichas reales solo verás valoraciones de personas, siempre con su número de votos a la vista."}
        </p>
      </div>
    </div>
  );
}
