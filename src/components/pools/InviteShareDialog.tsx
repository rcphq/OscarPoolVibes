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
  defaultOpen: boolean;
  inviteUrl: string;
  poolName: string;
  inviteCode: string;
}

export function InviteShareDialog({
  defaultOpen,
  inviteUrl,
  poolName,
  inviteCode,
}: InviteShareDialogProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Strip the query param that triggered this dialog (e.g. ?created=true)
  // so a page refresh doesn't re-open it.
  useEffect(() => {
    if (defaultOpen) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [defaultOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Pool Created!</DialogTitle>
          <DialogDescription>
            Invite friends to join your pool.
          </DialogDescription>
        </DialogHeader>
        <InviteShareButtons inviteUrl={inviteUrl} poolName={poolName} inviteCode={inviteCode} />
      </DialogContent>
    </Dialog>
  );
}
