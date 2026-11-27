import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/LocaleLink";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth-guards";
import ReportsAdminClient, { type ReportItem } from "./ReportsAdminClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel de Moderación | CinePOV",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  // Solo administradores. A cualquier otra persona se le responde como si la
  // página no existiera.
  if (!(await getAdminUser())) {
    notFound();
  }

  const reportedRatings = await db.rating.findMany({
    where: {
      OR: [
        { reportCount: { gt: 0 } },
        { isModerated: true },
        { reports: { some: {} } },
      ],
    },
    include: {
      user: {
        select: { id: true, displayName: true, email: true },
      },
      movie: {
        select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true },
      },
      reports: {
        include: {
          user: {
            select: { displayName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { reportCount: "desc" },
    take: 50,
  });

  const formattedReports: ReportItem[] = reportedRatings.map((r) => ({
    id: r.id,
    score: r.score,
    reviewText: r.reviewText,
    reportCount: r.reportCount,
    isModerated: r.isModerated,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
    movie: r.movie,
    reasons: r.reports.map((rep) => ({
      id: rep.id,
      reason: rep.reason,
      details: rep.details,
      reportedBy: rep.user.displayName,
      createdAt: rep.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <div className="border-b border-white/5 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-300 text-[10px] font-black uppercase tracking-wider">
          Control de Contenido
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Panel de Moderación de Reseñas
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Revisión de opiniones reportadas por la comunidad y gestión de contenido inapropiado. ·{" "}
          <Link href="/admin/metrics" className="text-primary-light hover:underline">
            Métricas de la beta
          </Link>
        </p>
      </div>

      <ReportsAdminClient initialReports={formattedReports} />
    </div>
  );
}
