"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import SearchBar from "@/components/SearchBar";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function Header() {
  const { data: session, status } = useSession();
  const prevRatingsCount = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (session?.user) {
      const count = session.user.ratingsCount || 0;
      if (prevRatingsCount.current !== undefined && prevRatingsCount.current !== count) {
        const oldCount = prevRatingsCount.current;
        
        // Comprobar si se alcanzó un hito de gamificación
        if (oldCount < 10 && count >= 10) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          toast.success("🏆 ¡Hito alcanzado! Has desbloqueado la insignia 'Cinéfilo Iniciado' (10 películas valoradas)");
        } else if (oldCount < 50 && count >= 50) {
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
          toast.success("🏆 ¡Hito alcanzado! Has desbloqueado la insignia 'Crítico de CinePOV' (50 películas valoradas)");
        } else if (oldCount < 100 && count >= 100) {
          confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 } });
          toast.success("🏆 ¡Hito alcanzado! Has desbloqueado la insignia 'Maestro de la Perspectiva' (100 películas valoradas)");
        }
      }
      prevRatingsCount.current = count;
    }
  }, [session]);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 bg-background/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <span className="text-2xl font-black tracking-wider accent-gradient group-hover:scale-105 interactive-transition">
                CinePOV
              </span>
            </Link>
            
            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/explore"
                className="text-sm font-medium text-muted-foreground hover:text-foreground interactive-transition"
              >
                Explorar
              </Link>
              <Link
                href="/rankings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground interactive-transition"
              >
                Rankings
              </Link>
              {status === "authenticated" && (
                <>
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground interactive-transition"
                  >
                    Mi Perfil
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Buscador Central (Solo en desktop/tablet) */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar />
          </div>

          {/* Acciones de Autenticación Dinámicas */}
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:scale-105 interactive-transition cursor-pointer text-[11px] font-black text-primary-light"
                  title="Tus películas valoradas en CinePOV"
                >
                  <span>🍿</span>
                  <span>{session.user?.ratingsCount || 0}</span>
                </Link>
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  Hola,{" "}
                  <Link href="/profile" className="text-white font-bold hover:text-primary transition-colors cursor-pointer">
                    {session.user?.name}
                  </Link>
                </span>
                
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/5 border border-white/10 hover:border-red-500/20 interactive-transition cursor-pointer"
                >
                  Salir
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 border border-white/10 interactive-transition"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-primary hover:bg-primary-hover px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:shadow-primary/25 interactive-transition"
                >
                  Regístrate
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
