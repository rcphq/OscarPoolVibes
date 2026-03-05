"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendInviteAction } from "./actions";

export function InviteForm({ poolId }: { poolId: string }) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await sendInviteAction(poolId, email);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `Invite sent to ${email}` });
        setEmail("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email Address</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !email}>
            {isPending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.type === "error"
              ? "text-destructive"
              : "text-green-500"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
