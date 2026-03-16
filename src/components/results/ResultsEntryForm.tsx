"use client";

import { useCallback, useState } from "react";
import { Trophy, Check, AlertTriangle, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Nominee = {
  id: string;
  name: string;
  subtitle: string | null;
};

type CategoryWithNominees = {
  id: string;
  name: string;
  displayOrder: number;
  pointValue: number;
  winnerId: string | null;
  nominees: Nominee[];
};

type ExistingResult = {
  categoryId: string;
  winnerId: string;
  tiedWinnerId: string | null;
  version: number;
  setBy: { name: string | null };
  updatedAt: string;
};

type ResultsEntryFormProps = {
  categories: CategoryWithNominees[];
  existingResults: ExistingResult[];
};

type CategoryStatus = {
  loading: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
};

export function ResultsEntryForm({
  categories,
  existingResults: initialResults,
}: ResultsEntryFormProps) {
  const [results, setResults] = useState<Record<string, ExistingResult>>(
    () => {
      const map: Record<string, ExistingResult> = {};
      for (const r of initialResults) map[r.categoryId] = r;
      return map;
    }
  );

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const r of initialResults) map[r.categoryId] = r.winnerId;
    return map;
  });

  const [tiedSelections, setTiedSelections] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      for (const r of initialResults) {
        if (r.tiedWinnerId) map[r.categoryId] = r.tiedWinnerId;
      }
      return map;
    }
  );

  const [isTie, setIsTie] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const r of initialResults) {
      if (r.tiedWinnerId) map[r.categoryId] = true;
    }
    return map;
  });

  const [statuses, setStatuses] = useState<Record<string, CategoryStatus>>({});

  const decidedCount = Object.keys(results).length;

  const clearFeedback = useCallback((categoryId: string) => {
    setStatuses((prev) => ({
      ...prev,
      [categoryId]: { loading: false, feedback: null },
    }));
  }, []);

  const handleSelectionChange = useCallback(
    (categoryId: string, nomineeId: string) => {
      setSelections((prev) => ({ ...prev, [categoryId]: nomineeId }));
      // Clear tied selection if it now matches the new primary
      setTiedSelections((prev) => {
        if (prev[categoryId] === nomineeId) {
          const next = { ...prev };
          delete next[categoryId];
          return next;
        }
        return prev;
      });
      clearFeedback(categoryId);
    },
    [clearFeedback]
  );

  const handleTiedSelectionChange = useCallback(
    (categoryId: string, nomineeId: string) => {
      setTiedSelections((prev) => ({ ...prev, [categoryId]: nomineeId }));
      clearFeedback(categoryId);
    },
    [clearFeedback]
  );

  const handleTieToggle = useCallback(
    (categoryId: string) => {
      setIsTie((prev) => {
        const enabling = !prev[categoryId];
        if (!enabling) {
          setTiedSelections((ts) => {
            const next = { ...ts };
            delete next[categoryId];
            return next;
          });
        }
        return { ...prev, [categoryId]: enabling };
      });
      clearFeedback(categoryId);
    },
    [clearFeedback]
  );

  const handleSetWinner = useCallback(
    async (categoryId: string) => {
      const winnerId = selections[categoryId];
      if (!winnerId) return;

      const tieActive = isTie[categoryId] ?? false;
      const tiedWinnerId = tieActive ? (tiedSelections[categoryId] ?? null) : null;
      if (tieActive && !tiedWinnerId) return;

      const existing = results[categoryId];
      const expectedVersion = existing ? existing.version : null;

      setStatuses((prev) => ({
        ...prev,
        [categoryId]: { loading: true, feedback: null },
      }));

      try {
        const response = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId,
            winnerId,
            tiedWinnerId,
            expectedVersion,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const category = categories.find((c) => c.id === categoryId);
          const nominee = category?.nominees.find((n) => n.id === winnerId);
          const tiedNominee = tiedWinnerId
            ? category?.nominees.find((n) => n.id === tiedWinnerId)
            : null;

          setResults((prev) => ({
            ...prev,
            [categoryId]: {
              categoryId,
              winnerId,
              tiedWinnerId,
              version: data.version,
              setBy: { name: "You" },
              updatedAt: new Date().toISOString(),
            },
          }));

          const successMsg = tiedNominee
            ? `Tie set: ${nominee?.name ?? "Unknown"} & ${tiedNominee.name}`
            : `Winner set: ${nominee?.name ?? "Unknown"}`;

          setStatuses((prev) => ({
            ...prev,
            [categoryId]: {
              loading: false,
              feedback: { type: "success", message: successMsg },
            },
          }));
          toast.success(successMsg);
        } else if (response.status === 409) {
          const conflict = data.error?.currentResult;
          if (conflict) {
            setResults((prev) => ({
              ...prev,
              [categoryId]: {
                categoryId,
                winnerId: conflict.winnerId,
                tiedWinnerId: conflict.tiedWinnerId ?? null,
                version: conflict.version,
                setBy: { name: conflict.setByName },
                updatedAt:
                  typeof conflict.updatedAt === "string"
                    ? conflict.updatedAt
                    : new Date(conflict.updatedAt).toISOString(),
              },
            }));
            setSelections((prev) => ({ ...prev, [categoryId]: conflict.winnerId }));
            if (conflict.tiedWinnerId) {
              setTiedSelections((prev) => ({
                ...prev,
                [categoryId]: conflict.tiedWinnerId,
              }));
              setIsTie((prev) => ({ ...prev, [categoryId]: true }));
            } else {
              setTiedSelections((prev) => {
                const next = { ...prev };
                delete next[categoryId];
                return next;
              });
              setIsTie((prev) => ({ ...prev, [categoryId]: false }));
            }
          }
          setStatuses((prev) => ({
            ...prev,
            [categoryId]: {
              loading: false,
              feedback: {
                type: "error",
                message:
                  data.error?.message ??
                  "Conflict: another user updated this result. Please review and try again.",
              },
            },
          }));
        } else {
          setStatuses((prev) => ({
            ...prev,
            [categoryId]: {
              loading: false,
              feedback: {
                type: "error",
                message:
                  data.error?.message ?? data.error ?? "Failed to set winner.",
              },
            },
          }));
        }
      } catch {
        setStatuses((prev) => ({
          ...prev,
          [categoryId]: {
            loading: false,
            feedback: { type: "error", message: "Network error. Please try again." },
          },
        }));
      }
    },
    [selections, tiedSelections, isTie, results, categories]
  );

  const handleClearWinner = useCallback(
    async (categoryId: string) => {
      const existing = results[categoryId];
      if (!existing) return;

      setStatuses((prev) => ({
        ...prev,
        [categoryId]: { loading: true, feedback: null },
      }));

      try {
        const response = await fetch("/api/results", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId,
            expectedVersion: existing.version,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setResults((prev) => {
            const next = { ...prev };
            delete next[categoryId];
            return next;
          });
          setSelections((prev) => {
            const next = { ...prev };
            delete next[categoryId];
            return next;
          });
          setTiedSelections((prev) => {
            const next = { ...prev };
            delete next[categoryId];
            return next;
          });
          setIsTie((prev) => ({ ...prev, [categoryId]: false }));
          setStatuses((prev) => ({
            ...prev,
            [categoryId]: {
              loading: false,
              feedback: { type: "success", message: "Winner cleared" },
            },
          }));
          toast.success("Winner cleared");
        } else if (response.status === 409) {
          const conflict = data.error?.currentResult;
          if (conflict) {
            setResults((prev) => ({
              ...prev,
              [categoryId]: {
                categoryId,
                winnerId: conflict.winnerId,
                tiedWinnerId: conflict.tiedWinnerId ?? null,
                version: conflict.version,
                setBy: { name: conflict.setByName },
                updatedAt:
                  typeof conflict.updatedAt === "string"
                    ? conflict.updatedAt
                    : new Date(conflict.updatedAt).toISOString(),
              },
            }));
            setSelections((prev) => ({ ...prev, [categoryId]: conflict.winnerId }));
          }
          setStatuses((prev) => ({
            ...prev,
            [categoryId]: {
              loading: false,
              feedback: {
                type: "error",
                message:
                  data.error?.message ??
                  "Conflict: the result was updated. Please refresh and try again.",
              },
            },
          }));
        } else {
          setStatuses((prev) => ({
            ...prev,
            [categoryId]: {
              loading: false,
              feedback: {
                type: "error",
                message:
                  data.error?.message ?? data.error ?? "Failed to clear winner.",
              },
            },
          }));
        }
      } catch {
        setStatuses((prev) => ({
          ...prev,
          [categoryId]: {
            loading: false,
            feedback: { type: "error", message: "Network error. Please try again." },
          },
        }));
      }
    },
    [results]
  );

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-4 py-3">
        <Trophy className="size-5 text-gold-400" />
        <p className="text-sm font-medium">
          <span className="text-gold-400">{decidedCount}</span> of{" "}
          <span className="text-gold-400">{categories.length}</span> categories
          decided
        </p>
      </div>

      {/* Category cards */}
      {categories.map((category) => {
        const result = results[category.id];
        const selectedNomineeId = selections[category.id] ?? "";
        const selectedTiedId = tiedSelections[category.id] ?? "";
        const tieActive = isTie[category.id] ?? false;
        const status = statuses[category.id];
        const isLoading = status?.loading ?? false;

        const currentTiedWinnerId = result?.tiedWinnerId ?? null;
        const selectedTiedOrNull = tieActive ? (selectedTiedId || null) : null;

        const hasChanged =
          selectedNomineeId !== "" &&
          (selectedNomineeId !== (result?.winnerId ?? "") ||
            selectedTiedOrNull !== currentTiedWinnerId);

        const canSubmit =
          !isLoading &&
          selectedNomineeId !== "" &&
          hasChanged &&
          (!tieActive || selectedTiedId !== "");

        const winnerNominee = result
          ? category.nominees.find((n) => n.id === result.winnerId)
          : null;
        const tiedWinnerNominee = result?.tiedWinnerId
          ? category.nominees.find((n) => n.id === result.tiedWinnerId)
          : null;

        // Tied dropdown excludes the primary selection
        const tiedNomineeOptions = category.nominees.filter(
          (n) => n.id !== selectedNomineeId
        );

        return (
          <Card key={category.id} className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="font-heading text-lg text-gold-400">
                    {category.name}
                  </CardTitle>
                  <span className="inline-flex items-center rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-400">
                    {category.pointValue} pts
                  </span>
                </div>
                {result && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/20 px-3 py-1 text-xs font-semibold text-gold-300">
                    <Trophy className="size-3" />
                    {result.tiedWinnerId ? "Tie" : "Decided"}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Current winner display */}
              {result && winnerNominee ? (
                <div className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Trophy className="size-4 text-gold-400" />
                        <span className="font-semibold text-gold-300">
                          {winnerNominee.name}
                        </span>
                        {winnerNominee.subtitle && (
                          <span className="text-sm text-gold-400/70">
                            &mdash; {winnerNominee.subtitle}
                          </span>
                        )}
                      </div>
                      {tiedWinnerNominee && (
                        <div className="flex items-center gap-2">
                          <Trophy className="size-4 text-gold-400" />
                          <span className="font-semibold text-gold-300">
                            {tiedWinnerNominee.name}
                          </span>
                          {tiedWinnerNominee.subtitle && (
                            <span className="text-sm text-gold-400/70">
                              &mdash; {tiedWinnerNominee.subtitle}
                            </span>
                          )}
                          <span className="text-xs text-gold-400/60">(tie)</span>
                        </div>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Set by {result.setBy.name ?? "Unknown"} &middot;{" "}
                        {formatDate(result.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearWinner(category.id)}
                      disabled={isLoading}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Undo2 className="size-3.5" />
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Not yet announced
                </div>
              )}

              {/* Winner selection */}
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label
                      htmlFor={`winner-${category.id}`}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      {result ? "Change winner" : "Select winner"}
                    </label>
                    <Select
                      value={selectedNomineeId}
                      onValueChange={(value) =>
                        handleSelectionChange(category.id, value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        id={`winner-${category.id}`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select nominee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {category.nominees.map((nominee) => (
                          <SelectItem key={nominee.id} value={nominee.id}>
                            <span>
                              {nominee.name}
                              {nominee.subtitle && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  &mdash; {nominee.subtitle}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => handleSetWinner(category.id)}
                    disabled={!canSubmit}
                    size="default"
                    className="shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Setting...
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        {tieActive ? "Set Tie" : "Set Winner"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Tie toggle */}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={tieActive}
                    onChange={() => handleTieToggle(category.id)}
                    disabled={isLoading}
                    className="size-4 rounded accent-gold-400"
                  />
                  This is a tie (two winners)
                </label>

                {/* Tied winner dropdown — shown when tie is active */}
                {tieActive && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`tied-winner-${category.id}`}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Tied with
                    </label>
                    <Select
                      value={selectedTiedId}
                      onValueChange={(value) =>
                        handleTiedSelectionChange(category.id, value)
                      }
                      disabled={isLoading || !selectedNomineeId}
                    >
                      <SelectTrigger
                        id={`tied-winner-${category.id}`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select second winner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tiedNomineeOptions.map((nominee) => (
                          <SelectItem key={nominee.id} value={nominee.id}>
                            <span>
                              {nominee.name}
                              {nominee.subtitle && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  &mdash; {nominee.subtitle}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Per-category feedback */}
              {status?.feedback && (
                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    status.feedback.type === "success"
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                  role="alert"
                >
                  {status.feedback.type === "success" ? (
                    <Check className="size-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0" />
                  )}
                  {status.feedback.message}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Unknown date";
  }
}
