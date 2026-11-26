import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ImportClient from "@/components/ImportClient";
import { localizePath } from "@/lib/i18n/paths";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "Importar Valoraciones — CinePOV",
  description: "Sincroniza tu historial de cine importando tu archivo de valoraciones de Letterboxd.",
};

export default async function ImportPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(localizePath("/login", await getRequestLocale()));
  }

  return (
    <div className="flex-1 flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <ImportClient />
    </div>
  );
}
