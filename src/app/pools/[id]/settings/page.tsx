import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings, Users, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import { getMemberRole } from "@/lib/db/pool-members";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PoolSettingsForm } from "./pool-settings-form";
import { ArchivePoolButton } from "./archive-pool-button";
import { MemberManagement } from "./member-management";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: "Pool Settings | OscarPoolVibes",
    description: "Configure pool settings, manage members, and more.",
  };
}

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PoolSettingsPage({ params }: SettingsPageProps) {
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Settings className="size-6 text-primary" />
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Pool Settings
          </h1>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your pool name, access type, and member limits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PoolSettingsForm
              poolId={poolId}
              name={pool.name}
              accessType={pool.accessType}
              maxMembers={pool.maxMembers}
            />
          </CardContent>
        </Card>

        {/* Member Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <CardTitle>Members</CardTitle>
            </div>
            <CardDescription>
              Manage pool members and their roles. {pool.members.length} active
              member{pool.members.length !== 1 ? "s" : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberManagement
              poolId={poolId}
              members={pool.members.map((m) => ({
                id: m.id,
                role: m.role,
                user: m.user,
              }))}
              currentUserId={session.user.id}
            />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Archiving a pool hides it from all members. This action cannot be
              undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchivePoolButton poolId={poolId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
