import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCachedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { HeroBackground } from "@/components/home/hero-background";
import { Countdown } from "@/components/home/countdown";

export const metadata: Metadata = {
  title: { absolute: "OscarPoolVibes - Predict the Oscars with Friends" },
  description:
    "Create a pool, invite your friends, and see who can predict the most winners on Hollywood's biggest night.",
  openGraph: {
    title: "OscarPoolVibes - Predict the Oscars with Friends",
    description:
      "Create a pool, invite your friends, and see who can predict the most winners on Hollywood's biggest night.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OscarPoolVibes - Predict the Oscars with Friends",
    description:
      "Create a pool, invite your friends, and compete on Oscar night.",
  },
};

export default async function Home() {
  const session = await getCachedSession();

  const activeCeremony = await prisma.ceremonyYear.findFirst({
    where: { isActive: true },
    select: { ceremonyDate: true, name: true },
  });

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4">
      <HeroBackground />
      <div className="relative mx-auto max-w-2xl space-y-8 text-center backdrop-blur-sm rounded-xl p-8 shadow-2xl bg-black/40 border border-gold-500/20">
        <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-7xl drop-shadow-lg text-white">
          Predict the Oscars
          <span className="block text-gold-400 mt-2">with Friends</span>
        </h1>
        <p className="mx-auto max-w-lg text-lg leading-relaxed text-zinc-300 drop-shadow-md">
          Create a pool, invite your friends, and see who can predict the most
          winners on Hollywood&apos;s biggest night.
        </p>

        {activeCeremony?.ceremonyDate && (
          <div className="pt-4 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gold-200">
              {activeCeremony.name} Countdown
            </h2>
            <Countdown targetDate={activeCeremony.ceremonyDate} />
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mt-8">
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

