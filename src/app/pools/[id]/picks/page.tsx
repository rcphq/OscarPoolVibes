import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Lock, EyeOff } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import { getMemberRole } from "@/lib/db/pool-members";
import { getPredictionsByPool } from "@/lib/db/predictions";
import { prisma } from "@/lib/db/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

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
    title: `All Picks - ${pool.name} | OscarPoolVibes`,
    description: `View all members' predictions for ${pool.name}`,
  };
}

export default async function AllPicksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user!.id;

  const pool = await getPool(id);

  if (!pool) {
    notFound();
  }

  // Verify pool membership
  const memberRole = await getMemberRole(pool.id, userId);

  if (!memberRole) {
    redirect("/pools");
  }

  // Fetch predictions with server-side visibility enforcement
  // getPredictionsByPool only returns other members' data when locked
  const { predictions, predictionsLocked, members } =
    await getPredictionsByPool(pool.id, userId);

  // Fetch all categories for the ceremony
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

  // Build a lookup: categoryId -> poolMemberId -> prediction
  const predictionGrid = new Map<
    string,
    Map<
      string,
      {
        firstChoice: { name: string; subtitle: string | null };
        runnerUp: { name: string; subtitle: string | null };
      }
    >
  >();

  for (const pred of predictions) {
    if (!predictionGrid.has(pred.categoryId)) {
      predictionGrid.set(pred.categoryId, new Map());
    }
    predictionGrid.get(pred.categoryId)!.set(pred.poolMember.id, {
      firstChoice: pred.firstChoice,
      runnerUp: pred.runnerUp,
    });
  }

  // Determine visible members: all members if locked, only current user if not
  const visibleMembers = predictionsLocked
    ? members
    : members.filter((m) => m.userId === userId);

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/pools/${id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-100/70 hover:text-gold-100"
          >
            <ArrowLeft className="size-4" />
            Back to Pool
          </Link>

          <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
            All Picks
          </h1>
          <p className="mt-2 text-gold-100/70">{pool.name}</p>

          {predictionsLocked ? (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-sm font-medium text-gold-400">
              <Lock className="size-3.5" />
              Predictions locked — all picks visible
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm text-gold-100/60">
              <EyeOff className="size-3.5" />
              Other members&apos; picks will be visible once predictions are
              locked
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {categories.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No categories have been added for this ceremony yet.
            </p>
          ) : visibleMembers.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No members found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/90 px-4 py-3 text-left text-sm font-semibold backdrop-blur">
                      Category
                    </th>
                    {visibleMembers.map((member) => {
                      const isCurrentUser =
                        member.userId === userId;
                      return (
                        <th
                          key={member.id}
                          className={`px-4 py-3 text-center text-sm font-semibold ${
                            isCurrentUser
                              ? "bg-gold-500/10 text-gold-300"
                              : ""
                          }`}
                        >
                          {member.user.name ?? "Anonymous"}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs font-normal text-gold-400">
                              (you)
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, idx) => (
                    <tr
                      key={category.id}
                      className={
                        idx % 2 === 0
                          ? "bg-background"
                          : "bg-muted/20"
                      }
                    >
                      <td className="sticky left-0 z-10 border-r bg-inherit px-4 py-3 backdrop-blur">
                        <div className="text-sm font-medium">
                          {category.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {category.pointValue} pts
                        </div>
                      </td>
                      {visibleMembers.map((member) => {
                        const pick = predictionGrid
                          .get(category.id)
                          ?.get(member.id);
                        const isCurrentUser =
                          member.userId === userId;

                        return (
                          <td
                            key={member.id}
                            className={`px-4 py-3 text-center ${
                              isCurrentUser ? "bg-gold-500/5" : ""
                            }`}
                          >
                            {pick ? (
                              <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-gold-300">
                                  {pick.firstChoice.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {pick.runnerUp.name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted-foreground/50">
                                --
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
