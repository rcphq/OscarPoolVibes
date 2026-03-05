import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Lock, Eye, Pencil } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import {
  getPoolMemberByUserAndPool,
  getPredictionsByMember,
} from "@/lib/db/predictions";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { PicksSummaryCard } from "@/components/pools/PicksSummaryCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pool = await getPool(id);

  if (!pool) {
    return { title: "Pool Not Found | OscarPoolVibes" };
  }

  return {
    title: `My Picks - ${pool.name} | OscarPoolVibes`,
    description: `Your Oscar predictions for ${pool.name}`,
  };
}

export default async function MyPicksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const pool = await getPool(id);

  if (!pool) {
    notFound();
  }

  // Verify pool membership
  const poolMember = await getPoolMemberByUserAndPool(session.user.id, id);

  if (!poolMember || poolMember.leftAt !== null) {
    redirect("/pools");
  }

  // Fetch all categories for this ceremony with nominees
  const categories = await prisma.category.findMany({
    where: { ceremonyYearId: pool.ceremonyYearId },
    select: {
      id: true,
      name: true,
      displayOrder: true,
      pointValue: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  // Fetch current user's predictions
  const predictions = await getPredictionsByMember(poolMember.id);

  // Build a map of categoryId -> prediction for quick lookup
  const predictionMap = new Map(
    predictions.map((p) => [p.categoryId, p])
  );

  const totalCategories = categories.length;
  const pickedCount = predictions.length;
  const progressPercent =
    totalCategories > 0
      ? Math.round((pickedCount / totalCategories) * 100)
      : 0;

  const predictionsLocked = pool.ceremonyYear.predictionsLocked;

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/pools/${id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-100/70 hover:text-gold-100"
          >
            <ArrowLeft className="size-4" />
            Back to Pool
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
                My Picks
              </h1>
              <p className="mt-2 text-gold-100/70">{pool.name}</p>
            </div>

            {!predictionsLocked && (
              <Button asChild>
                <Link href={`/pools/${id}/predict`}>
                  <Pencil className="size-4" />
                  Edit Picks
                </Link>
              </Button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gold-100/70">
                {pickedCount}/{totalCategories} categories picked
              </span>
              {predictionsLocked && (
                <span className="inline-flex items-center gap-1.5 text-gold-100/60">
                  <Lock className="size-3.5" />
                  Predictions locked
                </span>
              )}
              {!predictionsLocked && pickedCount === totalCategories && (
                <span className="inline-flex items-center gap-1.5 text-gold-400">
                  <Eye className="size-3.5" />
                  All picks made
                </span>
              )}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold-400 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Picks List */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-3xl gap-4">
          {categories.map((category) => {
            const prediction = predictionMap.get(category.id);

            return (
              <PicksSummaryCard
                key={category.id}
                categoryName={category.name}
                firstChoice={prediction?.firstChoice.name ?? null}
                runnerUp={prediction?.runnerUp.name ?? null}
                pointValue={category.pointValue}
              />
            );
          })}

          {categories.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No categories have been added for this ceremony yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
