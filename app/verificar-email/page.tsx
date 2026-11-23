"use client";

import { errorMessage } from "@/lib/errors";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const STATUS_CONTENT = {
  ok: {
    title: "Correo verificado",
    message:
      "Tu dirección de correo ha quedado confirmada. A partir de ahora tus valoraciones cuentan en las estadísticas demográficas de CinePOV.",
    className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  expired: {
    title: "Enlace caducado",
    message:
      "Este enlace de verificación tenía una validez de 24 horas y ya ha caducado. Pide uno nuevo para completar la verificación.",
    className: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  invalid: {
    title: "Enlace no válido",
    message:
      "Este enlace no es válido o ya se ha utilizado. Si tu cuenta ya está verificada, puedes iniciar sesión con normalidad.",
    className: "bg-red-500/10 border-red-500/20 text-red-400",
  },
} as const;

type VerificationStatus = keyof typeof STATUS_CONTENT;

function VerifyEmailResult() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status: VerificationStatus =
    rawStatus === "ok" || rawStatus === "expired" ? rawStatus : "invalid";

  const [resending, setResending] = useState(false);
  const content = STATUS_CONTENT[status];

  const handleResend = async () => {
    setResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se ha podido reenviar el correo.");
      }

      toast.success(data.message);
    } catch (err) {
      toast.error(errorMessage(err) || "Error de conexión.");
    } finally {
      setResending(false);
    }
  };

  return (
    <PanelShell>
      {/* Cabecera */}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-gradient">
          {content.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Verificación de correo en CinePOV</p>
      </div>

      <div
        className={`border p-4 rounded-xl text-sm text-center leading-relaxed ${content.className}`}
      >
        {content.message}
      </div>

      <div className="space-y-4">
        {status === "ok" ? (
          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg hover:shadow-primary/25 interactive-transition"
          >
            Iniciar sesión
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-lg hover:shadow-primary/25 disabled:opacity-50 interactive-transition cursor-pointer"
          >
            {resending ? "Reenviando..." : "Reenviar el correo de verificación"}
          </button>
        )}

        <Link
          href="/"
          className="w-full flex justify-center py-3 px-4 border border-white/10 rounded-xl text-sm font-semibold text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-white interactive-transition"
        >
          Volver al inicio
        </Link>
      </div>

      {status !== "ok" && (
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
          Para reenviar el correo necesitas tener la sesión iniciada. Si no la tienes,{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline hover:text-violet-400">
            inicia sesión
          </Link>{" "}
          y vuelve a esta página.
        </p>
      )}
    </PanelShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <PanelShell>
          <p className="text-center text-sm text-muted-foreground">
            Comprobando la verificación...
          </p>
        </PanelShell>
      }
    >
      <VerifyEmailResult />
    </Suspense>
  );
}
