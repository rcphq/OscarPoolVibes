"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InviteShareButtons } from "@/components/pools/InviteShareButtons";

interface InviteShareDialogProps {
  open: boolean;
  inviteUrl: string;
  poolName: string;
}

export function InviteShareDialog({
  open: initialOpen,
  inviteUrl,
  poolName,
}: InviteShareDialogProps) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    if (initialOpen) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [initialOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Pool Created!</DialogTitle>
          <DialogDescription>
            Invite friends to join your pool.
          </DialogDescription>
        </DialogHeader>
        <InviteShareButtons inviteUrl={inviteUrl} poolName={poolName} />
      </DialogContent>
    </Dialog>
  );
}
