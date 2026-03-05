import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Plus, Crown, Lock, Globe } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getUserPools } from "@/lib/db/pools";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My Pools | OscarPoolVibes",
  description: "View and manage your Oscar prediction pools",
};

export default async function PoolsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const pools = await getUserPools(session.user.id);

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
              My Pools
            </h1>
            <p className="mt-2 text-gold-100/70">
              Manage your Oscar prediction pools
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/pools/create">
              <Plus className="size-5" />
              Create Pool
            </Link>
          </Button>
        </div>
      </section>

      {/* Pool List */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {pools.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Crown className="size-8 text-gold-500" />
                </div>
                <h2 className="font-heading text-xl font-semibold">
                  You haven&apos;t joined any pools yet
                </h2>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  Create your own pool and invite friends, or ask someone to
                  share their invite link with you.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/pools/create">
                    <Plus className="size-4" />
                    Create Your First Pool
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2" role="list">
              {pools.map((pool) => (
                <li key={pool.id}>
                  <Link href={`/pools/${pool.id}`} className="block h-full">
                    <Card className="h-full transition-colors hover:border-gold-500/50">
                      <CardHeader>
                        <CardTitle className="font-heading text-lg">
                          {pool.name}
                        </CardTitle>
                        <CardDescription>
                          {pool.ceremonyYear.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="size-4" />
                            {pool._count.members}{" "}
                            {pool._count.members === 1 ? "member" : "members"}
                          </span>
                          <AccessTypeBadge accessType={pool.accessType} />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <span className="text-sm text-gold-500">
                          View Pool &rarr;
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      <Lock className="size-3" />
      Invite Only
    </span>
  );
}
