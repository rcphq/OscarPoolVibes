"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getPoolByInviteCode } from "@/lib/db/pools";
import { addMember } from "@/lib/db/pool-members";
import { acceptInvite, getInviteByToken } from "@/lib/db/invites";
import { trackServerEvent } from "@/lib/analytics/posthog-server";

export async function joinOpenPool(code: string) {
  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/pools/join?code=${encodeURIComponent(code)}`);
    redirect(`/auth/signin?callbackUrl=${callbackUrl}`);
  }

  const pool = await getPoolByInviteCode(code);
  if (!pool) {
    return { error: "Invalid invite code or pool not found." };
  }

  if (pool.accessType !== "OPEN") {
    return { error: "This pool requires a personal invitation to join." };
  }

  try {
    await addMember(pool.id, session.user.id);
    trackServerEvent(session.user.id, "pool_joined", { poolId: pool.id, method: "code" });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to join pool." };
  }

  redirect(`/pools/${pool.id}`);
}

export async function joinViaInvite(token: string) {
  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/pools/join?token=${encodeURIComponent(token)}`);
    redirect(`/auth/signin?callbackUrl=${callbackUrl}`);
  }

  const invite = await getInviteByToken(token);
  if (!invite) {
    return { error: "This invite is invalid or has expired." };
  }

  // Verify email matches the invite
  if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      error: "This invite was sent to a different email address. Please sign in with the correct account.",
    };
  }

  try {
    await acceptInvite(token, session.user.id);
    trackServerEvent(session.user.id, "pool_joined", { poolId: invite.poolId, method: "invite" });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to accept invite." };
  }

  redirect(`/pools/${invite.poolId}`);
}
