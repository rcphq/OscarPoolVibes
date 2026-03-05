import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Pool | OscarPoolVibes",
  description:
    "Create a new Oscar prediction pool and invite your friends.",
};

export default function CreatePoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
