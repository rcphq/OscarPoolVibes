"use client";

import { useState, useEffect } from "react";
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
    const timer = setTimeout(() => {
      setRevealedCount((c) => c + 1);
    }, 800);
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gold-400">And the Winners Are...</h2>
        <p className="text-sm text-gray-400">
          {allRevealed
            ? "All winners revealed!"
            : `${revealedCount}/${DEMO_CATEGORIES.length} categories revealed`}
        </p>
      </div>

      {!isAutoRevealing && revealedCount === 0 && (
        <div className="mb-6 flex justify-center gap-3">
          <button
            onClick={handleRevealNext}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
          >
            Reveal One by One
          </button>
          <button
            onClick={handleRevealAll}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-gold-400"
          >
            Reveal All
          </button>
        </div>
      )}

      {!isAutoRevealing && revealedCount > 0 && !allRevealed && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={handleRevealNext}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-gold-400"
          >
            Reveal Next
          </button>
        </div>
      )}

      <div className="space-y-2">
        {DEMO_CATEGORIES.map((category, index) => {
          const isRevealed = index < revealedCount;
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
                    ? "border-green-500/30 bg-green-950/20"
                    : "border-gray-700 bg-gray-900/50"
                  : "border-gray-800 bg-gray-900/30"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gold-500">
                    {category.pointValue} pts
                  </span>
                  <span className="font-medium text-gray-100">
                    {category.name}
                  </span>
                </div>

                {isRevealed ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gold-300">
                      {winner.name}
                    </span>
                    {firstChoiceCorrect && (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                        +{category.pointValue}
                      </span>
                    )}
                    {runnerUpCorrect && (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                        +{Math.round(category.pointValue * 0.5)} runner-up
                      </span>
                    )}
                    {!gotPoints && prediction?.firstChoiceId && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                        0
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-600">???</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <button
          onClick={onComplete}
          className="mt-8 w-full rounded-lg bg-gold-500 py-3 text-lg font-semibold text-gray-950 transition hover:bg-gold-400"
        >
          View Leaderboard
        </button>
      )}
    </div>
  );
}
