"use client";

import { useTransition, useState } from "react";
import { UserMinus, Shield } from "lucide-react";
import { PoolMemberRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { removeMemberAction, changeMemberRoleAction } from "./actions";

interface Member {
  id: string;
  role: PoolMemberRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface MemberManagementProps {
  poolId: string;
  members: Member[];
  currentUserId: string;
}

export function MemberManagement({
  poolId,
  members,
  currentUserId,
}: MemberManagementProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          poolId={poolId}
          member={member}
          isCurrentUser={member.user.id === currentUserId}
        />
      ))}
    </div>
  );
}

function MemberRow({
  poolId,
  member,
  isCurrentUser,
}: {
  poolId: string;
  member: Member;
  isCurrentUser: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMemberAction(poolId, member.user.id);
      if (result && "error" in result) {
        setError(result.error ?? null);
      }
    });
  }

  function handleRoleChange(role: string) {
    setError(null);
    startTransition(async () => {
      const result = await changeMemberRoleAction(
        poolId,
        member.user.id,
        role as PoolMemberRole
      );
      if (result && "error" in result) {
        setError(result.error ?? null);
      }
    });
  }

  const displayName = member.user.name || member.user.email || "Unknown User";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-3 min-w-0">
        {member.user.image ? (
          <img
            src={member.user.image}
            alt=""
            className="size-8 rounded-full"
          />
        ) : (
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {displayName}
            {isCurrentUser && (
              <span className="text-muted-foreground ml-1">(you)</span>
            )}
          </p>
          {member.user.email && member.user.name && (
            <p className="text-xs text-muted-foreground truncate">
              {member.user.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {error && <p className="text-xs text-destructive">{error}</p>}

        <Select
          value={member.role}
          onValueChange={handleRoleChange}
          disabled={isPending || isCurrentUser}
        >
          <SelectTrigger className="w-[160px]" size="sm">
            <Shield className="size-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="RESULTS_MANAGER">Results Manager</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
          </SelectContent>
        </Select>

        {!isCurrentUser && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            disabled={isPending}
            title="Remove member"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <UserMinus className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
