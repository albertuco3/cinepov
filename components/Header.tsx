"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import SearchBar from "@/components/SearchBar";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import NotificationsDropdown from "@/components/NotificationsDropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/client";
import { SOCIAL_ENABLED } from "@/lib/features";

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { dict } = useI18n();
  const prevRatingsCount = useRef<number | undefined>(undefined);

  const navLinks = [
    { href: "/explore", label: dict.nav.explore },
    { href: "/rankings", label: dict.nav.rankings },
    { href: "/tonight", label: dict.nav.coupleMode },
    { href: "/recommendations", label: dict.nav.forYou },
    ...(SOCIAL_ENABLED ? [{ href: "/feed", label: dict.nav.feed }] : []),
    { href: "/wrapped", label: dict.nav.wrapped },
    { href: "/blog", label: dict.nav.blog },
    ...(status === "authenticated" ? [{ href: "/profile", label: dict.nav.profile }] : []),
  ];

  useEffect(() => {
    if (session?.user) {
      const count = session.user.ratingsCount || 0;
      if (prevRatingsCount.current !== undefined && prevRatingsCount.current !== count) {
        const oldCount = prevRatingsCount.current;
        
        // Comprobar si se alcanzó un hito de gamificación
        if (oldCount < 10 && count >= 10) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          toast.success("Hito alcanzado: Has desbloqueado la insignia 'Cinéfilo Iniciado' (10 películas valoradas)");
        } else if (oldCount < 50 && count >= 50) {
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
          toast.success("Hito alcanzado: Has desbloqueado la insignia 'Crítico de CinePOV' (50 películas valoradas)");
        } else if (oldCount < 100 && count >= 100) {
          confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 } });
          toast.success("Hito alcanzado: Has desbloqueado la insignia 'Maestro de la Perspectiva' (100 películas valoradas)");
        }
      }
      prevRatingsCount.current = count;
    }
  }, [session]);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 bg-background/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo y Enlaces Principales */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-black tracking-wider accent-gradient bg-clip-text text-transparent group-hover:opacity-80 interactive-transition">
                CinePOV
              </span>
            </Link>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center gap-5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs transition-colors ${
                      isActive
                        ? "text-white font-black"
                        : "text-muted-foreground hover:text-white font-semibold"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Buscador Central (Solo en desktop/tablet) */}
          <div className="hidden md:block flex-1 max-w-xs">
            <SearchBar />
          </div>

          {/* Acciones de Autenticación y Selector de Idioma */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {status === "authenticated" ? (
              <div className="flex items-center gap-2.5">
                {SOCIAL_ENABLED && <NotificationsDropdown />}
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:scale-105 interactive-transition cursor-pointer text-[11px] font-black text-primary-light"
                  title="Tus películas valoradas en CinePOV"
                >
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{dict.common.votes}:</span>
                  <span>{session.user?.ratingsCount || 0}</span>
                </Link>
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  <Link href="/profile" className="text-white font-bold hover:text-primary transition-colors cursor-pointer">
                    {session.user?.name}
                  </Link>
                </span>
                
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/5 border border-white/10 hover:border-red-500/20 interactive-transition cursor-pointer"
                >
                  {dict.nav.logout}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 border border-white/10 interactive-transition"
                >
                  {dict.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-primary hover:bg-primary-hover px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:shadow-primary/25 interactive-transition"
                >
                  {dict.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
