"use client";

import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se ha podido procesar la solicitud.");
      }

      setSubmitted(true);
    } catch (err) {
      toast.error(errorMessage(err) || "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Cabecera */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-gradient">
            Recuperar acceso
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviaremos un enlace para crear una contraseña nueva
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm text-center leading-relaxed">
              Si esa dirección está registrada, te hemos enviado un enlace para restablecer
              la contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
              El enlace caduca en una hora y solo puede utilizarse una vez.
            </p>
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 border border-white/10 rounded-xl text-sm font-semibold text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-white interactive-transition"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 interactive-transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-lg hover:shadow-primary/25 disabled:opacity-50 interactive-transition cursor-pointer"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}

        {/* Link al Login */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          ¿Ya recuerdas tu contraseña?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline hover:text-violet-400">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
