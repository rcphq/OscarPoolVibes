"use client";

import { useState, useCallback } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InviteShareButtonsProps {
  inviteUrl: string;
  poolName: string;
  inviteCode: string;
}

export function InviteShareButtons({
  inviteUrl,
  poolName,
  inviteCode,
}: InviteShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const shareMessage = `Join my Oscar pool '${poolName}': ${inviteUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
        <code className="text-sm text-muted-foreground">{inviteCode}</code>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        <Button variant="outline" size="sm" asChild>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="size-4" />
            <span>WhatsApp</span>
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X"
          >
            <span aria-hidden="true" className="text-sm font-bold">
              𝕏
            </span>
            <span>Post</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
