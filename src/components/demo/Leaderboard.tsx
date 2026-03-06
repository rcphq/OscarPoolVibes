"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  const [phase, setPhase] = useState<"score" | "ranking" | "details">("score");
  const allScores = useMemo(
    () => [userScore, ...rivalScores].sort((a, b) => b.totalPoints - a.totalPoints),
    [userScore, rivalScores]
  );
  const userRank = useMemo(
    () => allScores.findIndex((s) => s.name === userScore.name) + 1,
    [allScores, userScore.name]
  );
  const topScore = allScores[0].totalPoints;

  // Staged reveal: score card -> ranking -> details
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ranking"), 1200);
    const t2 = setTimeout(() => setPhase("details"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Hero score card */}
      <div className="animate-scale-in mb-8 rounded-xl border border-gold-500/30 bg-gradient-to-br from-card to-background p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-gold-500">
          Your Final Score
        </p>
        <CountUpScore
          target={userScore.totalPoints}
          className="mt-2 text-6xl font-bold text-gold-400"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          out of {userScore.maxPossible} possible points
        </p>

        {/* Rank reveal with trophy */}
        <div
          className={`mt-4 flex items-center justify-center gap-6 transition-all duration-500 ${
            phase !== "score" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="text-center">
            <p className="flex items-center justify-center gap-1">
              {userRank <= 3 && (
                <span
                  className="animate-trophy-bounce inline-block text-lg"
                  role="img"
                  aria-label={
                    userRank === 1
                      ? "First place"
                      : userRank === 2
                        ? "Second place"
                        : "Third place"
                  }
                >
                  {userRank === 1 ? "\u{1F947}" : userRank === 2 ? "\u{1F948}" : "\u{1F949}"}
                </span>
              )}
              <span
                className={`text-xl font-bold ${
                  userRank <= 3 ? "text-gold-400" : "text-foreground"
                }`}
              >
                #{userRank}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Rank</p>
          </div>
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

      {/* Leaderboard bar chart — staggered entry */}
      {phase !== "score" && (
        <>
          <h3 className="animate-fade-in mb-3 text-lg font-semibold text-foreground">
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
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div
                    className={`rounded-lg border px-4 py-2 transition-colors ${
                      isUser
                        ? "border-gold-500/40 bg-gold-500/10"
                        : "border-border bg-card/50"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RankBadge rank={index + 1} />
                        <span
                          className={`text-sm font-medium ${
                            isUser ? "text-gold-300" : "text-foreground/80"
                          }`}
                        >
                          {isUser ? `${score.name} (You)` : score.name}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          isUser ? "text-gold-400" : "text-muted-foreground"
                        }`}
                      >
                        {score.totalPoints} pts
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`animate-bar-fill h-full rounded-full ${
                          isUser ? "bg-gold-500" : "bg-muted-foreground/40"
                        }`}
                        style={{
                          width: `${barWidth}%`,
                          animationDelay: `${index * 80 + 300}ms`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Details section — appears last */}
      {phase === "details" && (
        <div className="animate-fade-in-up">
          {/* Score breakdown toggle */}
          <button
            onClick={() => setShowBreakdown((b) => !b)}
            className="mb-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground/80 transition hover:border-border hover:text-foreground"
            aria-expanded={showBreakdown}
          >
            {showBreakdown ? "Hide" : "Show"} Category Breakdown
          </button>

          {showBreakdown && (
            <div className="animate-fade-in">
              <CategoryBreakdown scores={userScore.categoryScores} />
            </div>
          )}

          {/* Points by category chart */}
          <h3 className="mb-3 mt-8 text-lg font-semibold text-foreground">
            Points by Category
          </h3>
          <div className="mb-8 space-y-1">
            {userScore.categoryScores.map((cs, i) => (
              <div
                key={cs.categoryId}
                className="flex items-center gap-2"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="w-40 truncate text-xs text-muted-foreground">
                  {cs.categoryName}
                </span>
                <div className="flex-1">
                  <div className="h-4 overflow-hidden rounded bg-muted">
                    {cs.earnedPoints > 0 && (
                      <div
                        className={`animate-bar-fill h-full rounded ${
                          cs.firstChoiceCorrect
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${(cs.earnedPoints / cs.pointValue) * 100}%`,
                          animationDelay: `${i * 40}ms`,
                        }}
                      />
                    )}
                  </div>
                </div>
                <span className="w-12 text-right text-xs font-medium text-muted-foreground">
                  {cs.earnedPoints}/{cs.pointValue}
                </span>
              </div>
            ))}
          </div>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full rounded-lg bg-primary py-3 text-lg font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

/** Animated number count-up */
function CountUpScore({
  target,
  className,
}: {
  target: number;
  className?: string;
}) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(-1);

  useEffect(() => {
    if (target === 0) return;
    const duration = 800;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target]);

  return (
    <p className={className} aria-live="polite" aria-label={`Score: ${target}`}>
      {current}
    </p>
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
          accent ? "text-gold-400" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "text-gold-400"
      : rank === 2
        ? "text-foreground/80"
        : rank === 3
          ? "text-amber-600"
          : "text-muted-foreground";

  return <span className={`text-sm font-bold ${colors}`}>#{rank}</span>;
}

function CategoryBreakdown({ scores }: { scores: CategoryScore[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card/80">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Category
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your Pick
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Winner
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((cs) => (
            <tr
              key={cs.categoryId}
              className="border-b border-border/50 last:border-none"
            >
              <td className="px-3 py-2 text-foreground/80">{cs.categoryName}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    cs.firstChoiceCorrect
                      ? "text-green-400"
                      : cs.runnerUpCorrect
                        ? "text-yellow-400"
                        : "text-muted-foreground"
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
                      : "text-muted-foreground/60"
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
