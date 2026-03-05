"use client";

import { useCallback, useEffect, useRef } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConflictDialogProps = {
  open: boolean;
  categoryName: string;
  yourChoice: string;
  currentWinner: string;
  setBy: string;
  updatedAt: Date;
  onAcceptCurrent: () => void;
  onOverride: () => void;
  onClose: () => void;
};

/**
 * Modal dialog shown when a 409 version conflict is returned while setting a result.
 * Presents the conflict details and offers "Accept Current" or "Override" actions.
 */
export function ConflictDialog({
  open,
  categoryName,
  yourChoice,
  currentWinner,
  setBy,
  updatedAt,
  onAcceptCurrent,
  onOverride,
  onClose,
}: ConflictDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  // Open/close the native dialog element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the first action button
      acceptButtonRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Handle escape key
  const handleCancel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const formattedTime = formatRelativeTime(updatedAt);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="conflict-dialog-title"
      aria-describedby="conflict-dialog-description"
      className="fixed inset-0 z-50 m-auto max-w-md rounded-lg border-2 border-amber-400/60 bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2
              id="conflict-dialog-title"
              className="text-lg font-semibold leading-tight"
            >
              Result Conflict
            </h2>
            <p
              id="conflict-dialog-description"
              className="mt-1 text-sm text-muted-foreground"
            >
              Someone else set the winner for{" "}
              <span className="font-medium text-foreground">{categoryName}</span>{" "}
              while you were editing.
            </p>
          </div>
        </div>

        {/* Comparison */}
        <div className="mb-6 rounded-md border border-border bg-muted/50 p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Your choice */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Choice
              </p>
              <p className="mt-1 truncate font-medium text-foreground">
                {yourChoice}
              </p>
            </div>

            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />

            {/* Current winner */}
            <div className="min-w-0 flex-1 text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current Winner
              </p>
              <p className="mt-1 truncate font-medium text-foreground">
                {currentWinner}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Set by <span className="font-medium">{setBy}</span> {formattedTime}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            ref={acceptButtonRef}
            variant="secondary"
            className="flex-1"
            onClick={onAcceptCurrent}
          >
            Accept Current
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={onOverride}
          >
            Override
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/** Format a date as a relative time string (e.g., "2 minutes ago"). */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const target = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
