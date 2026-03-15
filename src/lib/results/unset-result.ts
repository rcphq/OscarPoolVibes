import { prisma } from "@/lib/db/client";
import type { UnsetResultRequest, UnsetResultResponse } from "@/types/results";
import { checkResultsPermission } from "./permissions";

/**
 * Remove the winner for a category (undo a result entered in error).
 *
 * Flow:
 * 1. Verify the user has permission (ADMIN or RESULTS_MANAGER in any pool for the ceremony)
 * 2. Verify a result exists and the expectedVersion matches (optimistic concurrency)
 * 3. Delete the CategoryResult row
 * 4. Clear Category.winnerId and Nominee.isWinner
 */
export async function unsetResult(
  userId: string,
  request: UnsetResultRequest
): Promise<UnsetResultResponse> {
  const { categoryId, expectedVersion } = request;

  // 1. Load category with ceremony info
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      ceremonyYear: { select: { id: true } },
    },
  });

  if (!category) {
    return {
      success: false,
      error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" },
    };
  }

  // 2. Check permission
  const permission = await checkResultsPermission(userId, category.ceremonyYear.id);
  if (!permission.canSetResults) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message:
          "You do not have permission to manage results. Only pool creators and designated results managers can clear winners.",
      },
    };
  }

  // 3. Use a transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.categoryResult.findUnique({
      where: { categoryId },
      include: {
        winner: { select: { name: true } },
        setBy: { select: { name: true, email: true } },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: {
          code: "CATEGORY_NOT_FOUND" as const,
          message: "No result exists for this category.",
        },
      };
    }

    // Version check for conflict prevention
    if (expectedVersion !== existing.version) {
      return {
        success: false,
        error: {
          code: "CONFLICT" as const,
          message: `This result was updated by ${existing.setBy.name ?? existing.setBy.email} since you last loaded the page. Please refresh and try again.`,
          currentResult: {
            winnerId: existing.winnerId,
            winnerName: existing.winner.name,
            setByName: existing.setBy.name ?? "Unknown",
            setByEmail: existing.setBy.email,
            version: existing.version,
            updatedAt: existing.updatedAt.toISOString(),
          },
        },
      };
    }

    // Clear the denormalized fields first
    await tx.nominee.updateMany({
      where: { categoryId, isWinner: true },
      data: { isWinner: false },
    });

    await tx.category.update({
      where: { id: categoryId },
      data: { winnerId: null },
    });

    // Delete the CategoryResult row
    await tx.categoryResult.delete({
      where: { categoryId },
    });

    return { success: true as const };
  });
}
