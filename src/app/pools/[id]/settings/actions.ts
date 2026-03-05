"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PoolMemberRole } from "@prisma/client";
import { updatePool, archivePool } from "@/lib/db/pools";
import {
  getMemberRole,
  removeMember,
  updateMemberRole,
} from "@/lib/db/pool-members";

const updatePoolSchema = z.object({
  name: z.string().min(1, "Pool name is required").max(100),
  accessType: z.enum(["OPEN", "INVITE_ONLY"]),
  maxMembers: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return null;
      const num = parseInt(val, 10);
      if (isNaN(num)) return null;
      return num;
    })
    .pipe(z.number().int().positive().nullable()),
});

async function requireAdmin(poolId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const role = await getMemberRole(poolId, session.user.id);
  if (role !== "ADMIN") {
    throw new Error("Only admins can perform this action");
  }

  return session.user.id;
}

export async function updatePoolSettings(poolId: string, formData: FormData) {
  await requireAdmin(poolId);

  const raw = {
    name: formData.get("name") as string,
    accessType: formData.get("accessType") as string,
    maxMembers: formData.get("maxMembers") as string,
  };

  const result = updatePoolSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  try {
    await updatePool(poolId, {
      name: result.data.name,
      accessType: result.data.accessType as "OPEN" | "INVITE_ONLY",
      maxMembers: result.data.maxMembers ?? undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update pool";
    return { error: { _form: [message] } };
  }

  revalidatePath(`/pools/${poolId}/settings`);
  return { success: true };
}

export async function archivePoolAction(poolId: string) {
  await requireAdmin(poolId);

  try {
    await archivePool(poolId);
  } catch {
    return { error: "Failed to archive pool" };
  }

  redirect("/pools");
}

export async function removeMemberAction(poolId: string, userId: string) {
  const adminId = await requireAdmin(poolId);

  if (adminId === userId) {
    return { error: "You cannot remove yourself. Use leave pool instead." };
  }

  try {
    await removeMember(poolId, userId);
  } catch {
    return { error: "Failed to remove member" };
  }

  revalidatePath(`/pools/${poolId}/settings`);
  return { success: true };
}

export async function changeMemberRoleAction(
  poolId: string,
  userId: string,
  role: PoolMemberRole
) {
  await requireAdmin(poolId);

  try {
    await updateMemberRole(poolId, userId, role);
  } catch {
    return { error: "Failed to change member role" };
  }

  revalidatePath(`/pools/${poolId}/settings`);
  return { success: true };
}

export async function leavePoolAction(poolId: string) {
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
