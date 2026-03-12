"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Trophy, Share2, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PoolCompletionCardProps {
  /** Total active members in the pool. Card renders null when 0. */
  total: number;
  /** Members who have submitted predictions for every category. */
  complete: number;
  /** Members who have at least one prediction but haven't finished. */
  incomplete: number;
  /** Members who have made zero predictions. */
  notStarted: number;
  /** Pool name — used as the share image title. */
  poolName: string;
}

/** Segments that make up the tri-color progress bar. */
const SEGMENTS = [
  {
    key: "complete" as const,
    label: "Complete",
    // Gold — full ballot submitted
    colorClass: "bg-[#D4AF37]",
    dotClass: "bg-[#D4AF37]",
    delay: "0ms",
  },
  {
    key: "incomplete" as const,
    label: "In Progress",
    // Amber — partially filled
    colorClass: "bg-amber-700",
    dotClass: "bg-amber-700",
    delay: "150ms",
  },
  {
    key: "notStarted" as const,
    label: "Not Started",
    // Slate — no picks yet; slate-700 has enough lightness contrast against
    // the card background so the segment reads as a distinct shape.
    colorClass: "bg-slate-700",
    dotClass: "bg-slate-700",
    delay: "300ms",
  },
] as const;

export function PoolCompletionCard({
  total,
  complete,
  incomplete,
  notStarted,
  poolName,
}: PoolCompletionCardProps) {
  // Capture ref: html-to-image reads this element's DOM subtree.
  const cardRef = useRef<HTMLDivElement>(null);

  // Drives the stagger-fill animation — segments start at width 0 and
  // transition to their real percentage only after the component mounts
  // on the client, preventing a layout pop on hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [sharing, setSharing] = useState(false);
  // Ref-based guard prevents double-invocation without adding `sharing` to
  // the useCallback dep array (which would recreate the function on every
  // state change and cause stale-closure bugs).
  const sharingRef = useRef(false);

  // All hooks must be declared before any early return (Rules of Hooks).
  const handleShare = useCallback(async () => {
    const el = cardRef.current;
    if (!el || sharingRef.current) return;

    sharingRef.current = true;
    setSharing(true);
    try {
      // Capture the card as a PNG with an explicit opaque background so the
      // image looks correct on any recipient's background (light or dark).
      const dataUrl = await toPng(el, {
        backgroundColor: "#0A1628",
        // Pixel-ratio 2 gives a crisp result on retina screens.
        pixelRatio: 2,
      });

      // CSP-safe base64 → Blob conversion (avoids fetch() on a data: URL,
      // which some Content-Security-Policy configurations block).
      const [, b64] = dataUrl.split(",");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "image/png" });
      const file = new File([blob], "ballot-status.png", { type: "image/png" });

      // Mobile — use native share sheet if the platform supports file sharing.
      if (
        typeof navigator.share === "function" &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `${poolName} — Ballot Status`,
        });
        toast.success("Shared!");
        return;
      }

      // Desktop — write to clipboard via the async Clipboard API.
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast.success("Image copied to clipboard!");
        return;
      }

      // Fallback — trigger a file download when neither API is available.
      // The anchor must be in the DOM before .click() for Firefox to honour
      // the download attribute.
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = "ballot-status.png";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      toast.success("Image downloaded!");
    } catch (err) {
      // User cancellation (e.g., dismissing the share sheet) is not an error.
      const isCancelled =
        err instanceof DOMException &&
        (err.name === "AbortError" || err.name === "NotAllowedError");
      if (!isCancelled) {
        toast.error("Could not capture image.");
      }
    } finally {
      sharingRef.current = false;
      setSharing(false);
    }
  }, [poolName]);

  // No members yet — nothing meaningful to show (must come after all hooks).
  if (total === 0) return null;

  // Pre-compute percentages. Each segment starts at 0% and transitions to its
  // real value only after mount, preventing a layout pop during hydration.
  const pct = {
    complete: (complete / total) * 100,
    incomplete: (incomplete / total) * 100,
    notStarted: (notStarted / total) * 100,
  };

  return (
    <Card ref={cardRef}>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2 text-lg">
          <Trophy className="size-4 text-[#D4AF37]" aria-hidden="true" />
          Ballot Status
        </CardTitle>
        <CardDescription>
          {complete === total && total > 0
            ? `All ${total} members are ready!`
            : `${total} ${total === 1 ? "member" : "members"} in this pool`}
        </CardDescription>

        {/* Share / copy button — positioned top-right via CardAction */}
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            disabled={sharing}
            aria-label="Share ballot status as image"
            title="Share ballot status"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            {sharing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Share2 className="size-4" aria-hidden="true" />
            )}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* ── Progress bar ──────────────────────────────────────────────────
            role="img" + aria-label make the visualization self-describing
            for screen readers. The sr-only span below provides the same
            information in prose form as a redundant fallback.             */}
        <div
          role="img"
          aria-label={`Ballot completion: ${complete} of ${total} members complete`}
          className="flex h-3 overflow-hidden rounded-full bg-muted/30"
        >
          {SEGMENTS.map((seg) => (
            <div
              key={seg.key}
              // min-w-0 prevents flex from enforcing an implicit minimum
              // width, which would cause the math to not add up to 100%.
              className={`min-w-0 transition-all duration-700 ease-out ${seg.colorClass}`}
              style={{
                width: mounted ? `${pct[seg.key]}%` : "0%",
                transitionDelay: seg.delay,
              }}
            />
          ))}
        </div>

        {/* Visually hidden text for screen readers (bar is color-only) */}
        <span className="sr-only">
          {complete} complete, {incomplete} in progress, {notStarted} not
          started
        </span>

        {/* ── Stat chips ────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap gap-x-6 gap-y-2"
          aria-hidden="true"
        >
          {SEGMENTS.map((seg) => {
            const count = seg.key === "complete"
              ? complete
              : seg.key === "incomplete"
              ? incomplete
              : notStarted;

            return (
              <div key={seg.key} className="flex items-center gap-1.5">
                {/* Color dot — purely decorative; labels carry the meaning */}
                <span
                  className={`inline-block size-2 rounded-full ${seg.dotClass}`}
                />
                <span className="text-sm font-bold tabular-nums">{count}</span>
                <span className="text-sm text-muted-foreground">
                  {seg.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
