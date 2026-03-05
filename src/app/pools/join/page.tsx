import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getPoolByInviteCode } from "@/lib/db/pools";
import { getInviteByToken } from "@/lib/db/invites";
import { getMemberRole } from "@/lib/db/pool-members";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JoinPoolButton } from "./join-button";

interface JoinPageProps {
  searchParams: Promise<{ code?: string; token?: string }>;
}

export default async function JoinPoolPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const { code, token } = params;

  const session = await auth();

  // No code or token provided
  if (!code && !token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Join a Pool</CardTitle>
            <CardDescription>
              You need a valid invite link or code to join a pool.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in — redirect to sign in
  if (!session?.user?.id) {
    const callbackParam = code
      ? `code=${encodeURIComponent(code)}`
      : `token=${encodeURIComponent(token!)}`;
    redirect(`/auth/signin?callbackUrl=/pools/join?${callbackParam}`);
  }

  // --- OPEN pool join via invite code ---
  if (code) {
    const pool = await getPoolByInviteCode(code);

    if (!pool) {
      return <ErrorCard message="Invalid invite code. This pool may no longer exist." />;
    }

    if (pool.accessType !== "OPEN") {
      return <ErrorCard message="This pool requires a personal invitation to join." />;
    }

    // Check if already a member
    const existingRole = await getMemberRole(pool.id, session.user.id);
    if (existingRole) {
      redirect(`/pools/${pool.id}`);
    }

    // Check if pool is full
    if (pool.maxMembers && pool._count.members >= pool.maxMembers) {
      return <ErrorCard message="This pool has reached its maximum number of members." />;
    }

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Join Pool</CardTitle>
            <CardDescription>
              You have been invited to join a pool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-heading font-bold text-primary">
                {pool.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {pool.ceremonyYear.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {pool._count.members} {pool._count.members === 1 ? "member" : "members"}
              </p>
            </div>
            <JoinPoolButton code={code} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- INVITE_ONLY pool join via token ---
  if (token) {
    const invite = await getInviteByToken(token);

    if (!invite) {
      return <ErrorCard message="This invite is invalid or has expired." />;
    }

    if (invite.status !== "PENDING") {
      return (
        <ErrorCard
          message={`This invite has already been ${invite.status.toLowerCase()}.`}
        />
      );
    }

    // Check email match
    if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return (
        <ErrorCard
          message={`This invite was sent to ${invite.email}. Please sign in with that email address to accept it.`}
        />
      );
    }

    // Check if already a member
    const existingRole = await getMemberRole(invite.poolId, session.user.id);
    if (existingRole) {
      redirect(`/pools/${invite.poolId}`);
    }

    // Check if pool is full
    if (
      invite.pool.maxMembers &&
      invite.pool._count.members >= invite.pool.maxMembers
    ) {
      return <ErrorCard message="This pool has reached its maximum number of members." />;
    }

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">
              Accept Invitation
            </CardTitle>
            <CardDescription>
              You have been invited to join a pool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-heading font-bold text-primary">
                {invite.pool.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {invite.pool.ceremonyYear.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {invite.pool._count.members}{" "}
                {invite.pool._count.members === 1 ? "member" : "members"}
              </p>
            </div>
            <JoinPoolButton token={token} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading">
            Unable to Join
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
