import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming loading skeleton for the Scoring Settings page.
 * Matches the tier-grouped table layout so there's no layout shift on hydration.
 */
export default function ScoringLoading() {
  // Row counts per tier: Tier 1 = 6, Tier 2 = 6, Tier 3 = 6, Tier 4 = 7
  const tierRowCounts = [6, 6, 6, 7];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Page header */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Ceremony-wide notice banner skeleton */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* Table skeleton — one section per tier */}
        <div className="space-y-6">
          {tierRowCounts.map((rowCount, tierIndex) => (
            <div key={tierIndex} className="space-y-1">
              {/* Tier group header */}
              <Skeleton className="h-10 w-full rounded-md" />
              {/* Category rows */}
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-center gap-4 px-4 py-2"
                >
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-9 w-24 shrink-0" />
                  <Skeleton className="h-9 w-24 shrink-0" />
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
