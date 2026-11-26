"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/errors";

/**
 * Aviso para quien aún no ha verificado su email. Sin verificar, sus
 * valoraciones no cuentan en las notas públicas (barrera contra el review
 * bombing), y sin este aviso no tendría forma de saberlo.
 */
export default function VerifyEmailBanner() {
  const { data: session, status } = useSession();
  const { dict } = useI18n();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (status !== "authenticated" || session.user.emailVerified !== false) return null;

  const resend = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      setSent(true);
      toast.success(dict.auth.verifyBannerSent);
    } catch (err) {
      toast.error(errorMessage(err) || dict.common.error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="status" className="border-b border-amber-500/20 bg-amber-500/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center gap-3 text-xs">
        <span className="text-amber-100/90">{dict.auth.verifyBannerText}</span>
        <button
          type="button"
          onClick={resend}
          disabled={sending || sent}
          className="px-3 py-1 rounded-full border border-amber-400/40 text-amber-200 font-bold hover:bg-amber-400/10 disabled:opacity-50 cursor-pointer"
        >
          {sent ? "✓" : dict.auth.verifyBannerCta}
        </button>
      </div>
    </div>
  );
}
