import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { CeremonyManagement } from "./ceremony-management";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Check if user is ADMIN in at least one pool
  const adminMembership = await prisma.poolMember.findFirst({
    where: {
      userId: session.user.id,
      role: "ADMIN",
      leftAt: null,
    },
  });

  if (!adminMembership) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <Settings className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-heading font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You must be an admin of at least one pool to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all ceremony years with counts and full category/nominee data
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

  // Serialize dates to strings for the client component
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
      {/* Navy header bar */}
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
