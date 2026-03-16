"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Shape of one category slide — matches the Prisma select in getCategoriesWithNominees */
type CarouselCategory = {
  name: string;
  /** Populated once a winner has been selected for this category; null otherwise. */
  winnerId: string | null;
  nominees: { id: string; name: string; subtitle: string | null }[];
};

interface NomineesCarouselProps {
  categories: CarouselCategory[];
}

/** How long each category is shown before auto-advancing (ms) */
const AUTO_ADVANCE_MS = 5000;

/** How long after a manual interaction before auto-advance resumes (ms) */
const RESUME_AFTER_IDLE_MS = 3000;

/**
 * NomineesCarousel
 *
 * Displays an animated "And the nominees are…" card that cycles through all
 * Oscar categories. Auto-advances every 5 s, pauses on hover, and lets the
 * user navigate manually with prev/next buttons or keyboard arrows.
 *
 * Respects `prefers-reduced-motion` — transitions are instant when set.
 */
export function NomineesCarousel({ categories }: NomineesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  /** Controls the fade-in animation on slide change */
  const [visible, setVisible] = useState(true);
  /** True while the user is hovering over the carousel */
  const [paused, setPaused] = useState(false);
  /** True on first paint to avoid SSR/client mismatch */
  const [mounted, setMounted] = useState(false);

  // Ref to the resume-after-idle timer so we can clear it on re-interaction
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /** Transition to a new index with a brief fade-out → fade-in */
  const goTo = useCallback(
    (nextIndex: number) => {
      setVisible(false);
      // Wait for fade-out (150 ms) then swap content and fade back in.
      // When prefers-reduced-motion is set the transition-duration is 0 ms,
      // so this setTimeout fires before the next paint anyway.
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setVisible(true);
      }, 150);
    },
    [],
  );

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % categories.length);
  }, [currentIndex, categories.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + categories.length) % categories.length);
  }, [currentIndex, categories.length, goTo]);

  /** Manual navigation pauses auto-advance and schedules a resume after idle */
  const handleManualNav = useCallback(
    (direction: "prev" | "next") => {
      setPaused(true);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(
        () => setPaused(false),
        RESUME_AFTER_IDLE_MS,
      );
      if (direction === "prev") {
        goPrev();
      } else {
        goNext();
      }
    },
    [goPrev, goNext],
  );

  // Auto-advance interval — stops when paused (hover or post-manual-nav)
  useEffect(() => {
    if (paused || categories.length <= 1) return;
    const id = setInterval(goNext, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, categories.length, goNext]);

  // Clean up the resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Nothing to show until the component is mounted client-side
  if (!mounted || categories.length === 0) return null;

  const current = categories[currentIndex];

  return (
    <div
      className="w-full py-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Eyebrow label — switches to "winners" once a winner is recorded for this category */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-200">
        {current.winnerId ? "And the winners are\u2026" : "And the nominees are\u2026"}
      </p>

      {/* Slide content */}
      <div
        className="relative min-h-[7rem] transition-opacity duration-150 motion-reduce:transition-none"
        style={{ opacity: visible ? 1 : 0 }}
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Category name */}
        <h3 className="font-heading text-xl font-semibold text-gold-400 sm:text-2xl">
          {current.name}
        </h3>

        {/* Nominee list — winner row gets a gold shimmer and star badge */}
        <ul className="mt-2 flex flex-col gap-0.5">
          {current.nominees.map((nominee) => {
            const isWinner = nominee.id === current.winnerId;
            return (
              <li
                key={nominee.id}
                className={
                  isWinner
                    ? "animate-shimmer animate-glow-pulse flex items-baseline gap-1 text-sm font-semibold text-gold-400"
                    : "text-sm text-foreground/80"
                }
              >
                {/* Star badge visible only on the winning nominee */}
                {isWinner && (
                  <span aria-label="Winner" className="shrink-0 text-gold-400">
                    ★
                  </span>
                )}
                {nominee.name}
                {nominee.subtitle && (
                  <span className={isWinner ? "ml-1 text-gold-300/70" : "ml-1 text-muted-foreground"}>
                    — {nominee.subtitle}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Controls row: prev · dots · next */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={() => handleManualNav("prev")}
          aria-label="Previous category"
          className="rounded-full p-1 text-gold-400 transition-colors hover:text-gold-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5" role="tablist" aria-label="Category slides">
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Go to ${cat.name}`}
              onClick={() => {
                setPaused(true);
                if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = setTimeout(
                  () => setPaused(false),
                  RESUME_AFTER_IDLE_MS,
                );
                goTo(i);
              }}
              className={[
                "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400",
                i === currentIndex
                  ? "w-4 bg-gold-400"
                  : "w-1.5 bg-gold-400/30 hover:bg-gold-400/60",
              ].join(" ")}
            />
          ))}
        </div>

        <button
          onClick={() => handleManualNav("next")}
          aria-label="Next category"
          className="rounded-full p-1 text-gold-400 transition-colors hover:text-gold-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
