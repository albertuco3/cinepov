import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import Link from "@/components/LocaleLink";
import { authOptions } from "@/lib/auth";
import { calculateUserWrapped } from "@/lib/wrapped";
import WrappedClient from "./WrappedClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu Año en Cine | CinePOV Wrapped",
  description: "Descubre tu resumen anual cinematográfico y tu contraste con tu segmento demográfico en CinePOV.",
};

export default async function WrappedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen py-16 px-4 max-w-lg mx-auto text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full inline-block">
            CinePOV Wrapped
          </span>
          <h1 className="text-3xl font-black text-white">Tu Año en Cine</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Inicia sesión para descubrir tus estadísticas cinematográficas anuales, tu mes más cinéfilo y cómo se compara tu criterio con tu generación.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/25"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  const stats = await calculateUserWrapped(session.user.id);

  if (!stats || stats.totalMovies < 2) {
    return (
      <div className="min-h-screen py-16 px-4 max-w-lg mx-auto text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-primary-light bg-primary/20 border border-primary/30 px-3 py-1 rounded-full inline-block">
            CinePOV Wrapped
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Generando tu Balance Anual
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Aún no has registrado suficientes valoraciones para elaborar un resumen anual fiable. Valora al menos dos películas para desbloquear tu experiencia de Tu Año en Cine.
          </p>
          <Link
            href="/explore"
            className="inline-block px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
          >
            Valorar Películas en el Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex flex-col justify-center">
      <WrappedClient stats={stats} userName={session.user.name || "Cinéfilo"} />
    </div>
  );
}
