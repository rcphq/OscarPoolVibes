import { prisma } from "@/lib/db/client";
import type { SetResultRequest, SetResultResponse } from "@/types/results";
import { checkResultsPermission } from "./permissions";

/**
 * Set the winner for a category with optimistic concurrency control.
 *
 * Flow:
 * 1. Verify the user has permission (ADMIN or RESULTS_MANAGER in any pool for the ceremony)
 * 2. Verify the nominee belongs to the category
 * 3. If no result exists: create it
 * 4. If result exists: update only if expectedVersion matches (conflict prevention)
 * 5. Sync the winner to Category.winnerId and Nominee.isWinner
 *
 * If two users try to set different winners simultaneously, the second one
 * gets a CONFLICT error with details about who set it and what they set.
 */
export async function setResult(
  userId: string,
  request: SetResultRequest
): Promise<SetResultResponse> {
  const { categoryId, winnerId, expectedVersion } = request;

  // 1. Load category with ceremony info
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      ceremonyYear: { select: { id: true } },
      nominees: { select: { id: true, name: true } },
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
        message: "You do not have permission to set results. Only pool creators and designated results managers can set winners.",
      },
    };
  }

  // 3. Verify nominee belongs to this category
  const nominee = category.nominees.find((n) => n.id === winnerId);
  if (!nominee) {
    return {
      success: false,
      error: {
        code: "INVALID_NOMINEE",
        message: "The selected nominee does not belong to this category",
      },
    };
  }

  // 4. Use a transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.categoryResult.findUnique({
      where: { categoryId },
      include: {
        winner: { select: { name: true } },
        setBy: { select: { name: true, email: true } },
      },
    });

    if (!existing) {
      // First time setting — expectedVersion should be null
      if (expectedVersion !== null) {
        return {
          success: false,
          error: {
            code: "CONFLICT" as const,
            message: "Expected an existing result but none was found. It may have been cleared.",
            currentResult: {
              winnerId: "",
              winnerName: "",
              setByName: "",
              setByEmail: "",
              version: 0,
              updatedAt: new Date(),
            },
          },
        };
      }

      const result = await tx.categoryResult.create({
        data: {
          categoryId,
          winnerId,
          setById: userId,
          version: 1,
        },
      });

      // Sync to Category and Nominee
      await syncWinner(tx, categoryId, winnerId);

      return { success: true as const, version: result.version };
    }

    // Existing result — check version for conflict
    if (expectedVersion !== existing.version) {
      return {
        success: false,
        error: {
          code: "CONFLICT" as const,
          message: `This result was already updated by ${existing.setBy.name ?? existing.setBy.email}. Please review their selection before overriding.`,
          currentResult: {
            winnerId: existing.winnerId,
            winnerName: existing.winner.name,
            setByName: existing.setBy.name ?? "Unknown",
            setByEmail: existing.setBy.email,
            version: existing.version,
            updatedAt: existing.updatedAt,
          },
        },
      };
    }

    // Version matches — safe to update
    const result = await tx.categoryResult.update({
      where: {
        categoryId,
        version: expectedVersion, // Double-check in WHERE for race condition safety
      },
      data: {
        winnerId,
        setById: userId,
        version: { increment: 1 },
      },
    });

    // Sync to Category and Nominee
    await syncWinner(tx, categoryId, winnerId);

    return { success: true as const, version: result.version };
  });
}

/**
 * Sync the winner to Category.winnerId and Nominee.isWinner fields.
 * This keeps the denormalized fields in sync with the CategoryResult source of truth.
 */
async function syncWinner(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  categoryId: string,
  winnerId: string
): Promise<void> {
  // Clear previous winner flag for this category's nominees
  await tx.nominee.updateMany({
    where: { categoryId, isWinner: true },
    data: { isWinner: false },
  });

  // Set new winner
  await tx.nominee.update({
    where: { id: winnerId },
    data: { isWinner: true },
  });

  // Update category's winnerId
  await tx.category.update({
    where: { id: categoryId },
    data: { winnerId },
  });
}
