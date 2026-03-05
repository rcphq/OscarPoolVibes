"use client";

import { useTransition, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archivePoolAction } from "./actions";

export function ArchivePoolButton({ poolId }: { poolId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleArchive() {
    startTransition(async () => {
      await archivePoolAction(poolId);
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        onClick={() => setConfirming(true)}
        disabled={isPending}
      >
        <Trash2 className="size-4" />
        Archive Pool
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-destructive font-medium">
        Are you sure? This will archive the pool for all members. This action
        cannot be undone.
      </p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={handleArchive}
          disabled={isPending}
        >
          {isPending ? "Archiving..." : "Yes, Archive Pool"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
