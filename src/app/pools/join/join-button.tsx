"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { joinOpenPool, joinViaInvite } from "./actions";

export function JoinPoolButton({
  code,
  token,
}: {
  code?: string;
  token?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      let result: { error: string } | undefined;

      if (code) {
        result = await joinOpenPool(code);
      } else if (token) {
        result = await joinViaInvite(token);
      }

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleJoin}
        disabled={isPending}
        size="lg"
        className="w-full text-base"
      >
        {isPending ? "Joining..." : "Join Pool"}
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
