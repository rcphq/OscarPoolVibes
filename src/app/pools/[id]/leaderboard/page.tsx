import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Lock, Clock, Trophy } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import { getMemberRole } from "@/lib/db/pool-members";
import { getPredictionsByPool } from "@/lib/db/predictions";
import { prisma } from "@/lib/db/client";
import {
  calculateLeaderboard,
  type LeaderboardInput,
} from "@/lib/scoring/calculate-leaderboard";
import type { ScoringInput } from "@/lib/scoring/calculate-score";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

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
    title: `Leaderboard - ${pool.name} | OscarPoolVibes`,
    description: `Leaderboard for ${pool.name}`,
  };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const pool = await getPool(id);

  if (!pool) {
    notFound();
  }

  // Verify pool membership
  const memberRole = await getMemberRole(pool.id, userId);

  if (!memberRole) {
    redirect("/pools");
  }

  // Fetch categories with nominees and winner info for this ceremony
  const categories = await prisma.category.findMany({
    where: { ceremonyYearId: pool.ceremonyYearId },
    select: {
      id: true,
      name: true,
      displayOrder: true,
      pointValue: true,
      runnerUpMultiplier: true,
      winnerId: true,
      winner: {
        select: { id: true, name: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Fetch all predictions for the pool (visibility handled by getPredictionsByPool)
  const { predictions, predictionsLocked, members } =
    await getPredictionsByPool(pool.id, userId);

  // Check if any winners have been announced
  const hasAnyWinners = categories.some((c) => c.winnerId !== null);

  // If predictions aren't locked yet, show a message
  if (!predictionsLocked) {
    return (
      <main className="min-h-screen">
        <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href={`/pools/${id}`}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-100/70 hover:text-gold-100"
            >
              <ArrowLeft className="size-4" />
              Back to Pool
            </Link>

            <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
              Leaderboard
            </h1>
            <p className="mt-2 text-gold-100/70">{pool.name}</p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <Lock className="mx-auto size-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-heading text-xl font-semibold">
              Predictions Not Yet Locked
            </h2>
            <p className="mt-2 text-muted-foreground">
              The leaderboard will be available once predictions are locked.
              Until then, members can still update their picks.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Build a category lookup map
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Group predictions by pool member
  const predictionsByMember = new Map<
    string,
    {
      userId: string;
      userName: string | null;
      userImage: string | null;
      predictions: ScoringInput[];
    }
  >();

  // Initialize all members (even those without predictions)
  for (const member of members) {
    predictionsByMember.set(member.id, {
      userId: member.userId,
      userName: member.user.name,
      userImage: member.user.image,
      predictions: [],
    });
  }

  // Fill in predictions
  for (const pred of predictions) {
    const cat = categoryMap.get(pred.categoryId);
    if (!cat) continue;

    const memberData = predictionsByMember.get(pred.poolMember.id);
    if (!memberData) continue;

    memberData.predictions.push({
      categoryId: cat.id,
      categoryName: cat.name,
      pointValue: cat.pointValue,
      runnerUpMultiplier: cat.runnerUpMultiplier,
      winnerId: cat.winnerId,
      firstChoiceId: pred.firstChoice.id,
      runnerUpId: pred.runnerUp.id,
    });
  }

  // Build leaderboard inputs
  const leaderboardInputs: LeaderboardInput[] = [];
  for (const [poolMemberId, data] of predictionsByMember) {
    leaderboardInputs.push({
      poolMemberId,
      userId: data.userId,
      userName: data.userName,
      userImage: data.userImage,
      predictions: data.predictions,
    });
  }

  const entries = calculateLeaderboard(leaderboardInputs);

  // Build category info for the table component
  const categoryInfoList = categories.map((c) => ({
    id: c.id,
    name: c.name,
    displayOrder: c.displayOrder,
    pointValue: c.pointValue,
    winnerId: c.winnerId,
    winnerName: c.winner?.name ?? null,
  }));

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href={`/pools/${id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-100/70 hover:text-gold-100"
          >
            <ArrowLeft className="size-4" />
            Back to Pool
          </Link>

          <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
            Leaderboard
          </h1>
          <p className="mt-2 text-gold-100/70">
            {pool.name} &mdash; {pool.ceremonyYear.name}
          </p>

          {!hasAnyWinners && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm text-gold-100/60">
              <Clock className="size-3.5" />
              No winners announced yet &mdash; scores will update live
            </div>
          )}

          {hasAnyWinners && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-sm font-medium text-gold-400">
              <Trophy className="size-3.5" />
              {categories.filter((c) => c.winnerId !== null).length} of{" "}
              {categories.length} categories decided
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {entries.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No predictions have been submitted yet.
            </p>
          ) : (
            <LeaderboardTable
              entries={entries}
              categories={categoryInfoList}
              currentUserId={userId}
            />
          )}
        </div>
      </section>
    </main>
  );
}
