import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Users, Crown, Settings, Trophy, BarChart3, ArrowLeft, Globe, Lock } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import { getMemberRole } from "@/lib/db/pool-members";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyInviteLink } from "@/components/pools/CopyInviteLink";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pool = await getPool(id);

  if (!pool) {
    return { title: "Pool Not Found | OscarPoolVibes" };
  }

  return {
    title: `${pool.name} | OscarPoolVibes`,
    description: `Oscar prediction pool for ${pool.ceremonyYear.name}`,
  };
}

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const pool = await getPool(id);

  if (!pool) {
    notFound();
  }

  // Check that the current user is an active member
  const memberRole = await getMemberRole(pool.id, session.user.id);

  if (!memberRole) {
    redirect("/pools");
  }

  const isAdmin = memberRole === "ADMIN";

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/pools"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-100/70 hover:text-gold-100"
          >
            <ArrowLeft className="size-4" />
            Back to Pools
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
                {pool.name}
              </h1>
              <p className="mt-2 text-gold-100/70">
                {pool.ceremonyYear.name}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-gold-100/60">
                  <Users className="size-4" />
                  {pool.members.length}{" "}
                  {pool.members.length === 1 ? "member" : "members"}
                </span>
                <AccessTypeBadge accessType={pool.accessType} />
              </div>
            </div>

            {/* Action Buttons */}
            <nav className="flex flex-wrap gap-2" aria-label="Pool actions">
              <Button asChild>
                <Link href={`/pools/${pool.id}/predictions`}>
                  <Trophy className="size-4" />
                  Make Predictions
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href={`/pools/${pool.id}/leaderboard`}>
                  <BarChart3 className="size-4" />
                  Leaderboard
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link href={`/pools/${pool.id}/settings`}>
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-3">
          {/* Invite Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Invite Link
              </CardTitle>
              <CardDescription>
                Share this code to invite others to your pool.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CopyInviteLink inviteCode={pool.inviteCode} />
            </CardContent>
          </Card>

          {/* Members Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Members ({pool.members.length})
              </CardTitle>
              <CardDescription>
                Pool members and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border" role="list">
                {pool.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt=""
                          className="size-8 rounded-full"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                          {(member.user.name ?? member.user.email)
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {member.user.name ?? member.user.email}
                        </p>
                        {member.user.name && (
                          <p className="text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <MemberRoleBadge role={member.role} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function AccessTypeBadge({ accessType }: { accessType: string }) {
  if (accessType === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-medium text-gold-400">
        <Globe className="size-3" />
        Open
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-gold-100/70">
      <Lock className="size-3" />
      Invite Only
    </span>
  );
}

function MemberRoleBadge({ role }: { role: string }) {
  switch (role) {
    case "ADMIN":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-medium text-gold-400">
          <Crown className="size-3" />
          Admin
        </span>
      );
    case "RESULTS_MANAGER":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          <Trophy className="size-3" />
          Results Manager
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          Member
        </span>
      );
  }
}
