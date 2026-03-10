import { nanoid } from "nanoid";
import { AccessType } from "@prisma/client";
import { prisma } from "@/lib/db/client";

export async function createPool(data: {
  name: string;
  ceremonyYearId: string;
  accessType: AccessType;
  maxMembers?: number;
  userId: string;
}) {
  const inviteCode = nanoid(8);

  return prisma.$transaction(async (tx) => {
    const pool = await tx.pool.create({
      data: {
        name: data.name,
        ceremonyYearId: data.ceremonyYearId,
        accessType: data.accessType,
        maxMembers: data.maxMembers ?? null,
        inviteCode,
        createdById: data.userId,
      },
    });

    await tx.poolMember.create({
      data: {
        poolId: pool.id,
        userId: data.userId,
        role: "ADMIN",
      },
    });

    return pool;
  });
}

export async function getPool(poolId: string) {
  return prisma.pool.findFirst({
    where: {
      id: poolId,
      archivedAt: null,
    },
    include: {
      members: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      ceremonyYear: true,
    },
  });
}

export async function getUserPools(userId: string) {
  return prisma.pool.findMany({
    where: {
      archivedAt: null,
      members: {
        some: {
          userId,
          leftAt: null,
        },
      },
    },
    include: {
      ceremonyYear: true,
      _count: {
        select: {
          members: {
            where: { leftAt: null },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePool(
  poolId: string,
  data: { name?: string; accessType?: AccessType; maxMembers?: number | null }
) {
  if (data.accessType === undefined && data.maxMembers === undefined) {
    return prisma.pool.update({
      where: { id: poolId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
    });
  }

  const existing = await prisma.pool.findUnique({
    where: { id: poolId },
    select: {
      accessType: true,
      _count: {
        select: {
          members: {
            where: { leftAt: null },
          },
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Pool not found");
  }

  if (data.accessType === "INVITE_ONLY" && existing.accessType === "OPEN") {
    throw new Error("Cannot change access type from OPEN to INVITE_ONLY");
  }

  if (data.maxMembers !== undefined && data.maxMembers !== null) {
    if (data.maxMembers < 2) {
      throw new Error("Pool must allow at least 2 members");
    }

    if (data.maxMembers < existing._count.members) {
      throw new Error(
        `Max members cannot be less than the current active membership (${existing._count.members})`
      );
    }
  }

  return prisma.pool.update({
    where: { id: poolId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.accessType !== undefined && { accessType: data.accessType }),
      ...(data.maxMembers !== undefined && { maxMembers: data.maxMembers }),
    },
  });
}

export async function archivePool(poolId: string) {
  return prisma.pool.update({
    where: { id: poolId },
    data: { archivedAt: new Date() },
  });
}

export async function getPoolByInviteCode(inviteCode: string) {
  return prisma.pool.findFirst({
    where: {
      inviteCode,
      archivedAt: null,
    },
    include: {
      ceremonyYear: true,
      _count: {
        select: {
          members: {
            where: { leftAt: null },
          },
        },
      },
    },
  });
}

