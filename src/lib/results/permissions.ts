import { prisma } from "@/lib/db/client";
import type { ResultsPermission } from "@/types/results";

/**
 * Check if a user has permission to set results for a given ceremony.
 *
 * Permission is granted if the user is:
 * 1. A pool ADMIN (creator) of any active pool membership for that ceremony, OR
 * 2. A RESULTS_MANAGER in any active pool membership for that ceremony
 *
 * Results are global per ceremony, so having the permission in *any* pool
 * for the ceremony is sufficient.
 */
export async function checkResultsPermission(
  userId: string,
  ceremonyYearId: string
): Promise<ResultsPermission> {
  const membership = await prisma.poolMember.findFirst({
    where: {
      userId,
      leftAt: null,
      pool: {
        ceremonyYearId,
      },
      role: {
        in: ["ADMIN", "RESULTS_MANAGER"],
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return { canSetResults: false, reason: "no_permission" };
  }

  return {
    canSetResults: true,
    reason: membership.role === "ADMIN" ? "pool_creator" : "results_manager",
  };
}

/**
 * Grant RESULTS_MANAGER role to a pool member.
 * Only active pool ADMINs can grant this.
 */
export async function grantResultsPermission(
  granterId: string,
  poolId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const granterMembership = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: { poolId, userId: granterId },
    },
    select: { role: true, leftAt: true },
  });

  if (
    !granterMembership ||
    granterMembership.leftAt !== null ||
    granterMembership.role !== "ADMIN"
  ) {
    return { success: false, error: "Only pool admins can grant results permission" };
  }

  const targetMembership = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: { poolId, userId: targetUserId },
    },
    select: { role: true, leftAt: true },
  });

  if (!targetMembership || targetMembership.leftAt !== null) {
    return { success: false, error: "User is not a member of this pool" };
  }

  if (targetMembership.role === "ADMIN") {
    return { success: false, error: "Pool admins already have results permission" };
  }

  await prisma.poolMember.update({
    where: {
      poolId_userId: { poolId, userId: targetUserId },
    },
    data: { role: "RESULTS_MANAGER" },
  });

  return { success: true };
}

/**
 * Revoke RESULTS_MANAGER role from a pool member (set back to MEMBER).
 * Only active pool ADMINs can revoke this.
 */
export async function revokeResultsPermission(
  revokerId: string,
  poolId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const revokerMembership = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: { poolId, userId: revokerId },
    },
    select: { role: true, leftAt: true },
  });

  if (
    !revokerMembership ||
    revokerMembership.leftAt !== null ||
    revokerMembership.role !== "ADMIN"
  ) {
    return { success: false, error: "Only pool admins can revoke results permission" };
  }

  const targetMembership = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: { poolId, userId: targetUserId },
    },
    select: { role: true, leftAt: true },
  });

  if (!targetMembership || targetMembership.leftAt !== null) {
    return { success: false, error: "User is not a member of this pool" };
  }

  if (targetMembership.role !== "RESULTS_MANAGER") {
    return { success: false, error: "User does not have results manager role" };
  }

  await prisma.poolMember.update({
    where: {
      poolId_userId: { poolId, userId: targetUserId },
    },
    data: { role: "MEMBER" },
  });

  return { success: true };
}

