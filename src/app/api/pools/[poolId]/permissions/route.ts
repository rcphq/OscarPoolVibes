import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/client";
import { grantResultsPermission, revokeResultsPermission } from "@/lib/results";

type RouteContext = {
  params: Promise<{ poolId: string }>;
};

/**
 * GET /api/pools/[poolId]/permissions
 * List pool members with their roles (to show who can manage results).
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await context.params;

  const members = await prisma.poolMember.findMany({
    where: { poolId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: [
      { role: "asc" }, // ADMIN first
      { joinedAt: "asc" },
    ],
  });

  return NextResponse.json(
    members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      canManageResults: m.role === "ADMIN" || m.role === "RESULTS_MANAGER",
    }))
  );
}

/**
 * POST /api/pools/[poolId]/permissions
 * Grant or revoke RESULTS_MANAGER role.
 *
 * Body: { targetUserId: string, action: "grant" | "revoke" }
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const body = await request.json();
  const { targetUserId, action } = body as {
    targetUserId: string;
    action: "grant" | "revoke";
  };

  if (!targetUserId || !["grant", "revoke"].includes(action)) {
    return NextResponse.json(
      { error: "targetUserId and action ('grant' or 'revoke') are required" },
      { status: 400 }
    );
  }

  const result =
    action === "grant"
      ? await grantResultsPermission(user.id, poolId, targetUserId)
      : await revokeResultsPermission(user.id, poolId, targetUserId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
