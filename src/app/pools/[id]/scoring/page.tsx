import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sliders } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import { getMemberRole } from "@/lib/db/pool-members";
import { getCategoriesByCeremonyYear } from "@/lib/db/categories";
import { getDefaultsForCategory } from "@/lib/scoring/defaults";
import { ScoringOverrideTable } from "@/components/pools/ScoringOverrideTable";

export const metadata: Metadata = {
  title: "Scoring Settings | OscarPoolVibes",
  description: "Override point values for each award category in your pool's ceremony.",
};

interface ScoringPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Scoring Settings page — lets ADMIN and RESULTS_MANAGER users customize
 * the point values awarded for each Oscar category.
 *
 * Permission note: access is gated on the user's role in *this specific pool*
 * (not any pool for the ceremony). Changes are still ceremony-wide and affect
 * all pools; this ensures the initiating user has legitimate pool context.
 */
export default async function ScoringPage({ params }: ScoringPageProps) {
  const { id: poolId } = await params;

  // Auth gate
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Role gate: only ADMIN and RESULTS_MANAGER may access
  const role = await getMemberRole(poolId, session.user.id);
  if (role !== "ADMIN" && role !== "RESULTS_MANAGER") {
    redirect(`/pools/${poolId}`);
  }

  // Pool must exist and not be archived
  const pool = await getPool(poolId);
  if (!pool) {
    redirect("/pools");
  }

  // Fetch all categories for this ceremony ordered by displayOrder
  const rawCategories = await getCategoriesByCeremonyYear(pool.ceremonyYearId);

  // Merge each category with its tier default values so the client component
  // can render default annotations and power per-row revert without a second
  // round-trip. The defaults are pure constants — no extra DB query needed.
  const categories = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    displayOrder: cat.displayOrder,
    pointValue: cat.pointValue,
    /** Absolute runner-up points derived from stored multiplier */
    runnerUpPoints: Math.round(cat.pointValue * cat.runnerUpMultiplier),
    defaults: getDefaultsForCategory(cat.name),
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-1">
          <Sliders className="size-6 text-primary" />
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Scoring Settings
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 ml-9">
          Customize point values for each award category.
        </p>

        {/* Client table — owns all interactive state */}
        <ScoringOverrideTable
          poolId={poolId}
          ceremonyYearName={pool.ceremonyYear.name}
          categories={categories}
        />
      </div>
    </div>
  );
}
