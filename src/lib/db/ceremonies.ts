import { prisma } from "@/lib/db/client";

/**
 * Returns the active ceremony's display name and scheduled date.
 * Returns null if no ceremony is currently active or if the active
 * ceremony has no date set yet.
 */
export async function getActiveCeremony() {
  return prisma.ceremonyYear.findFirst({
    where: { isActive: true },
    select: { id: true, ceremonyDate: true, name: true },
  });
}
