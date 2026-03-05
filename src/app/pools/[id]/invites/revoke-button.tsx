"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { revokeInviteAction } from "./actions";

export function RevokeButton({
  poolId,
  inviteId,
}: {
  poolId: string;
  inviteId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleRevoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeInviteAction(poolId, inviteId);
      if (result.error) {
        setError(result.error);
      } else {
        toast.success("Invite revoked");
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="destructive"
        size="xs"
        onClick={handleRevoke}
        disabled={isPending}
      >
        {isPending ? "Revoking..." : "Revoke"}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
