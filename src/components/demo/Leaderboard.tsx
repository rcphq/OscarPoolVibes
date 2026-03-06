"use client";

import { useState } from "react";
import type { PlayerScore, CategoryScore } from "@/lib/demo/scoring";

type LeaderboardProps = {
  userScore: PlayerScore;
  rivalScores: PlayerScore[];
  onRestart: () => void;
};

export function Leaderboard({
  userScore,
  rivalScores,
  onRestart,
}: LeaderboardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const allScores = [userScore, ...rivalScores].sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
  const userRank = allScores.findIndex((s) => s.name === userScore.name) + 1;
  const topScore = allScores[0].totalPoints;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Hero score card */}
      <div className="mb-8 rounded-xl border border-gold-500/30 bg-gradient-to-br from-gray-900 to-gray-950 p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-gold-500">
          Your Final Score
        </p>
        <p className="mt-2 text-6xl font-bold text-gold-400">
          {userScore.totalPoints}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          out of {userScore.maxPossible} possible points
        </p>
        <div className="mt-4 flex items-center justify-center gap-6">
          <Stat
            label="Rank"
            value={`#${userRank}`}
            accent={userRank <= 3}
          />
          <Stat
            label="Correct Picks"
            value={String(userScore.correctFirstChoices)}
          />
          <Stat
            label="Runner-Up Hits"
            value={String(userScore.correctRunnerUps)}
          />
        </div>
      </div>

      {/* Leaderboard bar chart */}
      <h3 className="mb-3 text-lg font-semibold text-gray-200">
        Pool Rankings
      </h3>
      <div className="mb-8 space-y-2">
        {allScores.map((score, index) => {
          const isUser = score.name === userScore.name;
          const barWidth =
            topScore > 0 ? (score.totalPoints / topScore) * 100 : 0;

          return (
            <div
              key={score.name}
              className={`rounded-lg border px-4 py-2 ${
                isUser
                  ? "border-gold-500/40 bg-gold-500/10"
                  : "border-gray-800 bg-gray-900/50"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      index === 0
                        ? "text-gold-400"
                        : index === 1
                          ? "text-gray-300"
                          : index === 2
                            ? "text-amber-600"
                            : "text-gray-500"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isUser ? "text-gold-300" : "text-gray-300"
                    }`}
                  >
                    {isUser ? `${score.name} (You)` : score.name}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isUser ? "text-gold-400" : "text-gray-400"
                  }`}
                >
                  {score.totalPoints} pts
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isUser ? "bg-gold-500" : "bg-gray-600"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Score breakdown toggle */}
      <button
        onClick={() => setShowBreakdown((b) => !b)}
        className="mb-4 w-full rounded-lg border border-gray-700 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:text-gray-200"
      >
        {showBreakdown ? "Hide" : "Show"} Category Breakdown
      </button>

      {showBreakdown && (
        <CategoryBreakdown scores={userScore.categoryScores} />
      )}

      {/* Score distribution chart */}
      <h3 className="mb-3 mt-8 text-lg font-semibold text-gray-200">
        Points by Category
      </h3>
      <div className="mb-8 space-y-1">
        {userScore.categoryScores.map((cs) => (
          <div key={cs.categoryId} className="flex items-center gap-2">
            <span className="w-40 truncate text-xs text-gray-400">
              {cs.categoryName}
            </span>
            <div className="flex-1">
              <div className="h-4 overflow-hidden rounded bg-gray-800">
                {cs.earnedPoints > 0 && (
                  <div
                    className={`h-full rounded ${
                      cs.firstChoiceCorrect ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    style={{
                      width: `${(cs.earnedPoints / cs.pointValue) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
            <span className="w-12 text-right text-xs font-medium text-gray-400">
              {cs.earnedPoints}/{cs.pointValue}
            </span>
          </div>
        ))}
      </div>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="w-full rounded-lg bg-gold-500 py-3 text-lg font-semibold text-gray-950 transition hover:bg-gold-400"
      >
        Try Again
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-xl font-bold ${
          accent ? "text-gold-400" : "text-gray-200"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function CategoryBreakdown({ scores }: { scores: CategoryScore[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/80">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Category
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Your Pick
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Winner
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((cs) => (
            <tr
              key={cs.categoryId}
              className="border-b border-gray-800/50 last:border-none"
            >
              <td className="px-3 py-2 text-gray-300">{cs.categoryName}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    cs.firstChoiceCorrect
                      ? "text-green-400"
                      : cs.runnerUpCorrect
                        ? "text-yellow-400"
                        : "text-gray-500"
                  }
                >
                  {cs.firstChoiceName}
                </span>
                {cs.runnerUpCorrect && (
                  <span className="ml-1 text-xs text-yellow-500">
                    (runner-up: {cs.runnerUpName})
                  </span>
                )}
              </td>
              <td className="px-3 py-2 font-medium text-gold-300">
                {cs.winnerName}
              </td>
              <td className="px-3 py-2 text-right">
                <span
                  className={`font-semibold ${
                    cs.earnedPoints > 0
                      ? cs.firstChoiceCorrect
                        ? "text-green-400"
                        : "text-yellow-400"
                      : "text-gray-600"
                  }`}
                >
                  {cs.earnedPoints}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
