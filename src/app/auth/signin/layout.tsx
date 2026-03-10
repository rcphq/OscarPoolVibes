import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | OscarPoolVibes",
  description:
    "Sign in to OscarPoolVibes to create and join Oscar prediction pools.",
};

// Note: authenticated users are redirected away from this route by middleware
// (src/middleware.ts), which correctly preserves the `callbackUrl` query param.
// A redundant redirect here would break callbackUrl flows (e.g., pool invite links).
export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
