"use client";

import { errorMessage } from "@/lib/errors";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { birthYearOptions } from "@/lib/age";

export default function WelcomePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.welcome;
  
  const [formData, setFormData] = useState({
    birthYear: "",
    gender: "",
    isAdult: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Si ya tiene los datos demográficos completos, mandarlo a la raíz
    if (status === "authenticated" && session?.user && session.user.birthYear && session.user.gender) {
      router.push("/");
    }
  }, [status, session, router]);

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
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: parseInt(formData.birthYear, 10),
          gender: formData.gender,
          isAdult: formData.isAdult,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorSave);
      }

      setSuccess(true);
      
      // Actualizar la sesión en el cliente (NextAuth jwt callback volverá a ejecutarse)
      await update();
      
      // Redirigir a la valoración rápida
      setTimeout(() => {
        router.push("/onboarding");
        router.refresh();
      }, 1500);

    } catch (err) {
      setError(errorMessage(err) || t.errorNetwork);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground text-sm">{t.loadingProfile}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Cabecera de bienvenida */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white text-gradient">
            {t.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.subtitle.replace("{name}", session?.user?.name || t.userFallback)}
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm text-center font-medium">
            {t.successMsg}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed text-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <strong className="text-white">{t.whyTitle}</strong> {t.whyDesc}
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Año de nacimiento */}
              <div>
                <label htmlFor="birthYear" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t.birthYearLabel}
                </label>
                <select
                  id="birthYear"
                  name="birthYear"
                  required
                  value={formData.birthYear}
                  onChange={handleChange}
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>{t.selectPlaceholder}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Género */}
              <div>
                <label htmlFor="gender" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t.genderLabel}
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>{t.selectPlaceholder}</option>
                  <option value="male">{t.genderMale}</option>
                  <option value="female">{t.genderFemale}</option>
                  <option value="non_binary">{t.genderNonBinary}</option>
                </select>
              </div>
            </div>
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
            <span>{t.adultDeclaration}</span>
          </label>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-lg hover:shadow-primary/25 disabled:opacity-50 interactive-transition cursor-pointer"
          >
            {loading ? t.savingBtn : t.submitBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
