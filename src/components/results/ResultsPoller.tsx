"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResultsPolling } from "@/hooks/useResultsPolling";
import type { CategoryResultView } from "@/types/results";

type ResultsPollerProps = {
  ceremonyYearId: string;
  onResultsUpdate: (results: CategoryResultView[]) => void;
};

/**
 * Client component that polls for result updates and provides
 * a manual refresh button plus a "last updated" indicator.
 */
export function ResultsPoller({
  ceremonyYearId,
  onResultsUpdate,
}: ResultsPollerProps) {
  const { results, lastUpdated, isPolling, refresh } =
    useResultsPolling(ceremonyYearId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  // Forward results to parent whenever they change
  useEffect(() => {
    if (results.length > 0) {
      onResultsUpdate(results);
    }
  }, [results, onResultsUpdate]);

  // Update "X seconds ago" display every second
  useEffect(() => {
    if (!lastUpdated) return;

    function tick() {
      if (!lastUpdated) return;
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Polling status indicator */}
      <div className="flex items-center gap-1.5">
        {isPolling ? (
          <>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Live
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex size-2 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-muted-foreground">
              Paused
            </span>
          </>
        )}
      </div>

      {/* Last updated timestamp */}
      {secondsAgo !== null && (
        <span className="text-xs text-muted-foreground">
          Updated {formatSecondsAgo(secondsAgo)}
        </span>
      )}

      {/* Manual refresh button */}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleRefresh}
        disabled={isRefreshing}
        aria-label="Refresh results"
      >
        <RefreshCw
          className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
        />
      </Button>
    </div>
  );
}

function formatSecondsAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
