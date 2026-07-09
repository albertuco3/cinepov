import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Si el usuario está autenticado pero no tiene los datos demográficos completados,
    // y no está intentando ir a /welcome, redirigir a /welcome
    if (token && (!token.birthYear || !token.gender)) {
      if (path !== "/welcome") {
        return NextResponse.redirect(new URL("/welcome", req.url));
      }
    }

    // Si ya tiene perfil completo e intenta entrar a /welcome:
    // - Si no ha completado el onboarding, mandarlo a /onboarding
    // - Si ya completó el onboarding, mandarlo a la raíz
    if (token && token.birthYear && token.gender && path === "/welcome") {
      if (!token.onboardingCompleted) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Si tiene perfil demográfico completo pero no ha hecho el onboarding de valoración rápida,
    // y no está en /onboarding, redirigirlo obligatoriamente a /onboarding
    if (token && token.birthYear && token.gender && !token.onboardingCompleted) {
      if (path !== "/onboarding" && path !== "/welcome") {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }

    // Si ya completó el onboarding e intenta acceder de nuevo a /onboarding, mandarlo a la raíz
    if (token && token.onboardingCompleted && path === "/onboarding") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // La raíz "/" y la exploración "/explore" son accesibles para invitados (no logueados)
        if (path === "/" || path === "/explore") {
          return true;
        }
        // Las rutas protegidas (/profile, /import, /welcome, /onboarding) requieren estar autenticado
        return !!token;
      },
    },
  }
);

export const config = {
  // El middleware ahora intercepta también "/" y "/explore" para poder redirigir al onboarding
  // a usuarios autenticados que no lo hayan completado, manteniendo acceso libre para invitados
  matcher: ["/", "/explore", "/profile", "/import", "/welcome", "/onboarding"],
};
