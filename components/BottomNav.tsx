"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/client";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { dict } = useI18n();

  // No mostrar la barra inferior en rutas embebibles o pantalla completa de wrapped
  if (pathname.startsWith("/embed") || pathname === "/wrapped") {
    return null;
  }

  const navItems = [
    {
      name: dict.nav.home,
      href: "/",
      isActive: pathname === "/",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: dict.nav.rankings,
      href: "/rankings",
      isActive: pathname.startsWith("/rankings"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: dict.nav.forYou,
      href: "/recommendations",
      isActive: pathname.startsWith("/recommendations"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      name: dict.nav.polarizing,
      href: "/polarizing",
      isActive: pathname.startsWith("/polarizing"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      name: session ? dict.nav.profile : dict.nav.login,
      href: session ? "/profile" : "/login",
      isActive: pathname.startsWith("/profile") || pathname.startsWith("/login"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl"
    >
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            item.isActive
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <div className={`p-1 rounded-lg ${item.isActive ? "bg-primary/10" : ""}`}>
            {item.icon}
          </div>
          <span className="truncate max-w-[64px] tracking-tight">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}
