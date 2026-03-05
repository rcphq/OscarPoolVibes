import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { setResult, getResultsByCeremony } from "@/lib/results";
import type { SetResultRequest } from "@/types/results";

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

  const body: SetResultRequest = await request.json();
  const { categoryId, winnerId, expectedVersion } = body;

  if (!categoryId || !winnerId) {
    return NextResponse.json(
      { error: "categoryId and winnerId are required" },
      { status: 400 }
    );
  }

  // Look up userId from session email
  const { prisma } = await import("@/lib/db/client");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const result = await setResult(user.id, {
    categoryId,
    winnerId,
    expectedVersion: expectedVersion ?? null,
  });

  if (!result.success) {
    const statusMap = {
      CONFLICT: 409,
      UNAUTHORIZED: 403,
      INVALID_NOMINEE: 400,
      CATEGORY_NOT_FOUND: 404,
    } as const;

    return NextResponse.json(result, {
      status: statusMap[result.error.code],
    });
  }

  return NextResponse.json(result);
}
