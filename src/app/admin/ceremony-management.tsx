"use client";

import { useState, useTransition, useRef } from "react";
import {
  Lock,
  Unlock,
  Plus,
  Calendar,
  Film,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  togglePredictionsLocked,
  toggleCeremonyActive,
  createCeremonyYear,
  updateCeremonyDate,
  addCategory,
  addNominee,
  type ActionResult,
} from "./actions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface NomineeData {
  id: string;
  name: string;
  subtitle: string | null;
}

interface CategoryData {
  id: string;
  name: string;
  displayOrder: number;
  pointValue: number;
  runnerUpMultiplier: number;
  nominees: NomineeData[];
}

interface CeremonyYearData {
  id: string;
  year: number;
  name: string;
  ceremonyDate: string | null;
  isActive: boolean;
  predictionsLocked: boolean;
  _count: { categories: number; pools: number };
  categories: CategoryData[];
}

interface CeremonyManagementProps {
  ceremonyYears: CeremonyYearData[];
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CeremonyManagement({
  ceremonyYears,
}: CeremonyManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Create New Ceremony */}
      <div>
        <Button
          variant="outline"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
        >
          <Plus className="size-4" />
          Create New Ceremony Year
        </Button>

        {showCreateForm && (
          <CreateCeremonyForm onClose={() => setShowCreateForm(false)} />
        )}
      </div>

      {/* Ceremony Year List */}
      {ceremonyYears.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Film className="mx-auto mb-3 size-10 opacity-50" />
            <p>No ceremony years yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        ceremonyYears.map((cy) => (
          <CeremonyYearCard key={cy.id} ceremony={cy} />
        ))
      )}
    </div>
  );
}

// ─── Ceremony Year Card ─────────────────────────────────────────────────────

function CeremonyYearCard({ ceremony }: { ceremony: CeremonyYearData }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lockWarning, setLockWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditDate, setShowEditDate] = useState(false);
  const editDateBtnRef = useRef<HTMLButtonElement>(null);

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await toggleCeremonyActive(ceremony.id);
      if (!result.success) {
        setError(result.error ?? "Failed to toggle");
      } else {
        toast.success(ceremony.isActive ? "Ceremony deactivated" : "Ceremony activated");
      }
    });
  }

  function handleToggleLocked() {
    setError(null);
    if (!ceremony.predictionsLocked) {
      setLockWarning(true);
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await togglePredictionsLocked(ceremony.id);
      if (!result.success) {
        setError(result.error ?? "Failed to toggle");
      } else {
        toast.success("Predictions unlocked");
      }
    });
  }

  function confirmLock() {
    setLockWarning(false);
    startTransition(async () => {
      const result: ActionResult = await togglePredictionsLocked(ceremony.id);
      if (!result.success) {
        setError(result.error ?? "Failed to toggle");
      } else {
        toast.success("Predictions locked");
      }
    });
  }

  return (
    <Card className={isPending ? "opacity-70" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Film className="size-5 text-primary" />
              {ceremony.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {ceremony.ceremonyDate
                  ? new Date(ceremony.ceremonyDate).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })
                  : "Date TBD"}
                <button
                  type="button"
                  ref={editDateBtnRef}
                  onClick={() => setShowEditDate(!showEditDate)}
                  className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Edit ceremony date"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              </span>
              <span>
                {ceremony._count.categories} categor
                {ceremony._count.categories === 1 ? "y" : "ies"}
              </span>
              <span>
                {ceremony._count.pools} pool
                {ceremony._count.pools === 1 ? "" : "s"}
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-6 text-sm">
            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor={`active-${ceremony.id}`} className="text-xs">
                Active
              </Label>
              <Switch
                id={`active-${ceremony.id}`}
                checked={ceremony.isActive}
                onCheckedChange={handleToggleActive}
                disabled={isPending}
              />
            </div>

            {/* Predictions locked toggle */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`locked-${ceremony.id}`}
                className="flex items-center gap-1 text-xs"
              >
                {ceremony.predictionsLocked ? (
                  <Lock className="size-3.5 text-destructive" />
                ) : (
                  <Unlock className="size-3.5 text-green-500" />
                )}
                Predictions
              </Label>
              <Switch
                id={`locked-${ceremony.id}`}
                checked={ceremony.predictionsLocked}
                onCheckedChange={handleToggleLocked}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* Lock warning */}
        {lockWarning && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-500" />
            <div className="space-y-2">
              <p className="font-medium text-yellow-200">
                This will prevent all users from making changes to their
                predictions.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={confirmLock}
                  disabled={isPending}
                >
                  Lock Predictions
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLockWarning(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}

        {showEditDate && (
          <EditDateForm
            ceremonyYearId={ceremony.id}
            currentDate={ceremony.ceremonyDate}
            onClose={() => {
              setShowEditDate(false);
              editDateBtnRef.current?.focus();
            }}
          />
        )}
      </CardHeader>

      <CardContent>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          {expanded ? "Collapse" : "Expand"} Categories & Nominees
        </Button>

        {expanded && (
          <div className="mt-4 space-y-4">
            <CategoriesSection
              ceremonyYearId={ceremony.id}
              categories={ceremony.categories}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Categories Section ─────────────────────────────────────────────────────

function CategoriesSection({
  ceremonyYearId,
  categories,
}: {
  ceremonyYearId: string;
  categories: CategoryData[];
}) {
  const [showAddCategory, setShowAddCategory] = useState(false);

  return (
    <div className="space-y-3">
      {/* Category table */}
      {categories.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-right font-medium">Points</th>
                <th className="px-3 py-2 text-right font-medium">Runner-up</th>
                <th className="px-3 py-2 text-right font-medium">Nominees</th>
              </tr>
            </thead>
            <tbody>
              {[...categories]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((cat) => (
                  <CategoryRow key={cat.id} category={cat} />
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAddCategory(!showAddCategory)}
        className="gap-1"
      >
        <Plus className="size-3.5" />
        Add Category
      </Button>

      {showAddCategory && (
        <AddCategoryForm
          ceremonyYearId={ceremonyYearId}
          nextOrder={
            categories.length > 0
              ? Math.max(...categories.map((c) => c.displayOrder)) + 1
              : 0
          }
          onClose={() => setShowAddCategory(false)}
        />
      )}
    </div>
  );
}

// ─── Category Row ───────────────────────────────────────────────────────────

function CategoryRow({ category }: { category: CategoryData }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddNominee, setShowAddNominee] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b hover:bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-2 text-muted-foreground">
          {category.displayOrder}
        </td>
        <td className="px-3 py-2 font-medium">{category.name}</td>
        <td className="px-3 py-2 text-right">{category.pointValue}</td>
        <td className="px-3 py-2 text-right">
          {category.runnerUpMultiplier}x
        </td>
        <td className="px-3 py-2 text-right">{category.nominees.length}</td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="bg-muted/20 px-3 py-3">
            <div className="space-y-2 pl-4">
              {category.nominees.length > 0 ? (
                <ul className="space-y-1">
                  {category.nominees.map((nom) => (
                    <li key={nom.id} className="text-sm">
                      <span className="font-medium">{nom.name}</span>
                      {nom.subtitle && (
                        <span className="ml-2 text-muted-foreground">
                          — {nom.subtitle}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No nominees yet.
                </p>
              )}

              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddNominee(!showAddNominee);
                }}
                className="gap-1"
              >
                <Plus className="size-3" />
                Add Nominee
              </Button>

              {showAddNominee && (
                <AddNomineeForm
                  categoryId={category.id}
                  onClose={() => setShowAddNominee(false)}
                />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Create Ceremony Form ───────────────────────────────────────────────────

function CreateCeremonyForm({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCeremonyYear(formData);
      if (result.success) {
        toast.success("Ceremony year created");
        onClose();
      } else {
        setError(result.error ?? "Failed to create ceremony year");
      }
    });
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">New Ceremony Year</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cy-year">Year</Label>
              <Input
                id="cy-year"
                name="year"
                type="number"
                min={2020}
                max={2099}
                placeholder="2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cy-date">Ceremony Date & Time</Label>
              <Input id="cy-date" name="ceremonyDate" type="datetime-local" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cy-name">Name</Label>
            <Input
              id="cy-name"
              name="name"
              placeholder='e.g., "98th Academy Awards"'
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Ceremony"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Edit Date Form ─────────────────────────────────────────────────────────

function EditDateForm({
  ceremonyYearId,
  currentDate,
  onClose,
}: {
  ceremonyYearId: string;
  currentDate: string | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Convert stored date string to datetime-local input format (YYYY-MM-DDTHH:mm)
  const defaultValue = currentDate
    ? new Date(currentDate).toISOString().slice(0, 16)
    : "";

  function handleSubmit(formData: FormData) {
    setError(null);
    const raw = formData.get("ceremonyDate");
    const value = raw && String(raw).trim() !== "" ? String(raw) : null;
    startTransition(async () => {
      const result = await updateCeremonyDate(ceremonyYearId, value);
      if (result.success) {
        toast.success("Ceremony date updated");
        onClose();
      } else {
        setError(result.error ?? "Failed to update date");
      }
    });
  }

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/20 p-3">
      <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor={`edit-date-${ceremonyYearId}`} className="text-xs">
            Ceremony Date &amp; Time
          </Label>
          <Input
            id={`edit-date-${ceremonyYearId}`}
            name="ceremonyDate"
            type="datetime-local"
            defaultValue={defaultValue}
            className="w-56"
          />
        </div>
        {error && <p className="w-full text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Add Category Form ──────────────────────────────────────────────────────

function AddCategoryForm({
  ceremonyYearId,
  nextOrder,
  onClose,
}: {
  ceremonyYearId: string;
  nextOrder: number;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addCategory(formData);
      if (result.success) {
        toast.success("Category added");
        onClose();
      } else {
        setError(result.error ?? "Failed to add category");
      }
    });
  }

  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="ceremonyYearId" value={ceremonyYearId} />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor={`cat-name-${ceremonyYearId}`}>Category Name</Label>
            <Input
              id={`cat-name-${ceremonyYearId}`}
              name="name"
              placeholder="Best Picture"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`cat-order-${ceremonyYearId}`}>Order</Label>
            <Input
              id={`cat-order-${ceremonyYearId}`}
              name="displayOrder"
              type="number"
              defaultValue={nextOrder}
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`cat-pts-${ceremonyYearId}`}>Points</Label>
            <Input
              id={`cat-pts-${ceremonyYearId}`}
              name="pointValue"
              type="number"
              defaultValue={10}
              min={1}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`cat-mult-${ceremonyYearId}`}>
              Runner-up Multiplier
            </Label>
            <Input
              id={`cat-mult-${ceremonyYearId}`}
              name="runnerUpMultiplier"
              type="number"
              step="0.1"
              defaultValue={0.5}
              min={0.1}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Adding..." : "Add Category"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Add Nominee Form ───────────────────────────────────────────────────────

function AddNomineeForm({
  categoryId,
  onClose,
}: {
  categoryId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addNominee(formData);
      if (result.success) {
        toast.success("Nominee added");
        onClose();
      } else {
        setError(result.error ?? "Failed to add nominee");
      }
    });
  }

  return (
    <div
      className="rounded-md border bg-muted/20 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <form action={handleSubmit} className="space-y-2">
        <input type="hidden" name="categoryId" value={categoryId} />

        <div className="space-y-1">
          <Label htmlFor={`nom-name-${categoryId}`}>Nominee Name</Label>
          <Input
            id={`nom-name-${categoryId}`}
            name="name"
            placeholder="Movie or person name"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`nom-sub-${categoryId}`}>
            Subtitle{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id={`nom-sub-${categoryId}`}
            name="subtitle"
            placeholder="e.g., movie name for actor categories"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" size="xs" disabled={isPending}>
            {isPending ? "Adding..." : "Add Nominee"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
