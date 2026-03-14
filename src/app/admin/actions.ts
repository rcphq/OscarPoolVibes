"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/client";
import { trackServerEvent } from "@/lib/analytics/posthog-server";

const createCeremonySchema = z.object({
  year: z.number().int().min(2020).max(2099),
  name: z.string().min(1).max(200),
  ceremonyDate: z.string().optional(),
});

const addCategorySchema = z.object({
  ceremonyYearId: z.string().min(1),
  name: z.string().min(1).max(200),
  displayOrder: z.number().int().min(0),
  pointValue: z.number().int().positive().default(10),
  runnerUpMultiplier: z.number().positive().default(0.5),
});

const addNomineeSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(300),
  subtitle: z.string().optional(),
});

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  if (!isSiteAdmin(session.user.email)) {
    throw new Error("Access denied: site admin access required");
  }

  return session.user.id;
}

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function togglePredictionsLocked(
  ceremonyYearId: string
): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();

    const ceremony = await prisma.ceremonyYear.findUnique({
      where: { id: ceremonyYearId },
      select: { predictionsLocked: true },
    });

    if (!ceremony) {
      return { success: false, error: "Ceremony year not found" };
    }

    const newLocked = !ceremony.predictionsLocked;
    await prisma.ceremonyYear.update({
      where: { id: ceremonyYearId },
      data: { predictionsLocked: newLocked },
    });

    trackServerEvent(userId, "admin_predictions_locked", { ceremonyYearId, locked: newLocked });
    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function toggleCeremonyActive(
  ceremonyYearId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const ceremony = await prisma.ceremonyYear.findUnique({
      where: { id: ceremonyYearId },
      select: { isActive: true },
    });

    if (!ceremony) {
      return { success: false, error: "Ceremony year not found" };
    }

    await prisma.ceremonyYear.update({
      where: { id: ceremonyYearId },
      data: { isActive: !ceremony.isActive },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function createCeremonyYear(
  formData: FormData
): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();

    const rawYear = formData.get("year");
    const rawName = formData.get("name");
    const rawDate = formData.get("ceremonyDate");

    const result = createCeremonySchema.safeParse({
      year: rawYear ? Number(rawYear) : undefined,
      name: rawName ? String(rawName) : "",
      ceremonyDate:
        rawDate && String(rawDate).trim() !== ""
          ? String(rawDate)
          : undefined,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Validation failed",
      };
    }

    const { year, name, ceremonyDate } = result.data;

    const existing = await prisma.ceremonyYear.findUnique({
      where: { year },
    });

    if (existing) {
      return { success: false, error: `Ceremony year ${year} already exists` };
    }

    const created = await prisma.ceremonyYear.create({
      data: {
        year,
        name,
        ceremonyDate: ceremonyDate ? new Date(ceremonyDate) : null,
      },
    });

    trackServerEvent(userId, "admin_ceremony_created", { ceremonyYearId: created.id });
    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function addCategory(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const rawDisplayOrder = formData.get("displayOrder");
    const rawPointValue = formData.get("pointValue");
    const rawMultiplier = formData.get("runnerUpMultiplier");

    const result = addCategorySchema.safeParse({
      ceremonyYearId: String(formData.get("ceremonyYearId") ?? ""),
      name: String(formData.get("name") ?? ""),
      displayOrder: rawDisplayOrder ? Number(rawDisplayOrder) : 0,
      pointValue: rawPointValue ? Number(rawPointValue) : 10,
      runnerUpMultiplier: rawMultiplier ? Number(rawMultiplier) : 0.5,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Validation failed",
      };
    }

    const { ceremonyYearId, name, displayOrder, pointValue, runnerUpMultiplier } =
      result.data;

    const ceremony = await prisma.ceremonyYear.findUnique({
      where: { id: ceremonyYearId },
    });

    if (!ceremony) {
      return { success: false, error: "Ceremony year not found" };
    }

    await prisma.category.create({
      data: {
        ceremonyYearId,
        name,
        displayOrder,
        pointValue,
        runnerUpMultiplier,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint")
    ) {
      return {
        success: false,
        error: "A category with that name already exists for this ceremony",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function updateCeremonyDate(
  ceremonyYearId: string,
  ceremonyDate: string | null
): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();

    const ceremony = await prisma.ceremonyYear.findUnique({
      where: { id: ceremonyYearId },
    });

    if (!ceremony) {
      return { success: false, error: "Ceremony year not found" };
    }

    const parsedDate = ceremonyDate ? new Date(ceremonyDate) : null;
    if (parsedDate !== null && isNaN(parsedDate.getTime())) {
      return { success: false, error: "Invalid ceremony date format" };
    }

    await prisma.ceremonyYear.update({
      where: { id: ceremonyYearId },
      data: { ceremonyDate: parsedDate },
    });

    trackServerEvent(userId, "admin_ceremony_date_updated", { ceremonyYearId });
    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function addNominee(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const rawSubtitle = formData.get("subtitle");

    const result = addNomineeSchema.safeParse({
      categoryId: String(formData.get("categoryId") ?? ""),
      name: String(formData.get("name") ?? ""),
      subtitle:
        rawSubtitle && String(rawSubtitle).trim() !== ""
          ? String(rawSubtitle)
          : undefined,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Validation failed",
      };
    }

    const { categoryId, name, subtitle } = result.data;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    await prisma.nominee.create({
      data: {
        categoryId,
        name,
        subtitle: subtitle ?? null,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint")
    ) {
      return {
        success: false,
        error: "A nominee with that name already exists in this category",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

