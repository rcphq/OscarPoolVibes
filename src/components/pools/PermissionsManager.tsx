"use client";

import { useState, useCallback } from "react";
import { Shield, ShieldCheck, ShieldOff, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PermissionMember {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "ADMIN" | "RESULTS_MANAGER" | "MEMBER";
  canManageResults: boolean;
}

interface PermissionsManagerProps {
  poolId: string;
  members: PermissionMember[];
}

export function PermissionsManager({
  poolId,
  members: initialMembers,
}: PermissionsManagerProps) {
  const [members, setMembers] = useState<PermissionMember[]>(initialMembers);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleTogglePermission = useCallback(
    async (targetUserId: string, action: "grant" | "revoke") => {
      setLoadingUserId(targetUserId);
      setFeedback(null);

      // Optimistic update
      const previousMembers = members;
      setMembers((prev) =>
        prev.map((m) => {
          if (m.userId !== targetUserId) return m;
          return {
            ...m,
            role: action === "grant" ? "RESULTS_MANAGER" : "MEMBER",
            canManageResults: action === "grant",
          };
        })
      );

      try {
        const res = await fetch(`/api/pools/${poolId}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId, action }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update permission");
        }

        const targetMember = members.find((m) => m.userId === targetUserId);
        const displayName =
          targetMember?.name || targetMember?.email || "User";
        setFeedback({
          type: "success",
          message:
            action === "grant"
              ? `${displayName} is now a Results Manager.`
              : `${displayName} is no longer a Results Manager.`,
        });
      } catch (err) {
        // Revert optimistic update
        setMembers(previousMembers);
        setFeedback({
          type: "error",
          message:
            err instanceof Error ? err.message : "Failed to update permission",
        });
      } finally {
        setLoadingUserId(null);
      }
    },
    [members, poolId]
  );

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          role="alert"
          className={`rounded-md px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <ul role="list" className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isLoading={loadingUserId === member.userId}
            onToggle={handleTogglePermission}
          />
        ))}
      </ul>
    </div>
  );
}

function MemberRow({
  member,
  isLoading,
  onToggle,
}: {
  member: PermissionMember;
  isLoading: boolean;
  onToggle: (userId: string, action: "grant" | "revoke") => void;
}) {
  const displayName = member.name || member.email || "Unknown User";
  const isAdmin = member.role === "ADMIN";
  const isResultsManager = member.role === "RESULTS_MANAGER";

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        {member.image ? (
          <img
            src={member.image}
            alt=""
            className="size-8 rounded-full shrink-0"
          />
        ) : (
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name and email */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          {member.name && member.email && (
            <p className="text-xs text-muted-foreground truncate">
              {member.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Role badge */}
        <RoleBadge role={member.role} />

        {/* Action button (non-ADMIN only) */}
        {!isAdmin && (
          <>
            {isResultsManager ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggle(member.userId, "revoke")}
                disabled={isLoading}
                aria-label={`Revoke Results Manager role from ${displayName}`}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldOff className="size-3.5" />
                )}
                Revoke
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggle(member.userId, "grant")}
                disabled={isLoading}
                aria-label={`Grant Results Manager role to ${displayName}`}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                Grant
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

function RoleBadge({ role }: { role: PermissionMember["role"] }) {
  switch (role) {
    case "ADMIN":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-medium text-gold-400">
          <Shield className="size-3" />
          Pool Admin
        </span>
      );
    case "RESULTS_MANAGER":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-medium text-teal-600 dark:text-teal-400">
          <ShieldCheck className="size-3" />
          Results Manager
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <User className="size-3" />
          Member
        </span>
      );
  }
}
