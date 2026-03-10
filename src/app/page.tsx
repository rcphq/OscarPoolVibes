import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCachedSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { absolute: "OscarPoolVibes â€” Predict the Oscars with Friends" },
  description:
    "Create a pool, invite your friends, and see who can predict the most winners on Hollywood's biggest night.",
  openGraph: {
    title: "OscarPoolVibes â€” Predict the Oscars with Friends",
    description:
      "Create a pool, invite your friends, and see who can predict the most winners on Hollywood's biggest night.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OscarPoolVibes â€” Predict the Oscars with Friends",
    description:
      "Create a pool, invite your friends, and compete on Oscar night.",
  },
};

export default async function Home() {
  const session = await getCachedSession();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
          Predict the Oscars
          <span className="block text-primary">with Friends</span>
        </h1>
        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
          Create a pool, invite your friends, and see who can predict the most
          winners on Hollywood&apos;s biggest night.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="px-8 text-base">
            <Link href={session?.user ? "/pools" : "/auth/signin"}>
              {session?.user ? "My Pools" : "Get Started"}
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="px-8 text-base">
            <Link href="/demo">Try Demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8 text-base">
            <Link href={session?.user ? "/pools" : "/pools/join"}>
              {session?.user ? "Browse Pools" : "Join a Pool"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

