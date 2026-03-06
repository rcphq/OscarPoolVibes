import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In | OscarPoolVibes",
  description:
    "Sign in to OscarPoolVibes to create and join Oscar prediction pools.",
};

export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/pools");
  }
  return children;
}
