import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { grantResultsPermission, revokeResultsPermission } from "@/lib/results";

const permissionActionSchema = z.object({
  targetUserId: z.string(),
  action: z.enum(["grant", "revoke"]),
});

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
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await context.params;

  // Verify caller is an ADMIN of this pool
  const caller = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!caller) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const callerMembership = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: { poolId, userId: caller.id },
    },
    select: { role: true },
  });

  if (!callerMembership || callerMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  const session = await auth();
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

  let body: z.infer<typeof permissionActionSchema>;
  try {
    body = permissionActionSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "targetUserId (string) and action ('grant' or 'revoke') are required" },
      { status: 400 }
    );
  }

  const { targetUserId, action } = body;

  const result =
    action === "grant"
      ? await grantResultsPermission(user.id, poolId, targetUserId)
      : await revokeResultsPermission(user.id, poolId, targetUserId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
