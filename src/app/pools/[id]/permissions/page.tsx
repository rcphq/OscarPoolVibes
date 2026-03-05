import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import { getMemberRole, getMembersWithRoles } from "@/lib/db/pool-members";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PermissionsManager,
  type PermissionMember,
} from "@/components/pools/PermissionsManager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: "Permissions | OscarPoolVibes",
    description: "Manage pool member roles and permissions.",
  };
}

interface PermissionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PoolPermissionsPage({
  params,
}: PermissionsPageProps) {
  const { id: poolId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const role = await getMemberRole(poolId, session.user.id);
  if (role !== "ADMIN") {
    redirect(`/pools/${poolId}`);
  }

  const pool = await getPool(poolId);
  if (!pool) {
    redirect("/pools");
  }

  const membersRaw = await getMembersWithRoles(poolId);

  const members: PermissionMember[] = membersRaw.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role as PermissionMember["role"],
    canManageResults: m.role === "ADMIN" || m.role === "RESULTS_MANAGER",
  }));

  // Sort: ADMIN first, then RESULTS_MANAGER, then MEMBER
  const roleOrder = { ADMIN: 0, RESULTS_MANAGER: 1, MEMBER: 2 };
  members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
        <div>
          <Link
            href={`/pools/${poolId}/settings`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Settings
          </Link>

          <div className="flex items-center gap-3">
            <Shield className="size-6 text-primary" />
            <div>
              <h1 className="text-3xl font-heading font-bold tracking-tight">
                Permissions
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {pool.name}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results Manager Permissions</CardTitle>
            <CardDescription>
              Grant or revoke the ability for members to manage ceremony results.
              Admins always have this permission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionsManager poolId={poolId} members={members} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
