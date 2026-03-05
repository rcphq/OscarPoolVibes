import Link from "next/link"
import { auth } from "@/lib/auth/auth"

export async function Header() {
  const session = await auth()

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
          {session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="size-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium">
                {session.user.name ?? session.user.email}
              </span>
              <Link href="/api/auth/signout">
                <span className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
                  Sign Out
                </span>
              </Link>
            </div>
          ) : (
            <Link href="/auth/signin">
              <span className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign In
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
