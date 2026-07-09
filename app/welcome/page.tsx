"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    birthYear: "",
    gender: "",
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
    if (status === "authenticated" && session?.user && (session.user as any).birthYear && (session.user as any).gender) {
      router.push("/");
    }
  }, [status, session, router]);

  // Generar años desde 1920 hasta 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 6 - 1920 + 1 },
    (_, i) => currentYear - 6 - i
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al guardar tu perfil.");
      }

      setSuccess(true);
      
      // Actualizar la sesión en el cliente (NextAuth jwt callback volverá a ejecutarse)
      await update();
      
      // Redirigir a la valoración rápida
      setTimeout(() => {
        router.push("/onboarding");
        router.refresh();
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Cabecera de bienvenida */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white text-gradient">
            ¡Te damos la bienvenida!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hola, <strong className="text-white">{session?.user?.name || "Usuario"}</strong>. Un último paso para activar tu cuenta.
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
            ¡Perfil completado! Activando CinePOV...
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed text-center bg-white/5 p-4 rounded-2xl border border-white/5">
              💡 <strong>¿Por qué pedimos esto?</strong> El pilar fundamental de CinePOV es permitir filtrar valoraciones por edad y género. Necesitamos estos datos (que mantendremos 100% privados y anónimos) para compararte con personas de tu mismo perfil cinematográfico.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Año de nacimiento */}
              <div>
                <label htmlFor="birthYear" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Año de nacimiento
                </label>
                <select
                  id="birthYear"
                  name="birthYear"
                  required
                  value={formData.birthYear}
                  onChange={handleChange}
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Género */}
              <div>
                <label htmlFor="gender" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Género
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona</option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                  <option value="non_binary">No binario</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-lg hover:shadow-primary/25 disabled:opacity-50 interactive-transition cursor-pointer"
          >
            {loading ? "Guardando..." : "Comenzar en CinePOV"}
          </button>
        </form>
      </div>
    </div>
  );
}
