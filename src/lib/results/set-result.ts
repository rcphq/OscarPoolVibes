import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { SetResultRequest, SetResultResponse } from "@/types/results";
import { checkResultsPermission } from "./permissions";

/**
 * Set the winner(s) for a category with optimistic concurrency control.
 *
 * Flow:
 * 1. Verify the user has permission (ADMIN or RESULTS_MANAGER in any pool for the ceremony)
 * 2. Verify the primary nominee belongs to the category
 * 3. If tiedWinnerId is provided: verify it also belongs to the category and
 *    differs from winnerId
 * 4. If no result exists: create it
 * 5. If result exists: update only if expectedVersion matches (conflict prevention)
 * 6. Sync winner(s) to Category.winnerId / Category.tiedWinnerId and Nominee.isWinner
 *
 * Ties: when tiedWinnerId is provided both nominees are marked isWinner=true.
 * When updating a tied result to a non-tied result, the old tiedWinnerId is
 * cleared and its nominee's isWinner flag is reset.
 *
 * If two users try to set different winners simultaneously, the second one
 * gets a CONFLICT error with details about who set it and what they set.
 */
export async function setResult(
  userId: string,
  request: SetResultRequest
): Promise<SetResultResponse> {
  const { categoryId, winnerId, tiedWinnerId = null, expectedVersion } = request;

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
        message:
          "You do not have permission to set results. Only pool creators and designated results managers can set winners.",
      },
    };
  }

  // 3. Verify primary nominee belongs to this category
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

  // 4. Validate tied nominee (when provided)
  if (tiedWinnerId !== null) {
    if (tiedWinnerId === winnerId) {
      return {
        success: false,
        error: {
          code: "INVALID_TIED_NOMINEE",
          message: "The tied winner must be a different nominee from the primary winner",
        },
      };
    }
    const tiedNominee = category.nominees.find((n) => n.id === tiedWinnerId);
    if (!tiedNominee) {
      return {
        success: false,
        error: {
          code: "INVALID_TIED_NOMINEE",
          message: "The selected tied nominee does not belong to this category",
        },
      };
    }
  }

  // 5. Use a transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.categoryResult.findUnique({
      where: { categoryId },
      include: {
        winner: { select: { name: true } },
        tiedWinner: { select: { name: true } },
        setBy: { select: { name: true, email: true } },
      },
    });

    if (!existing) {
      // First time setting - expectedVersion should be null
      if (expectedVersion !== null) {
        return {
          success: false,
          error: {
            code: "CONFLICT" as const,
            message: "Expected an existing result but none was found. It may have been cleared.",
            currentResult: {
              winnerId: "",
              winnerName: "",
              tiedWinnerId: null,
              tiedWinnerName: null,
              setByName: "",
              setByEmail: "",
              version: 0,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }

      const result = await tx.categoryResult.create({
        data: {
          categoryId,
          winnerId,
          tiedWinnerId: tiedWinnerId ?? null,
          setById: userId,
          version: 1,
        },
      });

      // Sync denormalized winner fields on Category and Nominee
      await syncWinners(tx, categoryId, winnerId, tiedWinnerId);

      return { success: true as const, version: result.version };
    }

    // Existing result - check version for conflict
    if (expectedVersion !== existing.version) {
      return {
        success: false,
        error: {
          code: "CONFLICT" as const,
          message: `This result was already updated by ${existing.setBy.name ?? existing.setBy.email}. Please review their selection before overriding.`,
          currentResult: {
            winnerId: existing.winnerId,
            winnerName: existing.winner.name,
            tiedWinnerId: existing.tiedWinnerId,
            tiedWinnerName: existing.tiedWinner?.name ?? null,
            setByName: existing.setBy.name ?? "Unknown",
            setByEmail: existing.setBy.email,
            version: existing.version,
            updatedAt: existing.updatedAt.toISOString(),
          },
        },
      };
    }

    // Version matches - safe to update
    try {
      const result = await tx.categoryResult.update({
        where: {
          categoryId,
          version: expectedVersion, // Double-check in WHERE for race condition safety
        },
        data: {
          winnerId,
          tiedWinnerId: tiedWinnerId ?? null,
          setById: userId,
          version: { increment: 1 },
        },
      });

      // Sync denormalized winner fields on Category and Nominee
      await syncWinners(tx, categoryId, winnerId, tiedWinnerId);

      return { success: true as const, version: result.version };
    } catch (error) {
      // Another writer may have updated between the read and update.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        const current = await tx.categoryResult.findUnique({
          where: { categoryId },
          include: {
            winner: { select: { name: true } },
            tiedWinner: { select: { name: true } },
            setBy: { select: { name: true, email: true } },
          },
        });

        if (current) {
          return {
            success: false,
            error: {
              code: "CONFLICT" as const,
              message: `This result was already updated by ${current.setBy.name ?? current.setBy.email}. Please review their selection before overriding.`,
              currentResult: {
                winnerId: current.winnerId,
                winnerName: current.winner.name,
                tiedWinnerId: current.tiedWinnerId,
                tiedWinnerName: current.tiedWinner?.name ?? null,
                setByName: current.setBy.name ?? "Unknown",
                setByEmail: current.setBy.email,
                version: current.version,
                updatedAt: current.updatedAt.toISOString(),
              },
            },
          };
        }

        return {
          success: false,
          error: {
            code: "CONFLICT" as const,
            message: "This result changed while you were updating. Please refresh and try again.",
            currentResult: {
              winnerId: "",
              winnerName: "",
              tiedWinnerId: null,
              tiedWinnerName: null,
              setByName: "",
              setByEmail: "",
              version: 0,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }

      throw error;
    }
  });
}

/**
 * Sync winner(s) to the denormalized Category and Nominee fields.
 *
 * For a normal (non-tied) result:
 *   - Clears all isWinner flags for the category's nominees
 *   - Sets isWinner=true on the single winner
 *   - Sets Category.winnerId, clears Category.tiedWinnerId
 *
 * For a tied result:
 *   - Clears all isWinner flags for the category's nominees
 *   - Sets isWinner=true on both tied nominees
 *   - Sets both Category.winnerId and Category.tiedWinnerId
 */
async function syncWinners(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  categoryId: string,
  winnerId: string,
  tiedWinnerId: string | null
): Promise<void> {
  // Clear all previous winner flags for this category's nominees
  await tx.nominee.updateMany({
    where: { categoryId, isWinner: true },
    data: { isWinner: false },
  });

  // Set primary winner flag
  await tx.nominee.update({
    where: { id: winnerId },
    data: { isWinner: true },
  });

  // Set tied winner flag (if applicable)
  if (tiedWinnerId !== null) {
    await tx.nominee.update({
      where: { id: tiedWinnerId },
      data: { isWinner: true },
    });
  }

  // Update the denormalized Category fields
  await tx.category.update({
    where: { id: categoryId },
    data: {
      winnerId,
      tiedWinnerId: tiedWinnerId ?? null,
    },
  });
}
