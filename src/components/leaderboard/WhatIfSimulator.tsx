"use client";

import { useState, useMemo, useCallback } from "react";
import { Dices, RotateCcw, FlaskConical, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateLeaderboard } from "@/lib/scoring/calculate-leaderboard";
import type { LeaderboardEntry } from "@/lib/scoring/calculate-leaderboard";
import { LeaderboardTable } from "./LeaderboardTable";

type WhatIfSimulatorProps = {
  categories: Array<{
    id: string;
    name: string;
    displayOrder: number;
    pointValue: number;
    runnerUpMultiplier: number;
    winnerId: string | null;
    winner: { id: string; name: string } | null;
    nominees: Array<{ id: string; name: string; subtitle: string | null }>;
  }>;
  leaderboardInputs: Array<{
    poolMemberId: string;
    userId: string;
    userName: string | null;
    userImage: string | null;
    predictions: Array<{
      categoryId: string;
      categoryName: string;
      pointValue: number;
      runnerUpMultiplier: number;
      winnerId: string | null;
      tiedWinnerId: string | null;
      firstChoiceId: string;
      runnerUpId: string;
    }>;
  }>;
  currentUserId: string;
};

function SimulationBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-gold-400" />
        <p className="text-sm font-medium text-gold-300">
          SIMULATION — These are not real results
        </p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        <RotateCcw className="size-3" />
        Reset
      </button>
    </div>
  );
}

export function WhatIfSimulator({
  categories,
  leaderboardInputs,
  currentUserId,
}: WhatIfSimulatorProps) {
  const [mockWinners, setMockWinners] = useState<Map<string, string>>(
    new Map()
  );
  const [isOpen, setIsOpen] = useState(false);
  const isSimulating = mockWinners.size > 0;

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  const handleRandomize = useCallback(() => {
    const next = new Map<string, string>();
    for (const cat of categories) {
      if (cat.nominees.length > 0) {
        const randomIndex = Math.floor(Math.random() * cat.nominees.length);
        next.set(cat.id, cat.nominees[randomIndex].id);
      }
    }
    setMockWinners(next);
  }, [categories]);

  const handleCategoryChange = useCallback(
    (categoryId: string, nomineeId: string) => {
      setMockWinners((prev) => {
        const next = new Map(prev);
        if (nomineeId === "__clear__") {
          next.delete(categoryId);
        } else {
          next.set(categoryId, nomineeId);
        }
        return next;
      });
    },
    []
  );

  const handleReset = useCallback(() => {
    setMockWinners(new Map());
  }, []);

  const simulatedEntries: LeaderboardEntry[] | null = useMemo(() => {
    if (!isSimulating || mockWinners.size === 0) return null;

    const simulatedInputs = leaderboardInputs.map((member) => ({
      ...member,
      predictions: member.predictions.map((pred) => ({
        ...pred,
        winnerId: mockWinners.get(pred.categoryId) ?? pred.winnerId,
      })),
    }));

    return calculateLeaderboard(simulatedInputs);
  }, [isSimulating, mockWinners, leaderboardInputs]);

  const simulatedCategoryInfo = useMemo(() => {
    if (!isSimulating || mockWinners.size === 0) return null;

    const nomineeLookup = new Map<string, string>();
    for (const cat of categories) {
      for (const nom of cat.nominees) {
        nomineeLookup.set(nom.id, nom.name);
      }
    }

    return categories.map((c) => {
      const simWinnerId = mockWinners.get(c.id) ?? c.winnerId;
      return {
        id: c.id,
        name: c.name,
        displayOrder: c.displayOrder,
        pointValue: c.pointValue,
        winnerId: simWinnerId,
        winnerName: simWinnerId
          ? nomineeLookup.get(simWinnerId) ?? c.winner?.name ?? null
          : null,
      };
    });
  }, [isSimulating, mockWinners, categories]);

  const filledCount = mockWinners.size;
  const totalCount = categories.length;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-300 transition-all hover:bg-gold-500/20 hover:text-gold-200">
            <FlaskConical className="size-4" />
            What If?
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-heading text-lg text-gold-300">
              <FlaskConical className="size-5" />
              What If? Simulator
            </SheetTitle>
            <SheetDescription>
              Pick hypothetical winners to see how the leaderboard would change.
              {filledCount > 0 && (
                <span className="ml-1 text-gold-400">
                  ({filledCount}/{totalCount} set)
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex gap-2 px-4">
            <button
              onClick={handleRandomize}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-sm font-medium text-gold-300 transition-colors hover:bg-gold-500/20"
            >
              <Dices className="size-4" />
              Randomize All
            </button>
            {mockWinners.size > 0 && (
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              {sortedCategories.map((cat) => {
                const currentValue = mockWinners.get(cat.id);
                const hasRealWinner = cat.winnerId !== null;

                return (
                  <div key={cat.id} className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {cat.name}
                      {hasRealWinner && (
                        <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-400">
                          Decided
                        </span>
                      )}
                    </label>
                    {hasRealWinner && cat.winner && (
                      <p className="text-xs text-muted-foreground">
                        Actual winner: {cat.winner.name}
                      </p>
                    )}
                    <Select
                      value={currentValue ?? "__none__"}
                      onValueChange={(val) =>
                        handleCategoryChange(
                          cat.id,
                          val === "__none__" ? "__clear__" : val
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a winner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">
                            No selection
                          </span>
                        </SelectItem>
                        {cat.nominees.map((nom) => (
                          <SelectItem key={nom.id} value={nom.id}>
                            {nom.name}
                            {nom.subtitle && (
                              <span className="ml-1 text-muted-foreground">
                                — {nom.subtitle}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {isSimulating && simulatedEntries && simulatedCategoryInfo && (
        <div className="mt-8">
          <SimulationBanner onReset={handleReset} />
          <LeaderboardTable
            entries={simulatedEntries}
            categories={simulatedCategoryInfo}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </>
  );
}
