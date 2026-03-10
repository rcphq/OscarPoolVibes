import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/lib/auth/auth";
import { SkipLink } from "@/components/ui/SkipLink";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCachedSession } from "@/lib/auth/session";

export async function Header() {
  const session = await getCachedSession();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="border-b border-border bg-card">
      <SkipLink />
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-heading text-primary">
          OscarPoolVibes
        </Link>
        <nav className="flex items-center gap-4">
          {!session?.user && (
            <Link
              href="/demo"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Demo
            </Link>
          )}
          <Link
            href={session?.user ? "/pools" : "/pools/join"}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {session?.user ? "Pools" : "Join Pool"}
          </Link>
          <ThemeToggle />
          {session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium">
                {session.user.name ?? session.user.email}
              </span>
              <form action={handleSignOut}>
                <Button type="submit" variant="secondary" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

