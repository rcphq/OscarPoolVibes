import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { setResult, unsetResult, getResultsByCeremony } from "@/lib/results";
import { trackServerEvent } from "@/lib/analytics/posthog-server";

const ERROR_STATUS_MAP = {
  CONFLICT: 409,
  UNAUTHORIZED: 403,
  INVALID_NOMINEE: 400,
  INVALID_TIED_NOMINEE: 400,
  CATEGORY_NOT_FOUND: 404,
} as const;

async function revalidateCeremonyPools(ceremonyYearId: string) {
  if (!ceremonyYearId) return;
  const { prisma } = await import("@/lib/db/client");
  const pools = await prisma.pool.findMany({
    where: { ceremonyYearId },
    select: { id: true },
  });
  for (const pool of pools) {
    revalidatePath(`/pools/${pool.id}/leaderboard`);
    revalidatePath(`/pools/${pool.id}`);
  }
}

const setResultSchema = z.object({
  categoryId: z.string(),
  winnerId: z.string(),
  /** Optional second winner for tied categories. Must differ from winnerId. */
  tiedWinnerId: z.string().nullable().optional(),
  expectedVersion: z.number().int().nullable().optional(),
});

/**
 * GET /api/results?ceremonyYearId=<id>
 * Returns all results for a ceremony year.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ceremonyYearId = request.nextUrl.searchParams.get("ceremonyYearId");
  if (!ceremonyYearId) {
    return NextResponse.json(
      { error: "ceremonyYearId query parameter is required" },
      { status: 400 }
    );
  }

  const results = await getResultsByCeremony(ceremonyYearId);
  return NextResponse.json(results);
}

/**
 * POST /api/results
 * Set the winner for a category.
 *
 * Body: { categoryId, winnerId, expectedVersion }
 *
 * Returns:
 * - 200 { success: true, version: number } on success
 * - 409 { success: false, error: { code: "CONFLICT", ... } } on conflict
 * - 403 { success: false, error: { code: "UNAUTHORIZED", ... } } on no permission
 * - 400 for validation errors
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof setResultSchema>;
  try {
    body = setResultSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "categoryId and winnerId are required" },
      { status: 400 }
    );
  }

  const { categoryId, winnerId, tiedWinnerId, expectedVersion } = body;

  // Look up userId from session email
  const { prisma } = await import("@/lib/db/client");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // Look up ceremonyYearId for analytics
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { ceremonyYearId: true },
  });
  const ceremonyYearId = category?.ceremonyYearId ?? "";

  try {
    const result = await setResult(user.id, {
      categoryId,
      winnerId,
      tiedWinnerId: tiedWinnerId ?? null,
      expectedVersion: expectedVersion ?? null,
    });

    if (!result.success) {
      if (result.error.code === "CONFLICT") {
        trackServerEvent(user.id, "result_conflict", { ceremonyYearId, categoryId });
      }

      return NextResponse.json(result, {
        status: ERROR_STATUS_MAP[result.error.code] ?? 500,
      });
    }

    trackServerEvent(user.id, "result_set", { ceremonyYearId, categoryId });
    await revalidateCeremonyPools(ceremonyYearId);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to set result. Please retry." },
      { status: 500 }
    );
  }
}

const unsetResultSchema = z.object({
  categoryId: z.string(),
  expectedVersion: z.number().int(),
});

/**
 * DELETE /api/results
 * Remove the winner for a category (undo a result entered in error).
 *
 * Body: { categoryId, expectedVersion }
 *
 * Returns:
 * - 200 { success: true } on success
 * - 409 on version conflict
 * - 403 on no permission
 * - 400 for validation errors
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof unsetResultSchema>;
  try {
    body = unsetResultSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "categoryId and expectedVersion are required" },
      { status: 400 }
    );
  }

  const { categoryId, expectedVersion } = body;

  const { prisma } = await import("@/lib/db/client");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { ceremonyYearId: true },
  });
  const ceremonyYearId = category?.ceremonyYearId ?? "";

  try {
    const result = await unsetResult(user.id, { categoryId, expectedVersion });

    if (!result.success) {
      if (result.error.code === "CONFLICT") {
        trackServerEvent(user.id, "result_conflict", { ceremonyYearId, categoryId });
      }

      return NextResponse.json(result, {
        status: ERROR_STATUS_MAP[result.error.code] ?? 500,
      });
    }

    trackServerEvent(user.id, "result_unset", { ceremonyYearId, categoryId });
    await revalidateCeremonyPools(ceremonyYearId);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to clear result. Please retry." },
      { status: 500 }
    );
  }
}
