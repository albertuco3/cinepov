"use client";

import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import Link from "@/components/LocaleLink";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { useI18n, useLocalePath } from "@/lib/i18n/client";
import { birthYearOptions } from "@/lib/age";

export default function RegisterPage() {
  const router = useRouter();
  const lp = useLocalePath();
  const { dict, locale } = useI18n();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    birthYear: "",
    gender: "",
    isAdult: false,
    website: "", // Campo trampa (honeypot) contra bots
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const years = birthYearOptions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextValue = e.target instanceof HTMLInputElement && e.target.type === "checkbox" ? e.target.checked : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          birthYear: parseInt(formData.birthYear, 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        track("signup_failed", {
          reason: response.status === 429
            ? "rate_limited"
            : data.error?.includes("registrado")
              ? "email_already_registered"
              : "server_error",
        });
        throw new Error(data.error || (locale === "en" ? "Error registering user." : "Ocurrió un error al registrar el usuario."));
      }

      track("signup_completed", { method: "credentials" });
      setSuccess(true);
      
      // Redirigir al login tras 2 segundos
      toast.success(locale === "en" ? "Account created successfully!" : "¡Cuenta creada con éxito!");
      setTimeout(() => {
        router.push(lp("/login"));
      }, 2000);

    } catch (err) {
      setError(errorMessage(err) || (locale === "en" ? "Error creating account." : "Error al crear la cuenta."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = () => {
    toast.info(locale === "en" ? "Google registration not configured." : "Registro con Google no configurado.");
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Cabecera */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-gradient">
            {dict.auth.registerTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {dict.auth.registerSubtitle}
          </p>
        </div>

        {/* Mensajes de feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm text-center font-medium">
            {locale === "en" ? "Registration successful! Redirecting to sign in..." : "¡Registro completado con éxito! Redirigiendo al login..."}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nombre público */}
            <div>
              <label htmlFor="displayName" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {dict.auth.nameLabel}
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Ej. cinefilo_99"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm"
              />
            </div>

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
                placeholder={locale === "en" ? "Minimum 6 characters" : "Mínimo 6 caracteres"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm"
              />
            </div>

            {/* Fila doble: Año y Género */}
            <div className="grid grid-cols-2 gap-4">
              {/* Año de nacimiento */}
              <div>
                <label htmlFor="birthYear" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {dict.auth.birthYearLabel}
                </label>
                <select
                  id="birthYear"
                  name="birthYear"
                  required
                  value={formData.birthYear}
                  onChange={handleChange}
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>{locale === "en" ? "Select" : "Selecciona"}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Género */}
              <div>
                <label htmlFor="gender" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {dict.auth.genderLabel}
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>{locale === "en" ? "Select" : "Selecciona"}</option>
                  <option value="male">{dict.demographics.men}</option>
                  <option value="female">{dict.demographics.women}</option>
                  <option value="non_binary">{dict.demographics.nonBinary}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Campo invisible trampa (honeypot) para bots */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="website">Sitio web personal</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          {/* Declaración de mayoría de edad: el año de nacimiento por sí solo no la garantiza */}
          <label className="flex items-start gap-3 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              name="isAdult"
              required
              checked={formData.isAdult}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-white/10 bg-transparent accent-primary cursor-pointer"
            />
            <span>{dict.auth.adultDeclaration}</span>
          </label>

          {/* Nota de privacidad demográfica */}
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            <strong>{locale === "en" ? "Transparency:" : "Transparencia:"}</strong>{" "}
            {locale === "en"
              ? "Your birth year and gender will never be public. They are used in a 100% anonymized way exclusively to feed demographic movie filter charts."
              : "Tu año de nacimiento y tu género nunca serán públicos. Se usan de forma 100% anonimizada exclusivamente para nutrir los gráficos de los filtros demográficos de las películas."}
          </p>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-lg hover:shadow-primary/25 disabled:opacity-50 interactive-transition cursor-pointer"
            >
              {loading ? (locale === "en" ? "Creating account..." : "Registrando...") : dict.auth.submitRegister}
            </button>

            {/* Botón de Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleMock}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-white/10 rounded-xl text-sm font-semibold text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-white interactive-transition cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18 8.79 18 6 15.21 6 11.76S8.79 5.52 12.24 5.52c1.614 0 3.02.5 4.094 1.483l2.455-2.455C17.323 3.1 14.977 2 12.24 2 6.83 2 2.5 6.33 2.5 11.76s4.33 9.76 9.74 9.76c5.637 0 9.372-3.957 9.372-9.53 0-.643-.075-1.265-.182-1.705H12.24z" />
              </svg>
              {locale === "en" ? "Sign up with Google" : "Registrarse con Google"}
            </button>
          </div>
        </form>

        {/* Link al Login */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline hover:text-violet-400">
            {dict.auth.alreadyHaveAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
