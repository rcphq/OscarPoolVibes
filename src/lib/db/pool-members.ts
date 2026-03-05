import { PoolMemberRole } from "@prisma/client";
import { prisma } from "@/lib/db/client";

export async function addMember(
  poolId: string,
  userId: string,
  role: PoolMemberRole = "MEMBER"
) {
  return prisma.$transaction(async (tx) => {
    // Check for existing membership (including soft-deleted)
    const existing = await tx.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });

    if (existing && existing.leftAt === null) {
      throw new Error("User is already an active member of this pool");
    }

    // Enforce max members atomically
    const pool = await tx.pool.findUniqueOrThrow({
      where: { id: poolId },
      select: { maxMembers: true },
    });

    if (pool.maxMembers !== null) {
      const activeCount = await tx.poolMember.count({
        where: { poolId, leftAt: null },
      });

      if (activeCount >= pool.maxMembers) {
        throw new Error("Pool has reached its maximum number of members");
      }
    }

    // Rejoin: clear leftAt if previously left
    if (existing) {
      return tx.poolMember.update({
        where: { id: existing.id },
        data: { leftAt: null, role },
      });
    }

    return tx.poolMember.create({
      data: { poolId, userId, role },
    });
  });
}

export async function removeMember(poolId: string, userId: string) {
  return prisma.poolMember.update({
    where: { poolId_userId: { poolId, userId } },
    data: { leftAt: new Date() },
  });
}

export async function getMembersWithRoles(poolId: string) {
  return prisma.poolMember.findMany({
    where: {
      poolId,
      leftAt: null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export async function updateMemberRole(
  poolId: string,
  userId: string,
  role: PoolMemberRole
) {
  return prisma.poolMember.update({
    where: { poolId_userId: { poolId, userId } },
    data: { role },
  });
}

export async function getMemberRole(
  poolId: string,
  userId: string
): Promise<PoolMemberRole | null> {
  const member = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId } },
    select: { role: true, leftAt: true },
  });

  if (!member || member.leftAt !== null) {
    return null;
  }

  return member.role;
}
