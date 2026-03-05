"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CategoryResultView } from "@/types/results";

type UseResultsPollingReturn = {
  results: CategoryResultView[];
  lastUpdated: Date | null;
  isPolling: boolean;
  refresh: () => Promise<void>;
};

/**
 * Custom hook that polls GET /api/results at a specified interval.
 * Pauses polling when the browser tab is not visible (Page Visibility API).
 */
export function useResultsPolling(
  ceremonyYearId: string,
  intervalMs: number = 30000
): UseResultsPollingReturn {
  const [results, setResults] = useState<CategoryResultView[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/results?ceremonyYearId=${encodeURIComponent(ceremonyYearId)}`
      );
      if (!response.ok) return;

      const data: CategoryResultView[] = await response.json();
      setResults(data);
      setLastUpdated(new Date());
    } catch {
      // Silently fail — polling will retry on next interval
    }
  }, [ceremonyYearId]);

  const refresh = useCallback(async () => {
    await fetchResults();
  }, [fetchResults]);

  // Set up polling interval
  useEffect(() => {
    // Fetch immediately on mount
    fetchResults();

    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchResults, intervalMs);
      setIsPolling(true);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        // Fetch immediately when tab becomes visible again, then resume interval
        fetchResults();
        startPolling();
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchResults, intervalMs]);

  return { results, lastUpdated, isPolling, refresh };
}
