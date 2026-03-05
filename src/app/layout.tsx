import type { Metadata } from "next";
import { Suspense } from "react";
import { Playfair_Display, Inter } from "next/font/google";
import { auth } from "@/lib/auth/auth";
import { Header } from "@/components/ui/Header";
import { PostHogProvider } from "@/lib/analytics/posthog-provider";
import { PostHogPageView } from "@/lib/analytics/posthog-pageview";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SonnerToaster } from "@/components/ui/sonner";
import { JsonLd } from "@/lib/seo/json-ld";
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
  metadataBase: new URL("https://oscarpoolvibes.com"),
  title: {
    default: "OscarPoolVibes",
    template: "%s | OscarPoolVibes",
  },
  description: "Create and manage Oscar prediction pools with friends",
  openGraph: {
    type: "website",
    siteName: "OscarPoolVibes",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="antialiased">
        <ThemeProvider>
          <PostHogProvider userId={session?.user?.id}>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <Header />
            <main id="main-content" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <JsonLd />
          </PostHogProvider>
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
