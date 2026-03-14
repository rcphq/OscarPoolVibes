import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Clock, Trophy } from "lucide-react";
import { getCachedSession } from "@/lib/auth/session";
import { getPool } from "@/lib/db/pools";
import { getMemberRole } from "@/lib/db/pool-members";
import { getPredictionsByPool } from "@/lib/db/predictions";
import { getCategoriesWithNominees } from "@/lib/db/categories";
import {
  calculateLeaderboard,
  type LeaderboardInput,
} from "@/lib/scoring/calculate-leaderboard";
import type { ScoringInput } from "@/lib/scoring/calculate-score";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { PreResultsLeaderboard } from "@/components/leaderboard/PreResultsLeaderboard";
import { WhatIfSimulator } from "@/components/leaderboard/WhatIfSimulator";

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
  const session = await getCachedSession();

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

  const isAdmin = memberRole === "ADMIN";
  // RESULTS_MANAGER can also use the What If? simulator
  const canSimulate = isAdmin || memberRole === "RESULTS_MANAGER";

  const categories = await getCategoriesWithNominees(pool.ceremonyYearId);

  // Fetch all predictions for the pool (visibility handled by getPredictionsByPool)
  const { predictions, predictionsLocked, members } =
    await getPredictionsByPool(pool.id, userId);

  // Build a category lookup map — needed both pre- and post-lock for the simulator
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

  // Fill in predictions. Pre-lock, getPredictionsByPool only returns the
  // current user's own predictions (others' picks are sealed), so other
  // members will appear with 0 points in the simulator — intentional.
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

  // Build leaderboard inputs — used by WhatIfSimulator in both pre- and post-lock views
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

  // Check if any winners have been announced
  const hasAnyWinners = categories.some((c) => c.winnerId !== null);

  // If predictions aren't locked yet, show pre-results view
  if (!predictionsLocked) {
    const currentMember = members.find((m) => m.userId === userId);
    const currentUserPredictionCount = predictions.length;
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
            <p className="mt-2 text-gold-100/70">
              {pool.name} &mdash; {pool.ceremonyYear.name}
            </p>

            {canSimulate && (
              <div className="mt-4 block">
                <WhatIfSimulator
                  categories={categories}
                  leaderboardInputs={leaderboardInputs}
                  currentUserId={userId}
                />
              </div>
            )}
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <PreResultsLeaderboard
            poolName={pool.name}
            ceremonyName={pool.ceremonyYear.name}
            currentUserName={currentMember?.user.name ?? session.user.name ?? null}
            currentUserImage={currentMember?.user.image ?? session.user.image ?? null}
            currentUserPredictionCount={currentUserPredictionCount}
            totalCategories={categories.length}
            memberCount={members.length}
          />
        </section>
      </main>
    );
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

          {canSimulate && (
            <div className="mt-4 block">
              <WhatIfSimulator
                categories={categories}
                leaderboardInputs={leaderboardInputs}
                currentUserId={userId}
              />
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 relative backdrop-blur-xs">
        {/* Subtle glow behind the leaderboard table */}
        <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-gold-500/5 to-transparent blur-3xl" />
        
        <div className="mx-auto max-w-5xl rounded-xl border border-gold-500/20 bg-background/60 shadow-2xl backdrop-blur-md p-1 sm:p-2">
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
