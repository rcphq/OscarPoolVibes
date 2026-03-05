import { Check, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface PicksSummaryCardProps {
  categoryName: string;
  firstChoice: string | null;
  runnerUp: string | null;
  pointValue: number;
}

export function PicksSummaryCard({
  categoryName,
  firstChoice,
  runnerUp,
  pointValue,
}: PicksSummaryCardProps) {
  const hasPick = firstChoice !== null;

  return (
    <Card className={!hasPick ? "border-dashed opacity-70" : ""}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">
            {categoryName}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {pointValue} pts
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {hasPick ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-gold-400" />
              <span className="text-sm font-semibold text-gold-300">
                {firstChoice}
              </span>
            </div>
            {runnerUp && (
              <div className="flex items-center gap-2">
                <span className="ml-0.5 size-3 shrink-0 rounded-full border border-muted-foreground/40" />
                <span className="text-sm text-muted-foreground">
                  {runnerUp}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <X className="size-4 shrink-0 text-muted-foreground/50" />
            <span className="text-sm italic text-muted-foreground">
              No pick yet
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
