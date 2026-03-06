"use client";

import { useState, useEffect } from "react";
import { PredictionForm } from "@/components/demo/PredictionForm";
import { ResultsReveal } from "@/components/demo/ResultsReveal";
import { Leaderboard } from "@/components/demo/Leaderboard";
import { scorePredictions } from "@/lib/demo/scoring";
import { getRivalScores } from "@/lib/demo/rivals";
import { CEREMONY_NAME } from "@/lib/demo/oscar-data";
import type { Prediction } from "@/lib/demo/scoring";
import Link from "next/link";

type DemoPhase = "predict" | "reveal" | "leaderboard";

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
    setPhase("reveal");
  };

  const handleRevealComplete = () => {
    setPhase("leaderboard");
  };

  const handleRestart = () => {
    setPredictions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setPhase("predict");
  };

  const userScore = scorePredictions(predictions, "You");
  const rivalScores = getRivalScores();

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
            <PhaseIndicator phase={phase} />
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

function PhaseIndicator({ phase }: { phase: DemoPhase }) {
  const phases: { key: DemoPhase; label: string }[] = [
    { key: "predict", label: "Predict" },
    { key: "reveal", label: "Results" },
    { key: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <div className="flex items-center gap-1">
      {phases.map((p, i) => (
        <div key={p.key} className="flex items-center">
          <span
            className={`text-xs ${
              p.key === phase
                ? "font-semibold text-gold-400"
                : phases.indexOf(phases.find((x) => x.key === phase)!) > i
                  ? "text-gray-400"
                  : "text-gray-600"
            }`}
          >
            {p.label}
          </span>
          {i < phases.length - 1 && (
            <span className="mx-1 text-gray-700">/</span>
          )}
        </div>
      ))}
    </div>
  );
}
