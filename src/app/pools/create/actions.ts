"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { createPool } from "@/lib/db/pools";
import { prisma } from "@/lib/db/client";
import { trackServerEvent } from "@/lib/analytics/posthog-server";

const createPoolSchema = z.object({
  name: z
    .string()
    .min(1, "Pool name is required")
    .max(100, "Pool name must be 100 characters or fewer"),
  ceremonyYearId: z.string().min(1, "Ceremony year is required"),
  accessType: z.enum(["OPEN", "INVITE_ONLY"]),
  maxMembers: z
    .number()
    .int()
    .min(2, "Pool must allow at least 2 members")
    .optional(),
});

export type CreatePoolFormState = {
  errors?: {
    name?: string[];
    ceremonyYearId?: string[];
    accessType?: string[];
    maxMembers?: string[];
    _form?: string[];
  };
};

export async function createPoolAction(
  _prevState: CreatePoolFormState,
  formData: FormData
): Promise<CreatePoolFormState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      errors: { _form: ["You must be signed in to create a pool."] },
    };
  }

  const rawMaxMembers = formData.get("maxMembers");
  const parsedMaxMembers =
    rawMaxMembers && String(rawMaxMembers).trim() !== ""
      ? Number(rawMaxMembers)
      : undefined;

  const validationResult = createPoolSchema.safeParse({
    name: formData.get("name"),
    ceremonyYearId: formData.get("ceremonyYearId"),
    accessType: formData.get("accessType"),
    maxMembers: parsedMaxMembers,
  });

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors as CreatePoolFormState["errors"],
    };
  }

  const { name, ceremonyYearId, accessType, maxMembers } =
    validationResult.data;

  // Verify ceremony year exists and is active
  const ceremonyYear = await prisma.ceremonyYear.findUnique({
    where: { id: ceremonyYearId },
    select: { isActive: true },
  });

  if (!ceremonyYear) {
    return {
      errors: { ceremonyYearId: ["Selected ceremony year does not exist."] },
    };
  }

  if (!ceremonyYear.isActive) {
    return {
      errors: {
        ceremonyYearId: ["Selected ceremony year is no longer active."],
      },
    };
  }

  let poolId: string;

  try {
    const pool = await createPool({
      name,
      ceremonyYearId,
      accessType,
      maxMembers,
      userId: session.user.id,
    });
    poolId = pool.id;
    trackServerEvent(session.user.id, "pool_created", {
      poolId,
      accessType,
      ceremonyYear: ceremonyYearId,
    });
  } catch {
    return {
      errors: {
        _form: ["Something went wrong creating the pool. Please try again."],
      },
    };
  }

  redirect(`/pools/${poolId}`);
}
