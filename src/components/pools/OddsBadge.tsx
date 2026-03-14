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

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/60 whitespace-nowrap", className)}>
      {polymarket !== null && (
        <span className={cn(polymarket > 50 && "text-muted-foreground")}>
          P:{polymarket}%
        </span>
      )}
      {polymarket !== null && kalshi !== null && (
        <span>·</span>
      )}
      {kalshi !== null && (
        <span className={cn(kalshi > 50 && "text-muted-foreground")}>
          K:{kalshi}%
        </span>
      )}
    </div>
  );
}
