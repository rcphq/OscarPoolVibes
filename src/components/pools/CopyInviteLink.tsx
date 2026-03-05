"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Button } from "@/components/ui/button";

interface CopyInviteLinkProps {
  inviteCode: string;
  poolId?: string;
}

export function CopyInviteLink({ inviteCode, poolId }: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false);
  const posthog = usePostHog();

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pools/join/${inviteCode}`
      : `/pools/join/${inviteCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      posthog?.capture("pool_invite_link_copied", { poolId: poolId ?? "" });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [inviteUrl]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-2">
        <code className="text-sm text-muted-foreground">{inviteCode}</code>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? "Invite link copied" : "Copy invite link"}
      >
        {copied ? (
          <>
            <Check className="size-4 text-green-500" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="size-4" />
            <span>Copy Link</span>
          </>
        )}
      </Button>
    </div>
  );
}
