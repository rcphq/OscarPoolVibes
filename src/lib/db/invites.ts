import { nanoid } from "nanoid";
import type { PoolMemberRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

async function addMemberInTransaction(
  tx: Prisma.TransactionClient,
  poolId: string,
  userId: string,
  role: PoolMemberRole = "MEMBER"
) {
  const existing = await tx.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId } },
  });

  if (existing && existing.leftAt === null) {
    throw new Error("User is already an active member of this pool");
  }

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

  if (existing) {
    return tx.poolMember.update({
      where: { id: existing.id },
      data: { leftAt: null, role },
    });
  }

  return tx.poolMember.create({
    data: { poolId, userId, role },
  });
}

export async function createInvite(data: {
  poolId: string;
  email: string;
  invitedById: string;
}) {
  // Verify pool exists and is INVITE_ONLY
  const pool = await prisma.pool.findUnique({
    where: { id: data.poolId, archivedAt: null },
    select: { accessType: true },
  });

  if (!pool) {
    throw new Error("Pool not found");
  }

  if (pool.accessType !== "INVITE_ONLY") {
    throw new Error("Invites are only available for invite-only pools");
  }

  // Check if invite already exists for this email+pool
  const existing = await prisma.poolInvite.findUnique({
    where: { poolId_email: { poolId: data.poolId, email: data.email } },
  });

  if (existing && existing.status === "PENDING") {
    throw new Error("An invite has already been sent to this email for this pool");
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // If a previous invite exists (ACCEPTED/DECLINED/EXPIRED), upsert it
  return prisma.poolInvite.upsert({
    where: { poolId_email: { poolId: data.poolId, email: data.email } },
    update: {
      token,
      status: "PENDING",
      expiresAt,
      invitedById: data.invitedById,
    },
    create: {
      poolId: data.poolId,
      email: data.email,
      invitedById: data.invitedById,
      token,
      expiresAt,
    },
  });
}

export async function getInviteByToken(token: string) {
  const invite = await prisma.poolInvite.findUnique({
    where: { token },
    include: {
      pool: {
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
      },
    },
  });

  if (!invite) {
    return null;
  }

  // Check expiration
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    // Mark as expired if still pending
    if (invite.status === "PENDING") {
      await prisma.poolInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
    }
    return null;
  }

  return invite;
}

export async function acceptInvite(token: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.poolInvite.findUnique({
      where: { token },
      include: { pool: true },
    });

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "PENDING") {
      throw new Error(`Invite has already been ${invite.status.toLowerCase()}`);
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await tx.poolInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("Invite has expired");
    }

    await addMemberInTransaction(tx, invite.poolId, userId);

    return tx.poolInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
      include: { pool: true },
    });
  });
}

export async function declineInvite(token: string) {
  const invite = await prisma.poolInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw new Error("Invite not found");
  }

  if (invite.status !== "PENDING") {
    throw new Error(`Invite has already been ${invite.status.toLowerCase()}`);
  }

  return prisma.poolInvite.update({
    where: { token },
    data: { status: "DECLINED" },
  });
}

export async function revokeInvite(inviteId: string, poolId: string) {
  const result = await prisma.poolInvite.updateMany({
    where: { id: inviteId, poolId },
    data: { status: "EXPIRED" },
  });

  if (result.count === 0) {
    throw new Error("Invite not found");
  }

  return result;
}

export async function getPoolInvites(poolId: string) {
  return prisma.poolInvite.findMany({
    where: { poolId },
    include: {
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvitesByEmail(email: string) {
  return prisma.poolInvite.findMany({
    where: {
      email,
      status: "PENDING",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      pool: {
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
      },
      invitedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
