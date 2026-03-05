import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes that don't require auth
  const publicPaths = ["/", "/auth/signin", "/api/auth"]
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for Auth.js session cookie (lightweight — no DB import)
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token")

  if (!hasSession) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
