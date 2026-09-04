"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

const CONFIRMATION_KEYWORD = "ELIMINAR";

interface AccountDangerZoneProps {
  hasPassword: boolean;
}

export default function AccountDangerZone({ hasPassword }: AccountDangerZoneProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  // El servidor es quien decide si la cuenta tiene contraseña local: si responde
  // que hace falta, se muestra el campo aunque la prop dijera lo contrario.
  const [passwordRequired, setPasswordRequired] = useState(hasPassword);
  const [deleting, setDeleting] = useState(false);

  const canSubmit =
    confirmation === CONFIRMATION_KEYWORD && (!passwordRequired || password.length > 0);

  const resetConfirmation = () => {
    setConfirming(false);
    setConfirmation("");
    setPassword("");
  };

  const handleDeleteAccount = async () => {
    if (!canSubmit) return;

    setDeleting(true);

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation,
          password: passwordRequired ? password : undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        if (resData.requiresPassword) {
          setPasswordRequired(true);
        }
        throw new Error(resData.error || "No se pudo eliminar la cuenta.");
      }

      toast.success(
        `Cuenta eliminada. Se conservan ${resData.preservedRatings} valoraciones de forma anónima.`
      );

      // No se restaura el estado de carga: la sesión se cierra y la vista se abandona.
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("Error al eliminar la cuenta:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar la cuenta.");
      setPassword("");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PORTABILIDAD DE DATOS */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wide border-b border-white/5 pb-3">
          Tus Datos y Privacidad
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-sm font-bold text-white">Descargar mis valoraciones</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Obtén un fichero CSV con todas tus películas calificadas, tus notas y las fechas de
              visionado. Es un formato abierto: puedes abrirlo en Excel o importarlo en cualquier
              otro servicio.
            </p>
          </div>

          <a
            href="/api/user/export"
            download
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-black tracking-wide uppercase border border-white/10 hover:border-white/20 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 interactive-transition cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Descargar CSV
          </a>
        </div>
      </div>

      {/* ZONA PELIGROSA: SUPRESIÓN DE LA CUENTA */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-5">
        <div className="space-y-1 border-b border-red-500/20 pb-3">
          <h2 className="text-lg font-bold text-red-400 tracking-wide">Zona Peligrosa</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Las acciones de esta sección son irreversibles.
          </p>
        </div>

        <div className="space-y-2 max-w-2xl">
          <h3 className="text-sm font-bold text-white">Eliminar mi cuenta</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Se borrarán de forma permanente tus datos personales: tu correo electrónico, tu nombre
            en pantalla, tu contraseña y tus preferencias de comunicación. No podrás volver a
            acceder a esta cuenta ni recuperarla.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Tus valoraciones se conservan de forma anónima y agregada, sin ningún vínculo contigo:
            solo permanecen la nota y el segmento demográfico, que es lo que sostiene las medias
            públicas de la comunidad. Nadie podrá volver a atribuirte esos votos. Puedes consultar
            el detalle en nuestra{" "}
            <Link
              href="/privacidad"
              className="text-primary-light font-semibold hover:underline"
            >
              política de privacidad
            </Link>
            .
          </p>
        </div>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white interactive-transition cursor-pointer"
          >
            Quiero eliminar mi cuenta
          </button>
        ) : (
          <div className="space-y-4 border-t border-red-500/20 pt-5">
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">
              Confirmación final
            </p>

            <div className="space-y-1.5">
              <label
                htmlFor="deleteConfirmation"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Escribe {CONFIRMATION_KEYWORD} para confirmar
              </label>
              <input
                id="deleteConfirmation"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                placeholder={CONFIRMATION_KEYWORD}
                className="w-full bg-[#0f111a] border border-red-500/20 focus:border-red-500/50 outline-none text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-colors"
              />
            </div>

            {passwordRequired && (
              <div className="space-y-1.5">
                <label
                  htmlFor="deletePassword"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Tu contraseña actual
                </label>
                <input
                  id="deletePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  className="w-full bg-[#0f111a] border border-red-500/20 focus:border-red-500/50 outline-none text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1">
              <button
                type="button"
                onClick={resetConfirmation}
                disabled={deleting}
                className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase border border-white/10 hover:border-white/20 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 interactive-transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || !canSubmit}
                className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase bg-red-500/90 hover:bg-red-500 text-white disabled:bg-red-500/30 disabled:text-white/60 disabled:cursor-not-allowed interactive-transition cursor-pointer shadow-lg shadow-red-500/10"
              >
                {deleting ? "Eliminando cuenta..." : "Eliminar mi cuenta definitivamente"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
