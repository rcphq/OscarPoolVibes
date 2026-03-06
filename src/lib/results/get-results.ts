import { prisma } from "@/lib/db/client";
import type { CategoryResultView } from "@/types/results";

/**
 * Get all results for a ceremony year.
 * Returns every category with its winner (if set) and who set it.
 */
export async function getResultsByCeremony(
  ceremonyYearId: string
): Promise<CategoryResultView[]> {
  const categories = await prisma.category.findMany({
    where: { ceremonyYearId },
    orderBy: { displayOrder: "asc" },
    include: {
      results: {
        include: {
          winner: { select: { name: true } },
          setBy: { select: { name: true } },
        },
      },
    },
  });

  return categories.map((category) => {
    const result = category.results[0] ?? null;
    return {
      categoryId: category.id,
      categoryName: category.name,
      winnerId: result?.winnerId ?? null,
      winnerName: result?.winner.name ?? null,
      setByName: result?.setBy.name ?? null,
      version: result?.version ?? 0,
      updatedAt: result?.updatedAt.toISOString() ?? null,
    };
  });
}

/**
 * Get the result for a single category.
 * Includes full conflict-resolution detail (version, who set it, when).
 */
export async function getResultByCategory(
  categoryId: string
): Promise<CategoryResultView | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      results: {
        include: {
          winner: { select: { name: true } },
          setBy: { select: { name: true } },
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  const result = category.results[0] ?? null;
  return {
    categoryId: category.id,
    categoryName: category.name,
    winnerId: result?.winnerId ?? null,
    winnerName: result?.winner.name ?? null,
    setByName: result?.setBy.name ?? null,
    version: result?.version ?? 0,
    updatedAt: result?.updatedAt.toISOString() ?? null,
  };
}
