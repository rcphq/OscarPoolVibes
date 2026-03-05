import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import {
  getPoolMemberByUserAndPool,
  getPredictionsByMember,
} from "@/lib/db/predictions";
import { PredictionForm } from "@/components/pools/PredictionForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pool = await prisma.pool.findFirst({
    where: { id, archivedAt: null },
    select: { name: true },
  });

  if (!pool) {
    return { title: "Pool Not Found | OscarPoolVibes" };
  }

  return {
    title: `Predictions - ${pool.name} | OscarPoolVibes`,
    description: `Make your Oscar predictions for ${pool.name}`,
  };
}

export default async function PredictPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch pool with ceremony year to check lock status
  const pool = await prisma.pool.findFirst({
    where: { id, archivedAt: null },
    select: {
      id: true,
      name: true,
      ceremonyYearId: true,
      ceremonyYear: {
        select: {
          id: true,
          name: true,
          predictionsLocked: true,
        },
      },
    },
  });

  if (!pool) {
    notFound();
  }

  // Verify membership
  const poolMember = await getPoolMemberByUserAndPool(
    session.user.id,
    pool.id
  );

  if (!poolMember || poolMember.leftAt !== null) {
    redirect("/pools");
  }

  // Fetch all categories with nominees for this ceremony year
  const categories = await prisma.category.findMany({
    where: { ceremonyYearId: pool.ceremonyYearId },
    select: {
      id: true,
      name: true,
      displayOrder: true,
      pointValue: true,
      nominees: {
        select: { id: true, name: true, subtitle: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Fetch existing predictions
  const existingPredictionsRaw = await getPredictionsByMember(poolMember.id);
  const existingPredictions = existingPredictionsRaw.map((p) => ({
    categoryId: p.category.id,
    firstChoiceId: p.firstChoice.id,
    runnerUpId: p.runnerUp.id,
  }));

  const isLocked = pool.ceremonyYear.predictionsLocked;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/pools/${pool.id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-100/70 hover:text-gold-100"
          >
            <ArrowLeft className="size-4" />
            Back to {pool.name}
          </Link>

          <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
            Make Your Predictions
          </h1>
          <p className="mt-2 text-gold-100/70">{pool.ceremonyYear.name}</p>

          {isLocked && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-300">
              <Lock className="size-4 shrink-0" />
              Predictions are locked. You can no longer make changes.
            </div>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <PredictionForm
            categories={categories}
            existingPredictions={existingPredictions}
            poolId={pool.id}
            isLocked={isLocked}
          />
        </div>
      </section>
    </main>
  );
}
