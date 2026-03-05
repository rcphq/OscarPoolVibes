"use client";

import { useState } from "react";
import {
  Trophy,
  Medal,
  ChevronDown,
  ChevronUp,
  Crown,
  Check,
  X,
} from "lucide-react";
import type { LeaderboardEntry } from "@/lib/scoring/calculate-leaderboard";
import type { CategoryScore } from "@/lib/scoring/calculate-score";

type CategoryInfo = {
  id: string;
  name: string;
  displayOrder: number;
  pointValue: number;
  winnerId: string | null;
  winnerName: string | null;
};

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  categories: CategoryInfo[];
  currentUserId: string;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center gap-1 rounded-full bg-gold-500/20 px-2.5 py-1 text-sm font-bold text-gold-300">
        <Crown className="size-4" />
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center gap-1 rounded-full bg-gray-300/15 px-2.5 py-1 text-sm font-bold text-gray-300">
        <Medal className="size-4" />
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center gap-1 rounded-full bg-amber-700/15 px-2.5 py-1 text-sm font-bold text-amber-600">
        <Medal className="size-4" />
        {rank}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2.5 py-1 text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

function Avatar({
  image,
  name,
}: {
  image: string | null;
  name: string | null;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt=""
        className="size-8 rounded-full"
      />
    );
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

function CategoryBreakdownRow({
  score,
  category,
}: {
  score: CategoryScore | undefined;
  category: CategoryInfo;
}) {
  if (!score) {
    return (
      <tr className="border-b border-border/30 last:border-b-0">
        <td className="py-2 pl-14 pr-4 text-sm text-muted-foreground">
          {category.name}
        </td>
        <td className="px-4 py-2 text-center text-sm italic text-muted-foreground/50">
          No pick
        </td>
        <td className="px-4 py-2 text-center text-sm text-muted-foreground">
          --
        </td>
      </tr>
    );
  }

  const isCorrectFirst = score.isFirstChoiceCorrect;
  const isCorrectRunner = score.isRunnerUpCorrect;
  const hasWinner = score.winnerId !== null;

  let rowClass = "";
  if (isCorrectFirst) {
    rowClass = "bg-gold-500/10";
  } else if (isCorrectRunner) {
    rowClass = "bg-gray-300/5";
  }

  return (
    <tr
      className={`border-b border-border/30 last:border-b-0 ${rowClass}`}
    >
      <td className="py-2 pl-14 pr-4">
        <div className="text-sm font-medium">{category.name}</div>
        {hasWinner && category.winnerName && (
          <div className="text-xs text-muted-foreground">
            Winner: {category.winnerName}
          </div>
        )}
      </td>
      <td className="px-4 py-2 text-center">
        {isCorrectFirst ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold-300">
            <Trophy className="size-3.5" />
            1st choice correct
          </span>
        ) : isCorrectRunner ? (
          <span className="inline-flex items-center gap-1 text-sm text-gray-300">
            <Check className="size-3.5" />
            Runner-up correct
          </span>
        ) : hasWinner ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground/60">
            <X className="size-3.5" />
            Incorrect
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/50">Pending</span>
        )}
      </td>
      <td className="px-4 py-2 text-center">
        <span
          className={`text-sm font-semibold ${
            score.points > 0 ? "text-gold-300" : "text-muted-foreground"
          }`}
        >
          {score.points > 0 ? `+${score.points}` : score.points}
        </span>
      </td>
    </tr>
  );
}

export function LeaderboardTable({
  entries,
  categories,
  currentUserId,
}: LeaderboardTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (poolMemberId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(poolMemberId)) {
        next.delete(poolMemberId);
      } else {
        next.add(poolMemberId);
      }
      return next;
    });
  };

  // Build a map from categoryId to score for each entry
  const sortedCategories = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[500px] border-collapse">
        <thead>
          <tr className="bg-navy text-sm">
            <th className="px-4 py-3 text-left font-semibold text-gold-100/80">
              Rank
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gold-100/80">
              Player
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gold-300">
              Score
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gold-100/80">
              Correct
            </th>
            <th className="w-10 px-2 py-3">
              <span className="sr-only">Expand</span>
            </th>
          </tr>
        </thead>
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const isExpanded = expandedRows.has(entry.poolMemberId);

            // Build breakdown lookup
            const breakdownMap = new Map<string, CategoryScore>();
            for (const b of entry.breakdown) {
              breakdownMap.set(b.categoryId, b);
            }

            return (
              <tbody key={entry.poolMemberId}>
                <tr
                  className={`border-b transition-colors hover:bg-muted/30 ${
                    isCurrentUser
                      ? "border-l-2 border-l-gold-400 bg-gold-500/5"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        image={entry.userImage}
                        name={entry.userName}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {entry.userName ?? "Anonymous"}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs font-normal text-gold-400">
                              (you)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-lg font-bold text-gold-300">
                      {entry.totalScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-muted-foreground">
                      {entry.correctFirstChoices + entry.correctRunnerUps} /{" "}
                      {entry.breakdown.length}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => toggleRow(entry.poolMemberId)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} details for ${entry.userName ?? "Anonymous"}`}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="bg-muted/10 p-0">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="py-2 pl-14 pr-4 text-left text-xs font-semibold text-muted-foreground">
                              Category
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">
                              Result
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">
                              Points
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCategories.map((cat) => (
                            <CategoryBreakdownRow
                              key={cat.id}
                              score={breakdownMap.get(cat.id)}
                              category={cat}
                            />
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}
      </table>
    </div>
  );
}
