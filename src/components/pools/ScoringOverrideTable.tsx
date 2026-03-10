"use client";

/**
 * ScoringOverrideTable — interactive table for overriding per-category point values.
 *
 * Rendered inside /pools/[id]/scoring/page.tsx (server component).
 * All data mutations go through server actions in actions.ts.
 */

import { useEffect, useState, useTransition } from "react";
import { RotateCcw, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { TIER_GROUPS } from "@/lib/scoring/defaults";
import {
  updateCategoryScoring,
  revertScoringToDefaults,
} from "@/app/pools/[id]/scoring/actions";

// ── Types ────────────────────────────────────────────────────────────────────

type CategoryRow = {
  id: string;
  name: string;
  displayOrder: number;
  pointValue: number;
  runnerUpPoints: number;
  defaults: {
    pointValue: number;
    runnerUpMultiplier: number;
  };
};

type Props = {
  poolId: string;
  ceremonyYearName: string;
  categories: CategoryRow[];
};

type FieldEdits = {
  pointValue: number;
  runnerUpPoints: number;
};

type FieldErrors = {
  pointValue?: string;
  runnerUpPoints?: string;
};

// ── Validation ───────────────────────────────────────────────────────────────

function validateField(
  field: "pointValue" | "runnerUpPoints",
  value: number,
  otherValue: number
): string | undefined {
  if (!Number.isInteger(value)) return "Must be a whole number";
  if (field === "pointValue") {
    if (value < 1) return "Must be at least 1";
    if (value > 500) return "Cannot exceed 500";
  } else {
    if (value < 0) return "Cannot be negative";
    if (value > 500) return "Cannot exceed 500";
    if (value > otherValue) return "Cannot exceed 1st place points";
  }
  return undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScoringOverrideTable({
  poolId,
  ceremonyYearName,
  categories,
}: Props) {
  const [edits, setEdits] = useState<Record<string, FieldEdits>>({});
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({});
  const [isPending, startTransition] = useTransition();

  // Build a lookup map from category name → row for tier grouping
  const categoryByName = new Map<string, CategoryRow>(
    categories.map((c) => [c.name, c])
  );

  // Derived
  const isDirty = Object.keys(edits).length > 0;
  const hasErrors = Object.values(errors).some(
    (e) => e.pointValue !== undefined || e.runnerUpPoints !== undefined
  );
  const dirtyCount = Object.keys(edits).length;

  // Resolve displayed value: local edit first, then server value
  function getValue(
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    original: number
  ): number {
    return edits[categoryId]?.[field] ?? original;
  }

  // Unsaved changes — native browser warning on close/refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleChange(
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    raw: string,
    original: FieldEdits
  ) {
    const parsed = parseFloat(raw);
    const value = isNaN(parsed) ? 0 : parsed;
    setEdits((prev) => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] ?? original),
        [field]: value,
      },
    }));
  }

  function handleBlur(
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    value: number,
    otherValue: number
  ) {
    const error = validateField(field, value, otherValue);
    setErrors((prev) => {
      const current = prev[categoryId] ?? {};
      const updated = { ...current, [field]: error };
      // Clean up undefined keys so hasErrors check stays accurate
      if (updated.pointValue === undefined) delete updated.pointValue;
      if (updated.runnerUpPoints === undefined) delete updated.runnerUpPoints;
      if (Object.keys(updated).length === 0) {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      }
      return { ...prev, [categoryId]: updated };
    });
  }

  function handleRowRevert(categoryId: string) {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const updates = Object.entries(edits).map(([categoryId, vals]) => ({
        categoryId,
        ...vals,
      }));
      const result = await updateCategoryScoring(poolId, updates);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Scoring saved");
        setEdits({});
        setErrors({});
      }
    });
  }

  function handleRevertAll() {
    startTransition(async () => {
      const result = await revertScoringToDefaults(poolId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Scoring reverted to defaults");
        setEdits({});
        setErrors({});
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pb-20">
      {/* Ceremony-wide notice */}
      <div className="flex items-start gap-2 rounded-md border border-gold-500/30 bg-gold-500/5 px-4 py-3 text-sm text-muted-foreground mb-6">
        <Info className="size-4 mt-0.5 shrink-0 text-gold-400" />
        <span>
          Changes apply to <strong className="text-foreground">all pools</strong>{" "}
          for the{" "}
          <strong className="text-foreground">{ceremonyYearName}</strong>{" "}
          ceremony.
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Award category scoring overrides</caption>

          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32"
              >
                1st Place
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32"
              >
                2nd Place
              </th>
              <th scope="col" className="w-8 px-2 py-3">
                <span className="sr-only">Reset row</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {TIER_GROUPS.map((tier) => {
              const tierRows = tier.categories
                .map((name) => categoryByName.get(name))
                .filter((row): row is CategoryRow => row !== undefined);

              if (tierRows.length === 0) return null;

              const defaultRunnerUp = Math.round(
                tier.defaultPointValue * tier.defaultRunnerUpMultiplier
              );

              return (
                <TierSection
                  key={tier.tierLabel}
                  tierLabel={tier.tierLabel}
                  defaultPointValue={tier.defaultPointValue}
                  defaultRunnerUp={defaultRunnerUp}
                  rows={tierRows}
                  edits={edits}
                  errors={errors}
                  getValue={getValue}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onRowRevert={handleRowRevert}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky action bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold-500/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              {dirtyCount} categor{dirtyCount === 1 ? "y" : "ies"} modified
            </span>

            <div className="flex items-center gap-2">
              {/* Revert All — AlertDialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    Revert All to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revert All to Defaults?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all categories to their tier default point
                      values. Any unsaved changes will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRevertAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Revert All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Save */}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || hasErrors}
              >
                <Save className="size-4" />
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TierSection sub-component ─────────────────────────────────────────────────

type TierSectionProps = {
  tierLabel: string;
  defaultPointValue: number;
  defaultRunnerUp: number;
  rows: CategoryRow[];
  edits: Record<string, FieldEdits>;
  errors: Record<string, FieldErrors>;
  getValue: (
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    original: number
  ) => number;
  onChange: (
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    raw: string,
    original: FieldEdits
  ) => void;
  onBlur: (
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    value: number,
    otherValue: number
  ) => void;
  onRowRevert: (categoryId: string) => void;
};

function TierSection({
  tierLabel,
  defaultPointValue,
  defaultRunnerUp,
  rows,
  edits,
  errors,
  getValue,
  onChange,
  onBlur,
  onRowRevert,
}: TierSectionProps) {
  return (
    <>
      {/* Tier header */}
      <tr className="bg-gold-500/5 border-y border-gold-500/20">
        <td
          colSpan={4}
          className="px-4 py-2 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
              {tierLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/15 px-2 py-0.5 text-xs text-gold-400">
              Default: {defaultPointValue}pts / {defaultRunnerUp}pts
            </span>
          </div>
        </td>
      </tr>

      {/* Category rows */}
      {rows.map((row) => (
        <CategoryDataRow
          key={row.id}
          row={row}
          edits={edits}
          errors={errors}
          getValue={getValue}
          onChange={onChange}
          onBlur={onBlur}
          onRowRevert={onRowRevert}
        />
      ))}
    </>
  );
}

// ── CategoryDataRow sub-component ─────────────────────────────────────────────

type CategoryDataRowProps = {
  row: CategoryRow;
  edits: Record<string, FieldEdits>;
  errors: Record<string, FieldErrors>;
  getValue: (
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    original: number
  ) => number;
  onChange: (
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    raw: string,
    original: FieldEdits
  ) => void;
  onBlur: (
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    value: number,
    otherValue: number
  ) => void;
  onRowRevert: (categoryId: string) => void;
};

function CategoryDataRow({
  row,
  edits,
  errors,
  getValue,
  onChange,
  onBlur,
  onRowRevert,
}: CategoryDataRowProps) {
  const isDirtyRow = edits[row.id] !== undefined;
  const rowErrors = errors[row.id];

  const pointValue = getValue(row.id, "pointValue", row.pointValue);
  const runnerUpPoints = getValue(row.id, "runnerUpPoints", row.runnerUpPoints);

  const original: FieldEdits = {
    pointValue: row.pointValue,
    runnerUpPoints: row.runnerUpPoints,
  };

  const pointValueErrorId = `${row.id}-pointValue-error`;
  const runnerUpErrorId = `${row.id}-runnerUpPoints-error`;

  // Compute ratio hint: show when ratio differs from 0.6 by more than 0.01
  const ratio = pointValue > 0 ? runnerUpPoints / pointValue : 0;
  const showRatioHint =
    !rowErrors?.runnerUpPoints && Math.abs(ratio - 0.6) > 0.01;

  return (
    <tr
      className={
        isDirtyRow
          ? "border-l-2 border-gold-500/60 bg-gold-500/5 transition-colors"
          : "transition-colors hover:bg-muted/30"
      }
    >
      {/* Category name */}
      <th
        scope="row"
        className="px-4 py-3 text-left text-sm font-medium text-foreground align-top"
      >
        {row.name}
      </th>

      {/* 1st Place */}
      <td className="px-3 py-3 align-top w-32">
        <label
          className="sr-only"
          htmlFor={`${row.id}-pointValue`}
        >
          {row.name} — 1st Place Points
        </label>
        <Input
          id={`${row.id}-pointValue`}
          type="number"
          min={1}
          max={500}
          step={1}
          value={pointValue}
          aria-invalid={rowErrors?.pointValue !== undefined ? true : undefined}
          aria-describedby={
            rowErrors?.pointValue ? pointValueErrorId : undefined
          }
          className="h-8 w-24 text-sm"
          onChange={(e) =>
            onChange(row.id, "pointValue", e.target.value, original)
          }
          onBlur={() => onBlur(row.id, "pointValue", pointValue, runnerUpPoints)}
        />
        <div className="min-h-[1.25rem]">
          {rowErrors?.pointValue && (
            <p
              id={pointValueErrorId}
              role="alert"
              className="text-xs text-destructive mt-0.5"
            >
              {rowErrors.pointValue}
            </p>
          )}
        </div>
      </td>

      {/* 2nd Place */}
      <td className="px-3 py-3 align-top w-32">
        <label
          className="sr-only"
          htmlFor={`${row.id}-runnerUpPoints`}
        >
          {row.name} — 2nd Place Points
        </label>
        <Input
          id={`${row.id}-runnerUpPoints`}
          type="number"
          min={0}
          max={500}
          step={1}
          value={runnerUpPoints}
          aria-invalid={
            rowErrors?.runnerUpPoints !== undefined ? true : undefined
          }
          aria-describedby={
            rowErrors?.runnerUpPoints ? runnerUpErrorId : undefined
          }
          className="h-8 w-24 text-sm"
          onChange={(e) =>
            onChange(row.id, "runnerUpPoints", e.target.value, original)
          }
          onBlur={() =>
            onBlur(row.id, "runnerUpPoints", runnerUpPoints, pointValue)
          }
        />
        <div className="min-h-[1.25rem]">
          {rowErrors?.runnerUpPoints ? (
            <p
              id={runnerUpErrorId}
              role="alert"
              className="text-xs text-destructive mt-0.5"
            >
              {rowErrors.runnerUpPoints}
            </p>
          ) : showRatioHint ? (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {"\u2193"} {Math.round(ratio * 100)}% of 1st
            </p>
          ) : null}
        </div>
      </td>

      {/* Per-row revert */}
      <td className="px-2 py-3 align-top w-8">
        {isDirtyRow && (
          <Button
            variant="ghost"
            size="icon-xs"
            title="Reset to default"
            aria-label={`Reset ${row.name} to default`}
            onClick={() => onRowRevert(row.id)}
            className="mt-0.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        )}
      </td>
    </tr>
  );
}
