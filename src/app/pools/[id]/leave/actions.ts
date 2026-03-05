"use server";

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { removeMember } from "@/lib/db/pool-members";

export async function leavePool(poolId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  try {
    await removeMember(poolId, session.user.id);
  } catch {
    return { error: "Failed to leave pool" };
  }

  redirect("/pools");
}
