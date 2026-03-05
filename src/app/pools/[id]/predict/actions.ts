"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import {
  getPoolMemberByUserAndPool,
  upsertPrediction,
} from "@/lib/db/predictions";
import { savePredictionsSchema } from "@/types/predictions";
import type { SavePredictionsInput } from "@/types/predictions";
import { trackServerEvent } from "@/lib/analytics/posthog-server";

export async function savePredictions(
  input: SavePredictionsInput
): Promise<{ success: true } | { error: string }> {
  // 1. Validate auth
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to save predictions" };
  }

  const userId = session.user.id;

  // 2. Validate input schema
  const parsed = savePredictionsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { poolId, predictions } = parsed.data;

  // 3. Validate user is an active pool member
  const poolMember = await getPoolMemberByUserAndPool(userId, poolId);
  if (!poolMember || poolMember.leftAt !== null) {
    return { error: "You are not an active member of this pool" };
  }

  // 4. Check predictions are not locked
  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: poolId },
    select: {
      ceremonyYear: {
        select: { predictionsLocked: true },
      },
    },
  });

  if (pool.ceremonyYear.predictionsLocked) {
    return { error: "Predictions are locked for this ceremony" };
  }

  // 5. Validate each nominee belongs to its category and firstChoice !== runnerUp
  const categoryIds = predictions.map((p) => p.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: {
      id: true,
      nominees: {
        select: { id: true },
      },
    },
  });

  const categoryNomineesMap = new Map(
    categories.map((c) => [c.id, new Set(c.nominees.map((n) => n.id))])
  );

  for (const prediction of predictions) {
    const nomineeIds = categoryNomineesMap.get(prediction.categoryId);
    if (!nomineeIds) {
      return { error: `Category ${prediction.categoryId} not found` };
    }

    if (!nomineeIds.has(prediction.firstChoiceId)) {
      return {
        error: `First choice nominee does not belong to the specified category`,
      };
    }

    if (!nomineeIds.has(prediction.runnerUpId)) {
      return {
        error: `Runner-up nominee does not belong to the specified category`,
      };
    }

    if (prediction.firstChoiceId === prediction.runnerUpId) {
      return { error: "First choice and runner-up must be different" };
    }
  }

  // 6. Upsert all predictions
  await Promise.all(
    predictions.map((p) =>
      upsertPrediction(
        poolMember.id,
        p.categoryId,
        p.firstChoiceId,
        p.runnerUpId
      )
    )
  );

  // 7. Track and revalidate
  trackServerEvent(userId, "predictions_saved", { poolId, categoryCount: predictions.length });
  revalidatePath(`/pools/${poolId}/predict`);

  return { success: true };
}
