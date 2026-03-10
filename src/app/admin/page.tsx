import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { isSiteAdmin, isSiteAdminConfigured } from "@/lib/auth/admin";
import { getCachedSession } from "@/lib/auth/session";
import { CeremonyManagement } from "./ceremony-management";

export const metadata: Metadata = {
  title: "Admin | OscarPoolVibes",
  description: "Manage ceremony years, categories, and nominees.",
};

export default async function AdminPage() {
  const session = await getCachedSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (!isSiteAdmin(session.user.email)) {
    const description = isSiteAdminConfigured()
      ? "Your email is not configured for site administration."
      : "No site admin emails are configured yet. Add SITE_ADMIN_EMAILS to enable this area.";

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <Settings className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-heading font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  const ceremonyYears = await prisma.ceremonyYear.findMany({
    orderBy: { year: "desc" },
    include: {
      categories: {
        orderBy: { displayOrder: "asc" },
        include: {
          nominees: {
            orderBy: { name: "asc" },
          },
        },
      },
      _count: {
        select: { categories: true, pools: true },
      },
    },
  });

  const serialized = ceremonyYears.map((cy) => ({
    id: cy.id,
    year: cy.year,
    name: cy.name,
    ceremonyDate: cy.ceremonyDate?.toISOString() ?? null,
    isActive: cy.isActive,
    predictionsLocked: cy.predictionsLocked,
    _count: cy._count,
    categories: cy.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      displayOrder: cat.displayOrder,
      pointValue: cat.pointValue,
      runnerUpMultiplier: cat.runnerUpMultiplier,
      nominees: cat.nominees.map((nom) => ({
        id: nom.id,
        name: nom.name,
        subtitle: nom.subtitle,
      })),
    })),
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="bg-[#0C1445] py-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4">
          <Settings className="size-6 text-[#C9A84C]" />
          <h1 className="text-2xl font-heading font-bold text-white">
            Administration
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <CeremonyManagement ceremonyYears={serialized} />
      </div>
    </div>
  );
}

