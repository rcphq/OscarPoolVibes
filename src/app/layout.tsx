import type { Metadata } from "next";
import { Suspense } from "react";
import { Playfair_Display, Inter } from "next/font/google";
import { auth } from "@/lib/auth/auth";
import { Header } from "@/components/ui/Header";
import { PostHogProvider } from "@/lib/analytics/posthog-provider";
import { PostHogPageView } from "@/lib/analytics/posthog-pageview";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OscarPoolVibes",
  description: "Create and manage Oscar prediction pools with friends",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`dark ${playfairDisplay.variable} ${inter.variable}`}>
      <body className="antialiased">
        <PostHogProvider userId={session?.user?.id}>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <Header />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
