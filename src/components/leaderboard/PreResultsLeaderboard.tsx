"use client";

import Image from "next/image";
import { Lock, Users } from "lucide-react";

type PreResultsLeaderboardProps = {
  poolName: string;
  ceremonyName: string;
  currentUserName: string | null;
  currentUserImage: string | null;
  currentUserPredictionCount: number;
  totalCategories: number;
  memberCount: number;
};

function Avatar({
  image,
  name,
}: {
  image: string | null;
  name: string | null;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={48}
        height={48}
        className="size-12 rounded-full"
      />
    );
  }
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function PreResultsLeaderboard({
  poolName,
  ceremonyName,
  currentUserName,
  currentUserImage,
  currentUserPredictionCount,
  totalCategories,
  memberCount,
}: PreResultsLeaderboardProps) {
  const completionPercent =
    totalCategories > 0
      ? Math.round((currentUserPredictionCount / totalCategories) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="animate-shimmer relative overflow-hidden rounded-lg border border-gold-500/20 bg-gold-500/5 px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-gold-300">
          <Lock className="size-4" />
          Predictions locked &mdash; awaiting ceremony results
        </div>
        <p className="mt-1 text-xs text-gold-200/80">
          {poolName} • {ceremonyName}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Avatar image={currentUserImage} name={currentUserName} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-lg font-semibold text-foreground">
              {currentUserName ?? "Anonymous"}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentUserPredictionCount} of {totalCategories} categories
              predicted
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Completion</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gold-400 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Users className="size-4" />
        {memberCount} {memberCount === 1 ? "member" : "members"} competing
      </div>

      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="size-4 text-muted-foreground/60" />
          <span className="text-sm">
            {totalCategories} categories &bull; awaiting results
          </span>
        </div>
      </div>
    </div>
  );
}
