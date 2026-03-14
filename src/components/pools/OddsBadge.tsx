import { cn } from "@/lib/utils";

type OddsBadgeProps = {
  polymarket: number | null;
  kalshi: number | null;
  className?: string;
};

export function OddsBadge({ polymarket, kalshi, className }: OddsBadgeProps) {
  if (polymarket === null && kalshi === null) {
    return null;
  }

  const parts: string[] = [];
  if (polymarket !== null) parts.push(`Polymarket: ${polymarket}%`);
  if (kalshi !== null) parts.push(`Kalshi: ${kalshi}%`);

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/60 whitespace-nowrap", className)}
      aria-label={parts.join(", ")}
    >
      {polymarket !== null && (
        <span className={cn(polymarket > 50 && "text-muted-foreground")}>
          P:{polymarket}%
        </span>
      )}
      {polymarket !== null && kalshi !== null && (
        <span aria-hidden="true">·</span>
      )}
      {kalshi !== null && (
        <span className={cn(kalshi > 50 && "text-muted-foreground")}>
          K:{kalshi}%
        </span>
      )}
    </div>
  );
}
