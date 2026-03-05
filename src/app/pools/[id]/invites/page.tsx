import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pools";
import { getMemberRole } from "@/lib/db/pool-members";
import { getPoolInvites } from "@/lib/db/invites";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteForm } from "./invite-form";
import { RevokeButton } from "./revoke-button";

interface InvitesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ManageInvitesPage({ params }: InvitesPageProps) {
  const { id: poolId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/pools/${poolId}/invites`);
  }

  const [pool, role] = await Promise.all([
    getPool(poolId),
    getMemberRole(poolId, session.user.id),
  ]);

  if (!pool) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">
              Pool Not Found
            </CardTitle>
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

  if (role !== "ADMIN") {
    redirect(`/pools/${poolId}`);
  }

  const invites = await getPoolInvites(poolId);

  const pendingInvites = invites.filter((inv) => inv.status === "PENDING");
  const acceptedInvites = invites.filter((inv) => inv.status === "ACCEPTED");
  const declinedOrExpired = invites.filter(
    (inv) => inv.status === "DECLINED" || inv.status === "EXPIRED"
  );

  const isInviteOnly = pool.accessType === "INVITE_ONLY";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Manage Invites</h1>
            <p className="text-muted-foreground">{pool.name}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/pools/${poolId}`}>Back to Pool</Link>
          </Button>
        </div>

        {/* Invite form — only for INVITE_ONLY pools */}
        {isInviteOnly ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Send Invitation</CardTitle>
              <CardDescription>
                Invite someone by email to join this pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteForm poolId={poolId} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Open Pool</CardTitle>
              <CardDescription>
                This pool is open. Anyone with the invite code can join.
                Share this code:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-primary font-mono">
                  {pool.inviteCode}
                </code>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">
                Pending ({pendingInvites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited by {invite.invitedBy.name ?? invite.invitedBy.email}
                        {" "}on{" "}
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <RevokeButton poolId={poolId} inviteId={invite.id} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Accepted Invites */}
        {acceptedInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">
                Accepted ({acceptedInvites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {acceptedInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Accepted on{" "}
                        {new Date(invite.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-green-500">
                      Accepted
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Declined / Expired */}
        {declinedOrExpired.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">
                Declined / Expired ({declinedOrExpired.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {declinedOrExpired.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 opacity-60"
                  >
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {invite.status === "DECLINED" ? "Declined" : "Expired"}{" "}
                        on {new Date(invite.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {invite.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {invites.length === 0 && isInviteOnly && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No invites sent yet. Use the form above to invite people to your pool.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
