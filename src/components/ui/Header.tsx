import Link from "next/link"

export function Header() {
  // TODO: const session = await auth() — will be added when auth is configured in Wave 2B
  // TODO: Import auth from "@/lib/auth/auth" and make this an async function

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-heading text-primary">
          OscarPoolVibes
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/pools"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pools
          </Link>
          {/* TODO: When auth is set up, conditionally show Leaderboard link and UserMenu for logged-in users */}
          <Link href="/auth/signin">
            <span className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Sign In
            </span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
