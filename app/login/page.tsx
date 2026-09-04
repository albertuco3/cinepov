"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useI18n } from "@/lib/i18n/client";

export default function LoginPage() {
  const router = useRouter();
  const { dict, locale } = useI18n();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      if (res?.error) {
        throw new Error(res.error || (locale === "en" ? "Invalid email or password." : "El email o la contraseña son incorrectos."));
      }

      // Login exitoso, redirigir a la raíz y forzar refresco para Header
      router.push("/");
      router.refresh();

    } catch (err: any) {
      setError(err.message || (locale === "en" ? "Error signing in." : "Error al iniciar sesión."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Error al iniciar sesión con Google:", err);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Cabecera */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-gradient">
            {dict.auth.loginTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {dict.auth.loginSubtitle}
          </p>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {dict.auth.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {dict.auth.passwordLabel}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm"
              />
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-muted-foreground hover:text-primary interactive-transition"
                >
                  {locale === "en" ? "Forgot your password?" : "¿Has olvidado tu contraseña?"}
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-lg hover:shadow-primary/25 disabled:opacity-50 interactive-transition cursor-pointer"
            >
              {loading ? (locale === "en" ? "Signing in..." : "Iniciando sesión...") : dict.auth.submitLogin}
            </button>

            {/* Botón de Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-white/10 rounded-xl text-sm font-semibold text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-white interactive-transition cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18 8.79 18 6 15.21 6 11.76S8.79 5.52 12.24 5.52c1.614 0 3.02.5 4.094 1.483l2.455-2.455C17.323 3.1 14.977 2 12.24 2 6.83 2 2.5 6.33 2.5 11.76s4.33 9.76 9.74 9.76c5.637 0 9.372-3.957 9.372-9.53 0-.643-.075-1.265-.182-1.705H12.24z" />
              </svg>
              {locale === "en" ? "Continue with Google" : "Continuar con Google"}
            </button>
          </div>
        </form>

        {/* Link al Registro */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/register" className="font-semibold text-primary hover:underline hover:text-violet-400">
            {dict.auth.dontHaveAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
