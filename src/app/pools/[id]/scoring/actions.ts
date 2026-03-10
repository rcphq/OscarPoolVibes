"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { getMemberRole } from "@/lib/db/pool-members";
import { getDefaultsForCategory } from "@/lib/scoring/defaults";
import { trackServerEvent } from "@/lib/analytics/posthog-server";

// ─── Zod validation schema ────────────────────────────────────────────────────

/**
 * A single category scoring override from the client.
 * runnerUpPoints is UI-layer; we compute runnerUpMultiplier = runnerUpPoints / pointValue
 * before writing to the DB so the canonical float is stored, not the integer.
 */
const categoryUpdateSchema = z
  .object({
    categoryId: z.string().cuid("Invalid category ID"),
    pointValue: z
      .number()
      .int("Must be a whole number")
      .min(1, "Must be at least 1 point")
      .max(500, "Cannot exceed 500 points"),
    runnerUpPoints: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .max(500, "Cannot exceed 500 points"),
  })
  .refine((data) => data.runnerUpPoints <= data.pointValue, {
    message: "Runner-up points cannot exceed 1st place points",
    path: ["runnerUpPoints"],
  });

/** Maximum number of category updates accepted in a single call */
const updatesSchema = z.array(categoryUpdateSchema).min(1).max(50);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScoringActionResult = { success: true } | { error: string };

// ─── Permission helper ────────────────────────────────────────────────────────

/**
 * Verify the calling user has ADMIN or RESULTS_MANAGER role in the given pool,
 * and return their userId plus the pool's ceremonyYearId.
 *
 * Importantly, this checks role in the *specific* pool `poolId`, not in any
 * pool for the ceremony. This prevents an admin from a small side-pool from
 * silently modifying scoring expectations in a large main pool.
 */
async function requireScoringPermission(
  poolId: string
): Promise<{ userId: string; ceremonyYearId: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const role = await getMemberRole(poolId, session.user.id);
  if (role !== "ADMIN" && role !== "RESULTS_MANAGER") {
    throw new Error("Only admins and results managers can override scoring");
  }

  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { ceremonyYearId: true },
  });
  if (!pool) {
    throw new Error("Pool not found");
  }

  return { userId: session.user.id, ceremonyYearId: pool.ceremonyYearId };
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Persist point value overrides for a subset of categories (dirty rows only).
 *
 * Design decisions:
 * - Only sends rows that changed, preventing last-write-wins races when two
 *   admins have the page open simultaneously.
 * - Verifies all categoryIds belong to the pool's ceremony to prevent
 *   cross-ceremony manipulation via forged requests.
 * - Uses an interactive Prisma transaction so any failure rolls back all
 *   updates atomically — the user never sees a partial state.
 * - Computes runnerUpMultiplier = runnerUpPoints / pointValue internally;
 *   clients deal only in human-readable integer point values.
 */
export async function updateCategoryScoring(
  poolId: string,
  updates: Array<{ categoryId: string; pointValue: number; runnerUpPoints: number }>
): Promise<ScoringActionResult> {
  let userId: string;
  let ceremonyYearId: string;

  try {
    ({ userId, ceremonyYearId } = await requireScoringPermission(poolId));
  } catch (e) {
    // Next.js redirect() throws a framework error with a `digest` property —
    // rethrow it so the redirect actually executes instead of swallowing it.
    if (e instanceof Error && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "Permission denied" };
  }

  // Validate structure and value ranges
  const parsed = updatesSchema.safeParse(updates);
  if (!parsed.success) {
    // Zod v4 uses .issues; fall back gracefully if the API ever changes
    const issues = parsed.error.issues ?? [];
    return { error: issues[0]?.message ?? "Invalid input" };
  }

  const validUpdates = parsed.data;

  // Ownership guard: confirm all categoryIds belong to this ceremony
  const categoryIds = validUpdates.map((u) => u.categoryId);
  const ownedCategories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, ceremonyYearId },
    select: { id: true },
  });
  if (ownedCategories.length !== categoryIds.length) {
    return { error: "One or more categories do not belong to this ceremony" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const update of validUpdates) {
        // Convert absolute runner-up integer → fractional multiplier for storage
        const runnerUpMultiplier = update.runnerUpPoints / update.pointValue;

        await tx.category.update({
          where: { id: update.categoryId },
          data: {
            pointValue: update.pointValue,
            runnerUpMultiplier,
            scoringLastChangedBy: userId,
          },
        });
      }
    });
  } catch {
    return { error: "Failed to save scoring changes. No changes were saved." };
  }

  // Analytics is best-effort — a failure here must not roll back successful DB writes
  try {
    trackServerEvent(userId, "scoring_overridden", {
      poolId,
      updatedCount: validUpdates.length,
    });
  } catch {
    // intentionally silent
  }

  // Bust all surfaces that display computed scores — scoring is read-time (ADR-3)
  revalidatePath(`/pools/${poolId}/scoring`);
  revalidatePath(`/pools/${poolId}/leaderboard`);
  revalidatePath(`/pools/${poolId}`);

  return { success: true };
}

/**
 * Reset all category point values for the pool's ceremony back to their
 * canonical tier defaults (defined in src/lib/scoring/defaults.ts).
 *
 * This is a ceremony-wide operation: every pool for this ceremony will see
 * the reverted values immediately (scoring is computed at read time per ADR-3).
 */
export async function revertScoringToDefaults(
  poolId: string
): Promise<ScoringActionResult> {
  let userId: string;
  let ceremonyYearId: string;

  try {
    ({ userId, ceremonyYearId } = await requireScoringPermission(poolId));
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "Permission denied" };
  }

  const categories = await prisma.category.findMany({
    where: { ceremonyYearId },
    select: { id: true, name: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      for (const category of categories) {
        const defaults = getDefaultsForCategory(category.name);
        await tx.category.update({
          where: { id: category.id },
          data: {
            pointValue: defaults.pointValue,
            runnerUpMultiplier: defaults.runnerUpMultiplier,
            scoringLastChangedBy: userId,
          },
        });
      }
    });
  } catch {
    return { error: "Failed to revert scoring. No changes were saved." };
  }

  try {
    trackServerEvent(userId, "scoring_reverted_to_defaults", { poolId });
  } catch {
    // intentionally silent
  }

  revalidatePath(`/pools/${poolId}/scoring`);
  revalidatePath(`/pools/${poolId}/leaderboard`);
  revalidatePath(`/pools/${poolId}`);

  return { success: true };
}
