"use client";

/**
 * ScoringOverrideTable - interactive table for overriding per-category point values.
 *
 * Rendered inside /pools/[id]/scoring/page.tsx (server component).
 * All data mutations go through server actions in actions.ts.
 */

import type { ComponentProps } from "react";
import { useEffect, useState, useTransition } from "react";
import { Info, RotateCcw, Save, Undo2 } from "lucide-react";
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
  revertScoringToDefaults,
  updateCategoryScoring,
} from "@/app/pools/[id]/scoring/actions";

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

type ScoringSection = {
  key: string;
  tierLabel: string;
  defaultPointValue?: number;
  defaultRunnerUp?: number;
  helperText?: string;
  rows: CategoryRow[];
};

const KNOWN_TIER_CATEGORY_NAMES = new Set(
  TIER_GROUPS.flatMap((tier) => tier.categories)
);

function validateField(
  field: "pointValue" | "runnerUpPoints",
  value: number,
  otherValue: number
): string | undefined {
  if (!Number.isInteger(value)) return "Must be a whole number";

  if (field === "pointValue") {
    if (value < 1) return "Must be at least 1";
    if (value > 500) return "Cannot exceed 500";
    if (otherValue > value) return "Cannot be less than 2nd place points";
    return undefined;
  }

  if (value < 0) return "Cannot be negative";
  if (value > 500) return "Cannot exceed 500";
  if (value > otherValue) return "Cannot exceed 1st place points";
  return undefined;
}

function getDefaultRunnerUpPoints(defaults: CategoryRow["defaults"]): number {
  return Math.round(defaults.pointValue * defaults.runnerUpMultiplier);
}

function buildScoringSections(categories: CategoryRow[]): ScoringSection[] {
  const sortedCategories = [...categories].sort(
    (left, right) => left.displayOrder - right.displayOrder
  );

  const presetSections = TIER_GROUPS.map((tier) => {
    const rows = sortedCategories.filter((row) => tier.categories.includes(row.name));

    return {
      key: tier.tierLabel,
      tierLabel: tier.tierLabel,
      defaultPointValue: tier.defaultPointValue,
      defaultRunnerUp: Math.round(
        tier.defaultPointValue * tier.defaultRunnerUpMultiplier
      ),
      rows,
    };
  }).filter((section) => section.rows.length > 0);

  const additionalRows = sortedCategories.filter(
    (row) => !KNOWN_TIER_CATEGORY_NAMES.has(row.name)
  );

  if (additionalRows.length === 0) {
    return presetSections;
  }

  return [
    ...presetSections,
    {
      key: "additional-categories",
      tierLabel: "Additional Categories",
      helperText: "Not part of the preset Oscar tier list, but still editable here.",
      rows: additionalRows,
    },
  ];
}

export function ScoringOverrideTable({
  poolId,
  ceremonyYearName,
  categories,
}: Props) {
  const [edits, setEdits] = useState<Record<string, FieldEdits>>({});
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({});
  const [isPending, startTransition] = useTransition();
  const sections = buildScoringSections(categories);

  const isDirty = Object.keys(edits).length > 0;
  const hasErrors = Object.values(errors).some(
    (entry) =>
      entry.pointValue !== undefined || entry.runnerUpPoints !== undefined
  );
  const dirtyCount = Object.keys(edits).length;

  function getValue(
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    original: number
  ): number {
    return edits[categoryId]?.[field] ?? original;
  }

  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function handleChange(
    categoryId: string,
    field: "pointValue" | "runnerUpPoints",
    raw: string,
    original: FieldEdits
  ) {
    const parsed = Number(raw);
    const value = Number.isNaN(parsed) ? 0 : parsed;

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
    const fieldError = validateField(field, value, otherValue);
    const companionField = field === "pointValue" ? "runnerUpPoints" : "pointValue";
    const companionError = validateField(companionField, otherValue, value);

    setErrors((prev) => {
      const current = prev[categoryId] ?? {};
      const updated: FieldErrors = {
        ...current,
        [field]: fieldError,
        [companionField]: companionError,
      };

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

  function handleRowResetToDefaults(
    categoryId: string,
    defaults: CategoryRow["defaults"]
  ) {
    setEdits((prev) => ({
      ...prev,
      [categoryId]: {
        pointValue: defaults.pointValue,
        runnerUpPoints: getDefaultRunnerUpPoints(defaults),
      },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const updates = Object.entries(edits).map(([categoryId, values]) => ({
        categoryId,
        ...values,
      }));

      const result = await updateCategoryScoring(poolId, updates);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Scoring saved");
      setEdits({});
      setErrors({});
    });
  }

  function handleRevertAll() {
    startTransition(async () => {
      const result = await revertScoringToDefaults(poolId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Scoring reverted to defaults");
      setEdits({});
      setErrors({});
    });
  }

  return (
    <div className="pb-20">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2 rounded-md border border-gold-500/30 bg-gold-500/5 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-gold-400" />
          <span>
            Changes apply to <strong className="text-foreground">all pools</strong>{" "}
            for the <strong className="text-foreground">{ceremonyYearName}</strong>{" "}
            ceremony.
          </span>
        </div>

        <RevertAllDialogTrigger
          isPending={isPending}
          onConfirm={handleRevertAll}
          buttonProps={{
            variant: "outline",
            className:
              "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-start",
          }}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Award category scoring overrides</caption>

          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </th>
              <th
                scope="col"
                className="w-32 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                1st Place
              </th>
              <th
                scope="col"
                className="w-32 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                2nd Place
              </th>
              <th scope="col" className="w-14 px-2 py-3">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sections.map((section) => (
              <TierSection
                key={section.key}
                tierLabel={section.tierLabel}
                defaultPointValue={section.defaultPointValue}
                defaultRunnerUp={section.defaultRunnerUp}
                helperText={section.helperText}
                rows={section.rows}
                edits={edits}
                errors={errors}
                getValue={getValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onRowRevert={handleRowRevert}
                onRowResetToDefaults={handleRowResetToDefaults}
              />
            ))}
          </tbody>
        </table>
      </div>

      {isDirty ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold-500/20 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              {dirtyCount} categor{dirtyCount === 1 ? "y" : "ies"} modified
            </span>

            <div className="flex items-center gap-2">
              <RevertAllDialogTrigger
                isPending={isPending}
                onConfirm={handleRevertAll}
                buttonProps={{
                  variant: "ghost",
                  size: "sm",
                  className: "text-destructive hover:text-destructive",
                }}
              />

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || hasErrors}
              >
                <Save className="size-4" />
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type TierSectionProps = {
  tierLabel: string;
  defaultPointValue?: number;
  defaultRunnerUp?: number;
  helperText?: string;
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
  onRowResetToDefaults: (
    categoryId: string,
    defaults: CategoryRow["defaults"]
  ) => void;
};

function TierSection({
  tierLabel,
  defaultPointValue,
  defaultRunnerUp,
  helperText,
  rows,
  edits,
  errors,
  getValue,
  onChange,
  onBlur,
  onRowRevert,
  onRowResetToDefaults,
}: TierSectionProps) {
  return (
    <>
      <tr className="border-y border-gold-500/20 bg-gold-500/5">
        <td colSpan={4} className="px-4 py-2 text-left">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
              {tierLabel}
            </span>
            {defaultPointValue !== undefined && defaultRunnerUp !== undefined ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/15 px-2 py-0.5 text-xs text-gold-400">
                Default: {defaultPointValue}pts / {defaultRunnerUp}pts
              </span>
            ) : null}
            {helperText ? (
              <span className="text-xs text-muted-foreground">{helperText}</span>
            ) : null}
          </div>
        </td>
      </tr>

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
          onRowResetToDefaults={onRowResetToDefaults}
        />
      ))}
    </>
  );
}

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
  onRowResetToDefaults: (
    categoryId: string,
    defaults: CategoryRow["defaults"]
  ) => void;
};

function CategoryDataRow({
  row,
  edits,
  errors,
  getValue,
  onChange,
  onBlur,
  onRowRevert,
  onRowResetToDefaults,
}: CategoryDataRowProps) {
  const isDirtyRow = edits[row.id] !== undefined;
  const rowErrors = errors[row.id];

  const pointValue = getValue(row.id, "pointValue", row.pointValue);
  const runnerUpPoints = getValue(row.id, "runnerUpPoints", row.runnerUpPoints);

  const original: FieldEdits = {
    pointValue: row.pointValue,
    runnerUpPoints: row.runnerUpPoints,
  };

  const defaultRunnerUpPoints = getDefaultRunnerUpPoints(row.defaults);
  const differsFromDefault =
    pointValue !== row.defaults.pointValue || runnerUpPoints !== defaultRunnerUpPoints;

  const pointValueErrorId = `${row.id}-pointValue-error`;
  const runnerUpErrorId = `${row.id}-runnerUpPoints-error`;
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
      <th
        scope="row"
        className="px-4 py-3 text-left text-sm font-medium align-top text-foreground"
      >
        {row.name}
      </th>

      <td className="w-32 px-3 py-3 align-top">
        <label className="sr-only" htmlFor={`${row.id}-pointValue`}>
          {row.name} - 1st Place Points
        </label>
        <Input
          id={`${row.id}-pointValue`}
          type="number"
          min={1}
          max={500}
          step={1}
          value={pointValue}
          aria-invalid={rowErrors?.pointValue !== undefined ? true : undefined}
          aria-describedby={rowErrors?.pointValue ? pointValueErrorId : undefined}
          className="h-8 w-24 text-sm"
          onChange={(event) =>
            onChange(row.id, "pointValue", event.target.value, original)
          }
          onBlur={() => onBlur(row.id, "pointValue", pointValue, runnerUpPoints)}
        />
        <div className="min-h-[1.25rem]">
          {rowErrors?.pointValue ? (
            <p
              id={pointValueErrorId}
              role="alert"
              className="mt-0.5 text-xs text-destructive"
            >
              {rowErrors.pointValue}
            </p>
          ) : null}
        </div>
      </td>

      <td className="w-32 px-3 py-3 align-top">
        <label className="sr-only" htmlFor={`${row.id}-runnerUpPoints`}>
          {row.name} - 2nd Place Points
        </label>
        <Input
          id={`${row.id}-runnerUpPoints`}
          type="number"
          min={0}
          max={500}
          step={1}
          value={runnerUpPoints}
          aria-invalid={rowErrors?.runnerUpPoints !== undefined ? true : undefined}
          aria-describedby={rowErrors?.runnerUpPoints ? runnerUpErrorId : undefined}
          className="h-8 w-24 text-sm"
          onChange={(event) =>
            onChange(row.id, "runnerUpPoints", event.target.value, original)
          }
          onBlur={() => onBlur(row.id, "runnerUpPoints", runnerUpPoints, pointValue)}
        />
        <div className="min-h-[1.25rem]">
          {rowErrors?.runnerUpPoints ? (
            <p
              id={runnerUpErrorId}
              role="alert"
              className="mt-0.5 text-xs text-destructive"
            >
              {rowErrors.runnerUpPoints}
            </p>
          ) : showRatioHint ? (
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              {Math.round(ratio * 100)}% of 1st
            </p>
          ) : null}
        </div>
      </td>

      <td className="w-14 px-2 py-3 align-top">
        <div className="flex items-center gap-1">
          {isDirtyRow ? (
            <Button
              variant="ghost"
              size="icon-xs"
              title="Discard row changes"
              aria-label={`Discard unsaved changes for ${row.name}`}
              onClick={() => onRowRevert(row.id)}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="size-3.5" />
            </Button>
          ) : null}

          {differsFromDefault ? (
            <Button
              variant="ghost"
              size="icon-xs"
              title="Reset to defaults"
              aria-label={`Reset ${row.name} to defaults`}
              onClick={() => onRowResetToDefaults(row.id, row.defaults)}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

type RevertAllDialogTriggerProps = {
  isPending: boolean;
  onConfirm: () => void;
  buttonProps?: ComponentProps<typeof Button>;
};

function RevertAllDialogTrigger({
  isPending,
  onConfirm,
  buttonProps,
}: RevertAllDialogTriggerProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending} {...buttonProps}>
          Revert All to Defaults
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revert All to Defaults?</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset all categories to their tier default point values. Any
            unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Revert All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
