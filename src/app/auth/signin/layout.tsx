import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | OscarPoolVibes",
  description:
    "Sign in to OscarPoolVibes to create and join Oscar prediction pools.",
};

// Middleware handles redirecting authenticated users away from this route.
// A redundant redirect here would break callbackUrl flows (e.g., pool invite links).
export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
