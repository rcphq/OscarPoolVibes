"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type LeaderboardAutoRefreshProps = {
  ceremonyYearId: string;
  /** Polling interval in milliseconds. Defaults to 15 seconds. */
  intervalMs?: number;
};

/**
 * Invisible client component that polls /api/results and triggers a
 * router.refresh() whenever the set of winners changes.  This causes
 * the server component tree (leaderboard page) to re-render with
 * fresh scoring data without a full page reload.
 *
 * Pauses polling when the tab is hidden (Page Visibility API).
 */
export function LeaderboardAutoRefresh({
  ceremonyYearId,
  intervalMs = 15_000,
}: LeaderboardAutoRefreshProps) {
  const router = useRouter();
  const fingerprintRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForUpdates = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/results?ceremonyYearId=${encodeURIComponent(ceremonyYearId)}`
      );
      if (!res.ok) return;

      const data: Array<{ categoryId: string; winnerId: string | null; version: number }> =
        await res.json();

      // Build a fingerprint from winner IDs + versions so we detect both
      // new winners and changed/cleared winners.
      const fingerprint = data
        .map((r) => `${r.categoryId}:${r.winnerId ?? ""}:${r.version}`)
        .sort()
        .join("|");

      if (fingerprintRef.current !== null && fingerprint !== fingerprintRef.current) {
        router.refresh();
      }

      fingerprintRef.current = fingerprint;
    } catch {
      // Silently ignore — next poll will retry
    }
  }, [ceremonyYearId, router]);

  useEffect(() => {
    // Initial fetch to set baseline fingerprint
    checkForUpdates();

    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(checkForUpdates, intervalMs);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        checkForUpdates();
        startPolling();
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForUpdates, intervalMs]);

  // Renders nothing — purely a side-effect component
  return null;
}
