"use client";

import { errorMessage } from "@/lib/errors";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se ha podido actualizar la contraseña.");
      }

      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      router.push("/login");
    } catch (err) {
      setError(errorMessage(err) || "Error de conexión.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <PanelShell>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-gradient">
            Enlace no válido
          </h2>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center leading-relaxed">
          Este enlace de restablecimiento está incompleto. Solicita uno nuevo para continuar.
        </div>
        <Link
          href="/forgot-password"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg hover:shadow-primary/25 interactive-transition"
        >
          Solicitar un enlace nuevo
        </Link>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      {/* Cabecera */}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-gradient">
          Nueva contraseña
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Elige una contraseña nueva para tu cuenta de CinePOV
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
          {/* Contraseña nueva */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Contraseña nueva
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm"
            />
          </div>

          {/* Confirmación */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Repite la contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Vuelve a escribirla"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-lg hover:shadow-primary/25 disabled:opacity-50 interactive-transition cursor-pointer"
        >
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        ¿El enlace ha caducado?{" "}
        <Link
          href="/forgot-password"
          className="font-semibold text-primary hover:underline hover:text-violet-400"
        >
          Solicita otro aquí
        </Link>
      </p>
    </PanelShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <PanelShell>
          <p className="text-center text-sm text-muted-foreground">Cargando el formulario...</p>
        </PanelShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
