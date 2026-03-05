import { auth } from "@/lib/auth/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Public routes that don't require auth
  const publicPaths = ["/", "/auth/signin", "/api/auth"]
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  if (!isLoggedIn && !isPublicPath) {
    return Response.redirect(new URL("/auth/signin", req.nextUrl))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
