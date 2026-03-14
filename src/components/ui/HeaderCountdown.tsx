"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface HeaderCountdownProps {
  targetDate: Date;
  ceremonyName: string;
}

/** Computes time remaining from now until targetDate. Returns all-zeros if past. */
function computeTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

/**
 * Formats compact responsive text, omitting leading zero segments so that
 * e.g. "0d 0h 32m" becomes "32m 10s" when the ceremony is imminent.
 */
function formatCompact(t: TimeLeft): { mobile: string; tablet: string } {
  if (t.days > 0) {
    return {
      mobile: `${t.days}d ${t.hours}h`,
      tablet: `${t.days}d ${t.hours}h ${t.minutes}m`,
    };
  }
  if (t.hours > 0) {
    return {
      mobile: `${t.hours}h ${t.minutes}m`,
      tablet: `${t.hours}h ${t.minutes}m ${t.seconds}s`,
    };
  }
  const mm = `${t.minutes}m ${t.seconds}s`;
  return { mobile: mm, tablet: mm };
}

/** Builds a screen-reader-friendly label, omitting zero leading units. */
function formatAccessible(t: TimeLeft, name: string): string {
  const parts: string[] = [];
  if (t.days > 0) parts.push(`${t.days} day${t.days !== 1 ? "s" : ""}`);
  if (t.hours > 0) parts.push(`${t.hours} hour${t.hours !== 1 ? "s" : ""}`);
  if (t.minutes > 0 || parts.length === 0)
    parts.push(`${t.minutes} minute${t.minutes !== 1 ? "s" : ""}`);
  return `${name}: ${parts.join(", ")} remaining`;
}

/**
 * Compact countdown badge displayed in the site header on all pages except
 * the home page (which has its own full 4-box countdown in the hero).
 *
 * Responsive:
 *   mobile  — "2d 14h" (two most-significant non-zero units)
 *   tablet  — "2d 14h 32m"
 *   desktop — "97th Academy Awards · 2d 14h 32m 10s"
 *
 * Only renders when the ceremony is in the future and a date is set.
 */
export function HeaderCountdown({ targetDate, ceremonyName }: HeaderCountdownProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // Initialize to zeros — component is hidden until mounted (hydration guard)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Compute immediately on mount so there's no 1-second flash of zeros
    const initial = computeTimeLeft(targetDate);
    setTimeLeft(initial);
    setMounted(true);

    const interval = setInterval(() => {
      const next = computeTimeLeft(targetDate);
      setTimeLeft(next);
      // Stop ticking once the ceremony has started
      if (
        next.days === 0 &&
        next.hours === 0 &&
        next.minutes === 0 &&
        next.seconds === 0
      ) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Prevent hydration mismatch — render nothing on the server
  if (!mounted) return null;

  // Home page has its own full hero countdown; skip the header badge there
  if (pathname === "/") return null;

  const isZero =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isZero) {
    return (
      <span
        className="border border-gold-700/30 dark:border-gold-500/30 rounded-full px-2.5 py-0.5 text-xs font-medium text-gold-700 dark:text-gold-400"
        aria-label={`${ceremonyName}: ceremony has started`}
      >
        TBD!
      </span>
    );
  }

  const { mobile: mobileText, tablet: tabletText } = formatCompact(timeLeft);
  const desktopText = `${ceremonyName} · ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
  const accessibleLabel = formatAccessible(timeLeft, ceremonyName);

  return (
    <span
      className="border border-gold-700/30 dark:border-gold-500/30 rounded-full px-2.5 py-0.5 text-xs font-medium text-gold-700 dark:text-gold-400"
      aria-label={accessibleLabel}
    >
      {/* Each span is aria-hidden — the parent aria-label provides the single accessible string */}
      <span className="sm:hidden" aria-hidden="true">{mobileText}</span>
      <span className="hidden sm:inline md:hidden" aria-hidden="true">{tabletText}</span>
      <span className="hidden md:inline" aria-hidden="true">{desktopText}</span>
    </span>
  );
}
