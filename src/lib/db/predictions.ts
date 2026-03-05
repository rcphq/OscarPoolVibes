import { prisma } from "@/lib/db/client";

export async function getPoolMemberByUserAndPool(
  userId: string,
  poolId: string
) {
  return prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId } },
    select: { id: true, leftAt: true },
  });
}

export async function upsertPrediction(
  poolMemberId: string,
  categoryId: string,
  firstChoiceId: string,
  runnerUpId: string
) {
  return prisma.prediction.upsert({
    where: {
      poolMemberId_categoryId: { poolMemberId, categoryId },
    },
    create: {
      poolMemberId,
      categoryId,
      firstChoiceId,
      runnerUpId,
    },
    update: {
      firstChoiceId,
      runnerUpId,
    },
  });
}

export async function getPredictionsByMember(poolMemberId: string) {
  return prisma.prediction.findMany({
    where: { poolMemberId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          displayOrder: true,
          pointValue: true,
        },
      },
      firstChoice: {
        select: { id: true, name: true, subtitle: true },
      },
      runnerUp: {
        select: { id: true, name: true, subtitle: true },
      },
    },
    orderBy: { category: { displayOrder: "asc" } },
  });
}

export async function getPredictionsByPool(
  poolId: string,
  requestingUserId: string
) {
  // Get the pool with its ceremony year lock status
  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: poolId },
    select: {
      ceremonyYear: {
        select: { predictionsLocked: true },
      },
    },
  });

  const predictionsLocked = pool.ceremonyYear.predictionsLocked;

  // Get all active pool members
  const members = await prisma.poolMember.findMany({
    where: { poolId, leftAt: null },
    select: {
      id: true,
      userId: true,
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // If predictions are locked, return everyone's predictions.
  // Otherwise, only return the requesting user's own predictions.
  const visibleMemberIds = predictionsLocked
    ? members.map((m) => m.id)
    : members.filter((m) => m.userId === requestingUserId).map((m) => m.id);

  const predictions = await prisma.prediction.findMany({
    where: {
      poolMemberId: { in: visibleMemberIds },
    },
    include: {
      poolMember: {
        select: {
          id: true,
          userId: true,
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          displayOrder: true,
          pointValue: true,
        },
      },
      firstChoice: {
        select: { id: true, name: true, subtitle: true },
      },
      runnerUp: {
        select: { id: true, name: true, subtitle: true },
      },
    },
    orderBy: [
      { poolMember: { user: { name: "asc" } } },
      { category: { displayOrder: "asc" } },
    ],
  });

  return { predictions, predictionsLocked, members };
}
