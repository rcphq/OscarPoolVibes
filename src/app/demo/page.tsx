"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PredictionForm } from "@/components/demo/PredictionForm";
import { EnvelopeTransition } from "@/components/demo/EnvelopeTransition";
import { ResultsReveal } from "@/components/demo/ResultsReveal";
import { Leaderboard } from "@/components/demo/Leaderboard";
import { scorePredictions } from "@/lib/demo/scoring";
import { getRivalScores } from "@/lib/demo/rivals";
import { CEREMONY_NAME } from "@/lib/demo/oscar-data";
import type { Prediction } from "@/lib/demo/scoring";
import Link from "next/link";

type DemoPhase = "predict" | "envelope" | "reveal" | "leaderboard";

const STORAGE_KEY = "oscar-demo-predictions";

export default function DemoPage() {
  const [phase, setPhase] = useState<DemoPhase>("predict");
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  // Load saved predictions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPredictions(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePredictionsSubmit = (newPredictions: Prediction[]) => {
    setPredictions(newPredictions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPredictions));
    } catch {
      // ignore
    }
    setPhase("envelope");
  };

  const handleEnvelopeComplete = useCallback(() => {
    setPhase("reveal");
  }, []);

  const handleRevealComplete = useCallback(() => {
    setPhase("leaderboard");
  }, []);

  const handleRestart = useCallback(() => {
    setPredictions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setPhase("predict");
  }, []);

  const userScore = useMemo(() => scorePredictions(predictions, "You"), [predictions]);
  const rivalScores = useMemo(() => getRivalScores(), []);

  // Map display phase for the indicator (envelope counts as "reveal")
  const displayPhase = phase === "envelope" ? "reveal" : phase;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-gold-400">
            OscarPoolVibes
          </Link>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-400">
              Demo Pool
            </span>
            <PhaseIndicator phase={displayPhase} />
          </div>
        </div>
      </header>

      {/* Ceremony banner */}
      <div className="border-b border-gray-800 bg-gray-900/50 py-3 text-center">
        <p className="text-sm font-medium text-gray-400">{CEREMONY_NAME}</p>
      </div>

      {/* Main content */}
      <main className="px-4 py-8">
        {phase === "predict" && (
          <PredictionForm
            onSubmit={handlePredictionsSubmit}
            initialPredictions={predictions}
          />
        )}
        {phase === "envelope" && (
          <EnvelopeTransition onComplete={handleEnvelopeComplete} />
        )}
        {phase === "reveal" && (
          <ResultsReveal
            predictions={predictions}
            onComplete={handleRevealComplete}
          />
        )}
        {phase === "leaderboard" && (
          <Leaderboard
            userScore={userScore}
            rivalScores={rivalScores}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}

function PhaseIndicator({
  phase,
}: {
  phase: Exclude<DemoPhase, "envelope">;
}) {
  const phases = [
    { key: "predict" as const, label: "Predict" },
    { key: "reveal" as const, label: "Results" },
    { key: "leaderboard" as const, label: "Leaderboard" },
  ];

  const currentIndex = phases.findIndex((p) => p.key === phase);

  return (
    <ol className="flex items-center gap-1" aria-label="Demo progress">
      {phases.map((p, i) => (
        <li key={p.key} className="flex items-center">
          <span
            className={`text-xs transition-colors duration-300 ${
              i === currentIndex
                ? "font-semibold text-gold-400"
                : i < currentIndex
                  ? "text-gray-400"
                  : "text-gray-600"
            }`}
            aria-current={i === currentIndex ? "step" : undefined}
          >
            {p.label}
          </span>
          {i < phases.length - 1 && (
            <span className="mx-1 text-gray-700">/</span>
          )}
        </li>
      ))}
    </ol>
  );
}
