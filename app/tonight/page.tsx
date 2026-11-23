import type { Metadata } from "next";
import { db } from "@/lib/db";
import TonightClient from "./TonightClient";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);

  return {
    title: `${dict.tonight.title} — ${dict.tonight.badge} | CinePOV`,
    description: dict.tonight.subtitle,
    openGraph: {
      title: `${dict.tonight.title} — ${dict.tonight.badge} | CinePOV`,
      description: dict.tonight.subtitle,
      type: "website",
    },
  };
}

export default async function TonightPage() {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);

  const genres = await db.genre.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* 1. Cabecera */}
      <div className="space-y-3 text-center sm:text-left border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-light text-[10px] font-black uppercase tracking-wider">
          {dict.tonight.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {dict.tonight.title}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {dict.tonight.subtitle}
        </p>
      </div>

      {/* 2. Cliente interactivo */}
      <TonightClient genres={genres} />
    </div>
  );
}
