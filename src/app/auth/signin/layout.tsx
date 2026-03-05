import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | OscarPoolVibes",
  description:
    "Sign in to OscarPoolVibes to create and join Oscar prediction pools.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
