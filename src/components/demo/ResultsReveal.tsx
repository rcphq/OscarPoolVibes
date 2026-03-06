"use client";

import { useState, useEffect, useMemo } from "react";
import { DEMO_CATEGORIES, getWinner } from "@/lib/demo/oscar-data";
import type { Prediction } from "@/lib/demo/scoring";

type ResultsRevealProps = {
  predictions: Prediction[];
  onComplete: () => void;
};

export function ResultsReveal({ predictions, onComplete }: ResultsRevealProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);

  useEffect(() => {
    if (!isAutoRevealing) return;
    if (revealedCount >= DEMO_CATEGORIES.length) {
      setIsAutoRevealing(false);
      return;
    }
    const timer = setTimeout(
      () => setRevealedCount((c) => c + 1),
      900
    );
    return () => clearTimeout(timer);
  }, [isAutoRevealing, revealedCount]);

  const handleRevealAll = () => {
    setIsAutoRevealing(true);
    setRevealedCount(1);
  };

  const handleRevealNext = () => {
    setRevealedCount((c) => Math.min(c + 1, DEMO_CATEGORIES.length));
  };

  const allRevealed = revealedCount >= DEMO_CATEGORIES.length;

  // Running score tally
  const runningScore = useMemo(() => {
    let total = 0;
    for (let i = 0; i < revealedCount; i++) {
      const category = DEMO_CATEGORIES[i];
      const prediction = predictions.find((p) => p.categoryId === category.id);
      const winner = getWinner(category);
      if (prediction?.firstChoiceId === winner.id) {
        total += category.pointValue;
      } else if (prediction?.runnerUpId === winner.id) {
        total += Math.round(category.pointValue * 0.5);
      }
    }
    return total;
  }, [revealedCount, predictions]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header with running score */}
      <div className="mb-6 text-center">
        <h2 className="animate-fade-in text-2xl font-bold text-gold-400">
          And the Winners Are...
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {allRevealed
            ? "All winners revealed!"
            : `${revealedCount}/${DEMO_CATEGORIES.length} categories revealed`}
        </p>
        {revealedCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-1.5">
            <span className="text-xs uppercase tracking-wider text-gold-600">
              Score
            </span>
            <span
              key={runningScore}
              className="animate-count-up-bounce text-lg font-bold text-gold-400"
            >
              {runningScore}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      {!isAutoRevealing && revealedCount === 0 && (
        <div className="animate-fade-in mb-6 flex justify-center gap-3">
          <button
            onClick={handleRevealNext}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
          >
            One by One
          </button>
          <button
            onClick={handleRevealAll}
            className="animate-pulse-gold rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Reveal All
          </button>
        </div>
      )}

      {!isAutoRevealing && revealedCount > 0 && !allRevealed && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={handleRevealNext}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Reveal Next
          </button>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {DEMO_CATEGORIES.map((category, index) => {
          const isRevealed = index < revealedCount;
          const isJustRevealed = index === revealedCount - 1;
          const winner = getWinner(category);
          const prediction = predictions.find(
            (p) => p.categoryId === category.id
          );
          const firstChoiceCorrect =
            prediction?.firstChoiceId === winner.id;
          const runnerUpCorrect =
            !firstChoiceCorrect && prediction?.runnerUpId === winner.id;
          const gotPoints = firstChoiceCorrect || runnerUpCorrect;

          return (
            <div
              key={category.id}
              className={`overflow-hidden rounded-lg border transition-all duration-500 ${
                isRevealed
                  ? gotPoints
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-border bg-card/50"
                  : index === revealedCount
                    ? "animate-shimmer border-gold-500/20 bg-card/40"
                    : "border-border bg-card/30"
              } ${isJustRevealed ? "animate-dramatic-glow" : ""}`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gold-500">
                    {category.pointValue} pts
                  </span>
                  <span className="font-medium text-foreground">
                    {category.name}
                  </span>
                </div>

                {isRevealed ? (
                  <div
                    className={`flex items-center gap-2 ${
                      isJustRevealed ? "animate-slide-in-right" : ""
                    }`}
                  >
                    {/* Winner name */}
                    <span className="text-sm font-semibold text-gold-300">
                      {winner.name}
                    </span>

                    {/* Score badge */}
                    {firstChoiceCorrect && (
                      <span
                        className={`rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400 ${
                          isJustRevealed ? "animate-confetti-pop" : ""
                        }`}
                      >
                        +{category.pointValue}
                      </span>
                    )}
                    {runnerUpCorrect && (
                      <span
                        className={`rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400 ${
                          isJustRevealed ? "animate-confetti-pop" : ""
                        }`}
                      >
                        +{Math.round(category.pointValue * 0.5)}
                      </span>
                    )}
                    {!gotPoints && prediction?.firstChoiceId && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400/70">
                        miss
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground/40">
                    {index === revealedCount ? "..." : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Leaderboard CTA */}
      {allRevealed && (
        <div className="animate-fade-in-up mt-8">
          <div className="mb-4 text-center">
            <span className="text-3xl" role="img" aria-label="Trophy">
              {runningScore > 60 ? "\u{1F3C6}" : runningScore > 30 ? "\u{1F44F}" : "\u{1F3AC}"}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              {runningScore > 60
                ? "Outstanding picks!"
                : runningScore > 30
                  ? "Solid showing!"
                  : "Better luck next year!"}
            </p>
          </div>
          <button
            onClick={onComplete}
            className="w-full rounded-lg bg-primary py-3 text-lg font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            View Leaderboard
          </button>
        </div>
      )}
    </div>
  );
}
