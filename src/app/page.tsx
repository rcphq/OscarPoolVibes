import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-heading font-bold tracking-tight sm:text-6xl">
          Predict the Oscars
          <span className="block text-primary">with Friends</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Create a pool, invite your friends, and see who can predict the most
          winners on Hollywood&apos;s biggest night.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="text-base px-8">
            <Link href="/auth/signin">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8">
            <Link href="/pools">Browse Pools</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
