"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updatePoolSettings } from "./actions";

interface PoolSettingsFormProps {
  poolId: string;
  name: string;
  accessType: "OPEN" | "INVITE_ONLY";
  maxMembers: number | null;
}

export function PoolSettingsForm({
  poolId,
  name,
  accessType,
  maxMembers,
}: PoolSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAlreadyOpen = accessType === "OPEN";

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePoolSettings(poolId, formData);
      if (result && "error" in result && result.error) {
        const err = result.error;
        let errorText: string;
        if (typeof err === "string") {
          errorText = err;
        } else if ("_form" in err && Array.isArray(err._form)) {
          errorText = err._form.join(", ");
        } else {
          errorText = Object.values(err).flat().join(", ");
        }
        setMessage({ type: "error", text: errorText });
      } else {
        setMessage({ type: "success", text: "Settings updated successfully." });
        toast.success("Pool settings saved!");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Pool Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accessType">Access Type</Label>
        <Select
          name="accessType"
          defaultValue={accessType}
          disabled={isAlreadyOpen}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
          </SelectContent>
        </Select>
        {isAlreadyOpen && (
          <>
            <input type="hidden" name="accessType" value={accessType} />
            <p className="text-xs text-muted-foreground">
              Open pools cannot be changed back to invite-only.
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxMembers">Max Members (optional)</Label>
        <Input
          id="maxMembers"
          name="maxMembers"
          type="number"
          min={1}
          defaultValue={maxMembers ?? ""}
          placeholder="No limit"
        />
      </div>

      {message && (
        <p
          className={
            message.type === "error"
              ? "text-sm text-destructive"
              : "text-sm text-green-500"
          }
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
