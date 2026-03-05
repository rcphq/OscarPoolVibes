"use server";

import { auth } from "@/lib/auth/auth";
import { getMemberRole } from "@/lib/db/pool-members";
import { createInvite, revokeInvite } from "@/lib/db/invites";
import { getPool } from "@/lib/db/pools";

export async function sendInviteAction(poolId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to send invites." };
  }

  // Check admin permission
  const role = await getMemberRole(poolId, session.user.id);
  if (role !== "ADMIN") {
    return { error: "Only pool admins can send invites." };
  }

  // Validate pool exists
  const pool = await getPool(poolId);
  if (!pool) {
    return { error: "Pool not found." };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const invite = await createInvite({
      poolId,
      email: email.toLowerCase().trim(),
      invitedById: session.user.id,
    });
    return { success: true, inviteId: invite.id };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to send invite." };
  }
}

export async function revokeInviteAction(poolId: string, inviteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to revoke invites." };
  }

  // Check admin permission
  const role = await getMemberRole(poolId, session.user.id);
  if (role !== "ADMIN") {
    return { error: "Only pool admins can revoke invites." };
  }

  try {
    await revokeInvite(inviteId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to revoke invite." };
  }
}
