"use client";

import { useCallback, useState, useTransition, useEffect } from "react";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { savePredictions } from "@/app/pools/[id]/predict/actions";
import { useOdds } from "@/hooks/use-odds";
import { OddsBadge } from "@/components/pools/OddsBadge";
import { normalizeNomineeName } from "@/lib/odds/fetch-odds";

type Nominee = {
  id: string;
  name: string;
  subtitle: string | null;
};

type Category = {
  id: string;
  name: string;
  displayOrder: number;
  pointValue: number;
  nominees: Nominee[];
};

type ExistingPrediction = {
  categoryId: string;
  firstChoiceId: string;
  runnerUpId: string;
};

type PredictionFormProps = {
  categories: Category[];
  existingPredictions: ExistingPrediction[];
  poolId: string;
  isLocked: boolean;
};

type Selections = Record<
  string,
  { firstChoiceId: string; runnerUpId: string }
>;

export function PredictionForm({
  categories,
  existingPredictions,
  poolId,
  isLocked,
}: PredictionFormProps) {
  // Build initial state from existing predictions
  const initialSelections: Selections = {};
  for (const pred of existingPredictions) {
    initialSelections[pred.categoryId] = {
      firstChoiceId: pred.firstChoiceId,
      runnerUpId: pred.runnerUpId,
    };
  }

  const [selections, setSelections] = useState<Selections>(initialSelections);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [hideOdds, setHideOdds] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("hideOdds");
    if (stored !== null) {
      setHideOdds(stored === "true");
    }
  }, []);

  const handleToggleOdds = (checked: boolean) => {
    setHideOdds(checked);
    localStorage.setItem("hideOdds", String(checked));
  };

  const { odds } = useOdds(!hideOdds);

  const handleFirstChoiceChange = useCallback(
    (categoryId: string, nomineeId: string) => {
      setSelections((prev) => {
        const current = prev[categoryId];
        // If the new first choice is the same as the current runner-up, clear runner-up
        const runnerUpId =
          current?.runnerUpId === nomineeId ? "" : current?.runnerUpId ?? "";
        return {
          ...prev,
          [categoryId]: { firstChoiceId: nomineeId, runnerUpId },
        };
      });
      setFeedback(null);
    },
    []
  );

  const handleRunnerUpChange = useCallback(
    (categoryId: string, nomineeId: string) => {
      setSelections((prev) => ({
        ...prev,
        [categoryId]: {
          firstChoiceId: prev[categoryId]?.firstChoiceId ?? "",
          runnerUpId: nomineeId,
        },
      }));
      setFeedback(null);
    },
    []
  );

  const handleSubmit = () => {
    // Build predictions array from selections — only include fully filled categories
    const predictions = Object.entries(selections)
      .filter(([, sel]) => sel.firstChoiceId && sel.runnerUpId)
      .map(([categoryId, sel]) => ({
        categoryId,
        firstChoiceId: sel.firstChoiceId,
        runnerUpId: sel.runnerUpId,
      }));

    if (predictions.length === 0) {
      setFeedback({
        type: "error",
        message:
          "Please select both a first choice and runner-up for at least one category.",
      });
      return;
    }

    startTransition(async () => {
      const result = await savePredictions({ poolId, predictions });

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({
          type: "success",
          message: "Predictions saved successfully!",
        });
        toast.success("Predictions saved!");
      }
    });
  };

  const filledCount = Object.values(selections).filter(
    (s) => s.firstChoiceId && s.runnerUpId
  ).length;

  return (
    <div className="space-y-6">
      {/* Progress and Odds Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filledCount} of {categories.length} categories completed
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 shadow-sm backdrop-blur">
          <Switch
            id="never-tell-me"
            checked={hideOdds}
            onCheckedChange={handleToggleOdds}
          />
          <Label htmlFor="never-tell-me" className="cursor-pointer text-sm font-medium text-foreground">
            Never tell me the odds
          </Label>
        </div>
      </div>

      {/* Category cards */}
      {categories.map((category) => {
        const sel = selections[category.id];
        const firstChoiceId = sel?.firstChoiceId ?? "";
        const runnerUpId = sel?.runnerUpId ?? "";

        // Filter runner-up options to exclude first choice
        const runnerUpNominees = category.nominees.filter(
          (n) => n.id !== firstChoiceId
        );

        return (
          <Card key={category.id} className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="font-heading text-lg text-gold-400">
                  {category.name}
                </CardTitle>
                <span className="inline-flex items-center rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-400">
                  {category.pointValue} pts
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* First Choice */}
                <div className="space-y-2">
                  <Label htmlFor={`first-${category.id}`}>First Choice</Label>
                  <Select
                    value={firstChoiceId}
                    onValueChange={(value) =>
                      handleFirstChoiceChange(category.id, value)
                    }
                    disabled={isLocked}
                  >
                    <SelectTrigger
                      id={`first-${category.id}`}
                      className="w-full"
                    >
                      <SelectValue placeholder="Select nominee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {category.nominees.map((nominee) => {
                        const normName = normalizeNomineeName(nominee.name);
                        const nomineeOdds = odds?.[normName];
                        
                        return (
                          <SelectItem key={nominee.id} value={nominee.id} className="w-full">
                            <div className="flex w-full items-center justify-between gap-4">
                              <span className="truncate">
                                {nominee.name}
                                {nominee.subtitle && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    — {nominee.subtitle}
                                  </span>
                                )}
                              </span>
                              {!hideOdds && (
                                <OddsBadge 
                                  polymarket={nomineeOdds?.polymarket ?? null} 
                                  kalshi={nomineeOdds?.kalshi ?? null} 
                                />
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {!hideOdds && firstChoiceId && odds?.[normalizeNomineeName(category.nominees.find(n => n.id === firstChoiceId)?.name || '')] && (
                    <div className="mt-1 flex justify-end">
                      <OddsBadge 
                        polymarket={odds[normalizeNomineeName(category.nominees.find(n => n.id === firstChoiceId)?.name || '')]?.polymarket ?? null}
                        kalshi={odds[normalizeNomineeName(category.nominees.find(n => n.id === firstChoiceId)?.name || '')]?.kalshi ?? null}
                      />
                    </div>
                  )}
                </div>

                {/* Runner-Up */}
                <div className="space-y-2">
                  <Label htmlFor={`runner-${category.id}`}>Runner-Up</Label>
                  <Select
                    value={runnerUpId}
                    onValueChange={(value) =>
                      handleRunnerUpChange(category.id, value)
                    }
                    disabled={isLocked || !firstChoiceId}
                  >
                    <SelectTrigger
                      id={`runner-${category.id}`}
                      className="w-full"
                    >
                      <SelectValue
                        placeholder={
                          firstChoiceId
                            ? "Select runner-up..."
                            : "Choose first pick first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {runnerUpNominees.map((nominee) => {
                        const normName = normalizeNomineeName(nominee.name);
                        const nomineeOdds = odds?.[normName];

                        return (
                          <SelectItem key={nominee.id} value={nominee.id} className="w-full">
                            <div className="flex w-full items-center justify-between gap-4">
                              <span className="truncate">
                                {nominee.name}
                                {nominee.subtitle && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    — {nominee.subtitle}
                                  </span>
                                )}
                              </span>
                              {!hideOdds && (
                                <OddsBadge 
                                  polymarket={nomineeOdds?.polymarket ?? null} 
                                  kalshi={nomineeOdds?.kalshi ?? null} 
                                />
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {!hideOdds && runnerUpId && odds?.[normalizeNomineeName(category.nominees.find(n => n.id === runnerUpId)?.name || '')] && (
                    <div className="mt-1 flex justify-end">
                      <OddsBadge 
                        polymarket={odds[normalizeNomineeName(category.nominees.find(n => n.id === runnerUpId)?.name || '')]?.polymarket ?? null}
                        kalshi={odds[normalizeNomineeName(category.nominees.find(n => n.id === runnerUpId)?.name || '')]?.kalshi ?? null}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Feedback message */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
          role="alert"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Sticky submit button on mobile */}
      {!isLocked && (
        <div className="sticky bottom-4 z-10 flex justify-center pt-2">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isPending || filledCount === 0}
            className="w-full shadow-lg sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save All Predictions"
            )}
          </Button>
        </div>
      )}

      {/* Locked overlay message */}
      {isLocked && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-4 text-gold-300">
          <Lock className="size-5" />
          <span className="font-medium">
            Predictions are locked — no further changes can be made.
          </span>
        </div>
      )}
    </div>
  );
}
