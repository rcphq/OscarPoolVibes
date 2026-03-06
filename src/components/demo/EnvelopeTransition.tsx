"use client";

import { useState, useEffect } from "react";

type EnvelopeTransitionProps = {
  onComplete: () => void;
};

/**
 * Dramatic interstitial between locking predictions and revealing results.
 * Envelope-opening moment with gold shimmer and suspenseful text.
 */
export function EnvelopeTransition({ onComplete }: EnvelopeTransitionProps) {
  const [stage, setStage] = useState(0);
  // 0: "Predictions locked" text fades in
  // 1: Envelope appears
  // 2: "Opening..." shimmer
  // 3: auto-advance to results

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 800),
      setTimeout(() => setStage(2), 2000),
      setTimeout(() => setStage(3), 3200),
      setTimeout(() => onComplete(), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Preparing results"
    >
      {/* Locked text */}
      <p
        className={`mb-8 text-sm font-medium uppercase tracking-[0.3em] text-gray-500 transition-opacity duration-500 ${
          stage >= 0 ? "animate-fade-in" : "opacity-0"
        }`}
      >
        Predictions Locked
      </p>

      {/* Envelope */}
      <div
        className={`relative transition-all duration-700 ${
          stage >= 1 ? "animate-envelope-open" : "scale-90 opacity-0"
        }`}
      >
        <div
          className={`rounded-xl border-2 px-12 py-8 transition-all duration-700 ${
            stage >= 2
              ? "animate-dramatic-glow border-gold-400 bg-gray-900"
              : "border-gray-700 bg-gray-900/80"
          }`}
        >
          {/* Envelope flap */}
          <div className="absolute -top-px left-1/2 h-3 w-16 -translate-x-1/2 rounded-t-full bg-gray-800" />

          <div className="text-center">
            <p className="text-4xl" role="img" aria-label="Envelope">
              {stage < 2 ? "\u2709\uFE0F" : "\u{1F3AC}"}
            </p>
            <p
              className={`mt-4 text-lg font-semibold transition-all duration-500 ${
                stage >= 2 ? "text-gold-400" : "text-gray-400"
              }`}
            >
              {stage < 2
                ? "The envelope, please..."
                : stage < 3
                  ? "And the winners are..."
                  : "Let\u2019s go!"}
            </p>
          </div>
        </div>
      </div>

      {/* Shimmer bar */}
      {stage >= 2 && (
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-gray-800">
          <div className="animate-shimmer h-full w-full rounded-full bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        </div>
      )}

      {/* Skip link for accessibility */}
      <button
        onClick={onComplete}
        className="mt-6 text-xs text-gray-600 underline transition-colors hover:text-gray-400"
      >
        Skip animation
      </button>
    </div>
  );
}
