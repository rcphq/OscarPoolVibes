"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
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
import { archivePoolAction } from "./actions";

export function ArchivePoolButton({ poolId }: { poolId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      await archivePoolAction(poolId);
      toast.success("Pool archived");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          <Trash2 className="size-4" />
          {isPending ? "Archiving..." : "Archive Pool"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this pool?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive the pool for all members. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleArchive}
            disabled={isPending}
          >
            {isPending ? "Archiving..." : "Yes, Archive Pool"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
