import { prisma } from "@/lib/db/client";

export async function getCategoriesByCeremonyYear(ceremonyYearId: string) {
  return prisma.category.findMany({
    where: { ceremonyYearId },
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
}

export async function getCategoriesWithNominees(ceremonyYearId: string) {
  return prisma.category.findMany({
    where: { ceremonyYearId },
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
      nominees: {
        select: { id: true, name: true, subtitle: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });
}
